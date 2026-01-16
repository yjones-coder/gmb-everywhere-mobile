import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CategoryBadge } from "@/components/ui/category-badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { StatCard } from "@/components/ui/stat-card";
import { BusinessCardSkeleton } from "@/components/ui/skeleton";
import { Colors, Spacing } from "@/constants/theme";
import { Business } from "@/data/mock-businesses";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCompareList, useSavedAudits } from "@/hooks/use-local-storage";
import { trpc } from "@/lib/trpc";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Max width for content on larger screens (laptop/web)
const MAX_CONTENT_WIDTH = 720;

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { width: windowWidth } = useWindowDimensions();

  // Determine if we're on a larger screen (laptop/web)
  const isLargeScreen = windowWidth >= 768;

  const { saveAudit, isBusinessSaved } = useSavedAudits();
  const { addToCompare, isInCompareList, compareList } = useCompareList();

  // tRPC query for fetching business details - uses built-in query behavior
  const {
    data: business,
    isLoading,
    error: queryError,
  } = trpc.gmb.getBusinessDetails.useQuery(
    { placeId: id! },
    {
      enabled: !!id,
      retry: false,
    }
  );

  // Derive error message from query error
  const error = queryError
    ? "Failed to load business details. Please try again."
    : !business && !isLoading
      ? "Business not found. Please try searching again."
      : null;

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.95);

  useEffect(() => {
    headerOpacity.value = withSpring(1);
    contentScale.value = withDelay(100, withSpring(1, { damping: 15 }));
  }, [headerOpacity, contentScale]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
    opacity: contentScale.value,
  }));

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

  // Loading state
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <View style={[styles.headerInner, isLargeScreen && { maxWidth: MAX_CONTENT_WIDTH }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <ThemedText type="defaultSemiBold" style={styles.headerTitle} numberOfLines={1}>
              Business Details
            </ThemedText>
            <View style={styles.headerRight} />
          </View>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentWrapper, isLargeScreen && { maxWidth: MAX_CONTENT_WIDTH }]}>
            <BusinessCardSkeleton />
            <View style={styles.sectionSpacer} />
            <BusinessCardSkeleton />
            <View style={styles.sectionSpacer} />
            <BusinessCardSkeleton />
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Error state
  if (error || !business) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <View style={[styles.headerInner, isLargeScreen && { maxWidth: MAX_CONTENT_WIDTH }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <ThemedText type="defaultSemiBold" style={styles.headerTitle} numberOfLines={1}>
              Business Details
            </ThemedText>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.textDisabled} />
          <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || "Business not found"}
          </ThemedText>
          <ThemedText style={[styles.errorHint, { color: colors.textDisabled }]}>
            Please try searching for a different business.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 20), backgroundColor: colors.surface },
          headerAnimatedStyle,
        ]}
      >
        <View style={[styles.headerInner, isLargeScreen && { maxWidth: MAX_CONTENT_WIDTH }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle} numberOfLines={1}>
            Business Details
          </ThemedText>
          <View style={styles.headerRight} />
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.contentWrapper, isLargeScreen && { maxWidth: MAX_CONTENT_WIDTH }, contentAnimatedStyle]}>
          {/* Hero Card with Score Ring */}
          <View style={[styles.heroCard, { backgroundColor: colors.surface }, Platform.OS === 'web' && styles.cardShadow]}>
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <ThemedText type="title" style={styles.businessName}>
                  {business.name}
                </ThemedText>
                <View style={styles.addressRow}>
                  <MaterialIcons name="location-on" size={18} color={colors.textSecondary} />
                  <ThemedText style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>
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
              <ScoreRing
                score={business.rating}
                maxScore={5}
                size={100}
                strokeWidth={10}
                label="Rating"
                delay={300}
              />
            </View>
            <View style={[styles.reviewCountBadge, { borderTopColor: colors.border }]}>
              <MaterialIcons name="rate-review" size={16} color={colors.tint} />
              <ThemedText style={[styles.reviewCountText, { color: colors.tint }]}>
                {business.reviewCount.toLocaleString()} reviews
              </ThemedText>
            </View>
          </View>

          <View style={styles.sectionSpacer} />

          {/* Categories Section */}
          <View style={[styles.card, { backgroundColor: colors.surface }, Platform.OS === 'web' && styles.cardShadow]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="label" size={22} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Categories
              </ThemedText>
            </View>
            <View style={styles.categoriesContainer}>
              <CategoryBadge category={business.primaryCategory} isPrimary />
              {business.secondaryCategories.map((cat: string, index: number) => (
                <CategoryBadge key={index} category={cat} />
              ))}
            </View>
          </View>

          <View style={styles.sectionSpacer} />

          {/* Quick Stats with Animation */}
          <View style={styles.statsRow}>
            <StatCard
              icon="rate-review"
              label="Reviews"
              value={business.reviewCount}
              delay={0}
            />
            <StatCard
              icon="label"
              label="Categories"
              value={business.secondaryCategories.length + 1}
              delay={100}
            />
            <StatCard
              icon="build"
              label="Services"
              value={business.services.length}
              delay={200}
            />
          </View>

          <View style={styles.sectionSpacer} />

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <AnimatedPressable
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
              onPress={handleCategoryAnalysis}
            >
              <MaterialIcons name="analytics" size={22} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Category Analysis</ThemedText>
              <MaterialIcons name="chevron-right" size={22} color="#FFFFFF" />
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
              onPress={handleReviewAudit}
            >
              <MaterialIcons name="insights" size={22} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Review Audit</ThemedText>
              <MaterialIcons name="chevron-right" size={22} color="#FFFFFF" />
            </AnimatedPressable>

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
                  size={22}
                  color={colors.tint}
                />
                <ThemedText style={[styles.secondaryButtonText, { color: colors.tint }]}>
                  {isSaved ? "Saved" : "Save"}
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
                  size={22}
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
                <MaterialIcons name="compare-arrows" size={22} color="#FFFFFF" />
                <ThemedText style={styles.actionButtonText}>
                  View Comparison ({compareList.length})
                </ThemedText>
              </Pressable>
            )}
          </View>

          <View style={styles.sectionSpacer} />

          {/* Business IDs */}
          <View style={[styles.card, { backgroundColor: colors.surface }, Platform.OS === 'web' && styles.cardShadow]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="fingerprint" size={22} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Business IDs
              </ThemedText>
            </View>
            <View style={styles.idContainer}>
              <View style={[styles.idItem, { backgroundColor: colors.background }]}>
                <ThemedText style={[styles.idLabel, { color: colors.textSecondary }]}>Place ID</ThemedText>
                <ThemedText style={styles.idValue} numberOfLines={1}>{business.placeId}</ThemedText>
              </View>
              <View style={[styles.idItem, { backgroundColor: colors.background }]}>
                <ThemedText style={[styles.idLabel, { color: colors.textSecondary }]}>CID</ThemedText>
                <ThemedText style={styles.idValue}>{business.cid}</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.sectionSpacer} />

          {/* Services */}
          <View style={[styles.card, { backgroundColor: colors.surface }, Platform.OS === 'web' && styles.cardShadow]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="build" size={22} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Services
              </ThemedText>
            </View>
            <View style={styles.servicesList}>
              {business.services.map((service: string, index: number) => (
                <View key={index} style={styles.serviceItem}>
                  <MaterialIcons name="check-circle" size={18} color={colors.success} />
                  <ThemedText style={styles.serviceText}>{service}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionSpacer} />

          {/* Attributes */}
          <View style={[styles.card, { backgroundColor: colors.surface }, Platform.OS === 'web' && styles.cardShadow]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="verified" size={22} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Attributes
              </ThemedText>
            </View>
            <View style={styles.attributesList}>
              {business.attributes.map((attr: string, index: number) => (
                <View key={index} style={[styles.attributeChip, { backgroundColor: colors.tintLight }]}>
                  <ThemedText style={[styles.attributeText, { color: colors.tint }]}>{attr}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
  },
  errorText: {
    marginTop: 20,
    fontSize: 17,
    textAlign: "center",
  },
  errorHint: {
    marginTop: 12,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    alignSelf: "center",
  },
  sectionSpacer: {
    height: Spacing.xl,
  },
  heroCard: {
    padding: Spacing.xl,
    borderRadius: 20,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLeft: {
    flex: 1,
    marginRight: 24,
  },
  businessName: {
    fontSize: 26,
    marginBottom: 16,
    lineHeight: 32,
    fontWeight: "700",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  addressText: {
    marginLeft: 10,
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactText: {
    marginLeft: 10,
    fontSize: 15,
    lineHeight: 22,
  },
  reviewCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reviewCountText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    padding: Spacing.xl,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    marginLeft: 12,
    fontSize: 19,
    fontWeight: "600",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  actionButtonText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 14,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  compareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 14,
  },
  idContainer: {
    gap: 12,
  },
  idItem: {
    padding: 16,
    borderRadius: 12,
  },
  idLabel: {
    fontSize: 13,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  idValue: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  servicesList: {
    gap: 14,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceText: {
    marginLeft: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  attributesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  attributeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  attributeText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
