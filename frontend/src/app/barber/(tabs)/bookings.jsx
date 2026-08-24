import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Ionicons } from "@/components/icons/AppIcon";
import { useAppAlert } from "../../../context/AppAlertContext";

import { auth } from "../../../config/firebase";
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  getBookingsForBarber,
} from "../../../services/bookingService";
import { formatTime12Hour } from "../../../utils/bookingTime";
import { getOrCreateConversation } from "../../../services/messageService";
import {
  getBarberClient,
  updateBarberClientPrivateNote,
  upsertBarberClientFromBooking,
} from "../../../services/barberClientService";

const INITIAL_VISIBLE_BOOKINGS = 4;
const BOOKINGS_CACHE_KEY_PREFIX = "barberBookingsCache";
const DATE_FILTERS = [
  "all",
  "today",
  "tomorrow",
  "upcoming",
  "thisWeek",
  "specific",
];
const STATUS_FILTERS = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];
const bookingsMemoryCache = new Map();

function getBookingsCacheKey(barberId) {
  return `${BOOKINGS_CACHE_KEY_PREFIX}:${barberId}`;
}

function getSingleParam(param) {
  return Array.isArray(param) ? param[0] : param;
}

function getValidatedParam(param, validValues) {
  const value = getSingleParam(param);

  return validValues.includes(value) ? value : "";
}

