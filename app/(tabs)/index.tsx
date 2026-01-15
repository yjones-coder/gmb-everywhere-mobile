import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
  Alert,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BusinessCard } from "@/components/ui/business-card";
import { BusinessCardSkeleton } from "@/components/ui/skeleton";
import { Colors, Spacing } from "@/constants/theme";
import { Business, mockBusinesses, searchBusinesses } from "@/data/mock-businesses";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRecentSearches } from "@/hooks/use-local-storage";
import { trpc } from "@/lib/trpc";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { searches, addSearch, deleteSearch, clearSearches } = useRecentSearches();

  // tRPC mutation for searching businesses
  const searchMutation = trpc.gmb.search.useMutation();

  // Animation values
  const searchBarScale = useSharedValue(1);
  const welcomeOpacity = useSharedValue(0);

  useEffect(() => {
    welcomeOpacity.value = withTiming(1, { duration: 500 });
  }, [welcomeOpacity]);

  const welcomeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
  }));

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearching(true);
    setSearchError(null);

    try {
      // Use real Google Places API via tRPC
      const result = await searchMutation.mutateAsync({
        query: searchQuery,
      });

      if (result.status === "error") {
        // Show error and fall back to mock data
        setSearchError(result.error || "Search failed. Using mock data.");
        const mockResults = searchBusinesses(searchQuery);
        setSearchResults(mockResults);
        setHasSearched(true);
        addSearch(searchQuery, mockResults.length);

        if (mockResults.length > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } else if (result.status === "no_results") {
        setSearchResults([]);
        setHasSearched(true);
        addSearch(searchQuery, 0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        // Success with real data
        setSearchResults(result.businesses);
        setHasSearched(true);
        addSearch(searchQuery, result.businesses.length);

        if (result.businesses.length > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    } catch (error) {
      // Fallback to mock data on any error
      console.error("Search error, falling back to mock:", error);
      setSearchError("Connection error. Using mock data.");
      const mockResults = searchBusinesses(searchQuery);
      setSearchResults(mockResults);
      setHasSearched(true);
      addSearch(searchQuery, mockResults.length);

      if (mockResults.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, addSearch, searchMutation]);

  const handleRecentSearchPress = useCallback(async (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery(query);
    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await searchMutation.mutateAsync({
        query,
      });

      if (result.status === "error") {
        setSearchError(result.error || "Search failed. Using mock data.");
        const mockResults = searchBusinesses(query);
        setSearchResults(mockResults);
        setHasSearched(true);
      } else if (result.status === "no_results") {
        setSearchResults([]);
        setHasSearched(true);
      } else {
        setSearchResults(result.businesses);
        setHasSearched(true);
      }
    } catch (error) {
      console.error("Recent search error, falling back to mock:", error);
      setSearchError("Connection error. Using mock data.");
      const mockResults = searchBusinesses(query);
      setSearchResults(mockResults);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, [searchMutation]);

  const handleBusinessPress = useCallback((business: Business) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/business/[id]",
      params: { id: business.id },
    });
  }, [router]);

  const handleClearSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setSearchError(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setRefreshing(true);
    setSearchError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await searchMutation.mutateAsync({
        query: searchQuery,
      });

      if (result.status === "error") {
        setSearchError(result.error || "Search failed. Using mock data.");
        const mockResults = searchBusinesses(searchQuery);
        setSearchResults(mockResults);
      } else if (result.status === "no_results") {
        setSearchResults([]);
      } else {
        setSearchResults(result.businesses);
      }
    } catch (error) {
      console.error("Refresh error, falling back to mock:", error);
      setSearchError("Connection error. Using mock data.");
      const mockResults = searchBusinesses(searchQuery);
      setSearchResults(mockResults);
    } finally {
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [searchQuery, searchMutation]);

  const handleSearchFocus = useCallback(() => {
    searchBarScale.value = withSpring(1.02, { damping: 15 });
  }, [searchBarScale]);

  const handleSearchBlur = useCallback(() => {
    searchBarScale.value = withSpring(1, { damping: 15 });
  }, [searchBarScale]);

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
  }));

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

  const renderSkeletons = () => (
    <View>
      <BusinessCardSkeleton />
      <BusinessCardSkeleton />
      <BusinessCardSkeleton />
    </View>
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

        <Animated.View style={searchBarAnimatedStyle}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="search" size={22} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search businesses or categories..."
              placeholderTextColor={colors.textDisabled}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={handleClearSearch} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </Animated.View>

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
          {searchError && (
            <View style={[styles.errorBanner, { backgroundColor: colors.tintLight }]}>
              <MaterialIcons name="warning" size={20} color={colors.tint} />
              <ThemedText style={[styles.errorText, { color: colors.tint }]}>
                {searchError}
              </ThemedText>
            </View>
          )}
          {isSearching ? (
            renderSkeletons()
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderBusiness}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.tint}
                  colors={[colors.tint]}
                />
              }
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
            <Animated.View style={[styles.welcomeContainer, welcomeAnimatedStyle]}>
              <View style={[styles.welcomeIcon, { backgroundColor: colors.tintLight }]}>
                <MaterialIcons name="business" size={48} color={colors.tint} />
              </View>
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

              <Pressable
                style={[styles.gmbButton, { backgroundColor: colors.tint, marginTop: 24 }]}
                onPress={() => router.push("/gmb")}
              >
                <ThemedText style={styles.gmbButtonText}>Go to GMB Audit Tools</ThemedText>
              </Pressable>
            </Animated.View>
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
    marginTop: 8, // Add a bit more breathing room at the top
  },
  title: {
    marginBottom: 8, // More space after title
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
    marginBottom: 8, // Spacing before results/recent
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80, // Prevent overlap with tab bar
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
    paddingBottom: 40,
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
    paddingBottom: 80, // Prevent overlap with tab bar
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
    paddingBottom: 60, // Extra bottom padding for welcome state
  },
  welcomeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeTitle: {
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
    width: '100%', // Ensure it takes full width to allow wrapping
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
  gmbButton: {
    paddingHorizontal: 20,
    paddingVertical: 14, // Match search button height
    borderRadius: 12,
    alignItems: "center",
    width: '100%', // Make it more prominent like the search button
  },
  gmbButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
});
