import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CategoryBadge } from "@/components/ui/category-badge";
import { RatingDisplay } from "@/components/ui/rating-display";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SavedAudit, useSavedAudits } from "@/hooks/use-local-storage";

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const { audits, deleteAudit, loading } = useSavedAudits();

  const handleAuditPress = useCallback((audit: SavedAudit) => {
    router.push({
      pathname: "/business/[id]",
      params: { id: audit.business.id },
    });
  }, [router]);

  const handleDelete = useCallback((audit: SavedAudit) => {
    Alert.alert(
      "Delete Audit",
      `Delete saved audit for ${audit.business.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAudit(audit.id),
        },
      ]
    );
  }, [deleteAudit]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderAudit = ({ item }: { item: SavedAudit }) => (
    <Pressable
      style={[styles.auditCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleAuditPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <ThemedText type="defaultSemiBold" style={styles.businessName} numberOfLines={1}>
            {item.business.name}
          </ThemedText>
          <ThemedText style={[styles.savedDate, { color: colors.textSecondary }]}>
            Saved {formatDate(item.savedAt)}
          </ThemedText>
        </View>
        <Pressable onPress={() => handleDelete(item)} hitSlop={8} style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" size={22} color={colors.error} />
        </Pressable>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.categoryRow}>
          <CategoryBadge category={item.business.primaryCategory} isPrimary />
          {item.business.secondaryCategories.length > 0 && (
            <ThemedText style={[styles.moreCategories, { color: colors.textSecondary }]}>
              +{item.business.secondaryCategories.length} more
            </ThemedText>
          )}
        </View>

        <View style={styles.statsRow}>
          <RatingDisplay
            rating={item.business.rating}
            reviewCount={item.business.reviewCount}
            size="small"
          />
        </View>

        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <MaterialIcons name="label" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.quickStatText, { color: colors.textSecondary }]}>
              {item.business.secondaryCategories.length + 1} categories
            </ThemedText>
          </View>
          <View style={styles.quickStat}>
            <MaterialIcons name="build" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.quickStatText, { color: colors.textSecondary }]}>
              {item.business.services.length} services
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <ThemedText style={[styles.viewDetails, { color: colors.tint }]}>
          View Details
        </ThemedText>
        <MaterialIcons name="chevron-right" size={20} color={colors.tint} />
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <ThemedText type="title" style={styles.title}>
          Saved Audits
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your saved business audits
        </ThemedText>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: colors.textSecondary }}>Loading...</ThemedText>
        </View>
      ) : audits.length > 0 ? (
        <FlatList
          data={audits}
          renderItem={renderAudit}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="bookmark-border" size={64} color={colors.textDisabled} />
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            No Saved Audits
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            Save business audits to quickly access them later. Tap the bookmark icon on any business detail page.
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 20,
  },
  auditCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.lg,
    paddingBottom: 8,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  businessName: {
    fontSize: 17,
    lineHeight: 22,
  },
  savedDate: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  cardContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  moreCategories: {
    fontSize: 13,
    marginLeft: 8,
  },
  statsRow: {
    marginBottom: 10,
  },
  quickStats: {
    flexDirection: "row",
    gap: 16,
  },
  quickStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickStatText: {
    fontSize: 13,
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  viewDetails: {
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
});
