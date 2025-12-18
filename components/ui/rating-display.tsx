import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { ThemedText } from "../themed-text";

interface RatingDisplayProps {
  rating: number;
  reviewCount?: number;
  size?: "small" | "medium" | "large";
  showStars?: boolean;
}

export function RatingDisplay({
  rating,
  reviewCount,
  size = "medium",
  showStars = true,
}: RatingDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const getRatingColor = () => {
    if (rating >= 4.0) return colors.success;
    if (rating >= 3.0) return colors.warning;
    return colors.error;
  };

  const starSize = size === "small" ? 14 : size === "medium" ? 18 : 22;
  const textSize = size === "small" ? 13 : size === "medium" ? 15 : 18;

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <MaterialIcons
            key={i}
            name="star"
            size={starSize}
            color={getRatingColor()}
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <MaterialIcons
            key={i}
            name="star-half"
            size={starSize}
            color={getRatingColor()}
          />
        );
      } else {
        stars.push(
          <MaterialIcons
            key={i}
            name="star-border"
            size={starSize}
            color={colors.textDisabled}
          />
        );
      }
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      {showStars && <View style={styles.starsRow}>{renderStars()}</View>}
      <ThemedText
        style={[
          styles.ratingText,
          { fontSize: textSize, color: getRatingColor() },
        ]}
      >
        {rating.toFixed(1)}
      </ThemedText>
      {reviewCount !== undefined && (
        <ThemedText style={[styles.reviewCount, { fontSize: textSize - 2, color: colors.textSecondary }]}>
          ({reviewCount.toLocaleString()})
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsRow: {
    flexDirection: "row",
    marginRight: 4,
  },
  ratingText: {
    fontWeight: "600",
    marginRight: 2,
  },
  reviewCount: {
    marginLeft: 2,
  },
});
