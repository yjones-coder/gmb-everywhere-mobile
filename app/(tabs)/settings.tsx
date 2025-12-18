import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCompareList, useRecentSearches, useSavedAudits } from "@/hooks/use-local-storage";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const { audits } = useSavedAudits();
  const { searches, clearSearches } = useRecentSearches();
  const { compareList, clearCompareList } = useCompareList();

  const handleClearSearches = useCallback(() => {
    Alert.alert(
      "Clear Search History",
      "This will remove all your recent searches.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: clearSearches,
        },
      ]
    );
  }, [clearSearches]);

  const handleClearCompare = useCallback(() => {
    Alert.alert(
      "Clear Comparison List",
      "This will remove all businesses from your comparison list.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: clearCompareList,
        },
      ]
    );
  }, [clearCompareList]);

  const handleOpenGMBEverywhere = useCallback(() => {
    Linking.openURL("https://www.gmbeverywhere.com/");
  }, []);

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    destructive = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    destructive?: boolean;
  }) => (
    <Pressable
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: destructive ? colors.error + "15" : colors.tintLight }]}>
        <MaterialIcons
          name={icon as any}
          size={20}
          color={destructive ? colors.error : colors.tint}
        />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={[styles.settingTitle, destructive && { color: colors.error }]}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {showArrow && onPress && (
        <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
      )}
    </Pressable>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <ThemedText type="title" style={styles.title}>
          Settings
        </ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Data Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            DATA
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingItem
              icon="bookmark"
              title="Saved Audits"
              subtitle={`${audits.length} saved`}
              showArrow={false}
            />
            <SettingItem
              icon="history"
              title="Recent Searches"
              subtitle={`${searches.length} searches`}
              onPress={searches.length > 0 ? handleClearSearches : undefined}
              showArrow={searches.length > 0}
            />
            <SettingItem
              icon="compare-arrows"
              title="Comparison List"
              subtitle={`${compareList.length} businesses`}
              onPress={compareList.length > 0 ? handleClearCompare : undefined}
              showArrow={compareList.length > 0}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ABOUT
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingItem
              icon="language"
              title="GMB Everywhere Website"
              subtitle="Visit the official website"
              onPress={handleOpenGMBEverywhere}
            />
            <SettingItem
              icon="info"
              title="App Version"
              subtitle="1.0.0"
              showArrow={false}
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.tintLight }]}>
          <MaterialIcons name="lightbulb" size={24} color={colors.tint} />
          <View style={styles.infoContent}>
            <ThemedText style={[styles.infoTitle, { color: colors.tint }]}>
              About This App
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: colors.tint }]}>
              This mobile app replicates the core features of the GMB Everywhere Chrome extension, allowing you to perform local SEO audits on the go.
            </ThemedText>
          </View>
        </View>

        {/* Features List */}
        <View style={[styles.featuresCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="defaultSemiBold" style={styles.featuresTitle}>
            Features
          </ThemedText>
          {[
            "Search and analyze businesses",
            "View primary and secondary categories",
            "Analyze review trends and keywords",
            "Compare up to 4 competitors",
            "Save audits for quick access",
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={18} color={colors.success} />
              <ThemedText style={styles.featureText}>{feature}</ThemedText>
            </View>
          ))}
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  title: {
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  featuresCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  featuresTitle: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 10,
    lineHeight: 20,
  },
});
