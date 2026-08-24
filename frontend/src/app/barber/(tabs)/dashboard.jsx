import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@/components/icons/AppIcon";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";
import {
  listenToUnreadNotificationCount,
} from "../../../services/notificationService";
import {
  getBarberClient,
  upsertBarberClientFromBooking,
} from "../../../services/barberClientService";
import {
  confirmBooking,
} from "../../../services/bookingService";
import {
  BOOKING_CALENDAR_TYPES,
  DEFAULT_CALENDAR_TYPES,
  getBarberCalendarInfo,
} from "../../../services/barberCalendarService";
import {
  isToday,
  isUpcomingOrToday,
  sortBookingsByDateTime,
} from "../../../utils/dateHelpers";
import {
  formatTime12Hour,
  timeToMinutes,
} from "../../../utils/bookingTime";

const NEXT_CLIENT_CARD_WIDTH = 315;
const NEXT_CLIENT_CARD_GAP = 16;
const MINI_CALENDAR_HOURS_BEHIND = 1;
const MINI_CALENDAR_HOURS_AHEAD = 2;
const MINI_CALENDAR_ROW_HEIGHT = 76;
const SUMMARY_VISIBLE_CLIENTS = 3;
const DASHBOARD_CACHE_KEY_PREFIX = "barberDashboardCache";
const dashboardMemoryCache = new Map();

function getDashboardCacheKey(barberId) {
  return `${DASHBOARD_CACHE_KEY_PREFIX}:${barberId}`;
}

function QuickActionCard({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ minWidth: 138 }}
      className="rounded-xl bg-app-primary px-4 py-3 active:bg-app-primary-pressed"
    >
      <Text className="text-center text-sm font-semibold text-app-text-inverse">
        {label}
      </Text>
    </Pressable>
  );
}
function SummaryClientNames({ bookings, emptyText, showTime = false }) {
  const visibleBookings = bookings.slice(0, SUMMARY_VISIBLE_CLIENTS);
  const hiddenCount = Math.max(bookings.length - visibleBookings.length, 0);

  if (bookings.length === 0) {
    return (
      <Text className="mt-2 text-xs text-app-text-muted">
        {emptyText}
      </Text>
    );
  }

  return (
    <View className="mt-2">
      {visibleBookings.map((booking) => (
        <Text
          key={booking.id}
          numberOfLines={1}
          className="text-xs font-semibold text-app-text-secondary"
        >
          {booking.clientName || "Client"}
          {showTime && booking.startTime
            ? ` • ${formatTime12Hour(booking.startTime)}`
            : ""}
        </Text>
      ))}

      {hiddenCount > 0 ? (
        <Text className="mt-1 text-xs text-app-text-muted">
          +{hiddenCount} more
        </Text>
      ) : null}
    </View>
  );
}

