import { useEffect, useRef } from "react";
import { View, Text, ScrollView } from "react-native";

const ITEM_HEIGHT = 36;
const WHEEL_HEIGHT = ITEM_HEIGHT * 3;

const HOURS = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
const MINUTES = ["00", "15", "30", "45"];
const PERIODS = ["AM", "PM"];

function parseTime24(time24) {
  if (!time24 || !time24.includes(":")) {
    return {
      hour: "9",
      minute: "00",
      period: "AM",
    };
  }

  const [hourString, minuteString] = time24.split(":");
  const hour24 = Number(hourString);

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return {
    hour: String(hour12),
    minute: minuteString || "00",
    period,
  };
}

function toTime24(hour, minute, period) {
  let hourNumber = Number(hour);

  if (period === "AM" && hourNumber === 12) {
    hourNumber = 0;
  }

  if (period === "PM" && hourNumber !== 12) {
    hourNumber += 12;
  }

  return `${String(hourNumber).padStart(2, "0")}:${minute}`;
}

function WheelColumn({
  title,
  options,
  selectedValue,
  onChange,
  disabled,
  onTouchStart,
  onTouchEnd,
}) {
  const scrollRef = useRef(null);
  const selectedIndex = Math.max(options.indexOf(selectedValue), 0);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 0);
  }, [selectedIndex]);

  function handleScrollEnd(event) {
    if (disabled) return;

    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const safeIndex = Math.min(Math.max(index, 0), options.length - 1);

    onChange(options[safeIndex]);

    scrollRef.current?.scrollTo({
      y: safeIndex * ITEM_HEIGHT,
      animated: true,
    });
  }

  return (
    <View className="flex-1">
      <Text className="mb-1 text-center text-[10px] font-bold uppercase text-app-text-muted">
        {title}
      </Text>

      <View
        style={{ height: WHEEL_HEIGHT }}
        className="relative overflow-hidden rounded-xl border border-app-border bg-app-surface-elevated"
      >
        <View
          pointerEvents="none"
          style={{
            top: ITEM_HEIGHT,
            height: ITEM_HEIGHT,
          }}
          className="absolute left-1 right-1 rounded-lg border border-app-border-subtle bg-app-surface"
        />

        <ScrollView
          ref={scrollRef}
          nestedScrollEnabled
          scrollEnabled={!disabled}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          style={{ zIndex: 1 }}
          contentContainerStyle={{
            paddingTop: ITEM_HEIGHT,
            paddingBottom: ITEM_HEIGHT,
          }}
        >
          {options.map((item) => {
            const active = item === selectedValue;

            return (
              <View
                key={item}
                style={{ height: ITEM_HEIGHT }}
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

export default function TimeInput({
  label,
  value,
  onChange,
  disabled = false,
  onWheelTouchStart,
  onWheelTouchEnd,
  showLabel = true,
  showBorder = true,
}) {
  const parsed = parseTime24(value);

  function updateTime(nextValues) {
    const nextHour = nextValues.hour ?? parsed.hour;
    const nextMinute = nextValues.minute ?? parsed.minute;
    const nextPeriod = nextValues.period ?? parsed.period;

    onChange(toTime24(nextHour, nextMinute, nextPeriod));
  }

  return (
    <View className={disabled ? "opacity-40" : ""}>
      {showLabel ? (
        <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
          {label}
        </Text>
      ) : null}

      <View
        className={`rounded-2xl bg-app-surface p-2 ${
          showBorder ? "border border-app-border" : ""
        }`}
      >
        <Text className="mb-2 text-center text-sm font-bold text-app-text">
          {parsed.hour}:{parsed.minute} {parsed.period}
        </Text>

        <View className="flex-row gap-1">
          <WheelColumn
            title="Hr"
            options={HOURS}
            selectedValue={parsed.hour}
            disabled={disabled}
            onTouchStart={onWheelTouchStart}
            onTouchEnd={onWheelTouchEnd}
            onChange={(hour) => updateTime({ hour })}
          />

          <WheelColumn
            title="Min"
            options={MINUTES}
            selectedValue={parsed.minute}
            disabled={disabled}
            onTouchStart={onWheelTouchStart}
            onTouchEnd={onWheelTouchEnd}
            onChange={(minute) => updateTime({ minute })}
          />

          <WheelColumn
            title="AM"
            options={PERIODS}
            selectedValue={parsed.period}
            disabled={disabled}
            onTouchStart={onWheelTouchStart}
            onTouchEnd={onWheelTouchEnd}
            onChange={(period) => updateTime({ period })}
          />
        </View>
      </View>
    </View>
  );
}
