import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";

import usLocations from "../../data/usLocations.json";

const RESULT_LIMIT = 80;

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function findStateByValue(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  return (
    usLocations.find(
      (state) =>
        normalizeText(state.code) === normalizedValue ||
        normalizeText(state.name) === normalizedValue
    ) || null
  );
}

function getSelectedState(value) {
  return findStateByValue(value?.stateCode || value?.state);
}

function PickerModal({
  visible,
  title,
  searchValue,
  onChangeSearch,
  data,
  emptyText,
  onClose,
  onSelect,
  renderLabel,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="max-h-[78%] rounded-t-3xl bg-app-background px-5 pb-8 pt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-app-surface-elevated"
            >
              <Ionicons name="close" size={22} color="#111827" />
            </Pressable>

            <Text className="text-xl font-bold text-app-text">{title}</Text>

            <View className="h-10 w-10" />
          </View>

          <TextInput
            value={searchValue}
            onChangeText={onChangeSearch}
            placeholder="Search"
            placeholderTextColor="#8292A6"
            autoCapitalize="words"
            className="mb-4 rounded-2xl border border-app-border bg-app-surface px-4 py-4 text-base text-app-text"
          />

          <FlatList
            data={data}
            keyExtractor={(item) => `${renderLabel(item)}-${item.code || ""}`}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View className="rounded-2xl bg-app-surface px-4 py-5">
                <Text className="text-center text-app-text-muted">
                  {emptyText}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                className="mb-2 flex-row items-center rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
              >
                <Text className="flex-1 text-base font-semibold text-app-text">
                  {renderLabel(item)}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#8292A6"
                />
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function LocationPicker({
  label = "Location",
  value,
  onChange,
  disabled = false,
}) {
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const selectedState = getSelectedState(value);
  const selectedCity = value?.city || "";

  const filteredStates = useMemo(() => {
    const query = normalizeText(stateSearch);

    return usLocations
      .filter((state) => {
        if (!query) {
          return true;
        }

        return (
          normalizeText(state.name).includes(query) ||
          normalizeText(state.code).includes(query)
        );
      })
      .slice(0, RESULT_LIMIT);
  }, [stateSearch]);

  const filteredCities = useMemo(() => {
    const query = normalizeText(citySearch);
    const cities = selectedState?.cities || [];

    return cities
      .filter((city) => !query || normalizeText(city).includes(query))
      .slice(0, RESULT_LIMIT);
  }, [citySearch, selectedState]);

  function handleSelectState(nextState) {
    onChange({
      city: "",
      state: nextState.name,
      stateCode: nextState.code,
      countryCode: "US",
    });
    setStateSearch("");
    setCitySearch("");
    setStateModalVisible(false);
    setCityModalVisible(true);
  }

  function handleSelectCity(nextCity) {
    if (!selectedState) {
      return;
    }

    onChange({
      city: nextCity,
      state: selectedState.name,
      stateCode: selectedState.code,
      countryCode: "US",
    });
    setCitySearch("");
    setCityModalVisible(false);
  }

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <View className="flex-row gap-3">
        <Pressable
          disabled={disabled}
          onPress={() => setStateModalVisible(true)}
          className="flex-1 rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
        >
          <Text className="text-xs font-bold uppercase text-app-text-muted">
            State
          </Text>
          <Text className="mt-1 text-base font-semibold text-app-text">
            {selectedState?.name || value?.state || "Select state"}
          </Text>
        </Pressable>

        <Pressable
          disabled={disabled || !selectedState}
          onPress={() => setCityModalVisible(true)}
          className={`flex-1 rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated ${
            selectedState ? "" : "opacity-50"
          }`}
        >
          <Text className="text-xs font-bold uppercase text-app-text-muted">
            City
          </Text>
          <Text className="mt-1 text-base font-semibold text-app-text">
            {selectedCity || "Select city"}
          </Text>
        </Pressable>
      </View>

      <PickerModal
        visible={stateModalVisible}
        title="Choose State"
        searchValue={stateSearch}
        onChangeSearch={setStateSearch}
        data={filteredStates}
        emptyText="No states found."
        onClose={() => setStateModalVisible(false)}
        onSelect={handleSelectState}
        renderLabel={(state) => `${state.name} (${state.code})`}
      />

      <PickerModal
        visible={cityModalVisible}
        title={selectedState ? `Choose City in ${selectedState.name}` : "Choose City"}
        searchValue={citySearch}
        onChangeSearch={setCitySearch}
        data={filteredCities}
        emptyText="No cities found."
        onClose={() => setCityModalVisible(false)}
        onSelect={handleSelectCity}
        renderLabel={(city) => city}
      />
    </View>
  );
}
