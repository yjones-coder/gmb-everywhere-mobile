import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BusinessCard } from "@/components/ui/business-card";
import { Colors, Spacing } from "@/constants/theme";
import { Business, mockBusinesses, searchBusinesses } from "@/data/mock-businesses";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRecentSearches } from "@/hooks/use-local-storage";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const { searches, addSearch, deleteSearch, clearSearches } = useRecentSearches();

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const results = searchBusinesses(searchQuery);
    setSearchResults(results);
    setHasSearched(true);
    addSearch(searchQuery, results.length);
  }, [searchQuery, addSearch]);

  const handleRecentSearchPress = useCallback((query: string) => {
    setSearchQuery(query);
    const results = searchBusinesses(query);
    setSearchResults(results);
    setHasSearched(true);
  }, []);

  const handleBusinessPress = useCallback((business: Business) => {
    router.push({
      pathname: "/business/[id]",
      params: { id: business.id },
    });
  }, [router]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  }, []);

  const renderRecentSearch = ({ item }: { item: typeof searches[0] }) => (
    <Pressable
      style={[styles.recentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleRecentSearchPress(item.query)}
    >
      <MaterialIcons name="history" size={20} color={colors.textSecondary} />
      <View style={styles.recentTextContainer}>
        <ThemedText style={styles.recentQuery}>{item.query}</ThemedText>
        <ThemedText style={[styles.recentMeta, { color: colors.textSecondary }]}>
          {item.resultCount} results
        </ThemedText>
      </View>
      <Pressable onPress={() => deleteSearch(item.id)} hitSlop={8}>
        <MaterialIcons name="close" size={18} color={colors.textDisabled} />
      </Pressable>
    </Pressable>
  );

  const renderBusiness = ({ item }: { item: Business }) => (
    <BusinessCard business={item} onPress={() => handleBusinessPress(item)} />
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <ThemedText type="title" style={styles.title}>
          GMB Audit
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Search businesses to analyze
        </ThemedText>

        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={22} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search businesses or categories..."
            placeholderTextColor={colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.searchButton, { backgroundColor: colors.tint }]}
          onPress={handleSearch}
        >
          <ThemedText style={styles.searchButtonText}>Search</ThemedText>
        </Pressable>
      </View>

      {hasSearched ? (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Results ({searchResults.length})
            </ThemedText>
            <Pressable onPress={handleClearSearch}>
              <ThemedText style={[styles.clearText, { color: colors.tint }]}>Clear</ThemedText>
            </Pressable>
          </View>
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderBusiness}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={48} color={colors.textDisabled} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No businesses found for "{searchQuery}"
              </ThemedText>
              <ThemedText style={[styles.emptyHint, { color: colors.textDisabled }]}>
                Try searching for "dentist", "plumber", or "yoga"
              </ThemedText>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.recentContainer}>
          {searches.length > 0 ? (
            <>
              <View style={styles.recentHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Recent Searches
                </ThemedText>
                <Pressable onPress={clearSearches}>
                  <ThemedText style={[styles.clearText, { color: colors.tint }]}>Clear All</ThemedText>
                </Pressable>
              </View>
              <FlatList
                data={searches}
                renderItem={renderRecentSearch}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <View style={styles.welcomeContainer}>
              <MaterialIcons name="business" size={64} color={colors.tintLight} />
              <ThemedText type="subtitle" style={styles.welcomeTitle}>
                Welcome to GMB Audit
              </ThemedText>
              <ThemedText style={[styles.welcomeText, { color: colors.textSecondary }]}>
                Search for any business to view categories, analyze reviews, and compare competitors.
              </ThemedText>
              <View style={styles.suggestionsContainer}>
                <ThemedText style={[styles.suggestionsLabel, { color: colors.textSecondary }]}>
                  Try searching:
                </ThemedText>
                <View style={styles.suggestionChips}>
                  {["dentist", "auto repair", "yoga", "plumber"].map((term) => (
                    <Pressable
                      key={term}
                      style={[styles.suggestionChip, { backgroundColor: colors.tintLight }]}
                      onPress={() => handleRecentSearchPress(term)}
                    >
                      <ThemedText style={[styles.suggestionText, { color: colors.tint }]}>
                        {term}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}
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
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  searchButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  clearText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 22,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  recentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  recentTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  recentQuery: {
    fontSize: 15,
    fontWeight: "500",
  },
  recentMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  welcomeTitle: {
    marginTop: 16,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  suggestionsContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  suggestionsLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  suggestionChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
