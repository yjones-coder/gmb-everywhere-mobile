// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for GMB Everywhere Mobile
 */
const MAPPING = {
  // Tab bar icons
  "house.fill": "home",
  "bookmark.fill": "bookmark",
  "gearshape.fill": "settings",
  // Navigation
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "arrow.left": "arrow-back",
  // Search
  "magnifyingglass": "search",
  // Business & Categories
  "building.2.fill": "business",
  "tag.fill": "label",
  "list.bullet": "list",
  "chart.bar.fill": "bar-chart",
  // Reviews
  "star.fill": "star",
  "star": "star-border",
  "text.bubble.fill": "chat",
  "person.fill": "person",
  // Actions
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "trash.fill": "delete",
  "square.and.arrow.up": "share",
  "doc.on.doc.fill": "content-copy",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  // Comparison
  "arrow.left.arrow.right": "compare-arrows",
  "rectangle.split.2x2.fill": "grid-view",
  // Info
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "clock.fill": "schedule",
  "location.fill": "location-on",
  "phone.fill": "phone",
  "globe": "language",
  // Misc
  "paperplane.fill": "send",
  "heart.fill": "favorite",
  "ellipsis": "more-horiz",
  "arrow.clockwise": "refresh",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

export type { IconSymbolName };
