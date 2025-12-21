import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { ThemedText } from "../themed-text";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  delay?: number;
  color?: string;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendValue,
  delay = 0,
  color,
}: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getTrendColor = () => {
    if (trend === "up") return colors.success;
    if (trend === "down") return colors.error;
    return colors.textSecondary;
  };

  const getTrendIcon = () => {
    if (trend === "up") return "trending-up";
    if (trend === "down") return "trending-down";
    return "trending-flat";
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: (color || colors.tint) + "15" }]}>
        <MaterialIcons name={icon as any} size={22} color={color || colors.tint} />
      </View>
      <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.value, { color: color || colors.text }]}>
        {value}
      </ThemedText>
      {trend && trendValue && (
        <View style={styles.trendContainer}>
          <MaterialIcons name={getTrendIcon()} size={14} color={getTrendColor()} />
          <ThemedText style={[styles.trendValue, { color: getTrendColor() }]}>
            {trendValue}
          </ThemedText>
        </View>
      )}
    </Animated.View>
  );
}

interface StatRowProps {
  stats: {
    icon: string;
    label: string;
    value: string | number;
    color?: string;
  }[];
}

export function StatRow({ stats }: StatRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.rowContainer}>
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          color={stat.color}
          delay={index * 100}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  trendValue: {
    fontSize: 11,
    marginLeft: 2,
    fontWeight: "500",
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
});
