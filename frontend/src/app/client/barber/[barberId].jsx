import {
  useEffect,
  useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@/components/icons/AppIcon";
import { doc, getDoc } from "firebase/firestore";
import { useAppAlert } from "../../../context/AppAlertContext";

import {auth, db } from "../../../config/firebase";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import ConfirmationModal from "../../../components/ConfirmationModal";
import AccountRequiredModal from "../../../components/AccountRequiredModal";

//Booking functions
import {
  generateBookingSlotsForAvailability,
  normalizeAvailabilityDay,
} from "../../../utils/generateBookingSlots";
import { filterAvailableSlots } from "../../../utils/filterAvailableSlots";
import { getBarberBookingsByDate } from "../../../services/bookingService";
import { createBooking } from "../../../services/createBooking";


//Messages 
import { getOrCreateConversation } from "../../../services/messageService";


import { getReviewsForBarber } from "../../../services/reviewService";

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const PAYMENT_OPTION_LABELS = {
  cash: "Cash",
  venmo: "Venmo",
  cash_app: "Cash App",
  zelle: "Zelle",
  apple_pay: "Apple Pay",
  card: "Card",
};

function formatTime12Hour(time24) {
  if (!time24 || !time24.includes(":")) {
    return "Not available";
  }

  const [hourString, minute] = time24.split(":");
  const hour24 = Number(hourString);

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute} ${period}`;
}

function getUpcomingDays(numberOfDays = 7) {
  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);

    return {
      id: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`,
      date,
      dayKey: DAY_KEYS[date.getDay()],
      dayName: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      dateNumber: String(date.getDate()),
      isToday: index === 0,
      monthDay: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    };
  });
}

function getAcceptedPaymentLabels(acceptedPayments) {
  if (!Array.isArray(acceptedPayments)) {
    return [];
  }

  return acceptedPayments.map(
    (paymentId) => PAYMENT_OPTION_LABELS[paymentId] || paymentId
  );
}

function renderStars(rating, size = 16) {
  const numericRating = Number(rating || 0);

  return Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const iconName =
      numericRating >= starValue
        ? "star"
        : numericRating >= starValue - 0.5
          ? "star-half"
          : "star-outline";

    return (
      <Ionicons
        key={index}
        name={iconName}
        size={size}
        color="#1677FF"
      />
    );
  });
}

function getPortfolioImageUrl(image) {
  if (typeof image === "string") {
    return image;
  }

  return image?.url || image?.imageUrl || image?.downloadUrl || "";
}

export default function BarberDetails() {
  const { showAppAlert } = useAppAlert();
  const router = useRouter();
  const { barberId } = useLocalSearchParams();

  const [barberData, setBarberData] = useState(null);
  const [userData, setUserData] = useState(null);

  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");


  const [availableSlots, setAvailableSlots] = useState([]);
const [loadingSlots, setLoadingSlots] = useState(false);

const [clientUserData, setClientUserData] = useState(null);
const [savingBooking, setSavingBooking] = useState(false);
const [bookingConfirmVisible, setBookingConfirmVisible] = useState(false);
const [bookingConfirmError, setBookingConfirmError] = useState("");
const [guestBookingName, setGuestBookingName] = useState("");
const [bookingSuccessVisible, setBookingSuccessVisible] = useState(false);
const currentUser = auth.currentUser;

const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] = useState(false);
const [selectedTab, setSelectedTab] = useState("services");
//Messsages 
const [messageLoading, setMessageLoading] = useState(false);
const [selectedPortfolioImageUrl, setSelectedPortfolioImageUrl] = useState("");
const [accountModalVisible, setAccountModalVisible] = useState(false);

const isGuest = Boolean(clientUserData?.isGuest || currentUser?.isAnonymous);

function requireAccount() {
  setAccountModalVisible(true);
}

