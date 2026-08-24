import {
  useCallback,
  useState } from "react";
import {
  View,
  Pressable,
  Text,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@/components/icons/AppIcon";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { formatTime12Hour } from "../../../utils/bookingTime";
import { auth, db } from "../../../config/firebase";
import { useFocusEffect, useRouter } from "expo-router";
import { cancelBooking } from "../../../services/bookingService";
import { getReviewForBooking,createReview } from "../../../services/reviewService";
import { useAppAlert } from "../../../context/AppAlertContext";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";

const BOOKINGS_CACHE_KEY_PREFIX = "clientBookingsCache";
const INITIAL_VISIBLE_BOOKINGS = 4;

function getBookingsCacheKey(uid) {
  return `${BOOKINGS_CACHE_KEY_PREFIX}:${uid}`;
}

function formatScheduledDate(dateValue) {
  if (!dateValue) {
    return "Date not set";
  }

  const [year, month, day] = String(dateValue).split("-");

  if (!year || !month || !day) {
    return dateValue;
  }

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDateTimeValue(dateValue, timeValue = "") {
  if (!dateValue) {
    return 0;
  }

  const dateText = String(dateValue);
  const isoDateParts = dateText.split("-").map(Number);
  let date;

  if (
    isoDateParts.length === 3 &&
    isoDateParts.every((part) => Number.isFinite(part))
  ) {
    date = new Date(
      isoDateParts[0],
      isoDateParts[1] - 1,
      isoDateParts[2]
    );
  } else {
    date = new Date(dateText);
  }

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const [hour = 0, minute = 0] = String(timeValue)
    .split(":")
    .map(Number);

  date.setHours(
    Number.isFinite(hour) ? hour : 0,
    Number.isFinite(minute) ? minute : 0,
    0,
    0
  );

  return date.getTime();
}

function sortBookingsForDisplay(bookingsToSort) {
  return [...bookingsToSort].sort((a, b) => {
    const dateA = getDateTimeValue(a.appointmentDate, a.startTime);
    const dateB = getDateTimeValue(b.appointmentDate, b.startTime);

    return dateB - dateA;
  });
}
export default function ClientBookings() {
  const { showAppAlert } = useAppAlert();
const router = useRouter();
const [bookings, setBookings] = useState([]);
const [visibleBookingCount, setVisibleBookingCount] = useState(INITIAL_VISIBLE_BOOKINGS);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);

const [errorMessage, setErrorMessage] = useState("");

const [reviewModalVisible, setReviewModalVisible] = useState(false);
const [selectedBooking, setSelectedBooking] = useState(null);
const [rating, setRating] = useState(0);
const [comment, setComment] = useState("");
const [submittingReview, setSubmittingReview] = useState(false);
const [bookingToCancel, setBookingToCancel] = useState(null);
const [cancellingBooking, setCancellingBooking] = useState(false);

function openReviewModal(booking) {
  setSelectedBooking(booking);
  setRating(0);
  setComment("");
  setReviewModalVisible(true);
}

function closeReviewModal() {
  setReviewModalVisible(false);
  setSelectedBooking(null);
  setRating(0);
  setComment("");
  setSubmittingReview(false);
}
async function handleSubmitReview() {
  try {
    if (!selectedBooking) {
      showAppAlert("Missing booking", "Could not find the booking to review.");
      return;
    }

    if (!rating) {
      showAppAlert("Rating required", "Please select a rating from 1 to 5.");
      return;
    }

    setSubmittingReview(true);

    await createReview({
      booking: selectedBooking,
      rating,
      comment,
    });

    await loadClientBookings();

    closeReviewModal();

    showAppAlert("Review submitted", "Thank you for leaving a review.");
  } catch (error) {
    console.log("Submit review error:", error);

    showAppAlert(
      "Review failed",
      error.message || "Could not submit your review."
    );
  } finally {
    setSubmittingReview(false);
  }
}

function handleCancelBooking(booking) {
  const canCancel =
    booking.status === "pending" ||
    booking.status === "confirmed";

  if (!canCancel) {
    showAppAlert(
      "Cannot cancel",
      "Only pending or confirmed bookings can be cancelled."
    );
    return;
  }

  setBookingToCancel(booking);
}

function closeCancelBookingModal() {
  if (cancellingBooking) {
    return;
  }

  setBookingToCancel(null);
}

async function handleConfirmCancelBooking() {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      showAppAlert(
        "Login required",
        "You must be logged in to cancel a booking."
      );
      return;
    }

    if (!bookingToCancel) {
      showAppAlert("Missing booking", "Could not find this booking.");
      return;
    }

    if (bookingToCancel.clientId !== currentUser.uid) {
      showAppAlert(
        "Not allowed",
        "You cannot cancel this booking."
      );
      return;
    }

    setCancellingBooking(true);

    await cancelBooking(
      bookingToCancel.id,
      currentUser.uid
    );

    setBookingToCancel(null);
    await loadClientBookings();

    showAppAlert(
      "Booking cancelled",
      "Your appointment has been cancelled."
    );
  } catch (error) {
    console.log("Cancel booking error:", error);

    showAppAlert(
      "Cancellation failed",
      error.message || "Could not cancel the booking."
    );
  } finally {
    setCancellingBooking(false);
  }
}

