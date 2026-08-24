import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Pressable,
} from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../../config/firebase";
import {
  getHairProfile,
  buildEditableHairProfile,
  confirmHairProfile,
} from "../../../services/hairProfileService";
function LengthGuide() {
  return (
    <View className="mb-4 rounded-2xl bg-app-surface-elevated px-4 py-4">
      <Text className="text-sm font-semibold text-app-text-muted">
        Length Guide
      </Text>

      <Text className="mt-1 text-base font-medium text-app-text">
        Short: 1-3 inches, Medium: 3-6 inches, Long: 6+ inches
      </Text>
    </View>
  );
}

function HairProfileHeader({ onBack }) {
  return (
    <View className="mb-6 flex-row items-center">
      <Pressable
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
      >
        <Ionicons name="arrow-back" size={24} color="#1677FF" />
      </Pressable>

      <Text className="flex-1 text-center text-3xl font-bold text-app-text">
        Hair<Text className="text-app-primary">Results</Text>
      </Text>

      <View className="h-11 w-11" />
    </View>
  );
}

export default function HairProfileResults() {
  const { profileId } = useLocalSearchParams();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const isEditingConfirmedProfile = Boolean(
    profile?.confirmedProfile
  );

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setErrorMessage("You must be logged in.");
        return;
      }

      if (!profileId) {
        setErrorMessage("Missing profile ID.");
        return;
      }

      const result = await getHairProfile({
        clientId: currentUser.uid,
        profileId,
      });

      setProfile(result);
      setForm(
        result.confirmedProfile ??
          buildEditableHairProfile(result.originalAiPrediction)
      );
    } catch (error) {
      console.log("Error loading hair profile:", error);
      setErrorMessage("Could not load hair profile results.");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      loadProfile();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [loadProfile]);

  async function handleConfirm() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setErrorMessage("You must be logged in.");
      return;
    }

    if (!profileId) {
      setErrorMessage("Missing profile ID.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      await confirmHairProfile({
        clientId: currentUser.uid,
        profileId,
        confirmedProfile: form,
        originalAiPrediction: profile.originalAiPrediction,
      });

      router.replace("/client/hairProfile");
    } catch (error) {
      console.log("Error confirming hair profile:", error);
      setErrorMessage("Could not save your hair profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function updateField(fieldName, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator />
        <Text className="mt-3 text-app-text-muted">
          Loading analysis results...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage && !profile) {
    return (
      <SafeAreaView className="flex-1 bg-app-background">
        <View className="flex-1 px-6 py-6">
          <HairProfileHeader onBack={() => router.back()} />

          <Text className="mt-3 text-app-text-muted">
            {errorMessage}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HairProfileHeader onBack={() => router.back()} />

        <Text className="mb-4 text-base leading-6 text-app-text-secondary">
          Review the information below and correct anything that does not look right.
        </Text>

        <View>
          <LengthGuide />

         <EditableRow
  label="Overall Length"
  value={form.overallLengthCategory}
  onChangeText={(value) =>
    updateField("overallLengthCategory", value)
  }
/>

<EditableRow
  label="Front Length"
  value={form.frontLengthCategory}
  onChangeText={(value) =>
    updateField("frontLengthCategory", value)
  }
/>

<EditableRow
  label="Side Length"
  value={form.sideLengthCategory}
  onChangeText={(value) =>
    updateField("sideLengthCategory", value)
  }
/>

<EditableRow
  label="Back Length"
  value={form.backLengthCategory}
  onChangeText={(value) =>
    updateField("backLengthCategory", value)
  }
/>

<EditableRow
  label="Texture"
  value={form.texture}
  onChangeText={(value) =>
    updateField("texture", value)
  }
/>

<EditableRow
  label="Hairline Shape"
  value={form.hairlineShape}
  onChangeText={(value) =>
    updateField("hairlineShape", value)
  }
/>

<EditableRow
  label="Forehead Coverage"
  value={form.foreheadCoverage}
  onChangeText={(value) =>
    updateField("foreheadCoverage", value)
  }
/>

<EditableRow
  label="Fringe End Level"
  value={form.fringeEndLevel}
  onChangeText={(value) =>
    updateField("fringeEndLevel", value)
  }
/>

<EditableRow
  label="Face Shape"
  value={form.faceShape}
  onChangeText={(value) =>
    updateField("faceShape", value)
  }
/>

<EditableRow
  label="Fade or Taper"
  value={form.fadeOrTaperPresent}
  onChangeText={(value) =>
    updateField("fadeOrTaperPresent", value)
  }
/>

<EditableRow
  label="Fade Height"
  value={form.fadeHeight}
  onChangeText={(value) =>
    updateField("fadeHeight", value)
  }
/>

<EditableRow
  label="Ear Coverage"
  value={form.earCoverage}
  onChangeText={(value) =>
    updateField("earCoverage", value)
  }
/>

<EditableRow
  label="Sideburn Length"
  value={form.sideburnLength}
  onChangeText={(value) =>
    updateField("sideburnLength", value)
  }
/>

<EditableRow
  label="Back Blending"
  value={form.backBlending}
  onChangeText={(value) =>
    updateField("backBlending", value)
  }
/>

<EditableRow
  label="Nape Coverage"
  value={form.napeCoverage}
  onChangeText={(value) =>
    updateField("napeCoverage", value)
  }
/>

          {errorMessage ? (
            <View className="mt-4 rounded-2xl bg-app-surface-elevated p-4">
              <Text className="text-sm font-semibold text-app-error">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleConfirm}
            disabled={saving}
            className={`mt-6 rounded-2xl px-5 py-4 ${
              saving
                ? "bg-app-disabled"
                : "bg-app-primary active:bg-app-primary-pressed"
            }`}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-base font-bold text-app-text-inverse">
                {isEditingConfirmedProfile
                  ? "Save Changes"
                  : "Confirm Hair Profile"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EditableRow({ label, value, onChangeText }) {
  return (
    <View className="mb-3 rounded-2xl bg-app-surface-elevated px-4 py-4">
      <Text className="text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <TextInput
        value={String(value ?? "")}
        onChangeText={onChangeText}
        className="mt-2 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-base text-app-text"
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#8292A6"
      />
    </View>
  );
}