async function loadBarberReviews(currentBarberId) {
  try {
    if (!currentBarberId) {
      setReviews([]);
      return;
    }

    setReviewsLoading(true);

    const reviewList = await getReviewsForBarber(currentBarberId);

    setReviews(reviewList);
  } catch (error) {
    console.log("Load barber reviews error:", error);
    setReviews([]);
  } finally {
    setReviewsLoading(false);
  }
}

  useEffect(() => {
    async function loadBarberDetails() {
      try {
        if (!barberId || Array.isArray(barberId)) {
          setErrorMessage("A valid barber ID was not provided.");
          return;
        }

        const barberRef = doc(db, "barbers", barberId);
        const userRef = doc(db, "users", barberId);
        const clientUserRef = doc(db, "users", currentUser.uid);

        const [barberSnap, userSnap,clientUserSnap] = await Promise.all([
          getDoc(barberRef),
          getDoc(userRef),
          getDoc(clientUserRef),

        ]);
        if (clientUserSnap.exists()) {
          setClientUserData(clientUserSnap.data());
        }
        if (!barberSnap.exists()) {
          setErrorMessage("This barber profile could not be found.");
          return;
        }
        
 

        const loadedBarber = {
          id: barberSnap.id,
          ...barberSnap.data(),
        };

        setBarberData(loadedBarber);
        console.log("Loaded barber:", loadedBarber);
       await loadBarberReviews(barberId);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (error) {
        console.log("Load barber details error:", error);
        setErrorMessage("Failed to load barber details.");
      } finally {
        setLoading(false);
      }
    }

    loadBarberDetails();
  }, [barberId, currentUser?.uid]);


async function handleMessageBarber() {
  try {
    if (isGuest) {
      requireAccount();
      return;
    }

    setMessageLoading(true);

    const currentUser = auth.currentUser;

    if (!currentUser) {
      showAppAlert("Login required", "You must be logged in to message a barber.");
      return;
    }

    if (!barberId || Array.isArray(barberId)) {
      showAppAlert("Missing barber", "Missing barber information.");
      return;
    }

    const conversation = await getOrCreateConversation({
      clientId: currentUser.uid,
      barberId,
      clientName:
        clientUserData?.fullName ||
        currentUser.displayName ||
        "Client",
      barberName:
        userData?.fullName ||
        barberData?.fullName ||
        barberData?.name ||
        "Barber",
      businessName: barberData?.businessName || "",
      barberProfileImageUrl:
        barberData?.profileImageUrl ||
        userData?.profileImageUrl ||
        "",
    });

    router.push(`/client/conversation/${conversation.id}`);
  } catch (error) {
    console.error("Error opening conversation:", error);
    showAppAlert("Message error", "Could not open conversation. Please try again.");
  } finally {
    setMessageLoading(false);
  }
}

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />

        <Text className="mt-4 text-app-text-muted">
          Loading barber details...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage || !barberData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
        <Text className="text-center text-2xl font-bold text-app-text">
          Barber Not Found
        </Text>

        <Text className="mt-3 text-center text-base text-app-text-muted">
          {errorMessage || "The barber profile could not be loaded."}
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="mt-8 rounded-2xl bg-app-primary px-6 py-4 active:bg-app-primary-pressed"
        >
          <Text className="font-bold text-app-text-inverse">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const services = Array.isArray(barberData.services)
    ? barberData.services
    : [];

  const selectedServices = services.filter((service, index) => {
    const serviceId = service.id || String(index);
    return selectedServiceIds.includes(serviceId);
  });

  const totalDuration = selectedServices.reduce(
    (total, service) =>
      total + Number(service.durationMinutes || 0),
    0
  );

  const totalPrice = selectedServices.reduce(
    (total, service) => total + Number(service.price || 0),
    0
  );

  const hasSelectedServices = selectedServices.length > 0;
  const allowSameDayBooking = barberData.allowSameDayBooking !== false;

  const upcomingDays = getUpcomingDays(7);
  const calendarMonthYear = upcomingDays[0]?.date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const barberDisplayName =
    barberData.businessName || userData?.fullName || "Unnamed Barber";

  function toggleService(serviceId) {
    setSelectedServiceIds((current) => {
      if (current.includes(serviceId)) {
        return current.filter((id) => id !== serviceId);
      }

      return [...current, serviceId];
    });

    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableSlots([]);
  }

async function handleDateSelection(day) {
  if (!hasSelectedServices) {
    return;
  }

  if (day.isToday && !allowSameDayBooking) {
    return;
  }

  const dayAvailability = barberData.availability?.[day.dayKey];
  const normalizedAvailability = normalizeAvailabilityDay(dayAvailability);

  if (!normalizedAvailability.enabled) {
    return;
  }

  try {
    setLoadingSlots(true);
    setSelectedDate(day.id);
    setSelectedTime(null);
    setAvailableSlots([]);

    const candidateSlots = generateBookingSlotsForAvailability(
      dayAvailability,
      totalDuration
    );

    const existingBookings = await getBarberBookingsByDate(
      barberData.id,
      day.id
    );

    const validSlots = filterAvailableSlots(
      candidateSlots,
      existingBookings
    );

    setAvailableSlots(validSlots);
  } catch (error) {
    console.log("Load available slots error:", error);
    showAppAlert(
      "Availability error",
      "Could not load available appointment times."
    );
  } finally {
    setLoadingSlots(false);
  }
}

 function handleBookPress() {
  if (!hasSelectedServices || !selectedDate || !selectedTime) {
    showAppAlert(
      "Missing selection",
      "Please select at least one service, a date, and a time."
    );
    return;
  }

  const selectedSlot = availableSlots.find(
    (slot) => slot.startTime === selectedTime
  );

  if (!selectedSlot) {
    showAppAlert(
      "Time unavailable",
      "Please select an available appointment time."
    );
    return;
  }

  setBookingConfirmError("");
  setGuestBookingName("");
  setBookingConfirmVisible(true);
}

async function handleConfirmBooking() {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setBookingConfirmError("You must be logged in to create a booking.");
        return;
      }

      const selectedSlot = availableSlots.find(
        (slot) => slot.startTime === selectedTime
      );

      if (!selectedSlot) {
        setBookingConfirmError("Please select an available appointment time.");
        return;
      }

      const trimmedGuestName = guestBookingName.trim();

      if (isGuest && !trimmedGuestName) {
        setBookingConfirmError("Please enter your name.");
        return;
      }

      setSavingBooking(true);

      const bookingServices = selectedServices.map((service, index) => ({
        id: service.id || String(index),
        name: service.name || "Unnamed service",
        price: Number(service.price || 0),
        durationMinutes: Number(service.durationMinutes || 0),
      }));

      const bookingId = await createBooking({
        clientId: currentUser.uid,
        barberId: barberData.id,

        clientName:
          isGuest
            ? trimmedGuestName
            : clientUserData?.fullName || "Unnamed client",

        barberName:
          userData?.fullName || "Unnamed barber",

        businessName:
          barberData.businessName || "Unnamed business",

        services: bookingServices,

        totalPrice,
        totalDurationMinutes: totalDuration,

        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,

        clientNotes: "",
      });

      setBookingConfirmVisible(false);
      setBookingSuccessVisible(true);

      console.log("Created booking:", bookingId);
    } catch (error) {
      console.log("Create booking error:", error);
      setBookingConfirmError(
        error.message || "Could not create the booking."
      );
    } finally {
      setSavingBooking(false);
    }
}

