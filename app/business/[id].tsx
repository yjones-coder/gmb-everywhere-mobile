import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
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
import { CategoryBadge } from "@/components/ui/category-badge";
import { RatingDisplay } from "@/components/ui/rating-display";
import { Colors, Spacing } from "@/constants/theme";
import { mockBusinesses } from "@/data/mock-businesses";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCompareList, useSavedAudits } from "@/hooks/use-local-storage";

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const { saveAudit, isBusinessSaved } = useSavedAudits();
  const { addToCompare, isInCompareList, compareList } = useCompareList();

  const business = useMemo(() => {
    return mockBusinesses.find((b) => b.id === id);
  }, [id]);

  const isSaved = useMemo(() => {
    return business ? isBusinessSaved(business.id) : false;
  }, [business, isBusinessSaved]);

  const inCompare = useMemo(() => {
    return business ? isInCompareList(business.id) : false;
  }, [business, isInCompareList]);

  const handleSaveAudit = useCallback(async () => {
    if (!business) return;
    if (isSaved) {
      Alert.alert("Already Saved", "This business audit is already saved.");
      return;
    }
    await saveAudit(business);
    Alert.alert("Saved", "Business audit saved successfully!");
  }, [business, isSaved, saveAudit]);

  const handleAddToCompare = useCallback(async () => {
    if (!business) return;
    if (inCompare) {
      Alert.alert("Already Added", "This business is already in your comparison list.");
      return;
    }
    const success = await addToCompare(business);
    if (success) {
      Alert.alert("Added", "Business added to comparison list.");
    } else {
      Alert.alert("Limit Reached", "You can compare up to 4 businesses at a time.");
    }
  }, [business, inCompare, addToCompare]);

  const handleCategoryAnalysis = useCallback(() => {
    if (!business) return;
    router.push({
      pathname: "/business/categories",
      params: { id: business.id },
    });
  }, [business, router]);

  const handleReviewAudit = useCallback(() => {
    if (!business) return;
    router.push({
      pathname: "/business/reviews",
      params: { id: business.id },
    });
  }, [business, router]);

  const handleCompare = useCallback(() => {
    router.push("/compare");
  }, [router]);

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
          Business Details
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Business Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="title" style={styles.businessName}>
            {business.name}
          </ThemedText>
          <RatingDisplay
            rating={business.rating}
            reviewCount={business.reviewCount}
            size="large"
          />
          <View style={styles.addressRow}>
            <MaterialIcons name="location-on" size={18} color={colors.textSecondary} />
            <ThemedText style={[styles.addressText, { color: colors.textSecondary }]}>
              {business.address}
            </ThemedText>
          </View>
          <View style={styles.contactRow}>
            <MaterialIcons name="phone" size={18} color={colors.textSecondary} />
            <ThemedText style={[styles.contactText, { color: colors.textSecondary }]}>
              {business.phone}
            </ThemedText>
          </View>
        </View>

        {/* Categories Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Categories
          </ThemedText>
          <View style={styles.categoriesContainer}>
            <CategoryBadge category={business.primaryCategory} isPrimary />
            {business.secondaryCategories.map((cat, index) => (
              <CategoryBadge key={index} category={cat} />
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Stats
          </ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.tint }]}>
                {business.reviewCount}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Reviews
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.tint }]}>
                {business.secondaryCategories.length + 1}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Categories
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.tint }]}>
                {business.services.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Services
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.tint }]}>
                {business.posts.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Posts
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={handleCategoryAnalysis}
          >
            <MaterialIcons name="label" size={20} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Category Analysis</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={handleReviewAudit}
          >
            <MaterialIcons name="rate-review" size={20} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Review Audit</ThemedText>
          </Pressable>

          <View style={styles.secondaryActions}>
            <Pressable
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.surface, borderColor: colors.tint },
                isSaved && { backgroundColor: colors.tintLight },
              ]}
              onPress={handleSaveAudit}
            >
              <MaterialIcons
                name={isSaved ? "bookmark" : "bookmark-border"}
                size={20}
                color={colors.tint}
              />
              <ThemedText style={[styles.secondaryButtonText, { color: colors.tint }]}>
                {isSaved ? "Saved" : "Save Audit"}
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.surface, borderColor: colors.tint },
                inCompare && { backgroundColor: colors.tintLight },
              ]}
              onPress={handleAddToCompare}
            >
              <MaterialIcons
                name={inCompare ? "check" : "compare-arrows"}
                size={20}
                color={colors.tint}
              />
              <ThemedText style={[styles.secondaryButtonText, { color: colors.tint }]}>
                {inCompare ? "Added" : "Compare"}
              </ThemedText>
            </Pressable>
          </View>

          {compareList.length > 1 && (
            <Pressable
              style={[styles.compareButton, { backgroundColor: colors.success }]}
              onPress={handleCompare}
            >
              <MaterialIcons name="compare-arrows" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>
                View Comparison ({compareList.length})
              </ThemedText>
            </Pressable>
          )}
        </View>

        {/* Business IDs */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Business IDs
          </ThemedText>
          <View style={styles.idRow}>
            <ThemedText style={[styles.idLabel, { color: colors.textSecondary }]}>Place ID:</ThemedText>
            <ThemedText style={styles.idValue} numberOfLines={1}>{business.placeId}</ThemedText>
          </View>
          <View style={styles.idRow}>
            <ThemedText style={[styles.idLabel, { color: colors.textSecondary }]}>CID:</ThemedText>
            <ThemedText style={styles.idValue}>{business.cid}</ThemedText>
          </View>
        </View>

        {/* Services */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Services
          </ThemedText>
          <View style={styles.servicesList}>
            {business.services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <MaterialIcons name="check-circle" size={16} color={colors.success} />
                <ThemedText style={styles.serviceText}>{service}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Attributes */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Attributes
          </ThemedText>
          <View style={styles.attributesList}>
            {business.attributes.map((attr, index) => (
              <View key={index} style={[styles.attributeChip, { backgroundColor: colors.tintLight }]}>
                <ThemedText style={[styles.attributeText, { color: colors.tint }]}>{attr}</ThemedText>
              </View>
            ))}
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
  card: {
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  businessName: {
    fontSize: 24,
    marginBottom: 8,
    lineHeight: 30,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  contactText: {
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 17,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  compareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  idRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  idLabel: {
    width: 70,
    fontSize: 14,
  },
  idValue: {
    flex: 1,
    fontSize: 14,
  },
  servicesList: {
    gap: 8,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceText: {
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  attributesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  attributeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  attributeText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