function PendingClientRows({
  bookings,
  emptyText,
  acceptingBookingId,
  onAccept,
}) {
  const visibleBookings = bookings.slice(0, SUMMARY_VISIBLE_CLIENTS);
  const hiddenCount = Math.max(bookings.length - visibleBookings.length, 0);

  if (bookings.length === 0) {
    return (
      <Text className="mt-2 text-xs text-app-text-muted">
        {emptyText}
      </Text>
    );
  }

  return (
    <View className="mt-2">
      {visibleBookings.map((booking) => {
        const accepting = acceptingBookingId === booking.id;

        return (
          <View
            key={booking.id}
            className="mb-1 flex-row items-center justify-between"
          >
            <Text
              numberOfLines={1}
              className="mr-2 flex-1 text-xs font-semibold text-app-text-secondary"
            >
              {booking.clientName || "Client"}
            </Text>

            <Pressable
              onPress={() => onAccept(booking)}
              disabled={accepting}
              className="h-6 w-6 items-center justify-center rounded-full bg-app-primary active:bg-app-primary-pressed"
            >
              {accepting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="add" size={17} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        );
      })}

      {hiddenCount > 0 ? (
        <Text className="mt-1 text-xs text-app-text-muted">
          +{hiddenCount} more
        </Text>
      ) : null}
    </View>
  );
}

function SummaryCard({
  title,
  value,
  description,
  children,
  onPress,
}) {
  const Container = onPress ? Pressable : View;
  const containerProps = onPress
    ? {
        accessibilityRole: "button",
        onPress,
      }
    : {};

  return (
    <Container
      {...containerProps}
      style={{ width: "48%" }}
      className={`mt-4 rounded-2xl border border-app-border bg-app-surface px-4 py-4 ${
        onPress ? "active:bg-app-surface-elevated" : ""
      }`}
    >
      <Text className="text-sm font-semibold text-app-text-secondary">
        {title}
      </Text>

      <Text className="mt-2 text-3xl font-bold text-app-text">
        {value}
      </Text>

      {children || (
        <Text className="mt-2 text-xs text-app-text-muted">
          {description}
        </Text>
      )}
    </Container>
  );
}

function getDateStringWithOffset(dayOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDateString() {
  return getDateStringWithOffset(0);
}

function getTomorrowDateString() {
  return getDateStringWithOffset(1);
}

function isWithinThisWeek(dateKey) {
  const todayDateKey = getTodayDateString();
  const weekEndDateKey = getDateStringWithOffset(6);

  return dateKey >= todayDateKey && dateKey <= weekEndDateKey;
}

function normalizeRepeatDays(days) {
  if (!Array.isArray(days)) {
    return [];
  }

  return days.filter((day) => day >= 0 && day <= 6);
}

function doesRepeatingEventLandOnDate(event, dateKey) {
  if (!event.repeatRule || event.repeatRule === "none") {
    return event.date === dateKey;
  }

  const [eventYear, eventMonth, eventDay] = event.date.split("-").map(Number);
  const [targetYear, targetMonth, targetDay] = dateKey.split("-").map(Number);
  const eventDate = new Date(eventYear, eventMonth - 1, eventDay);
  const targetDate = new Date(targetYear, targetMonth - 1, targetDay);

  if (targetDate < eventDate) {
    return false;
  }

  if (event.repeatRule === "daily") {
    return true;
  }

  if (event.repeatRule === "specificDays") {
    return normalizeRepeatDays(event.repeatDays).includes(targetDate.getDay());
  }

  return (
    event.repeatRule === "weekly" &&
    eventDate.getDay() === targetDate.getDay()
  );
}

function getCalendarType(typeId, eventTypes) {
  return (
    [...BOOKING_CALENDAR_TYPES, ...eventTypes].find(
      (type) => type.id === typeId
    ) || DEFAULT_CALENDAR_TYPES[0]
  );
}

function getVisibleMiniHours(currentTime) {
  const currentHour = currentTime.getHours();
  const startHour = Math.max(currentHour - MINI_CALENDAR_HOURS_BEHIND, 0);
  const endHour = Math.min(currentHour + MINI_CALENDAR_HOURS_AHEAD, 23);

  return Array.from(
    { length: endHour - startHour + 1 },
    (_, index) => startHour + index
  );
}

function getEventsForHour(events, hour) {
  return events.filter((event) => {
    if (!event.startTime || !event.endTime) {
      return false;
    }

    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = timeToMinutes(event.endTime);
    const hourStart = hour * 60;
    const hourEnd = hourStart + 60;

    return startMinutes < hourEnd && endMinutes > hourStart;
  });
}

function getMiniCalendarEventLayout(event, visibleHours) {
  if (!event.startTime || !event.endTime || visibleHours.length === 0) {
    return null;
  }

  const visibleStartMinutes = visibleHours[0] * 60;
  const visibleEndMinutes = (visibleHours[visibleHours.length - 1] + 1) * 60;
  const eventStartMinutes = timeToMinutes(event.startTime);
  const eventEndMinutes = timeToMinutes(event.endTime);
  const clampedStartMinutes = Math.max(eventStartMinutes, visibleStartMinutes);
  const clampedEndMinutes = Math.min(eventEndMinutes, visibleEndMinutes);

  if (clampedEndMinutes <= clampedStartMinutes) {
    return null;
  }

  const top =
    ((clampedStartMinutes - visibleStartMinutes) / 60) *
    MINI_CALENDAR_ROW_HEIGHT;
  const height =
    ((clampedEndMinutes - clampedStartMinutes) / 60) *
    MINI_CALENDAR_ROW_HEIGHT;

  return {
    height: Math.max(height - 8, 34),
    top: top + 4,
  };
}

function getVisibleMiniEvents(events, visibleHours) {
  return events
    .map((event) => ({
      event,
      layout: getMiniCalendarEventLayout(event, visibleHours),
    }))
    .filter(({ layout }) => Boolean(layout));
}

function MiniCalendarEvent({ event, eventTypes, layout }) {
  const type = getCalendarType(event.typeId, eventTypes);

  return (
    <View
      style={{
        backgroundColor: type.color.background,
        borderColor: type.color.border,
        height: layout.height,
        left: 80,
        position: "absolute",
        right: 0,
        top: layout.top,
        zIndex: 5,
      }}
      className="justify-center rounded-xl border px-3 py-2"
    >
      <Text
        numberOfLines={1}
        style={{ color: type.color.text }}
        className="text-xs font-bold"
      >
        {event.title}
      </Text>

      <Text className="mt-1 text-xs text-app-text-secondary">
        {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}
      </Text>
    </View>
  );
}

function DailyCalendarPreview({
  todayBookingCount,
  events,
  eventTypes,
  currentTime,
}) {
  const visibleHours = getVisibleMiniHours(currentTime);
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentLineTop =
    ((currentHour - visibleHours[0]) * 60 + currentMinute) /
    60 *
    MINI_CALENDAR_ROW_HEIGHT;
  const visibleMiniEvents = getVisibleMiniEvents(events, visibleHours);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/barber/calender",
          params: {
            scrollTo: "now",
            scrollAt: String(Date.now()),
          },
        })
      }
      className="mt-4 rounded-2xl border border-app-border bg-app-surface p-4 active:bg-app-surface-elevated"
    >
      <View className="flex-row items-center">
        <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-app-primary-soft">
          <Ionicons
            name="calendar-outline"
            size={28}
            color="#1677FF"
          />
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-app-text">
            Daily Calendar
          </Text>

          <Text className="mt-1 text-sm text-app-text-secondary">
            {todayBookingCount > 0
              ? `${todayBookingCount} appointments scheduled today`
              : "Current calendar window"}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#8292A6" />
      </View>

      <View className="mt-4 rounded-2xl bg-app-surface-elevated px-4 py-3">
        <View
          style={{
            height: visibleHours.length * MINI_CALENDAR_ROW_HEIGHT,
            position: "relative",
          }}
        >
          {visibleHours.map((hour, index) => {
            const hourEvents = getEventsForHour(events, hour);

            return (
              <View
                key={hour}
                style={{
                  height: MINI_CALENDAR_ROW_HEIGHT,
                  position: "relative",
                  zIndex: 1,
                }}
                className={`flex-row items-start py-3 ${
                  index < visibleHours.length - 1
                    ? "border-b border-app-border-subtle"
                    : ""
                }`}
              >
                <Text className="w-20 text-xs font-bold text-app-text-muted">
                  {getHourLabel(hour)}
                </Text>

                <View className="flex-1">
                  {hourEvents.length === 0 ? (
                    <Text className="text-xs font-semibold text-app-text-muted">
                      Open
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}

          {visibleMiniEvents.map(({ event, layout }) => (
            <MiniCalendarEvent
              key={event.id}
              event={event}
              eventTypes={eventTypes}
              layout={layout}
            />
          ))}

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 76,
              right: 0,
              top: currentLineTop,
              zIndex: 10,
              height: 10,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: "#1677FF",
              }}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function getHourLabel(hour) {
  return formatTime12Hour(`${String(hour).padStart(2, "0")}:00`);
}

function getServicesText(booking) {
  if (!Array.isArray(booking?.services) || booking.services.length === 0) {
    return "No services listed";
  }

  return booking.services
    .map((service) => service.name)
    .filter(Boolean)
    .join(", ");
}

function getClientNoteText(booking) {
  return (
    booking?.clientNotes?.trim() ||
    booking?.note?.trim() ||
    booking?.notes?.trim() ||
    "No client note yet."
  );
}

function getPrivateClientNoteText(barberClient) {
  return (
    barberClient?.privateNote?.body?.trim() ||
    "No private client note yet."
  );
}

function NextClientCard({ booking, barberClient }) {
  const servicesText = getServicesText(booking);
  const clientNoteText = getClientNoteText(booking);
  const privateClientNoteText = getPrivateClientNoteText(barberClient);

  return (
    <Pressable
      onPress={() => {
        if (booking.id) {
          router.push({
            pathname: "/barber/bookings",
            params: {
              bookingId: booking.id,
            },
          });
          return;
        }

        router.push("/barber/bookings");
      }}
      style={{
        width: NEXT_CLIENT_CARD_WIDTH,
        marginRight: NEXT_CLIENT_CARD_GAP,
      }}
      className="rounded-2xl border border-app-border bg-app-surface p-4 active:bg-app-surface-elevated"
    >
      <View className="flex-row items-start">
        <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-app-primary-soft">
          <Text className="text-xl font-bold text-app-primary">
            {(booking.clientName || "C").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-app-text">
                {booking.clientName || "Client"}
              </Text>

              <Text className="mt-1 text-sm text-app-text-secondary">
                {booking.appointmentDate || "Date not set"} •{" "}
                {formatTime12Hour(booking.startTime)}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#8292A6"
            />
          </View>

          <View className="mt-4 rounded-xl bg-app-surface-elevated px-4 py-3">
            <Text className="text-xs font-semibold uppercase text-app-text-muted">
              Service
            </Text>

            <Text className="mt-1 text-sm font-semibold text-app-text">
              {servicesText}
            </Text>
          </View>

          <View className="mt-3 rounded-xl bg-app-surface-elevated px-4 py-3">
            <Text className="text-xs font-semibold uppercase text-app-text-muted">
              Client Note
            </Text>

            <Text className="mt-1 text-sm text-app-text-secondary">
              {clientNoteText}
            </Text>
          </View>

          <View className="mt-3 rounded-xl bg-app-primary-soft px-4 py-3">
            <Text className="text-xs font-semibold uppercase text-app-primary">
              Private Client Note
            </Text>

            <Text className="mt-1 text-sm text-app-text-secondary">
              {privateClientNoteText}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function NextClientsSection({
  bookings,
  contactsByClientId,
}) {
  if (bookings.length === 0) {
    return (
      <View className="mt-4 rounded-2xl border border-app-border bg-app-surface p-4">
        <Text className="text-base font-bold text-app-text">
          No next client yet
        </Text>

        <Text className="mt-2 text-sm text-app-text-secondary">
          Your next pending or confirmed booking will show here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-4"
      decelerationRate="fast"
      disableIntervalMomentum
      snapToInterval={NEXT_CLIENT_CARD_WIDTH + NEXT_CLIENT_CARD_GAP}
      snapToAlignment="start"
      contentContainerStyle={{ paddingRight: 20 }}
    >
      {bookings.map((booking) => (
        <NextClientCard
          key={booking.id}
          booking={booking}
          barberClient={contactsByClientId[booking.clientId]}
        />
      ))}
    </ScrollView>
  );
}

export default function BarberDashboardScreen() {
  const [allBookings, setAllBookings] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [tomorrowBookings, setTomorrowBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [thisWeekBookings, setThisWeekBookings] = useState([]);
  const [nextClientBookings, setNextClientBookings] = useState([]);
  const [nextClientContactsById, setNextClientContactsById] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarEventTypes, setCalendarEventTypes] = useState(
    DEFAULT_CALENDAR_TYPES
  );
  const [currentTime, setCurrentTime] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);
  const [acceptingPendingBookingId, setAcceptingPendingBookingId] =
    useState(null);

  function openBookingsWithFilters({
    dateFilter = "all",
    statusFilter = "all",
    selectedDate,
  }) {
    const params = {
      dateFilter,
      statusFilter,
    };

    if (selectedDate) {
      params.selectedDate = selectedDate;
    }

    router.push({
      pathname: "/barber/bookings",
      params,
    });
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser?.uid) {
      return;
    }

    const unsubscribe = listenToUnreadNotificationCount(
      currentUser.uid,
      (count) => {
        setUnreadNotificationCount(count);
      },
      (error) => {
        console.log(
          "Listen to barber notification badge error:",
          error
        );

        setUnreadNotificationCount(0);
      }
    );

    return () => unsubscribe();
  }, []);

  const applyDashboardData = useCallback((dashboardData) => {
    setAllBookings(dashboardData.allBookings || []);
    setTodayBookings(dashboardData.todayBookings || []);
    setTomorrowBookings(dashboardData.tomorrowBookings || []);
    setPendingBookings(dashboardData.pendingBookings || []);
    setThisWeekBookings(dashboardData.thisWeekBookings || []);
    setNextClientBookings(dashboardData.nextClientBookings || []);
    setNextClientContactsById(
      dashboardData.nextClientContactsById || {}
    );
    setCalendarEventTypes(
      dashboardData.calendarEventTypes || DEFAULT_CALENDAR_TYPES
    );
    setCalendarEvents(dashboardData.calendarEvents || []);
  }, []);

  const loadCachedDashboardData = useCallback(async (barberId) => {
    try {
      const memoryCache = dashboardMemoryCache.get(barberId);

      if (memoryCache) {
        applyDashboardData(memoryCache);
        return true;
      }

      const cachedDashboard = await AsyncStorage.getItem(
        getDashboardCacheKey(barberId)
      );

      if (!cachedDashboard) {
        return false;
      }

      const parsedCache = JSON.parse(cachedDashboard);
      dashboardMemoryCache.set(barberId, parsedCache);
      applyDashboardData(parsedCache);

      return true;
    } catch (err) {
      console.log("Load cached barber dashboard error:", err);
      return false;
    }
  }, [applyDashboardData]);

  const saveDashboardCache = useCallback(async ({
    barberId,
    dashboardData,
  }) => {
    try {
      const cachePayload = {
        ...dashboardData,
        cachedAt: Date.now(),
      };

      dashboardMemoryCache.set(barberId, cachePayload);
      await AsyncStorage.setItem(
        getDashboardCacheKey(barberId),
        JSON.stringify(cachePayload)
      );
    } catch (err) {
      console.log("Save barber dashboard cache error:", err);
    }
  }, []);

  const loadDashboardData = useCallback(async ({
    showLoader = true,
    useCache = false,
    showErrorOnFailure = true,
  } = {}) => {
    let hasCachedData = false;

    try {
      setError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("You must be logged in to view your dashboard.");
        return;
      }

      const uid = currentUser.uid;

      if (useCache) {
        hasCachedData = await loadCachedDashboardData(uid);

        if (hasCachedData) {
          setLoading(false);
          return;
        }
      }

      if (showLoader) {
        setLoading(true);
      }

      const bookingsRef = collection(db, "bookings");

      const bookingsQuery = query(
        bookingsRef,
        where("barberId", "==", uid)
      );

      const bookingsSnap = await getDocs(bookingsQuery);
      const calendarInfo = await getBarberCalendarInfo(uid);

      const bookings = bookingsSnap.docs.map((bookingDoc) => ({
        id: bookingDoc.id,
        ...bookingDoc.data(),
      }));
      const tomorrowDateKey = getTomorrowDateString();

      const activeTodayBookings = bookings.filter((booking) => {
        const isActiveStatus =
          booking.status === "pending" || booking.status === "confirmed";

        return isToday(booking.appointmentDate) && isActiveStatus;
      });

      const activeTomorrowBookings = bookings.filter((booking) => {
        const isActiveStatus =
          booking.status === "pending" || booking.status === "confirmed";

        return (
          booking.appointmentDate === tomorrowDateKey &&
          isActiveStatus
        );
      });

      const pending = bookings.filter((booking) => {
        return booking.status === "pending";
      });

      const thisWeekActiveBookings = bookings.filter((booking) => {
        const isActiveStatus =
          booking.status === "pending" || booking.status === "confirmed";

        return (
          isActiveStatus &&
          isWithinThisWeek(booking.appointmentDate)
        );
      });

      const nextActiveBookings = bookings
        .filter((booking) => {
          const isActiveStatus =
            booking.status === "pending" ||
            booking.status === "confirmed";

          return (
            isActiveStatus &&
            isUpcomingOrToday(booking.appointmentDate)
          );
        })
        .sort((a, b) => {
          const dateA = `${a.appointmentDate || ""} ${
            a.startTime || ""
          }`;
          const dateB = `${b.appointmentDate || ""} ${
            b.startTime || ""
          }`;

          return dateA.localeCompare(dateB);
        });

      const uniqueClientIds = [
        ...new Set(
          nextActiveBookings
            .map((booking) => booking.clientId)
            .filter(Boolean)
        ),
      ];

      const nextBarberClients = await Promise.all(
        uniqueClientIds.map(async (clientId) => {
          const barberClient = await getBarberClient({
            barberId: uid,
            clientId,
          });

          return [clientId, barberClient];
        })
      );

      const contactsByClientId = Object.fromEntries(nextBarberClients);
      const todayDateKey = getTodayDateString();
      const todayBookingEvents = activeTodayBookings.map((booking) => ({
        id: `booking-${booking.id}`,
        sourceId: booking.id,
        typeId:
          booking.status === "confirmed"
            ? "booking_confirmed"
            : "booking_pending",
        title: booking.clientName || "Client",
        date: booking.appointmentDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
      }));
      const todayCustomEvents = calendarInfo.events
        .filter((event) => doesRepeatingEventLandOnDate(event, todayDateKey))
        .map((event) => ({
          ...event,
          id: `${event.id}-${todayDateKey}`,
          date: todayDateKey,
        }));

      const dashboardData = {
        allBookings: bookings,
        todayBookings: sortBookingsByDateTime(activeTodayBookings),
        tomorrowBookings: sortBookingsByDateTime(activeTomorrowBookings),
        pendingBookings: sortBookingsByDateTime(pending),
        thisWeekBookings: sortBookingsByDateTime(thisWeekActiveBookings),
        nextClientBookings: nextActiveBookings,
        nextClientContactsById: contactsByClientId,
        calendarEventTypes: calendarInfo.eventTypes,
        calendarEvents: [...todayBookingEvents, ...todayCustomEvents],
      };

      applyDashboardData(dashboardData);
      await saveDashboardCache({
        barberId: uid,
        dashboardData,
      });
    } catch (err) {
      console.log("Error loading barber dashboard:", err);
      if (showErrorOnFailure && !hasCachedData) {
        setError("Failed to load dashboard. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [
    applyDashboardData,
    loadCachedDashboardData,
    saveDashboardCache,
  ]);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      loadDashboardData({
        useCache: true,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [loadDashboardData]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadDashboardData({
        showLoader: false,
        showErrorOnFailure: false,
      });
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboardData]);

  function getAmountsBookedForClient(targetBooking) {
    if (!targetBooking?.clientId) {
      return 1;
    }

    const bookedStatuses = ["confirmed", "completed"];
    const confirmedOrCompletedCount = allBookings.filter((booking) => {
      if (booking.clientId !== targetBooking.clientId) {
        return false;
      }

      if (booking.id === targetBooking.id) {
        return true;
      }

      return bookedStatuses.includes(booking.status);
    }).length;

    return Math.max(confirmedOrCompletedCount, 1);
  }

  function getAmountPayedForClient(targetBooking) {
    if (!targetBooking?.clientId) {
      return 0;
    }

    const paidStatuses = ["confirmed", "completed"];

    return allBookings.reduce((total, booking) => {
      if (booking.clientId !== targetBooking.clientId) {
        return total;
      }

      if (
        booking.id !== targetBooking.id &&
        !paidStatuses.includes(booking.status)
      ) {
        return total;
      }

      return total + Number(booking.totalPrice || 0);
    }, 0);
  }

  async function handleAcceptPendingBooking(booking) {
    try {
      setAcceptingPendingBookingId(booking.id);
      await confirmBooking(booking.id);

      const currentUser = auth.currentUser;

      if (booking?.clientId && currentUser?.uid) {
        await upsertBarberClientFromBooking({
          barberId: currentUser.uid,
          booking: {
            ...booking,
            status: "confirmed",
          },
          amountsBooked: getAmountsBookedForClient(booking),
          amountPayed: getAmountPayedForClient(booking),
        });
      }

      await loadDashboardData();
    } catch (err) {
      console.log("Error accepting pending booking:", err);
      setError("Failed to accept booking. Please try again.");
    } finally {
      setAcceptingPendingBookingId(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-app-background items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-app-text-secondary">
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-app-background items-center justify-center px-6">
        <Text className="text-center text-app-primary">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ScrollView
        className="flex-1 px-5 py-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1677FF"
            colors={["#1677FF"]}
          />
        }
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold text-app-text">
              Dash<Text className="text-app-primary">board</Text>
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/barber/notifications")}
            className="relative items-center justify-center rounded-full bg-app-primary-soft p-2 active:bg-app-surface-elevated"
          >
            <Ionicons
              name="notifications-outline"
              size={28}
              color="#0B1F3A"
            />

            {unreadNotificationCount > 0 ? (
              <View
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#0EA5E9",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 5,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {unreadNotificationCount > 9
                    ? "9+"
                    : unreadNotificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View className="mt-2">
          <Text className="text-xl font-bold text-app-text">
            Overview
          </Text>

          <View className="mt-0 flex-row  flex-wrap justify-between  ">
            <SummaryCard
              title="Today’s Appointments"
              value={todayBookings.length}
              onPress={() =>
                openBookingsWithFilters({
                  dateFilter: "today",
                  statusFilter: "all",
                })
              }
            >
              <SummaryClientNames
                bookings={todayBookings}
                emptyText="No clients booked today"
                showTime
              />
            </SummaryCard>

            <SummaryCard
              title="Tomorrow’s Bookings"
              value={tomorrowBookings.length}
              onPress={() =>
                openBookingsWithFilters({
                  dateFilter: "tomorrow",
                  statusFilter: "all",
                })
              }
            >
              <SummaryClientNames
                bookings={tomorrowBookings}
                emptyText="No clients booked tomorrow"
                showTime
              />
            </SummaryCard>

            <SummaryCard
              title="Pending Requests"
              value={pendingBookings.length}
              onPress={() =>
                openBookingsWithFilters({
                  dateFilter: "all",
                  statusFilter: "pending",
                })
              }
            >
              <PendingClientRows
                bookings={pendingBookings}
                emptyText="No pending clients"
                acceptingBookingId={acceptingPendingBookingId}
                onAccept={handleAcceptPendingBooking}
              />
            </SummaryCard>

            <SummaryCard
              title="This Week"
              value={thisWeekBookings.length}
              description="Pending and confirmed bookings"
              onPress={() =>
                openBookingsWithFilters({
                  dateFilter: "thisWeek",
                  statusFilter: "all",
                })
              }
            />
          </View>
        </View>

        <View className="mt-4">
          <Text className="text-xl font-bold text-app-text">
            Today
          </Text>

          <DailyCalendarPreview
            todayBookingCount={todayBookings.length}
            events={calendarEvents}
            eventTypes={calendarEventTypes}
            currentTime={currentTime}
          />
        </View>

        <View className="mt-4">
          <Text className="text-xl font-bold text-app-text">
            Next Clients
          </Text>

          <NextClientsSection
            bookings={nextClientBookings}
            contactsByClientId={nextClientContactsById}
          />
        </View>

        <View className="mb-8 mt-4">
          <Text className="text-xl font-bold text-app-text">
            Quick Actions
          </Text>

          <View className="mt-3 rounded-2xl border border-app-border bg-app-surface-elevated py-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 12,
                paddingHorizontal: 16,
              }}
            >
              <QuickActionCard
                label="Add Event"
                onPress={() =>
                  router.push({
                    pathname: "/barber/calender",
                    params: {
                      openEventAt: String(Date.now()),
                    },
                  })
                }
              />

              <QuickActionCard
                label="Manage Services"
                onPress={() => router.push("/barber/services")}
              />

              <QuickActionCard
                label="Manage Availability"
                onPress={() => router.push("/barber/availability")}
              />

              <QuickActionCard
                label="Client List"
                onPress={() => router.push("/barber/clients")}
              />
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
