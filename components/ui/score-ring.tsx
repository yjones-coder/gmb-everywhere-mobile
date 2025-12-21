import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { ThemedText } from "../themed-text";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  delay?: number;
}

export function ScoreRing({
  score,
  maxScore = 5,
  size = 100,
  strokeWidth = 10,
  label,
  delay = 0,
}: ScoreRingProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const progress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedScore = Math.min(score / maxScore, 1);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(normalizedScore, { duration: 1000 })
    );
  }, [normalizedScore, delay, progress]);

  const getScoreColor = () => {
    const percentage = score / maxScore;
    if (percentage >= 0.8) return colors.success;
    if (percentage >= 0.6) return colors.warning;
    return colors.error;
  };

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          stroke={colors.border}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <AnimatedCircle
          stroke={getScoreColor()}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.labelContainer, { width: size, height: size }]}>
        <ThemedText style={[styles.scoreText, { color: getScoreColor() }]}>
          {score.toFixed(1)}
        </ThemedText>
        {label && (
          <ThemedText style={[styles.labelText, { color: colors.textSecondary }]}>
            {label}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

interface MiniScoreProps {
  score: number;
  maxScore?: number;
  size?: number;
}

export function MiniScore({ score, maxScore = 5, size = 40 }: MiniScoreProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const getScoreColor = () => {
    const percentage = score / maxScore;
    if (percentage >= 0.8) return colors.success;
    if (percentage >= 0.6) return colors.warning;
    return colors.error;
  };

  return (
    <View
      style={[
        styles.miniContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getScoreColor() + "20",
          borderColor: getScoreColor(),
        },
      ]}
    >
      <ThemedText style={[styles.miniText, { color: getScoreColor(), fontSize: size * 0.35 }]}>
        {score.toFixed(1)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "700",
  },
  labelText: {
    fontSize: 12,
    marginTop: 2,
  },
  miniContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  miniText: {
    fontWeight: "700",
  },
});
