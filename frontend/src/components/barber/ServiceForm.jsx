import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  PanResponder,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";

const DURATION_ITEM_HEIGHT = 36;
const DURATION_WHEEL_HEIGHT = DURATION_ITEM_HEIGHT * 3;
const DURATION_HOURS = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];
const DURATION_MINUTES = ["00", "15", "30", "45"];
const MAX_DURATION_MINUTES = 8 * 60 + 45;

function parseDuration(value) {
  const numericValue = Number(value);
  const safeValue =
    Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 45;
  const roundedValue = Math.min(
    MAX_DURATION_MINUTES,
    Math.max(15, Math.round(safeValue / 15) * 15)
  );

  return {
    hours: String(Math.floor(roundedValue / 60)),
    minutes: String(roundedValue % 60).padStart(2, "0"),
  };
}

function formatDurationLabel(totalMinutes) {
  const numericMinutes = Number(totalMinutes);
  const safeMinutes =
    Number.isFinite(numericMinutes) && numericMinutes > 0 ? numericMinutes : 45;
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} hr`;
  }

  return `${minutes} min`;
}

function DurationWheelColumn({ title, options, selectedValue, onChange }) {
  const scrollRef = useRef(null);
  const selectedIndex = Math.max(options.indexOf(selectedValue), 0);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * DURATION_ITEM_HEIGHT,
        animated: false,
      });
    }, 0);
  }, [selectedIndex]);

  function handleScrollEnd(event) {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / DURATION_ITEM_HEIGHT);
    const safeIndex = Math.min(Math.max(index, 0), options.length - 1);

    onChange(options[safeIndex]);

    scrollRef.current?.scrollTo({
      y: safeIndex * DURATION_ITEM_HEIGHT,
      animated: true,
    });
  }

  return (
    <View className="flex-1">
      <Text className="mb-1 text-center text-[10px] font-bold uppercase text-app-text-muted">
        {title}
      </Text>

      <View
        style={{ height: DURATION_WHEEL_HEIGHT }}
        className="relative overflow-hidden rounded-xl border border-app-border bg-app-surface-elevated"
      >
        <View
          pointerEvents="none"
          style={{
            top: DURATION_ITEM_HEIGHT,
            height: DURATION_ITEM_HEIGHT,
          }}
          className="absolute left-1 right-1 rounded-lg border border-app-border-subtle bg-app-surface"
        />

        <ScrollView
          ref={scrollRef}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={DURATION_ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          style={{ zIndex: 1 }}
          contentContainerStyle={{
            paddingTop: DURATION_ITEM_HEIGHT,
            paddingBottom: DURATION_ITEM_HEIGHT,
          }}
        >
          {options.map((item) => {
            const active = item === selectedValue;

            return (
              <View
                key={item}
                style={{ height: DURATION_ITEM_HEIGHT }}
                className="items-center justify-center"
              >
                <Text
                  className={`text-center ${
                    active
                      ? "text-lg font-bold text-app-text"
                      : "text-sm font-semibold text-app-text-muted"
                  }`}
                >
                  {item}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

function DurationInput({ value, onChange }) {
  const parsed = parseDuration(value);

  function updateDuration(nextValues) {
    const nextHours = nextValues.hours ?? parsed.hours;
    const nextMinutes = nextValues.minutes ?? parsed.minutes;
    let totalMinutes = Number(nextHours) * 60 + Number(nextMinutes);

    if (totalMinutes <= 0) {
      totalMinutes = 15;
    }

    onChange(String(totalMinutes));
  }

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-app-text-secondary">
          Duration
        </Text>
        <Text className="text-sm font-bold text-app-primary">
          {formatDurationLabel(value)}
        </Text>
      </View>

      <View className="rounded-2xl border border-app-border bg-app-surface-elevated p-2">
        <View className="flex-row gap-2">
          <DurationWheelColumn
            title="Hr"
            options={DURATION_HOURS}
            selectedValue={parsed.hours}
            onChange={(hours) => updateDuration({ hours })}
          />

          <DurationWheelColumn
            title="Min"
            options={DURATION_MINUTES}
            selectedValue={parsed.minutes}
            onChange={(minutes) => updateDuration({ minutes })}
          />
        </View>
      </View>
    </View>
  );
}

export default function ServiceForm({
  editing,
  saving,
  serviceName,
  setServiceName,
  price,
  setPrice,
  durationMinutes,
  setDurationMinutes,
  description,
  setDescription,
  onSave,
  onCancel,
}) {
  const translateY = useMemo(() => new Animated.Value(0), []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 8 && Math.abs(gestureState.dx) < 24,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 90 && !saving) {
            onCancel();
            translateY.setValue(0);
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onCancel, saving, translateY]
  );

  useEffect(() => {
    const parsedDuration = parseDuration(durationMinutes);
    const normalizedDuration = String(
      Number(parsedDuration.hours) * 60 + Number(parsedDuration.minutes)
    );

    if (durationMinutes !== normalizedDuration) {
      setDurationMinutes(normalizedDuration);
    }
  }, [durationMinutes, setDurationMinutes]);

  function handlePriceChange(value) {
    setPrice(value.replace(/[^0-9]/g, ""));
  }

  return (
    <Animated.View
      className="rounded-t-3xl bg-app-background"
      style={{ maxHeight: "82%", transform: [{ translateY }] }}
    >
      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-3"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-3" {...panResponder.panHandlers}>
          <View className="items-center pb-1">
            <View className="h-1.5 w-12 rounded-full bg-app-border" />
          </View>
        </View>

        <View className="rounded-3xl bg-app-surface p-5">
          <View className="mb-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-app-text-secondary">
                Service Name
              </Text>

              <Pressable
                onPress={onCancel}
                disabled={saving}
                className="h-9 w-9 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
              >
                <Ionicons name="close" size={22} color="#1677FF" />
              </Pressable>
            </View>

            <TextInput
              value={serviceName}
              onChangeText={setServiceName}
              placeholder="Fade"
              placeholderTextColor="#8292A6"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Price
            </Text>
            <TextInput
              value={price}
              onChangeText={handlePriceChange}
              placeholder="35"
              placeholderTextColor="#8292A6"
              keyboardType="numeric"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>

          <View className="mb-4">
            <DurationInput
              value={durationMinutes}
              onChange={setDurationMinutes}
            />
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Clean fade with lineup"
              placeholderTextColor="#8292A6"
              multiline
              className="min-h-32 rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>

          <Pressable
            onPress={onSave}
            disabled={saving}
            className={`rounded-2xl px-4 py-4 ${
              saving ? "bg-app-disabled" : "bg-app-primary active:bg-app-primary-pressed"
            }`}
          >
            <Text className="text-center text-base font-bold text-app-text-inverse">
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Service"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Animated.View>
  );
}