function closeBookingSuccessModal() {
  setBookingSuccessVisible(false);
  router.replace("/client/bookings");
}

function closeBookingConfirmModal() {
  if (savingBooking) {
    return;
  }

  setBookingConfirmVisible(false);
  setBookingConfirmError("");
  setGuestBookingName("");
}

  const portfolioImages = Array.isArray(
  barberData.portfolioImages
)
  ? barberData.portfolioImages
  : [];
const acceptedPaymentLabels = getAcceptedPaymentLabels(
  barberData.acceptedPayments
);
const bookingConfirmDetail = `Book ${selectedServices.length} service${
  selectedServices.length === 1 ? "" : "s"
} with ${barberDisplayName} on ${selectedDate || "your selected date"} at ${
  selectedTime ? formatTime12Hour(selectedTime) : "your selected time"
}?`;

return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons name="arrow-back" size={24} color="#1677FF" />
          </Pressable>

          <Text className="flex-1 text-center text-2xl font-bold text-app-text">
            {barberDisplayName}
          </Text>

          <View className="h-11 w-11" />
        </View>

        {/* Barber Information */}
        <View className="mb-8 items-center">
          <View className="mb-4 items-center">
            {barberData.profileImageUrl ? (
  <Image
    source={{ uri: barberData.profileImageUrl }}
    className="h-28 w-28 rounded-full"
  />
) : (
  <View className="h-28 w-28 items-center justify-center rounded-full bg-app-surface-elevated">
    <Text className="text-app-text-muted">
      No Photo
    </Text>
  </View>
)}
          </View>

          <Text className="mt-3 text-center text-base text-app-text-muted">
            {barberData.location?.city || "City not added"},{" "}
            {barberData.location?.state || "State not added"}
          </Text>

          {acceptedPaymentLabels.length > 0 ? (
            <View className="mt-4 flex-row flex-wrap justify-center gap-2">
              {acceptedPaymentLabels.map((paymentLabel) => (
                <View
                  key={paymentLabel}
                  className="rounded-full bg-app-primary-soft px-3 py-2"
                >
                  <Text className="text-sm font-semibold text-app-primary">
                    {paymentLabel}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View className="mb-6 flex-row rounded-2xl bg-app-surface-elevated p-1">
  <Pressable
    onPress={() => setSelectedTab("services")}
    className={
      selectedTab === "services"
        ? "flex-1 rounded-xl bg-app-primary px-4 py-3"
        : "flex-1 rounded-xl px-4 py-3"
    }
  >
    <Text
      className={
        selectedTab === "services"
          ? "text-center font-bold text-app-text-inverse"
          : "text-center font-bold text-app-text-secondary"
      }
    >
      Services
    </Text>
  </Pressable>

  <Pressable
    onPress={() => setSelectedTab("reviews")}
    className={
      selectedTab === "reviews"
        ? "flex-1 rounded-xl bg-app-primary px-4 py-3"
        : "flex-1 rounded-xl px-4 py-3"
    }
  >
    <Text
      className={
        selectedTab === "reviews"
          ? "text-center font-bold text-app-text-inverse"
          : "text-center font-bold text-app-text-secondary"
      }
    >
      Reviews
    </Text>
  </Pressable>
   <Pressable
    onPress={() => setSelectedTab("portfolio")}
    className={
      selectedTab === "portfolio"
        ? "flex-1 rounded-xl bg-app-primary px-4 py-3"
        : "flex-1 rounded-xl px-4 py-3"
    }
  >
    <Text
      className={
        selectedTab === "portfolio"
          ? "text-center font-bold text-app-text-inverse"
          : "text-center font-bold text-app-text-secondary"
      }
    >
      Portfolio
    </Text>
  </Pressable>
</View>
{selectedTab === "services" && (
  <>

        {/* Services */}
        <View className="mb-3 rounded-3xl bg-app-surface p-5">
          <Text className="mb-3 text-xl font-bold text-app-text">
            Select Services
          </Text>

          {services.length === 0 ? (
            <Text className="text-app-text-muted">
              No services are currently listed.
            </Text>
          ) : (
            services.map((service, index) => {
              const serviceId =
                service.id || String(index);

              const selected =
                selectedServiceIds.includes(serviceId);

              return (
                <Pressable
                  key={serviceId}
                  onPress={() => toggleService(serviceId)}
                  className={`mb-3 rounded-2xl border p-4 active:opacity-80 ${
                    selected
                      ? "border-app-primary bg-app-primary-soft"
                      : "border-app-border bg-app-surface"
                  }`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="text-base font-bold text-app-text">
                        {service.name || "Unnamed service"}
                      </Text>

                      <Text className="mt-1 text-sm text-app-text-muted">
                        {service.durationMinutes ?? 0} minutes
                      </Text>

                      {service.description ? (
                        <Text className="mt-2 text-sm leading-5 text-app-text-secondary">
                          {service.description}
                        </Text>
                      ) : null}
                    </View>

                    <View className="items-end">
                      <Text className="font-bold text-app-text">
                        $
                        {Number(
                          service.price || 0
                        ).toFixed(2)}
                      </Text>

                      <View
                        className={`mt-3 h-6 w-6 items-center justify-center rounded-full border ${
                          selected
                            ? "border-app-primary bg-app-primary"
                            : "border-app-border bg-app-surface"
                        }`}
                      >
                        {selected ? (
                          <Text className="text-sm font-bold text-app-text-inverse">
                            ✓
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Date and Time */}
        <View
          className={`mb-6 rounded-3xl bg-app-surface p-5 ${
            hasSelectedServices
              ? "opacity-100"
              : "opacity-40"
          }`}
        >
          <Text className="text-xl font-bold text-app-text">
            Select Appointment
          </Text>

          <View className="mt-5">
            <Text className="mb-4 text-base font-bold text-app-text">
              {calendarMonthYear}
            </Text>

            <View className="mb-2 flex-row justify-between">
              {upcomingDays.map((day) => (
                <View key={`${day.id}-name`} className="w-11 items-center">
                  <Text className="text-xs font-bold text-app-text-muted">
                    {day.dayName}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row justify-between">
              {upcomingDays.map((day) => {
                const dayAvailability =
                  barberData.availability?.[day.dayKey];

                const barberIsOpen =
                  normalizeAvailabilityDay(dayAvailability).enabled;

                const enabled =
                  hasSelectedServices &&
                  barberIsOpen &&
                  (allowSameDayBooking || !day.isToday);

                const selected =
                  selectedDate === day.id;

                return (
                  <Pressable
                    key={day.id}
                    disabled={!enabled}
                    onPress={() =>
                      handleDateSelection(day)
                    }
                    className={`h-11 w-11 items-center justify-center rounded-full ${
                      selected
                        ? "bg-app-primary"
                        : enabled
                          ? "bg-app-surface-elevated active:bg-app-primary-soft"
                          : "bg-app-surface-elevated opacity-40"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        selected
                          ? "text-app-text-inverse"
                          : "text-app-text-secondary"
                      }`}
                    >
                      {day.dateNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!allowSameDayBooking ? (
              <Text className="mt-3 text-sm font-semibold text-app-text-muted">
                Same-day booking is not available with this barber.
              </Text>
            ) : null}
          </View>

          <View className="mt-5 rounded-2xl bg-app-surface-elevated p-4">
  {loadingSlots ? (
    <ActivityIndicator className="mt-4" />
  ) : !selectedDate ? (
    <Text className="mt-3 text-app-text-muted">
      Select an available day.
    </Text>
  ) : availableSlots.length === 0 ? (
    <Text className="mt-3 text-app-text-muted">
      No appointment times are available for this day.
    </Text>
  ) : (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      className="mt-4"
    >
      {availableSlots.map((slot) => {
        const selected = selectedTime === slot.startTime;

        return (
          <Pressable
            key={`${slot.startTime}-${slot.endTime}`}
            onPress={() => setSelectedTime(slot.startTime)}
            className={`mr-2 rounded-xl border px-4 py-3 ${
              selected
                ? "border-app-primary bg-app-primary"
                : "border-app-border bg-app-surface"
            }`}
          >
            <Text
              className={`font-semibold ${
                selected ? "text-app-text-inverse" : "text-app-text"
              }`}
            >
              {formatTime12Hour(slot.startTime)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  )}
</View>
        </View>

<Pressable
  disabled={
    savingBooking ||
    !hasSelectedServices ||
    !selectedDate ||
    !selectedTime
  }
  onPress={handleBookPress}
  className={`rounded-2xl px-4 py-4 active:opacity-80 ${
    savingBooking ||
    !hasSelectedServices ||
    !selectedDate ||
    !selectedTime
      ? "bg-app-disabled"
      : "bg-app-primary active:bg-app-primary-pressed"
  }`}
>
  <Text className="text-center text-base font-bold text-app-text-inverse">
    {savingBooking ? "Booking..." : "Book Appointment"}
  </Text>
</Pressable>
<Pressable
  onPress={handleMessageBarber}
  disabled={messageLoading}
  className={`mt-4 rounded-2xl px-4 py-4 ${
    messageLoading ? "bg-app-disabled" : "bg-app-primary active:bg-app-primary-pressed"
  }`}
>
  <Text className="text-center text-base font-bold text-app-text-inverse">
    {messageLoading ? "Opening Chat..." : "Message Barber"}
  </Text>
</Pressable>
    </>
)}

{/* reviews */}
{selectedTab === "reviews" && (
  <View className="mb-6 rounded-3xl bg-app-surface p-5">
    {reviewsLoading ? (
      <View>
        <ActivityIndicator />
        <Text className="mt-3 text-center text-app-text-muted">
          Loading reviews...
        </Text>
      </View>
    ) : reviews.length === 0 ? (
      <Text className="mt-5 text-app-text-muted">
        No reviews yet.
      </Text>
    ) : (
      <View>
        {reviews.map((review) => (
          <View
            key={review.id}
            className="mb-4 rounded-2xl bg-app-surface-elevated p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-bold text-app-text">
                {review.clientName || "Client"}
              </Text>

              <View className="flex-row items-center gap-0.5">
                {renderStars(review.rating, 14)}
              </View>
            </View>

            {!!review.comment && (
              <Text className="mt-3 leading-5 text-app-text-secondary">
                {review.comment}
              </Text>
            )}

            <Text className="mt-3 text-xs text-app-text-muted">
              {review.createdAt?.toDate
                ? review.createdAt.toDate().toLocaleDateString()
                : ""}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
)}
{selectedTab === "portfolio" && (
  <View className="mb-6 rounded-3xl bg-app-surface p-5">
    {portfolioImages.length === 0 ? (
      <Text className="text-app-text-muted">
        No portfolio images yet.
      </Text>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {portfolioImages.map((image, index) => {
          const imageUrl = getPortfolioImageUrl(image);

          if (!imageUrl) {
            return null;
          }

          return (
          <Pressable
            key={image.id || imageUrl || String(index)}
            onPress={() => setSelectedPortfolioImageUrl(imageUrl)}
            className="mr-3 active:opacity-80"
          >
            <Image
              source={{ uri: imageUrl }}
              className="h-28 w-28 rounded-xl"
              resizeMode="cover"
            />
          </Pressable>
          );
        })}
      </ScrollView>
    )}
  </View>
)}
        
      </ScrollView>

      <ConfirmDeleteModal
        visible={bookingConfirmVisible}
        title="Confirm Booking"
        detail={bookingConfirmDetail}
        confirmLabel="Confirm"
        loadingLabel="Booking..."
        loading={savingBooking}
        error={bookingConfirmError}
        onClose={closeBookingConfirmModal}
        onConfirm={handleConfirmBooking}
      >
        {isGuest ? (
          <View className="mt-5">
            <Text className="mb-2 text-sm font-bold text-app-text">
              Your Name
            </Text>

            <TextInput
              value={guestBookingName}
              onChangeText={(value) => {
                setGuestBookingName(value);
                setBookingConfirmError("");
              }}
              editable={!savingBooking}
              placeholder="Enter your name"
              placeholderTextColor="#78909A"
              autoCapitalize="words"
              className="rounded-2xl border border-app-border bg-app-background-soft px-4 py-3 text-base text-app-text"
            />
          </View>
        ) : null}
      </ConfirmDeleteModal>

      <ConfirmationModal
        visible={bookingSuccessVisible}
        title="Booking Requested"
        detail="Your appointment request was sent to the barber."
        confirmLabel="View Bookings"
        onClose={closeBookingSuccessModal}
      />

      <AccountRequiredModal
        visible={accountModalVisible}
        detail="Create an account to message barbers and keep your conversations."
        onClose={() => setAccountModalVisible(false)}
      />

      <Modal
        visible={Boolean(selectedPortfolioImageUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPortfolioImageUrl("")}
      >
        <View className="flex-1 justify-center bg-black/80 px-5">
          <Pressable
            onPress={() => setSelectedPortfolioImageUrl("")}
            className="mb-4 self-end rounded-full bg-app-primary-soft px-4 py-3"
          >
            <Text className="font-bold text-app-primary">Close</Text>
          </Pressable>

          {selectedPortfolioImageUrl ? (
            <Image
              source={{ uri: selectedPortfolioImageUrl }}
              className="w-full rounded-3xl bg-black"
              resizeMode="contain"
              style={{ height: "78%" }}
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
