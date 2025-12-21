import { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function BusinessCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Skeleton width="60%" height={20} />
        <Skeleton width={80} height={16} />
      </View>
      <View style={styles.cardCategory}>
        <Skeleton width={100} height={24} borderRadius={12} />
        <Skeleton width={60} height={16} style={{ marginLeft: 8 }} />
      </View>
      <Skeleton width="80%" height={14} />
    </View>
  );
}

export function BusinessDetailSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.detailContainer}>
      <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Skeleton width="70%" height={28} style={{ marginBottom: 12 }} />
        <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />
        <View style={styles.row}>
          <Skeleton width={18} height={18} borderRadius={9} />
          <Skeleton width="70%" height={14} style={{ marginLeft: 8 }} />
        </View>
        <View style={[styles.row, { marginTop: 8 }]}>
          <Skeleton width={18} height={18} borderRadius={9} />
          <Skeleton width="50%" height={14} style={{ marginLeft: 8 }} />
        </View>
      </View>
      <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Skeleton width={120} height={20} style={{ marginBottom: 12 }} />
        <View style={styles.categoryRow}>
          <Skeleton width={100} height={28} borderRadius={14} />
          <Skeleton width={80} height={28} borderRadius={14} />
          <Skeleton width={90} height={28} borderRadius={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardCategory: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailContainer: {
    padding: 16,
  },
  detailCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },
});
