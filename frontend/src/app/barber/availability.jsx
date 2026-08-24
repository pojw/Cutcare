import {
  useEffect,
  useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Switch,
} from "react-native";
import TimeInput from "../../components/barber/TimeInput";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@/components/icons/AppIcon";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAppAlert } from "../../context/AppAlertContext";

import { auth, db } from "../../config/firebase";

const DAYS = [
  { key: "monday", label: "Monday", shortLabel: "M" },
  { key: "tuesday", label: "Tuesday", shortLabel: "T" },
  { key: "wednesday", label: "Wednesday", shortLabel: "W" },
  { key: "thursday", label: "Thursday", shortLabel: "T" },
  { key: "friday", label: "Friday", shortLabel: "F" },
  { key: "saturday", label: "Saturday", shortLabel: "S" },
  { key: "sunday", label: "Sunday", shortLabel: "S" },
];

function buildDefaultAvailability() {
  return {
    monday: {
      enabled: true,
      blocks: [{ id: "monday-1", startTime: "09:00", endTime: "17:00" }],
    },
    tuesday: {
      enabled: true,
      blocks: [{ id: "tuesday-1", startTime: "09:00", endTime: "17:00" }],
    },
    wednesday: {
      enabled: true,
      blocks: [{ id: "wednesday-1", startTime: "09:00", endTime: "17:00" }],
    },
    thursday: {
      enabled: true,
      blocks: [{ id: "thursday-1", startTime: "09:00", endTime: "17:00" }],
    },
    friday: {
      enabled: true,
      blocks: [{ id: "friday-1", startTime: "09:00", endTime: "17:00" }],
    },
    saturday: {
      enabled: false,
      blocks: [{ id: "saturday-1", startTime: "10:00", endTime: "15:00" }],
    },
    sunday: {
      enabled: false,
      blocks: [{ id: "sunday-1", startTime: "10:00", endTime: "15:00" }],
    },
  };
}

