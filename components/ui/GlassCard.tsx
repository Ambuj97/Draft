import React from "react";
import { ViewProps, StyleProp, ViewStyle } from "react-native";
import { Card } from "./Card";

interface GlassCardProps extends ViewProps {
  /** @deprecated blur is gone in the Taproom language; kept for call-site compat. */
  intensity?: number;
  /** Renders an amber left edge for emphasis. */
  glow?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * @deprecated Use <Card/>. This is a thin shim so screens pending migration
 * keep working during the redesign.
 */
export function GlassCard({ glow = false, intensity, children, style, ...props }: GlassCardProps) {
  void intensity;
  return (
    <Card accent={glow} style={style} {...props}>
      {children}
    </Card>
  );
}
