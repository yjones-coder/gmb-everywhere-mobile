import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RatingDisplay } from "@/components/ui/rating-display";
import { Colors, Spacing } from "@/constants/theme";
import { Business } from "@/data/mock-businesses";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCompareList } from "@/hooks/use-local-storage";

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const { compareList, removeFromCompare, clearCompareList } = useCompareList();

  const handleRemove = useCallback((business: Business) => {
    Alert.alert(
      "Remove from Comparison",
      `Remove ${business.name} from comparison?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeFromCompare(business.id),
        },
      ]
    );
  }, [removeFromCompare]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      "Clear Comparison",
      "Remove all businesses from comparison?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            clearCompareList();
            router.back();
          },
        },
      ]
    );
  }, [clearCompareList, router]);

  const getMaxValue = (key: keyof Pick<Business, "rating" | "reviewCount">) => {
    return Math.max(...compareList.map((b) => b[key]));
  };

  const renderComparisonRow = (
    label: string,
    getValue: (b: Business) => string | number,
    highlight?: (b: Business) => boolean
  ) => (
    <View style={styles.comparisonRow}>
      <View style={[styles.labelCell, { borderColor: colors.border }]}>
        <ThemedText style={styles.labelText}>{label}</ThemedText>
      </View>
      {compareList.map((business) => (
        <View
          key={business.id}
          style={[
            styles.valueCell,
            { borderColor: colors.border },
            highlight?.(business) && { backgroundColor: colors.tintLight },
          ]}
        >
          <ThemedText
            style={[
              styles.valueText,
              highlight?.(business) && { color: colors.tint, fontWeight: "600" },
            ]}
            numberOfLines={2}
          >
            {getValue(business)}
          </ThemedText>
        </View>
      ))}
    </View>
  );

  if (compareList.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), backgroundColor: colors.surface }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
            Compare Businesses
          </ThemedText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="compare-arrows" size={64} color={colors.textDisabled} />
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            No Businesses to Compare
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            Add businesses to your comparison list from the business detail page.
          </ThemedText>
          <Pressable
            style={[styles.goBackButton, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.goBackText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          Compare ({compareList.length})
        </ThemedText>
        <Pressable onPress={handleClearAll} style={styles.clearButton}>
          <ThemedText style={[styles.clearText, { color: colors.error }]}>Clear</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Business Headers */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header Row */}
            <View style={styles.comparisonRow}>
              <View style={[styles.labelCell, { borderColor: colors.border }]}>
                <ThemedText style={styles.labelText}>Business</ThemedText>
              </View>
              {compareList.map((business) => (
                <View
                  key={business.id}
                  style={[styles.headerCell, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <ThemedText style={styles.businessName} numberOfLines={2}>
                    {business.name}
                  </ThemedText>
                  <Pressable
                    onPress={() => handleRemove(business)}
                    style={styles.removeButton}
                    hitSlop={8}
                  >
                    <MaterialIcons name="close" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Rating Row */}
            <View style={styles.comparisonRow}>
              <View style={[styles.labelCell, { borderColor: colors.border }]}>
                <ThemedText style={styles.labelText}>Rating</ThemedText>
              </View>
              {compareList.map((business) => (
                <View
                  key={business.id}
                  style={[
                    styles.valueCell,
                    { borderColor: colors.border },
                    business.rating === getMaxValue("rating") && { backgroundColor: colors.tintLight },
                  ]}
                >
                  <RatingDisplay rating={business.rating} size="small" showStars={false} />
                </View>
              ))}
            </View>

            {renderComparisonRow(
              "Reviews",
              (b) => b.reviewCount.toLocaleString(),
              (b) => b.reviewCount === getMaxValue("reviewCount")
            )}

            {renderComparisonRow(
              "Primary Category",
              (b) => b.primaryCategory
            )}

            {renderComparisonRow(
              "Categories",
              (b) => b.secondaryCategories.length + 1,
              (b) => b.secondaryCategories.length + 1 === Math.max(...compareList.map((x) => x.secondaryCategories.length + 1))
            )}

            {renderComparisonRow(
              "Services",
              (b) => b.services.length,
              (b) => b.services.length === Math.max(...compareList.map((x) => x.services.length))
            )}

            {renderComparisonRow(
              "Posts",
              (b) => b.posts.length,
              (b) => b.posts.length === Math.max(...compareList.map((x) => x.posts.length))
            )}

            {renderComparisonRow(
              "Attributes",
              (b) => b.attributes.length,
              (b) => b.attributes.length === Math.max(...compareList.map((x) => x.attributes.length))
            )}

            {/* Services Detail */}
            <View style={[styles.sectionHeader, { backgroundColor: colors.tintLight }]}>
              <ThemedText style={[styles.sectionHeaderText, { color: colors.tint }]}>
                Services Comparison
              </ThemedText>
            </View>
            {Array.from(new Set(compareList.flatMap((b) => b.services))).map((service) => (
              <View key={service} style={styles.comparisonRow}>
                <View style={[styles.labelCell, { borderColor: colors.border }]}>
                  <ThemedText style={styles.labelText} numberOfLines={2}>{service}</ThemedText>
                </View>
                {compareList.map((business) => (
                  <View
                    key={business.id}
                    style={[styles.valueCell, { borderColor: colors.border }]}
                  >
                    {business.services.includes(service) ? (
                      <MaterialIcons name="check-circle" size={20} color={colors.success} />
                    ) : (
                      <MaterialIcons name="cancel" size={20} color={colors.textDisabled} />
                    )}
                  </View>
                ))}
              </View>
            ))}

            {/* Attributes Detail */}
            <View style={[styles.sectionHeader, { backgroundColor: colors.tintLight }]}>
              <ThemedText style={[styles.sectionHeaderText, { color: colors.tint }]}>
                Attributes Comparison
              </ThemedText>
            </View>
            {Array.from(new Set(compareList.flatMap((b) => b.attributes))).map((attr) => (
              <View key={attr} style={styles.comparisonRow}>
                <View style={[styles.labelCell, { borderColor: colors.border }]}>
                  <ThemedText style={styles.labelText} numberOfLines={2}>{attr}</ThemedText>
                </View>
                {compareList.map((business) => (
                  <View
                    key={business.id}
                    style={[styles.valueCell, { borderColor: colors.border }]}
                  >
                    {business.attributes.includes(attr) ? (
                      <MaterialIcons name="check-circle" size={20} color={colors.success} />
                    ) : (
                      <MaterialIcons name="cancel" size={20} color={colors.textDisabled} />
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
  },
  headerRight: {
    width: 32,
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  goBackButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  goBackText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  comparisonRow: {
    flexDirection: "row",
  },
  labelCell: {
    width: 100,
    padding: 10,
    borderWidth: 1,
    justifyContent: "center",
  },
  labelText: {
    fontSize: 13,
    fontWeight: "500",
  },
  headerCell: {
    width: 120,
    padding: 10,
    borderWidth: 1,
    position: "relative",
  },
  businessName: {
    fontSize: 13,
    fontWeight: "600",
    paddingRight: 20,
  },
  removeButton: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  valueCell: {
    width: 120,
    padding: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  valueText: {
    fontSize: 13,
    textAlign: "center",
  },
  sectionHeader: {
    padding: 10,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
