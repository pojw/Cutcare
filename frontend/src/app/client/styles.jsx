import {
  useCallback,
  useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppAlert } from "../../context/AppAlertContext";

import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { auth } from "../../config/firebase";
import {
  createClientStyle,
  deleteClientStyle,
  getClientStyles,
  updateClientStyle,
} from "../../services/stylesServices";

function normalizeUrl(rawUrl) {
  const trimmedUrl = rawUrl.trim();

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

function StyleCard({ styleIdea, onOpen, onEdit, onDelete }) {
  return (
    <Pressable
      onPress={() => onOpen(styleIdea)}
      className="rounded-2xl border border-app-border bg-app-surface p-4 active:bg-app-surface-elevated"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text
            numberOfLines={1}
            className="text-lg font-bold text-app-text"
          >
            {styleIdea.title}
          </Text>

          <Text
            numberOfLines={1}
            className="mt-2 text-sm text-app-text-secondary"
          >
            {styleIdea.url}
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onEdit(styleIdea);
            }}
          >
            <Ionicons
              name="create-outline"
              size={22}
              color="#1677FF"
            />
          </Pressable>

          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onDelete(styleIdea);
            }}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color="#8292A6"
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function StyleFormModal({
  visible,
  isEditing,
  title,
  url,
  error,
  saving,
  onChangeTitle,
  onChangeUrl,
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
        onPress={onClose}
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="w-full rounded-3xl border border-app-border bg-app-surface px-5 pb-6 pt-5"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-app-text">
              {isEditing ? "Edit Style Idea" : "Add Style Idea"}
            </Text>

            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
            >
              <Text className="text-base font-bold text-app-primary">
                X
              </Text>
            </Pressable>
          </View>

          <Text className="mb-2 mt-5 text-sm font-semibold text-app-text-secondary">
            Name
          </Text>

          <TextInput
            value={title}
            onChangeText={onChangeTitle}
            placeholder="Example: Mid taper reference"
            placeholderTextColor="#78909A"
            className="rounded-2xl border border-app-border bg-app-background-soft px-4 py-3 text-app-text"
          />

          <Text className="mb-2 mt-5 text-sm font-semibold text-app-text-secondary">
            URL
          </Text>

          <TextInput
            value={url}
            onChangeText={onChangeUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://www.instagram.com/..."
            placeholderTextColor="#78909A"
            className="rounded-2xl border border-app-border bg-app-background-soft px-4 py-3 text-app-text"
          />

          {error ? (
            <Text className="mt-3 text-sm font-medium text-app-error">
              {error}
            </Text>
          ) : null}

          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onClose}
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
                {saving ? "Saving..." : isEditing ? "Update" : "Save"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function StylesScreen() {
  const { showAppAlert } = useAppAlert();
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);
  const [styleToDelete, setStyleToDelete] = useState(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [screenError, setScreenError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadStyles = useCallback(async ({
    showLoader = true,
    showErrorOnFailure = true,
  } = {}) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setScreenError("You must be logged in to view style ideas.");
      setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }

      setScreenError("");
      const loadedStyles = await getClientStyles(currentUser.uid);
      setStyles(loadedStyles);
    } catch (error) {
      console.log("Load style ideas error:", error);

      if (showErrorOnFailure) {
        setScreenError("Failed to load style ideas. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStyles();
    }, [loadStyles])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadStyles({
      showLoader: false,
      showErrorOnFailure: false,
    });
    setRefreshing(false);
  }

  function resetForm() {
    setEditingStyle(null);
    setTitle("");
    setUrl("");
    setFormError("");
  }

  function closeModal() {
    setModalVisible(false);
    resetForm();
  }

  function openAddModal() {
    resetForm();
    setModalVisible(true);
  }

  function openEditModal(styleIdea) {
    setEditingStyle(styleIdea);
    setTitle(styleIdea.title || "");
    setUrl(styleIdea.url || "");
    setFormError("");
    setModalVisible(true);
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setStyleToDelete(null);
    setDeleteError("");
  }

  async function handleSaveStyle() {
    const currentUser = auth.currentUser;
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!currentUser) {
      setFormError("You must be logged in to save a style idea.");
      return;
    }

    if (!trimmedTitle) {
      setFormError("Style name is required.");
      return;
    }

    if (!trimmedUrl) {
      setFormError("Style URL is required.");
      return;
    }

    const normalizedUrl = normalizeUrl(trimmedUrl);

    try {
      new URL(normalizedUrl);
    } catch {
      setFormError("Enter a valid URL.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      if (editingStyle) {
        await updateClientStyle({
          clientId: currentUser.uid,
          styleId: editingStyle.id,
          title: trimmedTitle,
          url: normalizedUrl,
        });
      } else {
        await createClientStyle({
          clientId: currentUser.uid,
          title: trimmedTitle,
          url: normalizedUrl,
        });
      }

      closeModal();
      await loadStyles({
        showLoader: false,
      });
    } catch (error) {
      console.log("Save style idea error:", error);
      setFormError("Failed to save style idea. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenStyle(styleIdea) {
    try {
      const canOpen = await Linking.canOpenURL(styleIdea.url);

      if (!canOpen) {
        showAppAlert("Cannot open link", "This URL could not be opened.");
        return;
      }

      await Linking.openURL(styleIdea.url);
    } catch (error) {
      console.log("Open style idea error:", error);
      showAppAlert("Cannot open link", "This URL could not be opened.");
    }
  }

  function handleDeleteStyle(styleIdea) {
    setStyleToDelete(styleIdea);
    setDeleteError("");
  }

  async function confirmDeleteStyle() {
    const currentUser = auth.currentUser;

    if (!currentUser || !styleToDelete) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      await deleteClientStyle({
        clientId: currentUser.uid,
        styleId: styleToDelete.id,
      });

      setStyles((currentStyles) =>
        currentStyles.filter((item) => item.id !== styleToDelete.id)
      );

      setStyleToDelete(null);
    } catch (error) {
      console.log("Delete style idea error:", error);
      setDeleteError(
        "Style idea could not be deleted. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-app-text-muted">
          Loading style ideas...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="px-6 py-6">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#1677FF"
            />
          </Pressable>

          <Text className="flex-1 text-center text-3xl font-bold text-app-text">
            Style<Text className="text-app-primary">Ideas</Text>
          </Text>

          <Pressable
            onPress={openAddModal}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary active:bg-app-primary-pressed"
          >
            <Ionicons
              name="add"
              size={28}
              color="#ffffff"
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {screenError ? (
          <View className="rounded-2xl border border-app-border bg-app-surface p-4">
            <Text className="text-base font-semibold text-app-error">
              {screenError}
            </Text>
          </View>
        ) : null}

        <View className="mt-6 gap-3">
          {styles.length === 0 ? (
            <View className="rounded-2xl border border-app-border bg-app-surface p-5">
              <Text className="text-lg font-bold text-app-text">
                No style ideas yet
              </Text>

              <Text className="mt-2 text-sm text-app-text-secondary">
                Tap the plus button to save an Instagram, TikTok, or web link.
              </Text>
            </View>
          ) : (
            styles.map((styleIdea) => (
              <StyleCard
                key={styleIdea.id}
                styleIdea={styleIdea}
                onOpen={handleOpenStyle}
                onEdit={openEditModal}
                onDelete={handleDeleteStyle}
              />
            ))
          )}
        </View>
      </ScrollView>

      <StyleFormModal
        visible={modalVisible}
        isEditing={Boolean(editingStyle)}
        title={title}
        url={url}
        error={formError}
        saving={saving}
        onChangeTitle={setTitle}
        onChangeUrl={setUrl}
        onClose={closeModal}
        onSave={handleSaveStyle}
      />

      <ConfirmDeleteModal
        visible={Boolean(styleToDelete)}
        title="Delete Style Idea?"
        detail="This will remove the saved style link from your ideas."
        loading={deleting}
        error={deleteError}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteStyle}
      />
    </SafeAreaView>
  );
}
