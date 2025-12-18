import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Colors, Spacing } from "@/constants/theme";
import { mockBusinesses, relatedCategories } from "@/data/mock-businesses";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function CategoryAnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const business = useMemo(() => {
    return mockBusinesses.find((b) => b.id === id);
  }, [id]);

  const suggestedCategories = useMemo(() => {
    if (!business) return [];
    return relatedCategories[business.primaryCategory] || [];
  }, [business]);

  const getTrafficColor = (potential: "high" | "medium" | "low") => {
    switch (potential) {
      case "high":
        return colors.success;
      case "medium":
        return colors.warning;
      case "low":
        return colors.error;
    }
  };

  if (!business) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText>Business not found</ThemedText>
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
        <ThemedText type="defaultSemiBold" style={styles.headerTitle} numberOfLines={1}>
          Category Analysis
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Business Name */}
        <ThemedText type="subtitle" style={styles.businessName}>
          {business.name}
        </ThemedText>

        {/* Primary Category */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="star" size={20} color={colors.tint} />
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Primary Category
            </ThemedText>
          </View>
          <View style={styles.primaryCategoryContainer}>
            <CategoryBadge category={business.primaryCategory} isPrimary />
          </View>
          <ThemedText style={[styles.categoryHint, { color: colors.textSecondary }]}>
            This is the main category that appears in Google search results and Maps.
          </ThemedText>
        </View>

        {/* Secondary Categories */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="label" size={20} color={colors.tint} />
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Secondary Categories ({business.secondaryCategories.length})
            </ThemedText>
          </View>
          {business.secondaryCategories.length > 0 ? (
            <View style={styles.categoriesList}>
              {business.secondaryCategories.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <CategoryBadge category={category} />
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              No secondary categories found.
            </ThemedText>
          )}
          <ThemedText style={[styles.categoryHint, { color: colors.textSecondary }]}>
            Secondary categories help Google understand additional services offered.
          </ThemedText>
        </View>

        {/* Suggested Categories */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="lightbulb" size={20} color={colors.warning} />
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Suggested Categories
            </ThemedText>
          </View>
          <ThemedText style={[styles.suggestionIntro, { color: colors.textSecondary }]}>
            Based on your primary category, consider adding these:
          </ThemedText>
          {suggestedCategories.length > 0 ? (
            <View style={styles.suggestionsList}>
              {suggestedCategories.map((item, index) => (
                <View
                  key={index}
                  style={[styles.suggestionItem, { borderColor: colors.border }]}
                >
                  <View style={styles.suggestionLeft}>
                    <ThemedText style={styles.suggestionCategory}>
                      {item.category}
                    </ThemedText>
                  </View>
                  <View style={styles.suggestionRight}>
                    <View
                      style={[
                        styles.trafficIndicator,
                        { backgroundColor: getTrafficColor(item.trafficPotential) },
                      ]}
                    />
                    <ThemedText
                      style={[
                        styles.trafficText,
                        { color: getTrafficColor(item.trafficPotential) },
                      ]}
                    >
                      {item.trafficPotential.charAt(0).toUpperCase() + item.trafficPotential.slice(1)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              No suggestions available for this category.
            </ThemedText>
          )}
        </View>

        {/* Traffic Legend */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="defaultSemiBold" style={styles.legendTitle}>
            Traffic Potential Legend
          </ThemedText>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <ThemedText style={styles.legendText}>High - Strong search volume</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <ThemedText style={styles.legendText}>Medium - Moderate search volume</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <ThemedText style={styles.legendText}>Low - Limited search volume</ThemedText>
            </View>
          </View>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  businessName: {
    marginBottom: 16,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    marginLeft: 8,
    fontSize: 17,
  },
  primaryCategoryContainer: {
    marginBottom: 12,
  },
  categoryHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  categoriesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  categoryItem: {
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 12,
    lineHeight: 20,
  },
  suggestionIntro: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  suggestionLeft: {
    flex: 1,
  },
  suggestionCategory: {
    fontSize: 14,
    fontWeight: "500",
  },
  suggestionRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  trafficIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  trafficText: {
    fontSize: 12,
    fontWeight: "600",
  },
  legendTitle: {
    marginBottom: 12,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
