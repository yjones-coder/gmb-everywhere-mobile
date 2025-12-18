import { Pressable, StyleSheet, View } from "react-native";

import { Business } from "@/data/mock-businesses";
import { useThemeColor } from "@/hooks/use-theme-color";

import { ThemedText } from "../themed-text";

import { CategoryBadge } from "./category-badge";
import { RatingDisplay } from "./rating-display";

interface BusinessCardProps {
  business: Business;
  onPress?: () => void;
}

export function BusinessCard({ business, onPress }: BusinessCardProps) {
  const backgroundColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "border");
  const textSecondary = useThemeColor({}, "textSecondary");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor, borderColor },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.name}>
          {business.name}
        </ThemedText>
        <RatingDisplay rating={business.rating} reviewCount={business.reviewCount} size="small" />
      </View>
      <View style={styles.categoryRow}>
        <CategoryBadge category={business.primaryCategory} isPrimary />
        {business.secondaryCategories.length > 0 && (
          <ThemedText style={[styles.moreCategories, { color: textSecondary }]}>
            +{business.secondaryCategories.length} more
          </ThemedText>
        )}
      </View>
      <ThemedText style={[styles.address, { color: textSecondary }]} numberOfLines={1}>
        {business.address}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  name: {
    flex: 1,
    marginRight: 8,
    fontSize: 17,
    lineHeight: 22,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  moreCategories: {
    fontSize: 13,
    marginLeft: 8,
  },
  address: {
    fontSize: 14,
    lineHeight: 18,
  },
});
