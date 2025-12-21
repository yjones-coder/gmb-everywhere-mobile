import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { Colors, Spacing } from "@/constants/theme";
import { mockBusinesses } from "@/data/mock-businesses";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCompareList, useSavedAudits } from "@/hooks/use-local-storage";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const { saveAudit, isBusinessSaved } = useSavedAudits();
  const { addToCompare, isInCompareList, compareList } = useCompareList();

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isSaved) {
      Alert.alert("Already Saved", "This business audit is already saved.");
      return;
    }
    await saveAudit(business);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved", "Business audit saved successfully!");
  }, [business, isSaved, saveAudit]);

  const handleAddToCompare = useCallback(async () => {
    if (!business) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (inCompare) {
      Alert.alert("Already Added", "This business is already in your comparison list.");
      return;
    }
    const success = await addToCompare(business);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Added", "Business added to comparison list.");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Limit Reached", "You can compare up to 4 businesses at a time.");
    }
  }, [business, inCompare, addToCompare]);

  const handleCategoryAnalysis = useCallback(() => {
    if (!business) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/business/categories",
      params: { id: business.id },
    });
  }, [business, router]);

  const handleReviewAudit = useCallback(() => {
    if (!business) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/business/reviews",
      params: { id: business.id },
    });
  }, [business, router]);

  const handleCompare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          <MaterialIcons name="error-outline" size={64} color={colors.textDisabled} />
          <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
            Business not found
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
          { paddingTop: Math.max(insets.top, 16), backgroundColor: colors.surface },
          headerAnimatedStyle,
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle} numberOfLines={1}>
          Business Details
        </ThemedText>
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentAnimatedStyle}>
          {/* Hero Card with Score Ring */}
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <ThemedText type="title" style={styles.businessName}>
                  {business.name}
                </ThemedText>
                <View style={styles.addressRow}>
                  <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {business.address}
                  </ThemedText>
                </View>
                <View style={styles.contactRow}>
                  <MaterialIcons name="phone" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.contactText, { color: colors.textSecondary }]}>
                    {business.phone}
                  </ThemedText>
                </View>
              </View>
              <ScoreRing
                score={business.rating}
                maxScore={5}
                size={90}
                strokeWidth={8}
                label="Rating"
                delay={300}
              />
            </View>
            <View style={styles.reviewCountBadge}>
              <MaterialIcons name="rate-review" size={14} color={colors.tint} />
              <ThemedText style={[styles.reviewCountText, { color: colors.tint }]}>
                {business.reviewCount.toLocaleString()} reviews
              </ThemedText>
            </View>
          </View>

          {/* Categories Section */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="label" size={20} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Categories
              </ThemedText>
            </View>
            <View style={styles.categoriesContainer}>
              <CategoryBadge category={business.primaryCategory} isPrimary />
              {business.secondaryCategories.map((cat, index) => (
                <CategoryBadge key={index} category={cat} />
              ))}
            </View>
          </View>

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

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <AnimatedPressable
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
              onPress={handleCategoryAnalysis}
            >
              <MaterialIcons name="analytics" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Category Analysis</ThemedText>
              <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
              onPress={handleReviewAudit}
            >
              <MaterialIcons name="insights" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Review Audit</ThemedText>
              <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
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
                  size={20}
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
            <View style={styles.cardHeader}>
              <MaterialIcons name="fingerprint" size={20} color={colors.tint} />
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

          {/* Services */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="build" size={20} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Services
              </ThemedText>
            </View>
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
            <View style={styles.cardHeader}>
              <MaterialIcons name="verified" size={20} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Attributes
              </ThemedText>
            </View>
            <View style={styles.attributesList}>
              {business.attributes.map((attr, index) => (
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
  errorText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  heroCard: {
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroLeft: {
    flex: 1,
    marginRight: 16,
  },
  businessName: {
    fontSize: 22,
    marginBottom: 8,
    lineHeight: 28,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  addressText: {
    marginLeft: 6,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactText: {
    marginLeft: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  reviewCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  reviewCountText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
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
  sectionTitle: {
    marginLeft: 8,
    fontSize: 17,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionButtonText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
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
  idContainer: {
    gap: 8,
  },
  idItem: {
    padding: 12,
    borderRadius: 8,
  },
  idLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  idValue: {
    fontSize: 13,
    fontFamily: "monospace",
  },
  servicesList: {
    gap: 10,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceText: {
    marginLeft: 10,
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
