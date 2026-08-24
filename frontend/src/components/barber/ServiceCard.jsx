import { View, Text, Pressable } from "react-native";

export default function ServiceCard({ service, saving, onEdit, onDelete }) {
  return (
    <View className="mb-4 rounded-3xl border border-app-border bg-app-surface p-5">
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-xl font-bold text-app-text">
            {service.name || "Unnamed service"}
          </Text>

          <Text className="mt-1 text-sm text-app-text-muted">
            ${service.price ?? 0} • {service.durationMinutes ?? 0} min
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={onEdit}
            disabled={saving}
            className="rounded-xl bg-app-primary-soft px-3 py-2"
          >
            <Text className="text-sm font-bold text-app-primary">Edit</Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            disabled={saving}
            className="rounded-xl bg-app-surface-elevated px-3 py-2"
          >
            <Text className="text-sm font-bold text-app-text-muted">Delete</Text>
          </Pressable>
        </View>
      </View>

      {service.description ? (
        <Text className="text-base text-app-text-secondary">{service.description}</Text>
      ) : (
        <Text className="text-base text-app-text-muted">No description added.</Text>
      )}
    </View>
  );
}