async function loadCachedBookings(uid) {
  try {
    const cachedBookings = await AsyncStorage.getItem(
      getBookingsCacheKey(uid)
    );

    if (!cachedBookings) {
      return false;
    }

    const parsedCache = JSON.parse(cachedBookings);

    if (Array.isArray(parsedCache.bookings)) {
      setBookings(sortBookingsForDisplay(parsedCache.bookings));
      return true;
    }

    return false;
  } catch (error) {
    console.log("Load cached bookings error:", error);
    return false;
  }
}

async function saveBookingsCache({
  uid,
  loadedBookings,
}) {
  try {
    await AsyncStorage.setItem(
      getBookingsCacheKey(uid),
      JSON.stringify({
        bookings: loadedBookings,
        cachedAt: Date.now(),
      })
    );
  } catch (error) {
    console.log("Save bookings cache error:", error);
  }
}

async function loadClientBookings({
  showLoader = true,
  useCache = false,
  showErrorOnFailure = true,
} = {}) {
  let hasCachedData = false;

  try {
    if (showLoader) {
      setLoading(true);
    }
    setErrorMessage("");

    const currentUser = auth.currentUser;
console.log("Current user uid:", currentUser?.uid);
    if (!currentUser) {
      setErrorMessage("You must be logged in to view bookings.");
      return;
    }

    if (useCache) {
      hasCachedData = await loadCachedBookings(currentUser.uid);

      if (hasCachedData) {
        setLoading(false);
      }
    }

    const bookingsRef = collection(db, "bookings");

    const bookingsQuery = query(
      bookingsRef,
      where("clientId", "==", currentUser.uid)
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookingList = bookingsSnapshot.docs.map((bookingDoc) => ({
      id: bookingDoc.id,
      ...bookingDoc.data(),
    }));
    

const sortedBookings = sortBookingsForDisplay(bookingList);

const bookingsWithReviews = await Promise.all(
  sortedBookings.map(async (booking) => {
    if (booking.status !== "completed") {
      return {
        ...booking,
        review: null,
      };
    }

    const review = await getReviewForBooking(booking.id);

    return {
      ...booking,
      review,
    };
  })
);
console.log("Bookings with reviews:", bookingsWithReviews);
setBookings(bookingsWithReviews);
await saveBookingsCache({
  uid: currentUser.uid,
  loadedBookings: bookingsWithReviews,
});
} catch (error) {
    console.log("Load client bookings error:", error);
    if (showErrorOnFailure && !hasCachedData) {
      setErrorMessage("Could not load your bookings.");
    }
  } finally {
    setLoading(false);
  }
}
useFocusEffect(
  useCallback(() => {
    loadClientBookings({
      showLoader: true,
      useCache: true,
    });
  }, [])
);

const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  setVisibleBookingCount(INITIAL_VISIBLE_BOOKINGS);
  await loadClientBookings({
    showLoader: false,
    showErrorOnFailure: false,
  });
  setRefreshing(false);
}, []);

