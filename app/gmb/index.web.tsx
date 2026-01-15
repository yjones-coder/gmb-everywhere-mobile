import { StyleSheet, ScrollView, ActivityIndicator, View, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState, useMemo, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '24px',
};

// Default center (London)
const defaultCenter = {
    lat: 51.5074,
    lng: -0.1278
};

export default function GmbScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'audit' | 'teleport' | 'heatmap'>('audit');
    const teleportMutation = trpc.gmb.teleport.useMutation();

    // Map Loader
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || ''
    });

    // Teleport state
    const [teleportLocation, setTeleportLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [teleportHistory, setTeleportHistory] = useState<Array<{ name: string; lat: number; lng: number }>>([]);

    // Map State
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    // Business location (London center for Mock Business)
    const businessLocation = { lat: 51.5074, lng: -0.1278 };

    // Preset locations
    const presetLocations = [
        { name: "Chiswick, London", lat: 51.4912, lng: -0.2522 },
        { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
        { name: "New York, NY", lat: 40.7128, lng: -74.0060 },
        { name: "Tokyo, Japan", lat: 35.6895, lng: 139.6917 },
        { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
        { name: "Berlin, Germany", lat: 52.5200, lng: 13.4050 },
    ];

    // Load teleport history from AsyncStorage
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const saved = await AsyncStorage.getItem('teleportHistory');
                if (saved) {
                    setTeleportHistory(JSON.parse(saved));
                }
            } catch (e) {
                console.error('Failed to load teleport history:', e);
            }
        };
        loadHistory();
    }, []);

    // Save teleport history
    const saveToHistory = async (name: string, lat: number, lng: number) => {
        const newEntry = { name, lat, lng };
        const updatedHistory = [newEntry, ...teleportHistory.slice(0, 9)]; // Keep last 10
        setTeleportHistory(updatedHistory);
        try {
            await AsyncStorage.setItem('teleportHistory', JSON.stringify(updatedHistory));
        } catch (e) {
            console.error('Failed to save teleport history:', e);
        }
    };

    // Handle teleport mutation
    const handleTeleport = async (lat: number, lng: number, name: string) => {
        try {
            const result = await teleportMutation.mutateAsync({
                query: "Mock Business",
                latitude: lat,
                longitude: lng,
            });

            if (result.status === "success") {
                setTeleportLocation({ lat, lng });
                setShowResults(true);
                await saveToHistory(name, lat, lng);
            } else {
                Alert.alert("Teleport Failed", result.error || "Unknown error occurred");
            }
        } catch (error) {
            Alert.alert("Teleport Failed", error instanceof Error ? error.message : "Unknown error occurred");
        }
    };

    // Handle manual coordinate input
    const handleManualTeleport = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);

        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert("Invalid Coordinates", "Please enter valid latitude and longitude values");
            return;
        }

        if (lat < -90 || lat > 90) {
            Alert.alert("Invalid Latitude", "Latitude must be between -90 and 90");
            return;
        }

        if (lng < -180 || lng > 180) {
            Alert.alert("Invalid Longitude", "Longitude must be between -180 and 180");
            return;
        }

        handleTeleport(lat, lng, `Custom (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    };

    // Handle preset selection
    const handlePresetPress = (preset: { name: string; lat: number; lng: number }) => {
        setTeleportLocation({ lat: preset.lat, lng: preset.lng });
        setManualLat(preset.lat.toFixed(6));
        setManualLng(preset.lng.toFixed(6));
        setShowResults(false);
    };

    // Handle history selection
    const handleHistoryPress = (historyItem: { name: string; lat: number; lng: number }) => {
        setTeleportLocation({ lat: historyItem.lat, lng: historyItem.lng });
        setManualLat(historyItem.lat.toFixed(6));
        setManualLng(historyItem.lng.toFixed(6));
        setShowResults(false);
    };

    // Handle map click for teleport
    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setTeleportLocation({ lat, lng });
            setManualLat(lat.toFixed(6));
            setManualLng(lng.toFixed(6));
            handleTeleport(lat, lng, `Map Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
    };

    // Get visibility score color
    const getVisibilityColor = (score: number) => {
        if (score >= 70) return '#34A853';
        if (score >= 40) return '#FBBC04';
        return '#EA4335';
    };

    const { data, isLoading, error } = trpc.gmb.audit.useQuery({
        query: "Mock Business",
    });

    // Heatmap query with default location (London)
    const { data: heatmapData, isLoading: heatmapLoading, error: heatmapError } = trpc.gmb.heatmap.useQuery({
        query: "Mock Business",
        latitude: 51.5074,
        longitude: -0.1278,
        gridSize: 5,
        spacingKm: 1,
    }, {
        enabled: activeTab === 'heatmap',
    });

    // Calculate ranking statistics
    const rankingStats = useMemo(() => {
        if (!heatmapData?.points || heatmapData.points.length === 0) {
            return null;
        }
        const validRanks = heatmapData.points.filter(p => p.rank > 0).map(p => p.rank);
        if (validRanks.length === 0) return null;

        const avg = validRanks.reduce((a, b) => a + b, 0) / validRanks.length;
        const best = Math.min(...validRanks);
        const worst = Math.max(...validRanks);

        return { average: avg.toFixed(1), best, worst };
    }, [heatmapData]);

    // Get color based on ranking
    const getRankColor = (rank: number) => {
        if (rank === 0) return '#9CA3AF'; // Gray for error
        if (rank <= 3) return '#34A853'; // Green
        if (rank <= 7) return '#FBBC04'; // Yellow
        if (rank <= 12) return '#F97316'; // Orange
        return '#EA4335'; // Red
    };

    // Get rank label
    const getRankLabel = (rank: number) => {
        if (rank === 0) return 'Error';
        if (rank <= 3) return 'Excellent';
        if (rank <= 7) return 'Good';
        if (rank <= 12) return 'Average';
        return 'Poor';
    };

    if (isLoading) {
        return (
            <ThemedView style={[styles.container, styles.center]}>
                <Stack.Screen options={{ title: 'Loading...' }} />
                <ActivityIndicator size="large" color={colors.tint} />
            </ThemedView>
        );
    }

    if (error || !data) {
        return (
            <ThemedView style={[styles.container, styles.center]}>
                <Stack.Screen options={{ title: 'Error' }} />
                <ThemedText>Error loading audit data</ThemedText>
                <ThemedText>{error?.message}</ThemedText>
            </ThemedView>
        );
    }

    const { reviewAudit, postAudit } = data.results;

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{
                title: activeTab === 'audit' ? 'GMB Audit' : activeTab === 'teleport' ? 'GMB Teleport' : 'GMB Heatmap',
                headerShown: true,
                headerTransparent: true,
                headerBlurEffect: 'regular',
                headerRight: () => (
                    <TouchableOpacity onPress={() => router.replace('/')} style={styles.headerButton}>
                        <IconSymbol name="house.fill" size={24} color={colors.tint} />
                    </TouchableOpacity>
                ),
            }} />

            <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => setActiveTab('audit')}
                    style={[styles.tab, activeTab === 'audit' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
                >
                    <ThemedText style={[styles.tabText, activeTab === 'audit' && { color: colors.tint }]}>Audit</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('teleport')}
                    style={[styles.tab, activeTab === 'teleport' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
                >
                    <ThemedText style={[styles.tabText, activeTab === 'teleport' && { color: colors.tint }]}>Teleport</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('heatmap')}
                    style={[styles.tab, activeTab === 'heatmap' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
                >
                    <ThemedText style={[styles.tabText, activeTab === 'heatmap' && { color: colors.tint }]}>Heatmap</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {activeTab === 'audit' ? (
                    <>
                        {/* Review Health Section */}
                        <View style={styles.section}>
                            <ThemedText type="title" style={styles.sectionTitle}>Review Health</ThemedText>
                            <ThemedView style={[styles.glassCard, { borderColor: colors.border }]}>
                                <View style={styles.headerRow}>
                                    <IconSymbol name="star.fill" size={32} color="#FFD700" />
                                    <View>
                                        <ThemedText type="title" style={styles.heroStat}>{reviewAudit.averageReviewRating}</ThemedText>
                                        <ThemedText style={styles.heroLabel}>Average Rating</ThemedText>
                                    </View>
                                </View>

                                <View style={styles.statsGrid}>
                                    <View style={styles.gridItem}>
                                        <IconSymbol name="text.bubble.fill" size={20} color={colors.tint} />
                                        <ThemedText type="defaultSemiBold" style={styles.gridValue}>{reviewAudit.numberOfReviews}</ThemedText>
                                        <ThemedText style={styles.gridLabel}>Total Reviews</ThemedText>
                                    </View>
                                    <View style={styles.gridLine} />
                                    <View style={styles.gridItem}>
                                        <IconSymbol name="person.fill" size={20} color={colors.tint} />
                                        <ThemedText type="defaultSemiBold" style={styles.gridValue}>{reviewAudit.reviewCalculatedValues.averageNumberOfReviewByReviewer}</ThemedText>
                                        <ThemedText style={styles.gridLabel}>Avg per Reviewer</ThemedText>
                                    </View>
                                </View>

                                <ThemedView lightColor="rgba(0,0,0,0.05)" darkColor="rgba(255,255,255,0.05)" style={styles.footerNote}>
                                    <IconSymbol name="info.circle.fill" size={14} color={colors.tabIconDefault} />
                                    <ThemedText style={styles.footerText}>
                                        {reviewAudit.reviewCalculatedValues.numberOfReviewsWithPhotos} reviews contain photos
                                    </ThemedText>
                                </ThemedView>
                            </ThemedView>
                        </View>

                        {/* Post Activity Section */}
                        <View style={styles.section}>
                            <ThemedText type="title" style={styles.sectionTitle}>Post Activity</ThemedText>
                            <ThemedView style={[styles.glassCard, { borderColor: colors.border }]}>
                                <View style={styles.headerRow}>
                                    <IconSymbol name="info.circle.fill" size={32} color={colors.tabIconDefault} />
                                    <View style={styles.flex1}>
                                        <ThemedText type="defaultSemiBold" style={styles.infoTitle}>Data Not Available</ThemedText>
                                        <ThemedText style={styles.infoText}>
                                            Google Posts data is not available through the Google Places API. This feature requires direct access to Google Business Profile.
                                        </ThemedText>
                                    </View>
                                </View>
                                <ThemedView lightColor="rgba(0,0,0,0.05)" darkColor="rgba(255,255,255,0.05)" style={styles.footerNote}>
                                    <IconSymbol name="lightbulb.fill" size={14} color={colors.tabIconDefault} />
                                    <ThemedText style={styles.footerText}>
                                        To track Google Posts, use Google Business Profile Manager directly
                                    </ThemedText>
                                </ThemedView>
                            </ThemedView>
                        </View>

                        {/* Review Velocity Section */}
                        <View style={styles.section}>
                            <View style={styles.velocityHeader}>
                                <ThemedText type="title" style={styles.sectionTitle}>Review Velocity</ThemedText>
                                <IconSymbol name="clock.fill" size={20} color={colors.tabIconDefault} />
                            </View>
                            {reviewAudit.reviewVelocity.map(([date, count, rating], index) => (
                                <ThemedView
                                    key={index}
                                    lightColor="rgba(0,0,0,0.02)"
                                    darkColor="rgba(255,255,255,0.02)"
                                    style={[styles.rowItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                                >
                                    <ThemedText type="defaultSemiBold">{date}</ThemedText>
                                    <View style={styles.velocityStats}>
                                        <ThemedText style={styles.velocityVal}>{count} reviews</ThemedText>
                                        <View style={styles.velocityRating}>
                                            <ThemedText style={styles.velocityVal}>{rating}</ThemedText>
                                            <IconSymbol name="star.fill" size={12} color="#FFD700" />
                                        </View>
                                    </View>
                                </ThemedView>
                            ))}
                        </View>
                    </>
                ) : activeTab === 'teleport' ? (
                    <View style={styles.teleportContainer}>
                        {/* Hero Section */}
                        <View style={styles.teleportHero}>
                            <IconSymbol name="location.fill" size={64} color={colors.tint} />
                            <ThemedText type="title" style={{ marginTop: 24 }}>GMB Teleport</ThemedText>
                            <ThemedText style={styles.teleportDescription}>
                                Select a location on the map or use presets to see how your business ranks from that area.
                            </ThemedText>
                        </View>

                        {/* Web Map Implementation */}
                        <View style={{ marginBottom: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={teleportLocation || defaultCenter}
                                    zoom={teleportLocation ? 13 : 11}
                                    onLoad={onLoad}
                                    onUnmount={onUnmount}
                                    onClick={handleMapClick}
                                >
                                    {/* Business Location Marker (Blue) */}
                                    <Marker
                                        position={businessLocation}
                                        label="B"
                                        title="Your Business"
                                    />

                                    {/* Teleport Location Marker (Red) & Radius */}
                                    {teleportLocation && (
                                        <>
                                            <Marker
                                                position={teleportLocation}
                                                animation={google.maps.Animation.DROP}
                                            />
                                            <Circle
                                                center={teleportLocation}
                                                radius={1000} // 1km radius
                                                options={{
                                                    strokeColor: colors.tint,
                                                    strokeOpacity: 0.8,
                                                    strokeWeight: 2,
                                                    fillColor: colors.tint,
                                                    fillOpacity: 0.35,
                                                }}
                                            />
                                        </>
                                    )}
                                </GoogleMap>
                            ) : (
                                <View style={[styles.webMapPlaceholder, { backgroundColor: colors.surface }]}>
                                    <ActivityIndicator size="large" color={colors.tint} />
                                    <ThemedText style={{ marginTop: 16 }}>Loading Google Maps...</ThemedText>
                                </View>
                            )}
                        </View>

                        {/* Selected Location Info */}
                        {teleportLocation && (
                            <ThemedView style={[styles.glassCard, { borderColor: colors.border }]}>
                                <View style={styles.locationInfoHeader}>
                                    <IconSymbol name="location.fill" size={20} color={colors.tint} />
                                    <ThemedText type="defaultSemiBold">Selected Location</ThemedText>
                                </View>
                                <View style={styles.locationInfoRow}>
                                    <ThemedText style={styles.locationLabel}>Latitude:</ThemedText>
                                    <ThemedText style={styles.locationValue}>{teleportLocation.lat.toFixed(6)}</ThemedText>
                                </View>
                                <View style={styles.locationInfoRow}>
                                    <ThemedText style={styles.locationLabel}>Longitude:</ThemedText>
                                    <ThemedText style={styles.locationValue}>{teleportLocation.lng.toFixed(6)}</ThemedText>
                                </View>
                            </ThemedView>
                        )}

                        {/* Manual Coordinate Input */}
                        <ThemedView style={[styles.glassCard, { borderColor: colors.border }]}>
                            <ThemedText type="defaultSemiBold" style={styles.inputSectionTitle}>Manual Coordinates</ThemedText>
                            <View style={styles.coordinateInputs}>
                                <View style={styles.inputWrapper}>
                                    <ThemedText style={styles.inputLabel}>Latitude</ThemedText>
                                    <TextInput
                                        style={[styles.coordinateInput, { borderColor: colors.border, color: colors.text }]}
                                        value={manualLat}
                                        onChangeText={setManualLat}
                                        placeholder="51.5074"
                                        placeholderTextColor={colors.tabIconDefault}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={styles.inputWrapper}>
                                    <ThemedText style={styles.inputLabel}>Longitude</ThemedText>
                                    <TextInput
                                        style={[styles.coordinateInput, { borderColor: colors.border, color: colors.text }]}
                                        value={manualLng}
                                        onChangeText={setManualLng}
                                        placeholder="-0.1278"
                                        placeholderTextColor={colors.tabIconDefault}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={handleManualTeleport}
                                style={[styles.teleportButton, { backgroundColor: colors.tint }]}
                                disabled={teleportMutation.isPending}
                            >
                                {teleportMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <ThemedText style={styles.teleportButtonText}>Teleport</ThemedText>
                                )}
                            </TouchableOpacity>
                        </ThemedView>

                        {/* Preset Locations */}
                        <ThemedText type="defaultSemiBold" style={styles.subHeader}>Popular Destinations</ThemedText>
                        <View style={styles.presetsGrid}>
                            {presetLocations.map((loc) => (
                                <TouchableOpacity
                                    key={loc.name}
                                    onPress={() => handlePresetPress(loc)}
                                    style={[styles.presetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                >
                                    <ThemedText type="defaultSemiBold">{loc.name}</ThemedText>
                                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>{loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Teleport History */}
                        {teleportHistory.length > 0 && (
                            <>
                                <ThemedText type="defaultSemiBold" style={styles.subHeader}>Recent Teleports</ThemedText>
                                <View style={styles.historyList}>
                                    {teleportHistory.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => handleHistoryPress(item)}
                                            style={[styles.historyItem, { borderColor: colors.border }]}
                                        >
                                            <IconSymbol name="clock.fill" size={16} color={colors.tabIconDefault} />
                                            <ThemedText style={styles.historyName}>{item.name}</ThemedText>
                                            <ThemedText style={styles.historyCoords}>{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Teleport Results */}
                        {showResults && teleportMutation.data && teleportMutation.data.status === "success" && (
                            <ThemedView style={[styles.glassCard, { borderColor: colors.border }]}>
                                <View style={styles.resultsHeader}>
                                    <IconSymbol name="chart.bar.fill" size={24} color={colors.tint} />
                                    <ThemedText type="title">Ranking Results</ThemedText>
                                </View>

                                <View style={styles.rankDisplay}>
                                    <View style={[styles.rankBadge, { backgroundColor: getRankColor(teleportMutation.data.results?.rank ?? 0) }]} >
                                        <ThemedText type="title" style={styles.rankNumber}>{teleportMutation.data.results?.rank ?? 0}</ThemedText>
                                        <ThemedText style={styles.rankLabel}>{teleportMutation.data.results?.rankLabel ?? 'Unknown'}</ThemedText>
                                    </View>
                                </View>

                                <View style={styles.resultsGrid}>
                                    <View style={styles.resultItem}>
                                        <IconSymbol name="location.fill" size={20} color={colors.tabIconDefault} />
                                        <ThemedText style={styles.resultLabel}>Distance</ThemedText>
                                        <ThemedText type="defaultSemiBold" style={styles.resultValue}>
                                            {teleportMutation.data.results?.distance ?? 0} {teleportMutation.data.results?.distanceUnit ?? 'km'}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.resultItem}>
                                        <IconSymbol name="eye.fill" size={20} color={colors.tabIconDefault} />
                                        <ThemedText style={styles.resultLabel}>Visibility</ThemedText>
                                        <ThemedText
                                            type="defaultSemiBold"
                                            style={[styles.resultValue, { color: getVisibilityColor(teleportMutation.data.results?.visibilityScore ?? 0) }]}
                                        >
                                            {teleportMutation.data.results?.visibilityScore ?? 0}%
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.resultDetail}>
                                    <ThemedText style={styles.detailLabel}>Total Results:</ThemedText>
                                    <ThemedText style={styles.detailValue}>{teleportMutation.data.results?.totalResults ?? 0} businesses</ThemedText>
                                </View>
                            </ThemedView>
                        )}

                        {/* Info Note */}
                        <ThemedView style={[styles.glassCard, { marginTop: 32, borderColor: colors.border }]}>
                            <ThemedText style={{ opacity: 0.6, textAlign: 'center', fontSize: 12 }}>
                                Note: This feature simulates ranking from the target location. For real GPS override, please use a developer system proxy.
                            </ThemedText>
                        </ThemedView>
                    </View>
                ) : (
                    <View style={styles.heatmapContainer}>
                        {heatmapLoading ? (
                            <View style={[styles.teleportHero, { paddingTop: 60 }]}>
                                <ActivityIndicator size="large" color={colors.tint} />
                                <ThemedText style={{ marginTop: 16 }}>Loading heatmap data...</ThemedText>
                            </View>
                        ) : heatmapError ? (
                            <View style={[styles.teleportHero, { paddingTop: 60 }]}>
                                <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.error} />
                                <ThemedText style={{ marginTop: 16 }}>Error loading heatmap</ThemedText>
                                <ThemedText style={{ opacity: 0.6, marginTop: 8 }}>{heatmapError.message}</ThemedText>
                            </View>
                        ) : heatmapData ? (
                            <>
                                {/* Ranking Statistics */}
                                {rankingStats && (
                                    <View style={styles.statsSummary}>
                                        <ThemedView style={[styles.statBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                            <ThemedText style={styles.statLabel}>Average</ThemedText>
                                            <ThemedText type="title" style={styles.statValue}>{rankingStats.average}</ThemedText>
                                        </ThemedView>
                                        <ThemedView style={[styles.statBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                            <ThemedText style={styles.statLabel}>Best</ThemedText>
                                            <ThemedText type="title" style={[styles.statValue, { color: '#34A853' }]}>{rankingStats.best}</ThemedText>
                                        </ThemedView>
                                        <ThemedView style={[styles.statBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                            <ThemedText style={styles.statLabel}>Worst</ThemedText>
                                            <ThemedText type="title" style={[styles.statValue, { color: '#EA4335' }]}>{rankingStats.worst}</ThemedText>
                                        </ThemedView>
                                    </View>
                                )}

                                {/* Heatmap Map Implementation */}
                                <View style={{ marginBottom: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                                    {isLoaded ? (
                                        <GoogleMap
                                            mapContainerStyle={mapContainerStyle}
                                            center={defaultCenter}
                                            zoom={13}
                                            onLoad={onLoad}
                                            onUnmount={onUnmount}
                                        >
                                            {/* Business Location Marker */}
                                            <Marker
                                                position={businessLocation}
                                                label="B"
                                                title="Your Business"
                                            />

                                            {/* Heatmap Points */}
                                            {heatmapData.points.map((point, index) => (
                                                <Circle
                                                    key={index}
                                                    center={{ lat: point.lat, lng: point.lng }}
                                                    radius={200} // Small circle for grid point
                                                    options={{
                                                        strokeColor: getRankColor(point.rank),
                                                        strokeOpacity: 0.8,
                                                        strokeWeight: 2,
                                                        fillColor: getRankColor(point.rank),
                                                        fillOpacity: 0.8,
                                                    }}
                                                    onClick={() => {
                                                        Alert.alert(
                                                            `Rank: ${point.rank}`,
                                                            `Location: ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </GoogleMap>
                                    ) : (
                                        <View style={[styles.webMapPlaceholder, { backgroundColor: colors.surface }]}>
                                            <ActivityIndicator size="large" color={colors.tint} />
                                            <ThemedText style={{ marginTop: 16 }}>Loading Map...</ThemedText>
                                        </View>
                                    )}
                                </View>

                                {/* Legend */}
                                <ThemedView style={[styles.legendContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <ThemedText type="defaultSemiBold" style={styles.legendTitle}>Ranking Legend</ThemedText>
                                    <View style={styles.legendItems}>
                                        <View style={styles.legendItem}>
                                            <View style={[styles.legendColor, { backgroundColor: '#34A853' }]} />
                                            <ThemedText style={styles.legendText}>1-3 (Excellent)</ThemedText>
                                        </View>
                                        <View style={styles.legendItem}>
                                            <View style={[styles.legendColor, { backgroundColor: '#FBBC04' }]} />
                                            <ThemedText style={styles.legendText}>4-7 (Good)</ThemedText>
                                        </View>
                                        <View style={styles.legendItem}>
                                            <View style={[styles.legendColor, { backgroundColor: '#F97316' }]} />
                                            <ThemedText style={styles.legendText}>8-12 (Average)</ThemedText>
                                        </View>
                                        <View style={styles.legendItem}>
                                            <View style={[styles.legendColor, { backgroundColor: '#EA4335' }]} />
                                            <ThemedText style={styles.legendText}>13-20 (Poor)</ThemedText>
                                        </View>
                                    </View>
                                </ThemedView>

                                {/* Heatmap Points List */}
                                <ThemedText type="defaultSemiBold" style={styles.subHeader}>Heatmap Points</ThemedText>
                                <View style={styles.heatmapPointsList}>
                                    {heatmapData.points.map((point, index) => (
                                        <View
                                            key={index}
                                            style={[styles.heatmapPointItem, { borderColor: colors.border }]}
                                        >
                                            <View style={[styles.pointIndicator, { backgroundColor: getRankColor(point.rank) }]} />
                                            <View style={styles.pointInfo}>
                                                <ThemedText type="defaultSemiBold">Rank: {point.rank}</ThemedText>
                                                <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                                                    {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                                                </ThemedText>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </>
                        ) : null}
                    </View>
                )}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 20,
    },
    headerButton: {
        marginRight: 16,
        padding: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        marginTop: 90, // Account for header
        borderBottomWidth: 1,
        paddingHorizontal: 20,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginRight: 16,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        opacity: 0.6,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        marginBottom: 16,
        fontSize: 20,
    },
    glassCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    heroStat: {
        fontSize: 40,
        lineHeight: 48,
    },
    heroLabel: {
        fontSize: 14,
        opacity: 0.6,
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    gridItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    gridLine: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(128,128,128,0.2)',
    },
    gridValue: {
        fontSize: 18,
    },
    gridLabel: {
        fontSize: 12,
        opacity: 0.6,
        textAlign: 'center',
    },
    smallHeroStat: {
        fontSize: 24,
        marginTop: 8,
    },
    infoTitle: {
        fontSize: 16,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 20,
    },
    footerNote: {
        marginTop: 20,
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    footerText: {
        fontSize: 12,
        opacity: 0.8,
    },
    velocityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    rowItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    velocityStats: {
        alignItems: 'flex-end',
        gap: 2,
    },
    velocityVal: {
        fontSize: 13,
        opacity: 0.7,
    },
    velocityRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    flex1: {
        flex: 1,
    },
    teleportContainer: {
        paddingTop: 20,
    },
    teleportHero: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    teleportDescription: {
        textAlign: 'center',
        opacity: 0.6,
        marginTop: 8,
        paddingHorizontal: 20,
    },
    subHeader: {
        marginTop: 24,
        marginBottom: 16,
    },
    presetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    presetCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 4,
    },
    heatmapContainer: {
        paddingTop: 20,
    },
    // Heatmap styles
    statsSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    statBadge: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    statLabel: {
        fontSize: 12,
        opacity: 0.6,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    legendContainer: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    legendTitle: {
        fontSize: 14,
        marginBottom: 12,
    },
    legendItems: {
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    legendText: {
        fontSize: 13,
        opacity: 0.8,
    },
    heatmapPointsList: {
        gap: 8,
    },
    heatmapPointItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    pointIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    pointInfo: {
        flex: 1,
    },
    // Teleport styles
    webMapPlaceholder: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        borderWidth: 1,
        borderRadius: 24,
        gap: 16,
        marginBottom: 20,
    },
    webMapTitle: {
        fontSize: 18,
        marginTop: 8,
        textAlign: 'center',
    },
    webMapText: {
        fontSize: 14,
        opacity: 0.7,
        textAlign: 'center',
        lineHeight: 20,
    },
    locationInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    locationInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    },
    locationLabel: {
        fontSize: 14,
        opacity: 0.6,
    },
    locationValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputSectionTitle: {
        marginBottom: 12,
    },
    coordinateInputs: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    inputWrapper: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 12,
        opacity: 0.6,
        marginBottom: 4,
    },
    coordinateInput: {
        height: 44,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        fontSize: 14,
    },
    teleportButton: {
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    teleportButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    historyList: {
        gap: 8,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    historyName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    historyCoords: {
        fontSize: 12,
        opacity: 0.6,
    },
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    resultsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    resultItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    resultLabel: {
        fontSize: 12,
        opacity: 0.6,
    },
    resultValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    resultDetail: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128, 128, 128, 0.2)',
    },
    detailLabel: {
        fontSize: 14,
        opacity: 0.6,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    rankDisplay: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    rankBadge: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    rankNumber: {
        color: '#FFFFFF',
        fontSize: 48,
        fontWeight: '700',
    },
    rankLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        opacity: 0.9,
        marginTop: 4,
    },
});
