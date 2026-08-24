import {
  useEffect,
  useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@/components/icons/AppIcon";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAppAlert } from "../../context/AppAlertContext";

import { auth, db } from "../../config/firebase";
import ConfirmationModal from "../../components/ConfirmationModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import ServiceCard from "../../components/barber/ServiceCard";
import ServiceForm from "../../components/barber/ServiceForm";
function createServiceId() {
  return `service_${Date.now()}`;
}

function normalizeServices(value) {
  if (!Array.isArray(value)) return [];

  return value.map((service, index) => {
    if (typeof service === "string") {
      return {
        id: `legacy_service_${index}`,
        name: service,
        price: 0,
        durationMinutes: 0,
        description: "",
      };
    }

    return {
      id: service.id || `service_${Date.now()}_${index}`,
      name: service.name || "",
      price: service.price ?? 0,
      durationMinutes: service.durationMinutes ?? 0,
      description: service.description || "",
    };
  });
}

export default function BarberServices() {
  const { showAppAlert } = useAppAlert();
  const router = useRouter();

  const [services, setServices] = useState([]);

  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [description, setDescription] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState({
    title: "",
    detail: "",
  });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  useEffect(() => {
    async function loadServices() {
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
        const existingServices = normalizeServices(data.services);

        setServices(existingServices);
        setShowForm(false);
      } catch (error) {
        console.log("Load barber services error:", error);
        showAppAlert("Error", "Something went wrong while loading services.");
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, [router, showAppAlert]);

  async function saveServices(nextServices) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    const barberRef = doc(db, "barbers", currentUser.uid);

    await updateDoc(barberRef, {
      services: nextServices,
      updatedAt: serverTimestamp(),
    });
  }

  function clearForm() {
    setServiceName("");
    setPrice("");
    setDurationMinutes("");
    setDescription("");
  }

  function handleStartCreateService() {
    clearForm();
    setEditingServiceId(null);
    setShowForm(true);
  }

  function handleStartEditService(service) {
    setEditingServiceId(service.id);
    setServiceName(service.name || "");
    setPrice(String(service.price ?? ""));
    setDurationMinutes(String(service.durationMinutes ?? ""));
    setDescription(service.description || "");
    setShowForm(true);
  }

  function handleCancelForm() {
    clearForm();
    setEditingServiceId(null);

    if (services.length > 0) {
      setShowForm(false);
    }
  }

  async function handleSaveService() {
    try {
      if (!serviceName.trim()) {
        showAppAlert("Missing service name", "Please enter a service name.");
        return;
      }

      if (!price.trim()) {
        showAppAlert("Missing price", "Please enter a price.");
        return;
      }

      if (!durationMinutes.trim()) {
        showAppAlert("Missing duration", "Please enter a duration.");
        return;
      }

      const numericPrice = Number(price);
      const numericDuration = Number(durationMinutes);

      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        showAppAlert("Invalid price", "Please enter a valid price.");
        return;
      }

      if (Number.isNaN(numericDuration) || numericDuration <= 0) {
        showAppAlert(
          "Invalid duration",
          "Please enter a valid duration in minutes."
        );
        return;
      }

      setSaving(true);

      let nextServices;

      if (editingServiceId) {
        nextServices = services.map((service) =>
          service.id === editingServiceId
            ? {
                ...service,
                name: serviceName.trim(),
                price: numericPrice,
                durationMinutes: numericDuration,
                description: description.trim(),
              }
            : service
        );
      } else {
        const newService = {
          id: createServiceId(),
          name: serviceName.trim(),
          price: numericPrice,
          durationMinutes: numericDuration,
          description: description.trim(),
        };

        nextServices = [...services, newService];
      }

      await saveServices(nextServices);

      setServices(nextServices);
      clearForm();
      setEditingServiceId(null);
      setShowForm(false);
      setConfirmationMessage({
        title: editingServiceId ? "Service Updated" : "Service Added",
        detail: editingServiceId
          ? "Your service has been updated."
          : "Your new service has been saved.",
      });
      setConfirmationVisible(true);
    } catch (error) {
      console.log("Save service error:", error);
      showAppAlert(
        "Save failed",
        "Something went wrong while saving the service."
      );
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal(service) {
    setServiceToDelete(service);
    setDeleteModalVisible(true);
  }

  function closeDeleteModal() {
    if (saving) {
      return;
    }

    setDeleteModalVisible(false);
    setServiceToDelete(null);
  }

  async function handleConfirmDeleteService() {
    if (!serviceToDelete) {
      return;
    }

    try {
      setSaving(true);

      const nextServices = services.filter(
        (service) => service.id !== serviceToDelete.id
      );

      await saveServices(nextServices);

      setServices(nextServices);

      if (editingServiceId === serviceToDelete.id) {
        clearForm();
        setEditingServiceId(null);
      }

      setShowForm(false);
      setDeleteModalVisible(false);
      setServiceToDelete(null);
    } catch (error) {
      console.log("Delete service error:", error);
      showAppAlert(
        "Delete failed",
        "Something went wrong while deleting."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-app-text-muted">Loading services...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ConfirmationModal
        visible={confirmationVisible}
        title={confirmationMessage.title}
        detail={confirmationMessage.detail}
        onClose={() => setConfirmationVisible(false)}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-6">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => router.back()}
                disabled={saving}
                className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
              >
                <Ionicons name="arrow-back" size={24} color="#1677FF" />
              </Pressable>

              <Text className="flex-1 text-center text-3xl font-bold text-app-text">
                Serv<Text className="text-app-primary">ices</Text>
              </Text>

              <View className="h-11 w-11" />
            </View>
          </View>

          <View className="mb-6 px-5">
            <Text className="mb-4 text-xl font-bold text-app-text">
              Current Services
            </Text>

            {services.length === 0 ? (
              <View className="rounded-3xl border border-app-border bg-app-surface p-5">
                <Text className="text-base font-semibold text-app-text">
                  No services added yet.
                </Text>
                <Text className="mt-2 text-sm text-app-text-muted">
                  Add your first service so clients know what they can book.
                </Text>
              </View>
            ) : (
              services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  saving={saving}
                  onEdit={() => handleStartEditService(service)}
                  onDelete={() => openDeleteModal(service)}
                />
              ))
            )}
          </View>

          {!showForm && (
            <Pressable
              onPress={handleStartCreateService}
              disabled={saving}
              className="mb-6 self-center rounded-2xl bg-app-primary px-4 py-4 active:bg-app-primary-pressed"
              style={{ width: "68%" }}
            >
              <Text className="text-center text-base font-bold text-app-text-inverse">
                Create New Service
              </Text>
            </Pressable>
          )}

          <Modal
            visible={showForm}
            animationType="slide"
            transparent
            onRequestClose={handleCancelForm}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1 justify-end"
              style={{ backgroundColor: "rgba(9, 18, 32, 0.24)" }}
            >
              <ServiceForm
                editing={!!editingServiceId}
                saving={saving}
                serviceName={serviceName}
                setServiceName={setServiceName}
                price={price}
                setPrice={setPrice}
                durationMinutes={durationMinutes}
                setDurationMinutes={setDurationMinutes}
                description={description}
                setDescription={setDescription}
                onSave={handleSaveService}
                onCancel={handleCancelForm}
              />
            </KeyboardAvoidingView>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="Delete Service?"
        detail={
          serviceToDelete
            ? `Remove ${serviceToDelete.name || "this service"} from your services?`
            : "Remove this service from your services?"
        }
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        loading={saving}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDeleteService}
      />
    </SafeAreaView>
  );
}
