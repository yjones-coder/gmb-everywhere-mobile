import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { ThemedText } from "../themed-text";

interface CategoryBadgeProps {
  category: string;
  isPrimary?: boolean;
}

export function CategoryBadge({ category, isPrimary = false }: CategoryBadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View
      style={[
        styles.badge,
        isPrimary
          ? { backgroundColor: colors.tint }
          : { backgroundColor: colors.tintLight, borderColor: colors.tint, borderWidth: 1 },
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          { color: isPrimary ? "#FFFFFF" : colors.tint },
        ]}
      >
        {category}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
});