function normalizeAvailability(value) {
  const defaults = buildDefaultAvailability();

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const normalized = {};

  DAYS.forEach((day) => {
    const existingDay = value?.[day.key];
    const existingBlocks = Array.isArray(existingDay?.blocks)
      ? existingDay.blocks
      : existingDay?.startTime && existingDay?.endTime
        ? [
            {
              id: `${day.key}-1`,
              startTime: existingDay.startTime,
              endTime: existingDay.endTime,
            },
          ]
        : defaults[day.key].blocks;

    normalized[day.key] = {
      enabled:
        typeof existingDay?.enabled === "boolean"
          ? existingDay.enabled
          : typeof existingDay?.isAvailable === "boolean"
            ? existingDay.isAvailable
          : defaults[day.key].enabled,
      blocks: existingBlocks.map((block, index) => ({
        id: block.id || `${day.key}-${index + 1}`,
        startTime: block.startTime || defaults[day.key].blocks[0].startTime,
        endTime: block.endTime || defaults[day.key].blocks[0].endTime,
      })),
    };
  });

  return normalized;
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const safeMinutes = Math.min(Math.max(totalMinutes, 0), 23 * 60 + 45);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function formatTime12Hour(time24) {
  if (!time24 || !time24.includes(":")) {
    return "Time not set";
  }

  const [hourString, minute] = time24.split(":");
  const hour24 = Number(hourString);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute} ${period}`;
}

function getNextBlockTimes(blocks) {
  const lastBlock = blocks[blocks.length - 1];
  const startTime = lastBlock?.endTime || "09:00";
  const endTime = minutesToTime(timeToMinutes(startTime) + 120);

  return {
    startTime,
    endTime,
  };
}

export default function BarberAvailability() {
  const { showAppAlert } = useAppAlert();
  const router = useRouter();

  const [availability, setAvailability] = useState(buildDefaultAvailability());
  const [allowSameDayBooking, setAllowSameDayBooking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  const [selectedDayKey, setSelectedDayKey] = useState(DAYS[0].key);
  const [slotModalVisible, setSlotModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [deletingSlot, setDeletingSlot] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [slotDraft, setSlotDraft] = useState({
    startTime: "09:00",
    endTime: "17:00",
  });

  const selectedDay =
    DAYS.find((day) => day.key === selectedDayKey) || DAYS[0];

  useEffect(() => {
    async function loadAvailability() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        const barberRef = doc(db, "barbers", currentUser.uid);
        const barberSnap = await getDoc(barberRef);

        if (!barberSnap.exists()) {
          showAppAlert(
            "Profile not found",
            "Your barber profile could not be found."
          );
          router.back();
          return;
        }

        const data = barberSnap.data();
        const existingAvailability = normalizeAvailability(data.availability);

        setAvailability(existingAvailability);
        setAllowSameDayBooking(data.allowSameDayBooking !== false);
      } catch (error) {
        console.log("Load barber availability error:", error);
        showAppAlert(
          "Error",
          "Something went wrong while loading availability."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, [router, showAppAlert]);

  function openSlotModal(dayKey, block) {
    setEditingSlot({
      dayKey,
      blockId: block.id,
      isNew: false,
    });
    setSlotDraft({
      startTime: block.startTime,
      endTime: block.endTime,
    });
    setSlotModalVisible(true);
  }

  function openNewSlotModal(dayKey) {
    const dayBlocks = availability[dayKey].blocks;
    const nextTimes = getNextBlockTimes(dayBlocks);

    setEditingSlot({
      dayKey,
      blockId: `${dayKey}-${Date.now()}`,
      isNew: true,
    });
    setSlotDraft(nextTimes);
    setSlotModalVisible(true);
  }

  function openDeleteSlotModal(dayKey, block) {
    setDeletingSlot({
      dayKey,
      blockId: block.id,
      startTime: block.startTime,
      endTime: block.endTime,
    });
    setDeleteModalVisible(true);
  }

  function closeDeleteSlotModal() {
    if (saving) {
      return;
    }

    setDeleteModalVisible(false);
    setDeletingSlot(null);
  }

  function toggleDay(dayKey) {
    setAvailability((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        enabled: !current[dayKey].enabled,
      },
    }));
  }

  function closeSlotModal() {
    setParentScrollEnabled(true);
    setSlotModalVisible(false);
    setEditingSlot(null);
  }

  function updateSlotDraft(field, value) {
    setSlotDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSelectDay(dayKey) {
    setParentScrollEnabled(true);
    setSelectedDayKey(dayKey);
  }

  function validateAvailability(nextAvailability = availability) {
    for (const day of DAYS) {
      const dayData = nextAvailability[day.key];

      if (!dayData.enabled) {
        continue;
      }

      if (!dayData.blocks?.length) {
        showAppAlert("Missing time block", `${day.label} needs one open block.`);
        return false;
      }

      for (let index = 0; index < dayData.blocks.length; index += 1) {
        const block = dayData.blocks[index];
        const blockLabel =
          dayData.blocks.length > 1
            ? `${day.label} block ${index + 1}`
            : day.label;

        if (!isValidTime(block.startTime)) {
          showAppAlert(
            "Invalid start time",
            `${blockLabel} start time must be in HH:MM format, like 09:00.`
          );
          return false;
        }

        if (!isValidTime(block.endTime)) {
          showAppAlert(
            "Invalid end time",
            `${blockLabel} end time must be in HH:MM format, like 17:00.`
          );
          return false;
        }

        if (timeToMinutes(block.startTime) >= timeToMinutes(block.endTime)) {
          showAppAlert(
            "Invalid time range",
            `${blockLabel} start time must be before the end time.`
          );
          return false;
        }
      }

      const sortedBlocks = [...dayData.blocks].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );

      for (let index = 1; index < sortedBlocks.length; index += 1) {
        const previousBlock = sortedBlocks[index - 1];
        const currentBlock = sortedBlocks[index];

        if (
          timeToMinutes(currentBlock.startTime) <
          timeToMinutes(previousBlock.endTime)
        ) {
          showAppAlert(
            "Overlapping blocks",
            `${day.label} has blocks that overlap.`
          );
          return false;
        }
      }
    }

    return true;
  }

  function buildAvailabilityWithSlot() {
    if (!editingSlot) {
      return availability;
    }

    return {
      ...availability,
      [editingSlot.dayKey]: {
        ...availability[editingSlot.dayKey],
        enabled: true,
        blocks: editingSlot.isNew
          ? [
              ...availability[editingSlot.dayKey].blocks,
              {
                id: editingSlot.blockId,
                startTime: slotDraft.startTime,
                endTime: slotDraft.endTime,
              },
            ]
          : availability[editingSlot.dayKey].blocks.map((block) =>
              block.id === editingSlot.blockId
                ? {
                    ...block,
                    startTime: slotDraft.startTime,
                    endTime: slotDraft.endTime,
                  }
                : block
            ),
      },
    };
  }

  function buildAvailabilityWithoutSlot() {
    if (!deletingSlot) {
      return availability;
    }

    return {
      ...availability,
      [deletingSlot.dayKey]: {
        ...availability[deletingSlot.dayKey],
        blocks: availability[deletingSlot.dayKey].blocks.filter(
          (block) => block.id !== deletingSlot.blockId
        ),
      },
    };
  }

  async function saveAvailability(nextAvailability = availability) {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      if (!validateAvailability(nextAvailability)) {
        return;
      }

      setSaving(true);

      const barberRef = doc(db, "barbers", currentUser.uid);

      await updateDoc(barberRef, {
        availability: nextAvailability,
        allowSameDayBooking,
        updatedAt: serverTimestamp(),
      });

      setAvailability(nextAvailability);
      return true;
    } catch (error) {
      console.log("Save barber availability error:", error);
      showAppAlert(
        "Save failed",
        "Something went wrong while saving your availability."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const saved = await saveAvailability();

    if (saved) {
      setConfirmationVisible(true);
    }
  }

  async function handleSaveSlot() {
    const nextAvailability = buildAvailabilityWithSlot();
    const saved = await saveAvailability(nextAvailability);

    if (saved) {
      closeSlotModal();
      setConfirmationVisible(true);
    }
  }

  async function handleConfirmDeleteSlot() {
    const nextAvailability = buildAvailabilityWithoutSlot();
    const saved = await saveAvailability(nextAvailability);

    if (saved) {
      setDeleteModalVisible(false);
      setDeletingSlot(null);
      setConfirmationVisible(true);
    }
  }

  function handleCancel() {
    router.back();
  }

  function renderDay({ item: day }) {
    const dayData = availability[day.key];
    const dayContent = (
      <>
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-bold text-app-text">{day.label}</Text>
          </View>

          {dayData.enabled ? (
            <Pressable
              onPress={() => toggleDay(day.key)}
              disabled={saving}
              className="rounded-full bg-app-surface-elevated px-4 py-2 active:bg-app-primary-soft"
            >
              <Text className="text-sm font-bold text-app-text-secondary">
                Close Day
              </Text>
            </Pressable>
          ) : (
            <View className="rounded-full bg-app-primary px-4 py-2">
              <Text className="text-sm font-bold text-app-text-inverse">
                Open Day
              </Text>
            </View>
          )}
        </View>

        <View className={!dayData.enabled ? "opacity-40" : ""}>
          {dayData.blocks.map((block, index) => (
            <View
              key={block.id}
              className={`rounded-2xl border border-app-border bg-app-surface-elevated ${
                index > 0 ? "mt-3" : ""
              }`}
            >
              <View className="flex-row items-center p-4">
                <Pressable
                  onPress={() => openSlotModal(day.key, block)}
                  disabled={!dayData.enabled || saving}
                  className="flex-1 active:bg-app-primary-soft"
                >
                  <Text className="text-sm font-bold text-app-text-secondary">
                    Slot {index + 1}
                  </Text>
                  <Text className="mt-1 text-base font-bold text-app-text">
                    {formatTime12Hour(block.startTime)} -{" "}
                    {formatTime12Hour(block.endTime)}
                  </Text>
                </Pressable>

                {dayData.blocks.length > 1 ? (
                  <Pressable
                    onPress={() => openDeleteSlotModal(day.key, block)}
                    disabled={!dayData.enabled || saving}
                    className="ml-2 h-9 w-9 items-center justify-center rounded-full active:bg-app-primary-soft"
                  >
                    <Ionicons name="trash-outline" size={18} color="#1677FF" />
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={() => openSlotModal(day.key, block)}
                  disabled={!dayData.enabled || saving}
                  className="h-9 w-9 items-center justify-center rounded-full active:bg-app-primary-soft"
                >
                  <Ionicons name="chevron-forward" size={20} color="#8A94A6" />
                </Pressable>
              </View>
            </View>
          ))}

          <View className="mt-4 items-center">
            <Pressable
              onPress={() => openNewSlotModal(day.key)}
              disabled={!dayData.enabled || saving}
              className="flex-row items-center rounded-full bg-app-primary-soft px-4 py-2 active:bg-app-surface-elevated"
            >
              <Ionicons name="add" size={18} color="#1677FF" />
              <Text className="ml-1 text-sm font-bold text-app-primary">
                Add Slot
              </Text>
            </Pressable>
          </View>
        </View>
      </>
    );

    if (!dayData.enabled) {
      return (
        <Pressable
          onPress={() => toggleDay(day.key)}
          disabled={saving}
          className="mb-5 rounded-2xl border border-app-border bg-app-surface p-4 active:bg-app-surface-elevated"
        >
          {dayContent}
        </Pressable>
      );
    }

    return (
      <View className="mb-5 rounded-2xl border border-app-border bg-app-surface p-4">
        {dayContent}
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-app-text-muted">
          Loading availability...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ConfirmationModal
        visible={confirmationVisible}
        title="Availability Saved"
        detail="Your weekly availability has been updated."
        onClose={() => setConfirmationVisible(false)}
      />

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="Delete Slot?"
        detail={
          deletingSlot
            ? `Remove ${formatTime12Hour(deletingSlot.startTime)} - ${formatTime12Hour(
                deletingSlot.endTime
              )} from this day?`
            : "Remove this availability slot?"
        }
        confirmLabel="Delete"
        loadingLabel="Saving..."
        loading={saving}
        onClose={closeDeleteSlotModal}
        onConfirm={handleConfirmDeleteSlot}
      />

      <Modal
        visible={slotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSlotModal}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable className="flex-1" onPress={closeSlotModal} />

          <View className="rounded-t-3xl bg-app-background px-5 pb-8 pt-4">
            <View className="mb-5 flex-row items-center justify-between">
              <Pressable
                onPress={closeSlotModal}
                disabled={saving}
                className="h-10 w-10 items-center justify-center rounded-full bg-app-surface-elevated"
              >
                <Ionicons name="close" size={22} color="#111827" />
              </Pressable>

              <Text className="text-xl font-bold text-app-text">Slot</Text>

              <View className="h-10 w-10" />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <TimeInput
                  label="Start"
                  value={slotDraft.startTime}
                  onChange={(value) => updateSlotDraft("startTime", value)}
                  disabled={saving}
                  onWheelTouchStart={() => setParentScrollEnabled(false)}
                  onWheelTouchEnd={() => setParentScrollEnabled(true)}
                />
              </View>

              <View className="flex-1">
                <TimeInput
                  label="End"
                  value={slotDraft.endTime}
                  onChange={(value) => updateSlotDraft("endTime", value)}
                  disabled={saving}
                  onWheelTouchStart={() => setParentScrollEnabled(false)}
                  onWheelTouchEnd={() => setParentScrollEnabled(true)}
                />
              </View>
            </View>

            <Pressable
              onPress={handleSaveSlot}
              disabled={saving}
              className={`mt-5 rounded-2xl px-4 py-4 ${
                saving ? "bg-app-disabled" : "bg-app-primary active:bg-app-primary-pressed"
              }`}
            >
              <Text className="text-center text-base font-bold text-app-text-inverse">
                {saving ? "Saving..." : "Save Availability"}
              </Text>
            </Pressable>

            <Pressable
              onPress={closeSlotModal}
              disabled={saving}
              className="mt-3 rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
            >
              <Text className="text-center text-base font-bold text-app-text">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <FlatList
          data={[selectedDay]}
          keyExtractor={(item) => item.key}
          renderItem={renderDay}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-5 pb-6"
          scrollEnabled={parentScrollEnabled}

          ListHeaderComponent={
            <View>
              <View className="px-1 py-6">
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => router.back()}
                    disabled={saving}
                    className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
                  >
                    <Ionicons name="arrow-back" size={24} color="#1677FF" />
                  </Pressable>

                  <Text className="flex-1 text-center text-3xl font-bold text-app-text">
                    Avail<Text className="text-app-primary">ability</Text>
                  </Text>

                  <View className="h-11 w-11" />
                </View>
              </View>

              <View className="mb-5 flex-row justify-between">
                {DAYS.map((day) => {
                  const selected = day.key === selectedDayKey;

                  return (
                    <Pressable
                      key={day.key}
                      onPress={() => handleSelectDay(day.key)}
                      disabled={saving}
                      className={`h-11 w-11 items-center justify-center rounded-full ${
                        selected
                          ? "bg-app-primary"
                          : "bg-app-surface-elevated active:bg-app-primary-soft"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          selected
                            ? "text-app-text-inverse"
                            : "text-app-text-secondary"
                        }`}
                      >
                        {day.shortLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className="mb-5 flex-row items-center rounded-2xl border border-app-border bg-app-surface p-4">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-bold text-app-text">
                    Allow Same-Day Booking
                  </Text>
                  <Text className="mt-1 text-sm font-semibold text-app-text-muted">
                    {allowSameDayBooking
                      ? "Allow clients to schedule the same day"
                      : "This means no clients can schedule the same day"}
                  </Text>
                </View>

                <Switch
                  value={allowSameDayBooking}
                  onValueChange={setAllowSameDayBooking}
                  disabled={saving}
                  trackColor={{ false: "#D8DEE8", true: "#BBD7FF" }}
                  thumbColor={allowSameDayBooking ? "#1677FF" : "#FFFFFF"}
                />
              </View>
            </View>
          }
          ListFooterComponent={
            <View>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                className={`rounded-2xl px-4 py-4 ${
                  saving ? "bg-app-disabled" : "bg-app-primary active:bg-app-primary-pressed"
                }`}
              >
                <Text className="text-center text-base font-bold text-app-text-inverse">
                  {saving ? "Saving..." : "Save Availability"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCancel}
                disabled={saving}
                className="mb-10 mt-4 rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
              >
                <Text className="text-center text-base font-bold text-app-text">
                  Cancel
                </Text>
              </Pressable>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