function getDateStringWithOffset(dayOffset) {
  const today = new Date();
  today.setDate(today.getDate() + dayOffset);

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDateString() {
  return getDateStringWithOffset(0);
}

function getTomorrowDateString() {
  return getDateStringWithOffset(1);
}

function getThisWeekEndDateString() {
  return getDateStringWithOffset(6);
}

function sortBarberBookings(bookings) {
  return [...bookings].sort((a, b) => {
    const dateA = `${a.appointmentDate || ""} ${a.startTime || ""}`;
    const dateB = `${b.appointmentDate || ""} ${b.startTime || ""}`;

    return dateA.localeCompare(dateB);
  });
}

function formatScheduledDate(dateString) {
  if (!dateString) {
    return "Date not set";
  }

  const [year, month, day] = dateString.split("-");

  if (!year || !month || !day) {
    return dateString;
  }

  return `${day}/${month}/${year}`;
}

function getStatusContainerClasses(status) {
  if (status === "pending") {
    return "bg-app-primary";
  }

  if (status === "confirmed") {
    return "bg-app-primary";
  }

  if (status === "completed") {
    return "bg-app-primary-soft";
  }

  if (status === "cancelled") {
    return "bg-app-surface-elevated";
  }

  return "bg-app-surface-elevated";
}

function getStatusTextClasses(status) {
  if (status === "pending" || status === "confirmed") {
    return "text-app-text-inverse";
  }

  if (status === "completed") {
    return "text-app-primary";
  }

  if (status === "cancelled") {
    return "text-app-text-muted";
  }

  return "text-app-text-secondary";
}

function getServices(booking) {
  return Array.isArray(booking.services) ? booking.services : [];
}

function FilterChip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={
        selected
          ? "mr-2 rounded-full border border-app-primary bg-app-primary px-4 py-2"
          : "mr-2 rounded-full border border-app-border bg-app-surface px-4 py-2"
      }
    >
      <Text
        className={
          selected
            ? "text-sm font-bold text-app-text-inverse"
            : "text-sm font-bold text-app-text-secondary"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}) {
  const className =
    variant === "subtle"
      ? "rounded-xl border border-app-border bg-app-surface px-4 py-3 active:bg-app-surface-elevated"
      : "rounded-xl bg-app-primary px-4 py-3 active:bg-app-primary-pressed";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ opacity: disabled ? 0.55 : 1 }}
      className={className}
    >
      <Text
        className={
          variant === "subtle"
            ? "text-center text-sm font-bold text-app-text-secondary"
            : "text-center text-sm font-bold text-app-text-inverse"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function BookingCard({
  booking,
  highlighted,
  actionLoadingId,
  noteLoadingId,
  messageLoadingId,
  onCancel,
  onComplete,
  onConfirm,
  onClientNote,
  onMessage,
}) {
  const services = getServices(booking);
  const canManage =
    booking.status === "pending" || booking.status === "confirmed";
  const isWorking = actionLoadingId === booking.id;
  const highlightOpacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(highlightOpacity, {
      toValue: highlighted ? 1 : 0,
      duration: highlighted ? 180 : 900,
      useNativeDriver: true,
    }).start();
  }, [highlightOpacity, highlighted]);

  return (
    <View className="relative mb-4 rounded-3xl border border-app-border bg-app-surface p-5">
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 rounded-3xl border-2 border-app-primary"
        style={{ opacity: highlightOpacity }}
      />

      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-xl font-bold text-app-text">
            {booking.clientName || "Client"}
          </Text>

          <Text className="mt-1 text-sm font-semibold text-app-text-muted">
            Scheduled Date: {formatScheduledDate(booking.appointmentDate)}
          </Text>

          <Text className="mt-1 text-sm text-app-text-muted">
            Time: {formatTime12Hour(booking.startTime)} -{" "}
            {formatTime12Hour(booking.endTime)}
          </Text>
        </View>

        <View
          className={`rounded-full px-3 py-2 ${getStatusContainerClasses(
            booking.status
          )}`}
        >
          <Text
            className={`text-sm font-bold capitalize ${getStatusTextClasses(
              booking.status
            )}`}
          >
            {booking.status || "unknown"}
          </Text>
        </View>
      </View>

      <View className="mt-5 rounded-2xl bg-app-surface-elevated p-4">
        <Text className="text-sm font-bold text-app-text-muted">
          Services
        </Text>

        {services.length === 0 ? (
          <Text className="mt-2 text-base text-app-text-muted">
            No services listed.
          </Text>
        ) : (
          services.map((service, index) => (
            <View
              key={service.id || String(index)}
              className="mt-3 flex-row justify-between"
            >
              <Text className="flex-1 pr-4 text-base font-semibold text-app-text">
                {service.name || "Unnamed service"}
              </Text>

              <Text className="text-base text-app-text-secondary">
                ${Number(service.price || 0).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>

      {booking.clientNotes ? (
        <View className="mt-3 rounded-2xl bg-app-surface-elevated p-4">
          <Text className="text-sm font-bold text-app-text-muted">
            Client Note
          </Text>

          <Text className="mt-2 text-base text-app-text-secondary">
            {booking.clientNotes}
          </Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row justify-between">
        <View>
          <Text className="text-xs font-semibold text-app-text-muted">
            Duration
          </Text>

          <Text className="mt-1 text-base text-app-text-secondary">
            {booking.totalDurationMinutes || 0} minutes
          </Text>
        </View>

        <View>
          <Text className="text-right text-xs font-semibold text-app-text-muted">
            Total
          </Text>

          <Text className="mt-1 text-base text-app-text-secondary">
            ${Number(booking.totalPrice || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {canManage ? (
        <View className="mt-5 gap-3">
          {booking.status === "confirmed" ? (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <ActionButton
                  label={
                    messageLoadingId === booking.id
                      ? "Opening Chat..."
                      : "Message Client"
                  }
                  onPress={() => onMessage(booking)}
                  disabled={messageLoadingId === booking.id}
                  variant="subtle"
                />
              </View>

              <View className="flex-1">
                <ActionButton
                  label={
                    noteLoadingId === booking.id
                      ? "Loading..."
                      : "Client Note"
                  }
                  onPress={() => onClientNote(booking)}
                  disabled={noteLoadingId === booking.id}
                  variant="subtle"
                />
              </View>
            </View>
          ) : (
            <ActionButton
              label={
                messageLoadingId === booking.id
                  ? "Opening Chat..."
                  : "Message Client"
              }
              onPress={() => onMessage(booking)}
              disabled={messageLoadingId === booking.id}
              variant="subtle"
            />
          )}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <ActionButton
                label={isWorking ? "Working..." : "Cancel"}
                onPress={() => onCancel(booking.id)}
                disabled={isWorking}
                variant="subtle"
              />
            </View>

            <View className="flex-1">
              {booking.status === "pending" ? (
                <ActionButton
                  label={isWorking ? "Working..." : "Confirm"}
                  onPress={() => onConfirm(booking.id)}
                  disabled={isWorking}
                />
              ) : (
                <ActionButton
                  label={isWorking ? "Working..." : "Complete"}
                  onPress={() => onComplete(booking.id)}
                  disabled={isWorking}
                />
              )}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ClientNoteModal({
  visible,
  clientName,
  noteBody,
  loading,
  saving,
  error,
  onChangeNoteBody,
  onClose,
  onSave,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={saving ? undefined : onClose}
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="max-h-[85%] w-full rounded-3xl border border-app-border bg-app-surface px-5 pb-6 pt-5"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-xl font-bold text-app-text">
                Client Note
              </Text>

              <Text
                numberOfLines={1}
                className="mt-1 text-sm font-semibold text-app-text-muted"
              >
                {clientName || "Client"}
              </Text>
            </View>

            <Pressable
              onPress={saving ? undefined : onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
            >
              <Text className="text-base font-bold text-app-primary">
                X
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="small" />
              <Text className="mt-3 text-sm text-app-text-muted">
                Loading note...
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-2 mt-5 text-sm font-semibold text-app-text-secondary">
                Private Note
              </Text>

              <TextInput
                value={noteBody}
                onChangeText={onChangeNoteBody}
                placeholder="Example: Loves anime. Ask about it next time."
                placeholderTextColor="#78909A"
                multiline
                textAlignVertical="top"
                className="min-h-36 rounded-2xl border border-app-border bg-app-background-soft px-4 py-3 text-app-text"
              />

              {error ? (
                <Text className="mt-3 text-sm font-medium text-app-error">
                  {error}
                </Text>
              ) : null}

              <View className="mt-6 flex-row gap-3">
                <Pressable
                  onPress={saving ? undefined : onClose}
                  className="flex-1 rounded-xl border border-app-border px-4 py-3"
                >
                  <Text className="text-center font-semibold text-app-text-secondary">
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={saving ? undefined : onSave}
                  className={`flex-1 rounded-xl px-4 py-3 ${
                    saving
                      ? "bg-app-disabled"
                      : "bg-app-primary active:bg-app-primary-pressed"
                  }`}
                >
                  <Text className="text-center font-semibold text-app-text-inverse">
                    {saving ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function BarberBookings() {
  const { showAppAlert } = useAppAlert();
  const router = useRouter();
  const {
    bookingId,
    dateFilter: routeDateFilter,
    selectedDate: routeSelectedDate,
    statusFilter: routeStatusFilter,
  } = useLocalSearchParams();
  const highlightTimerRef = useRef(null);
  const listRef = useRef(null);
  const scrollTargetId = Array.isArray(bookingId)
    ? bookingId[0]
    : bookingId;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [messageLoadingId, setMessageLoadingId] = useState(null);
  const [noteLoadingId, setNoteLoadingId] = useState(null);
  const [selectedNoteBooking, setSelectedNoteBooking] = useState(null);
  const [clientNoteBody, setClientNoteBody] = useState("");
  const [clientNoteLoading, setClientNoteLoading] = useState(false);
  const [clientNoteSaving, setClientNoteSaving] = useState(false);
  const [clientNoteError, setClientNoteError] = useState("");
  const [activeScrollTargetId, setActiveScrollTargetId] = useState("");
  const [highlightedBookingId, setHighlightedBookingId] = useState("");
  const [visibleBookingCount, setVisibleBookingCount] = useState(
    INITIAL_VISIBLE_BOOKINGS
  );

  const currentUser = auth.currentUser;

  const filteredBookings = useMemo(() => {
    const today = getTodayDateString();
    const tomorrow = getTomorrowDateString();
    const thisWeekEnd = getThisWeekEndDateString();

    return bookings.filter((booking) => {
      const matchesDateFilter =
        dateFilter === "all" ||
        (dateFilter === "today" && booking.appointmentDate === today) ||
        (dateFilter === "tomorrow" &&
          booking.appointmentDate === tomorrow) ||
        (dateFilter === "thisWeek" &&
          booking.appointmentDate >= today &&
          booking.appointmentDate <= thisWeekEnd) ||
        (dateFilter === "upcoming" && booking.appointmentDate >= today) ||
        (dateFilter === "specific" &&
          selectedDate &&
          booking.appointmentDate === selectedDate);

      const matchesStatusFilter =
        statusFilter === "all" || booking.status === statusFilter;

      return matchesDateFilter && matchesStatusFilter;
    });
  }, [
    bookings,
    dateFilter,
    selectedDate,
    statusFilter,
  ]);

  const visibleBookings = filteredBookings.slice(0, visibleBookingCount);
  const hasMoreBookings = filteredBookings.length > visibleBookingCount;

  const loadCachedBookings = useCallback(async (barberId) => {
    try {
      const memoryCache = bookingsMemoryCache.get(barberId);

      if (memoryCache?.bookings) {
        setBookings(memoryCache.bookings);
        setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
        return true;
      }

      const cachedBookings = await AsyncStorage.getItem(
        getBookingsCacheKey(barberId)
      );

      if (!cachedBookings) {
        return false;
      }

      const parsedCache = JSON.parse(cachedBookings);

      if (Array.isArray(parsedCache.bookings)) {
        bookingsMemoryCache.set(barberId, parsedCache);
        setBookings(parsedCache.bookings);
        setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
        return true;
      }

      return false;
    } catch (error) {
      console.log("Load cached barber bookings error:", error);
      return false;
    }
  }, []);

  const saveBookingsCache = useCallback(async ({
    barberId,
    loadedBookings,
  }) => {
    try {
      const cachePayload = {
        bookings: loadedBookings,
        cachedAt: Date.now(),
      };

      bookingsMemoryCache.set(barberId, cachePayload);
      await AsyncStorage.setItem(
        getBookingsCacheKey(barberId),
        JSON.stringify(cachePayload)
      );
    } catch (error) {
      console.log("Save barber bookings cache error:", error);
    }
  }, []);

  const loadBookings = useCallback(async ({
    showLoader = true,
    useCache = false,
    showErrorOnFailure = true,
  } = {}) => {
    let hasCachedData = false;

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("You must be logged in to view bookings.");
      }

      setErrorMessage("");

      if (useCache) {
        hasCachedData = await loadCachedBookings(user.uid);

        if (hasCachedData) {
          setLoading(false);
          return;
        }
      }

      if (showLoader) {
        setLoading(true);
      }

      const barberBookings = await getBookingsForBarber(user.uid);
      const sortedBookings = sortBarberBookings(barberBookings);

      setBookings(sortedBookings);
      setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
      await saveBookingsCache({
        barberId: user.uid,
        loadedBookings: sortedBookings,
      });
    } catch (error) {
      console.log("Error loading barber bookings:", error);
      if (showErrorOnFailure && !hasCachedData) {
        setErrorMessage("Could not load bookings. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadCachedBookings, saveBookingsCache]);

  const clearBookingHighlight = useCallback(() => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }

    setHighlightedBookingId("");
    setActiveScrollTargetId("");
  }, []);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      loadBookings({
        useCache: true,
      });
    });

    return () => {
      isMounted = false;
      clearBookingHighlight();
    };
  }, [clearBookingHighlight, loadBookings]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadBookings({
        showLoader: false,
        showErrorOnFailure: false,
      });
    } finally {
      setRefreshing(false);
    }
  }, [loadBookings]);

  useEffect(() => {
    const incomingDateFilter = getValidatedParam(
      routeDateFilter,
      DATE_FILTERS
    );
    const incomingStatusFilter = getValidatedParam(
      routeStatusFilter,
      STATUS_FILTERS
    );
    const incomingSelectedDate = getSingleParam(routeSelectedDate) || "";

    if (
      scrollTargetId ||
      (!incomingDateFilter && !incomingStatusFilter && !incomingSelectedDate)
    ) {
      return;
    }

    const nextDateFilter =
      incomingDateFilter || (incomingSelectedDate ? "specific" : "all");

    const applyRouteFiltersTimer = setTimeout(() => {
      setDateFilter(nextDateFilter);
      setStatusFilter(incomingStatusFilter || "all");
      setSelectedDate(
        nextDateFilter === "specific" ? incomingSelectedDate : ""
      );
      setDatePickerVisible(false);
      setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
      router.replace("/barber/bookings");
    }, 0);

    return () => clearTimeout(applyRouteFiltersTimer);
  }, [
    routeDateFilter,
    routeSelectedDate,
    routeStatusFilter,
    router,
    scrollTargetId,
  ]);

  useEffect(() => {
    if (!scrollTargetId) {
      return;
    }

    const applyHighlightTimer = setTimeout(() => {
      clearBookingHighlight();
      setActiveScrollTargetId(scrollTargetId);
      setHighlightedBookingId(scrollTargetId);
      setDateFilter("all");
      setStatusFilter("all");
      setSelectedDate("");
      router.replace("/barber/bookings");

      highlightTimerRef.current = setTimeout(() => {
        setHighlightedBookingId("");
        setActiveScrollTargetId("");
        highlightTimerRef.current = null;
      }, 2000);
    }, 0);

    return () => clearTimeout(applyHighlightTimer);
  }, [clearBookingHighlight, router, scrollTargetId]);

  useEffect(() => {
    if (!activeScrollTargetId || loading || filteredBookings.length === 0) {
      return;
    }

    const targetIndex = filteredBookings.findIndex(
      (booking) => booking.id === activeScrollTargetId
    );

    if (targetIndex < 0) {
      return;
    }

    if (targetIndex >= visibleBookingCount) {
      const revealTimer = setTimeout(() => {
        setVisibleBookingCount(targetIndex + 1);
      }, 0);

      return () => clearTimeout(revealTimer);
    }

    const scrollTimer = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: targetIndex,
        animated: true,
        viewPosition: 0.2,
      });
    }, 250);

    return () => clearTimeout(scrollTimer);
  }, [
    filteredBookings,
    loading,
    activeScrollTargetId,
    visibleBookingCount,
  ]);

  async function handleStatusAction(bookingIdToUpdate, actionType) {
    try {
      setActionLoadingId(bookingIdToUpdate);
      const bookingToUpdate = bookings.find(
        (booking) => booking.id === bookingIdToUpdate
      );

      if (actionType === "confirm") {
        await confirmBooking(bookingIdToUpdate);

        if (bookingToUpdate?.clientId && currentUser?.uid) {
          await upsertBarberClientFromBooking({
            barberId: currentUser.uid,
            booking: {
              ...bookingToUpdate,
              status: "confirmed",
            },
            amountsBooked: getAmountsBookedForClient(bookingToUpdate),
            amountPayed: getAmountPayedForClient(bookingToUpdate),
          });
        }
      }

      if (actionType === "cancel") {
        await cancelBooking(bookingIdToUpdate, currentUser?.uid);
      }

      if (actionType === "complete") {
        await completeBooking(bookingIdToUpdate);

        if (bookingToUpdate?.clientId && currentUser?.uid) {
          await upsertBarberClientFromBooking({
            barberId: currentUser.uid,
            booking: {
              ...bookingToUpdate,
              status: "completed",
            },
            amountsBooked: getAmountsBookedForClient(bookingToUpdate),
            amountPayed: getAmountPayedForClient(bookingToUpdate),
          });
        }
      }

      await loadBookings();
    } catch (error) {
      console.log("Error updating booking status:", error);
      setErrorMessage("Could not update booking. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleLoadMoreBookings() {
    setVisibleBookingCount(
      (currentCount) => currentCount + INITIAL_VISIBLE_BOOKINGS
    );
  }

  async function handleMessageClient(booking) {
    try {
      setMessageLoadingId(booking.id);

      const user = auth.currentUser;

      if (!user) {
        showAppAlert(
          "Login required",
          "You must be logged in to message a client."
        );
        return;
      }

      if (!booking?.clientId || !booking?.barberId) {
        showAppAlert(
          "Missing booking info",
          "This booking is missing client or barber information."
        );
        return;
      }

      const conversation = await getOrCreateConversation({
        clientId: booking.clientId,
        barberId: booking.barberId,
        clientName: booking.clientName || "Client",
        barberName: booking.barberName || user.displayName || "Barber",
        businessName: booking.businessName || "",
      });

      router.push(`/barber/conversation/${conversation.id}`);
    } catch (error) {
      console.log("Open client conversation error:", error);
      showAppAlert("Message error", "Could not open this conversation.");
    } finally {
      setMessageLoadingId(null);
    }
  }

  function getAmountsBookedForClient(targetBooking) {
    if (!targetBooking?.clientId) {
      return 1;
    }

    const bookedStatuses = ["confirmed", "completed"];
    const confirmedOrCompletedCount = bookings.filter((booking) => {
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

    return bookings.reduce((total, booking) => {
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

  async function handleOpenClientNote(booking) {
    try {
      setNoteLoadingId(booking.id);
      setSelectedNoteBooking(booking);
      setClientNoteBody("");
      setClientNoteError("");
      setClientNoteLoading(true);

      const user = auth.currentUser;

      if (!user || !booking?.clientId) {
        setClientNoteError("Missing client information.");
        return;
      }

      const barberClient = await getBarberClient({
        barberId: user.uid,
        clientId: booking.clientId,
      });

      setClientNoteBody(barberClient?.privateNote?.body || "");
    } catch (error) {
      console.log("Load barber client note error:", error);
      setClientNoteError("Could not load this client note.");
    } finally {
      setClientNoteLoading(false);
      setNoteLoadingId(null);
    }
  }

  function closeClientNoteModal() {
    if (clientNoteSaving) {
      return;
    }

    setSelectedNoteBooking(null);
    setClientNoteBody("");
    setClientNoteError("");
  }

  async function handleSaveClientNote() {
    const user = auth.currentUser;

    if (!user || !selectedNoteBooking?.clientId) {
      setClientNoteError("Missing client information.");
      return;
    }

    try {
      setClientNoteSaving(true);
      setClientNoteError("");

      await updateBarberClientPrivateNote({
        barberId: user.uid,
        booking: selectedNoteBooking,
        noteBody: clientNoteBody,
        amountsBooked: getAmountsBookedForClient(selectedNoteBooking),
        amountPayed: getAmountPayedForClient(selectedNoteBooking),
      });

      setSelectedNoteBooking(null);
      setClientNoteBody("");
      setClientNoteError("");
    } catch (error) {
      console.log("Save barber client note error:", error);
      setClientNoteError("Could not save this client note.");
    } finally {
      setClientNoteSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />

        <Text className="mt-3 text-app-text-secondary">
          Loading bookings...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
        <Text className="text-center font-semibold text-app-primary">
          {errorMessage}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="px-5 pb-3 pt-4">
        <Text className="text-3xl font-bold text-app-text">
          Book<Text className="text-app-primary">ings</Text>
        </Text>

        <View className="mt-5 rounded-2xl border border-app-border bg-app-surface p-4">
          <Text className="mb-2 text-xs font-bold uppercase text-app-text-muted">
            Date
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <FilterChip
              label="All"
              selected={dateFilter === "all"}
              onPress={() => {
                setDateFilter("all");
                setSelectedDate("");
                setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
              }}
            />

            <FilterChip
              label="Today"
              selected={dateFilter === "today"}
              onPress={() => {
                setDateFilter("today");
                setSelectedDate("");
                setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
              }}
            />

            <FilterChip
              label="Tomorrow"
              selected={dateFilter === "tomorrow"}
              onPress={() => {
                setDateFilter("tomorrow");
                setSelectedDate("");
                setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
              }}
            />

            <FilterChip
              label="Upcoming"
              selected={dateFilter === "upcoming"}
              onPress={() => {
                setDateFilter("upcoming");
                setSelectedDate("");
                setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
              }}
            />

            <FilterChip
              label="This Week"
              selected={dateFilter === "thisWeek"}
              onPress={() => {
                setDateFilter("thisWeek");
                setSelectedDate("");
                setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
              }}
            />

            <FilterChip
              label="Specific Date"
              selected={dateFilter === "specific"}
              onPress={() => {
                setDateFilter("specific");
                setDatePickerVisible(true);
                setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
              }}
            />
          </ScrollView>

          {dateFilter === "specific" ? (
            <View className="mt-3 flex-row items-center">
              <Pressable
                onPress={() => setDatePickerVisible(true)}
                className="flex-1 rounded-xl border border-app-border bg-app-surface-elevated px-4 py-3 active:bg-app-primary-soft"
              >
                <Text className="text-base font-semibold text-app-text">
                  {selectedDate
                    ? formatScheduledDate(selectedDate)
                    : "Choose a date"}
                </Text>
              </Pressable>

              {selectedDate ? (
                <Pressable
                  onPress={() => {
                    setSelectedDate("");
                    setDateFilter("all");
                    setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
                  }}
                  className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft"
                >
                  <Text className="text-base font-bold text-app-primary">
                    X
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <Text className="mb-2 mt-5 text-xs font-bold uppercase text-app-text-muted">
            Status
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {["all", "pending", "confirmed", "completed", "cancelled"].map(
              (status) => (
                <FilterChip
                  key={status}
                  label={
                    status === "all"
                      ? "All"
                      : status.charAt(0).toUpperCase() + status.slice(1)
                  }
                  selected={statusFilter === status}
                  onPress={() => {
                    setStatusFilter(status);
                    setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
                  }}
                />
              )
            )}
          </ScrollView>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={visibleBookings}
        keyExtractor={(item) => item.id}
        contentContainerClassName="flex-grow px-5 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1677FF"
            colors={["#1677FF"]}
          />
        }
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.2,
            });
          }, 350);
        }}
        ListEmptyComponent={
          <View className="rounded-3xl border border-app-border bg-app-surface p-6">
            <Text className="text-center text-lg font-bold text-app-text">
              {bookings.length === 0 ? "No bookings yet" : "No matching bookings"}
            </Text>

            <Text className="mt-2 text-center text-base text-app-text-muted">
              {bookings.length === 0
                ? "When clients book with you, their appointments will appear here."
                : "Try changing the date or status filter."}
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMoreBookings ? (
            <Pressable
              onPress={handleLoadMoreBookings}
              style={{ width: "58%" }}
              className="mt-2 self-center flex-row items-center justify-center rounded-xl bg-app-primary px-4 py-3 active:bg-app-primary-pressed"
            >
              <Text className="mr-2 text-base font-bold text-app-text-inverse">
                Load More
              </Text>

              <Ionicons
                name="chevron-down"
                size={18}
                color="#FFFFFF"
              />
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            highlighted={item.id === highlightedBookingId}
            actionLoadingId={actionLoadingId}
            messageLoadingId={messageLoadingId}
            noteLoadingId={noteLoadingId}
            onCancel={(id) => handleStatusAction(id, "cancel")}
            onComplete={(id) => handleStatusAction(id, "complete")}
            onConfirm={(id) => handleStatusAction(id, "confirm")}
            onClientNote={handleOpenClientNote}
            onMessage={handleMessageClient}
          />
        )}
      />

      <Modal
        visible={datePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View className="flex-1 justify-center bg-black/30 px-5">
          <View className="rounded-3xl bg-app-background p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-app-text">
                Select Date
              </Text>

              <Pressable
                onPress={() => setDatePickerVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-app-primary-soft"
              >
                <Text className="text-lg font-bold text-app-primary">
                  X
                </Text>
              </Pressable>
            </View>

            <Calendar
              current={selectedDate || getTodayDateString()}
              markedDates={
                selectedDate
                  ? {
                      [selectedDate]: {
                        selected: true,
                        selectedColor: "#1677FF",
                        selectedTextColor: "#FFFFFF",
                      },
                    }
                  : {}
              }
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setDateFilter("specific");
                setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
                setDatePickerVisible(false);
              }}
              theme={{
                backgroundColor: "#FFFFFF",
                calendarBackground: "#FFFFFF",
                textSectionTitleColor: "#52657A",
                selectedDayBackgroundColor: "#1677FF",
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: "#1677FF",
                dayTextColor: "#0B1F3A",
                textDisabledColor: "#B9C5D2",
                arrowColor: "#1677FF",
                monthTextColor: "#0B1F3A",
                textMonthFontWeight: "700",
                textDayFontWeight: "600",
                textDayHeaderFontWeight: "700",
              }}
            />

            <Pressable
              onPress={() => {
                setSelectedDate("");
                setDateFilter("all");
                setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
                setDatePickerVisible(false);
              }}
              className="mt-4 rounded-xl border border-app-border bg-app-surface px-4 py-3 active:bg-app-surface-elevated"
            >
              <Text className="text-center text-base font-bold text-app-text-secondary">
                Clear Date
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ClientNoteModal
        visible={Boolean(selectedNoteBooking)}
        clientName={selectedNoteBooking?.clientName || "Client"}
        noteBody={clientNoteBody}
        loading={clientNoteLoading}
        saving={clientNoteSaving}
        error={clientNoteError}
        onChangeNoteBody={setClientNoteBody}
        onClose={closeClientNoteModal}
        onSave={handleSaveClientNote}
      />
    </SafeAreaView>
  );
}