const visibleBookings = bookings.slice(0, visibleBookingCount);
const hasMoreBookings = bookings.length > visibleBookingCount;

function handleLoadMoreBookings() {
  setVisibleBookingCount((currentCount) => currentCount + INITIAL_VISIBLE_BOOKINGS);
}

if (loading) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
      <ActivityIndicator size="large" />
      <Text className="mt-4 text-app-text-muted">
        Loading bookings...
      </Text>
    </SafeAreaView>
  );
}

if (errorMessage) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
      <Text className="text-center text-2xl font-bold text-app-text">
        Booking Error
      </Text>

      <Text className="mt-3 text-center text-app-text-muted">
        {errorMessage}
      </Text>
    </SafeAreaView>
  );
}

return (
  <SafeAreaView className="flex-1 bg-app-background">
    <FlatList
      data={visibleBookings}
      keyExtractor={(item) => item.id}
      contentContainerClassName="px-6 py-6"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#1677FF"
          colors={["#1677FF"]}
        />
      }
      ListHeaderComponent={
        <View className="mb-6">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
            >
              <Ionicons name="arrow-back" size={24} color="#1677FF" />
            </Pressable>

            <Text className="flex-1 text-center text-3xl font-bold text-app-text">
              My<Text className="text-app-primary">Bookings</Text>
            </Text>

            <View className="h-11 w-11" />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View className="rounded-3xl border border-app-border bg-app-surface p-6">
          <Text className="text-center text-base text-app-text-muted">
            You do not have any bookings yet.
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
      renderItem={({ item }) => {
        const services = Array.isArray(item.services)
          ? item.services
          : [];

        return (
          <View className="mb-4 rounded-3xl border border-app-border bg-app-surface p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-xl font-bold text-app-text">
                  {item.businessName || item.barberName || "Barber"}
                </Text>

                <Text className="mt-1 text-sm text-app-text-muted">
                  Scheduled Date: {formatScheduledDate(item.appointmentDate)}
                </Text>

                <Text className="mt-1 text-sm text-app-text-muted">
                  Time: {formatTime12Hour(item.startTime)} –{" "}
                  {formatTime12Hour(item.endTime)}
                </Text>
              </View>

              <View className="rounded-full bg-app-primary px-3 py-2">
                <Text className="text-sm font-bold capitalize text-app-text-inverse">
                  {item.status || "pending"}
                </Text>
                
              </View>
              
            </View>

            <Text className="mb-2 mt-4 text-base font-semibold text-app-text-muted">
              Services
            </Text>

            {services.length === 0 ? (
              <Text className="text-base text-app-text-muted">
                No services listed.
              </Text>
            ) : (
              services.map((service, index) => (
                <View
                  key={service.id || String(index)}
                  className="mb-2 flex-row justify-between"
                >
                  <Text className="flex-1 pr-4 text-base text-app-text-secondary">
                    {service.name || "Unnamed service"}
                  </Text>

                  <Text className="text-base text-app-text-secondary">
                    ${Number(service.price || 0).toFixed(2)}
                  </Text>
                </View>
              ))
            )}

            <View className="mt-4 flex-row justify-between">
              <Text className="font-semibold text-app-text-muted">
                Duration
              </Text>

              <Text className="text-app-text-muted">
                {item.totalDurationMinutes || 0} minutes
              </Text>
            </View>

            <View className="mt-2 flex-row justify-between">
  <Text className="font-semibold text-app-text-secondary">
    Total
  </Text>

  <Text className="text-base text-app-text-secondary">
    ${Number(item.totalPrice || 0).toFixed(2)}
  </Text>
</View>

{(item.status === "pending" ||
  item.status === "confirmed") && (
  <View className="mt-4 flex-row justify-center">
    <Pressable
      onPress={() => handleCancelBooking(item)}
      className=" rounded-lg border border-app-error px-6 py-2 active:opacity-80"
    >
      <Text className="text-xs font-bold text-app-error">
        Cancel
      </Text>
    </Pressable>
  </View>
  
)}
{item.status === "completed" && (
  <View className="mt-4">
    {item.review ? (
      <View className="rounded-xl border border-app-primary bg-app-primary-soft px-4 py-3">
        <Text className="text-center text-sm font-bold text-app-primary">
          Review submitted
        </Text>
      </View>
    ) : (
     <Pressable
  onPress={() => openReviewModal(item)}
  className="rounded-xl bg-app-primary px-4 py-3 active:bg-app-primary-pressed"
>
  <Text className="text-center text-sm font-bold text-app-text-inverse">
    Leave Review
  </Text>
</Pressable>
    )}
  </View>
)}
           
          </View>
        );
      }}
    />
<Modal
  visible={reviewModalVisible}
  transparent
  animationType="fade"
  onRequestClose={closeReviewModal}
>
  <View
    className="flex-1 items-center justify-center px-6"
    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
  >
    <View className="w-full rounded-3xl border border-app-border bg-app-surface px-6 py-6">
      <Text className="text-2xl font-bold text-app-text">
        Leave a Review
      </Text>

      <Text className="mt-2 text-sm text-app-text-muted">
        {selectedBooking?.businessName ||
          selectedBooking?.barberName ||
          "Your barber"}
      </Text>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-bold text-app-text">
          Rating
        </Text>

        <View className="flex-row justify-between">
          {[1, 2, 3, 4, 5].map((value) => {
            const isSelected = rating === value;

            return (
              <Pressable
                key={value}
                style={{ outlineStyle: "none" }}
                onPress={() => setRating(value)}
       className={
  isSelected
    ? "h-14 w-14 items-center justify-center rounded-full bg-app-primary"
    : "h-14 w-14 items-center justify-center rounded-full border border-app-border bg-app-surface"
}
              >
                <Text
                  className={
                    isSelected
                      ? "text-base font-bold text-app-text-inverse"
                      : "text-base font-bold text-app-text"
                  }
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-bold text-app-text">
          Comment
        </Text>

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="How was your appointment?"
          placeholderTextColor="#8292A6"
          multiline
          textAlignVertical="top"
          className="min-h-28 rounded-2xl border border-app-border bg-app-background-soft px-4 py-3 text-base text-app-text"
        />
      </View>

      <View className="mt-6 flex-row gap-3">
        <Pressable
          onPress={closeReviewModal}
          className="flex-1 rounded-xl border border-app-border px-4 py-3 active:opacity-80"
        >
          <Text className="text-center font-bold text-app-text">
            Cancel
          </Text>
        </Pressable>

        <Pressable
  onPress={handleSubmitReview}
  disabled={submittingReview}
  style={{ outlineStyle: "none" }}
  className={
    submittingReview
      ? "flex-1 rounded-xl bg-app-disabled px-4 py-3"
      : "flex-1 rounded-xl bg-app-primary px-4 py-3 active:bg-app-primary-pressed"
  }
>
  <Text className="text-center font-bold text-app-text-inverse">
    {submittingReview ? "Submitting..." : "Submit"}
  </Text>
</Pressable>
      </View>
    </View>
  </View>
</Modal>
<ConfirmDeleteModal
  visible={Boolean(bookingToCancel)}
  title="Cancel Booking"
  detail="Are you sure you want to cancel this appointment?"
  confirmLabel="Cancel Appointment"
  loadingLabel="Cancelling..."
  loading={cancellingBooking}
  onClose={closeCancelBookingModal}
  onConfirm={handleConfirmCancelBooking}
/>
  </SafeAreaView>
);
}
