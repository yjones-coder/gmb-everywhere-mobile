import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RatingDisplay } from "@/components/ui/rating-display";
import { Colors, Spacing } from "@/constants/theme";
import { mockBusinesses, Review } from "@/data/mock-businesses";
import { useColorScheme } from "@/hooks/use-color-scheme";

type FilterOption = "all" | "5" | "4" | "3" | "2" | "1";

export default function ReviewAuditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [filter, setFilter] = useState<FilterOption>("all");

  const business = useMemo(() => {
    return mockBusinesses.find((b) => b.id === id);
  }, [id]);

  const filteredReviews = useMemo(() => {
    if (!business) return [];
    if (filter === "all") return business.reviews;
    return business.reviews.filter((r) => r.rating === parseInt(filter));
  }, [business, filter]);

  const ratingDistribution = useMemo(() => {
    if (!business) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    business.reviews.forEach((r) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
    });
    return dist;
  }, [business]);

  const keywords = useMemo(() => {
    if (!business) return [];
    const wordCount: Record<string, number> = {};
    const stopWords = new Set(["the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "for", "of", "in", "on", "at", "my", "i", "they", "it", "this", "that", "very", "so", "with"]);
    
    business.reviews.forEach((review) => {
      const words = review.text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
      words.forEach((word) => {
        if (word.length > 3 && !stopWords.has(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => ({ word, count }));
  }, [business]);

  const renderReview = useCallback(({ item }: { item: Review }) => (
    <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAuthor}>
          <View style={[styles.avatar, { backgroundColor: colors.tintLight }]}>
            <ThemedText style={[styles.avatarText, { color: colors.tint }]}>
              {item.author.charAt(0)}
            </ThemedText>
          </View>
          <View>
            <ThemedText style={styles.authorName}>{item.author}</ThemedText>
            <ThemedText style={[styles.reviewDate, { color: colors.textSecondary }]}>
              {new Date(item.date).toLocaleDateString()}
            </ThemedText>
          </View>
        </View>
        <RatingDisplay rating={item.rating} size="small" showStars={true} />
      </View>
      <ThemedText style={styles.reviewText}>{item.text}</ThemedText>
      <View style={styles.reviewFooter}>
        <MaterialIcons name="thumb-up" size={14} color={colors.textSecondary} />
        <ThemedText style={[styles.helpfulText, { color: colors.textSecondary }]}>
          {item.helpful} found helpful
        </ThemedText>
      </View>
    </View>
  ), [colors]);

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
          Review Audit
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={filteredReviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Business Name */}
            <ThemedText type="subtitle" style={styles.businessName}>
              {business.name}
            </ThemedText>

            {/* Overall Rating */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.overallRating}>
                <ThemedText style={[styles.bigRating, { color: colors.tint }]}>
                  {business.rating.toFixed(1)}
                </ThemedText>
                <View style={styles.overallDetails}>
                  <RatingDisplay rating={business.rating} size="medium" showStars={true} />
                  <ThemedText style={[styles.totalReviews, { color: colors.textSecondary }]}>
                    Based on {business.reviewCount} reviews
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Rating Distribution */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Rating Distribution
              </ThemedText>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating];
                const percentage = business.reviews.length > 0 
                  ? (count / business.reviews.length) * 100 
                  : 0;
                return (
                  <View key={rating} style={styles.distributionRow}>
                    <ThemedText style={styles.distributionLabel}>{rating}</ThemedText>
                    <MaterialIcons name="star" size={14} color={colors.warning} />
                    <View style={[styles.distributionBarBg, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.distributionBarFill,
                          { width: `${percentage}%`, backgroundColor: colors.tint },
                        ]}
                      />
                    </View>
                    <ThemedText style={[styles.distributionCount, { color: colors.textSecondary }]}>
                      {count}
                    </ThemedText>
                  </View>
                );
              })}
            </View>

            {/* Keywords */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Common Keywords
              </ThemedText>
              <View style={styles.keywordsContainer}>
                {keywords.map((kw, index) => (
                  <View
                    key={index}
                    style={[
                      styles.keywordChip,
                      { backgroundColor: colors.tintLight },
                    ]}
                  >
                    <ThemedText style={[styles.keywordText, { color: colors.tint }]}>
                      {kw.word} ({kw.count})
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* Filter */}
            <View style={styles.filterContainer}>
              <ThemedText type="defaultSemiBold" style={styles.filterLabel}>
                Filter Reviews
              </ThemedText>
              <View style={styles.filterOptions}>
                {(["all", "5", "4", "3", "2", "1"] as FilterOption[]).map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.filterChip,
                      { borderColor: colors.border },
                      filter === option && { backgroundColor: colors.tint, borderColor: colors.tint },
                    ]}
                    onPress={() => setFilter(option)}
                  >
                    <ThemedText
                      style={[
                        styles.filterChipText,
                        filter === option && { color: "#FFFFFF" },
                      ]}
                    >
                      {option === "all" ? "All" : `${option}★`}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <ThemedText type="defaultSemiBold" style={styles.reviewsTitle}>
              Reviews ({filteredReviews.length})
            </ThemedText>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="rate-review" size={48} color={colors.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              No reviews match this filter
            </ThemedText>
          </View>
        }
      />
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
  cardTitle: {
    marginBottom: 12,
    fontSize: 17,
  },
  overallRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  bigRating: {
    fontSize: 48,
    fontWeight: "700",
    marginRight: 16,
  },
  overallDetails: {
    flex: 1,
  },
  totalReviews: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  distributionLabel: {
    width: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  distributionBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  distributionBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  distributionCount: {
    width: 24,
    fontSize: 13,
    textAlign: "right",
  },
  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  keywordChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  keywordText: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviewsTitle: {
    marginBottom: 12,
  },
  reviewCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  reviewAuthor: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  authorName: {
    fontSize: 15,
    fontWeight: "500",
  },
  reviewDate: {
    fontSize: 12,
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpfulText: {
    fontSize: 12,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    lineHeight: 22,
  },
});
