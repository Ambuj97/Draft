import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polyline, Circle } from "react-native-svg";
import { radius } from "@/constants/theme";
import { useTheme } from "./ThemeContext";
import { Text } from "./Text";

type Pt = { latitude: number; longitude: number };

interface Props {
  /** Coordinate[][] from a session's pathJson (or a flat array). */
  segments: Pt[][] | Pt[];
  width?: number;
  height?: number;
}

/** A tiny auto-fit SVG sketch of a crawl route. */
export function RouteThumbnail({ segments, width = 96, height = 96 }: Props) {
  const { colors } = useTheme();

  const segs: Pt[][] = useMemo(() => {
    if (!Array.isArray(segments) || segments.length === 0) return [];
    return Array.isArray((segments as Pt[])[0]) ? (segments as Pt[][]) : [segments as Pt[]];
  }, [segments]);

  const lines = useMemo(() => {
    const all = segs.flat();
    if (all.length < 2) return null;

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const p of all) {
      minLat = Math.min(minLat, p.latitude);
      maxLat = Math.max(maxLat, p.latitude);
      minLng = Math.min(minLng, p.longitude);
      maxLng = Math.max(maxLng, p.longitude);
    }
    const pad = 6;
    const spanLat = maxLat - minLat || 1e-6;
    const spanLng = maxLng - minLng || 1e-6;
    // Keep aspect ratio — fit the larger span, centre the other.
    const scale = Math.min((width - pad * 2) / spanLng, (height - pad * 2) / spanLat);
    const offX = (width - spanLng * scale) / 2;
    const offY = (height - spanLat * scale) / 2;

    const project = (p: Pt) => {
      const x = offX + (p.longitude - minLng) * scale;
      // invert Y so north is up
      const y = offY + (maxLat - p.latitude) * scale;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };

    return segs
      .filter((s) => s.length > 1)
      .map((s) => s.map(project).join(" "));
  }, [segs, width, height]);

  return (
    <View
      style={[
        styles.box,
        { width, height, backgroundColor: colors.surfaceAlt, borderColor: colors.border },
      ]}
    >
      {lines ? (
        <Svg width={width} height={height}>
          {lines.map((pts, i) => (
            <Polyline
              key={i}
              points={pts}
              fill="none"
              stroke={colors.accent}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {(() => {
            const first = lines[0]?.split(" ")[0]?.split(",");
            return first ? (
              <Circle cx={Number(first[0])} cy={Number(first[1])} r={3} fill={colors.textPrimary} />
            ) : null;
          })()}
        </Svg>
      ) : (
        <Text variant="caption" color="muted">
          —
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
