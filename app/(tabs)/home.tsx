import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { desc } from "drizzle-orm";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Divider } from "@/components/ui/Divider";
import { Stat, StatRow } from "@/components/ui/Stat";
import { RouteThumbnail } from "@/components/ui/RouteThumbnail";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme } from "@/components/ui/ThemeContext";
import { useAuth } from "@/services/auth";
import { useCurrency } from "@/services/currency";
import { useDatabase } from "@/db/provider";
import { sessions, beers, Session, Beer } from "@/db/schema";
import { formatDistance, formatDuration } from "@/services/location";
import { space, fonts, radius } from "@/constants/theme";

const DAY = 86_400_000;
const WEEK = 7 * DAY;

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function durationSeconds(s: Session): number | null {
  if (!s.endedAt) return null;
  const ms =
    new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime() - (s.pausedMs ?? 0);
  return ms > 0 ? Math.floor(ms / 1000) : 0;
}
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 22) return "Evening";
  return "Late one";
}

const MILESTONES: { key: "crawls" | "km" | "beers" | "breweries"; noun: string; steps: number[] }[] = [
  { key: "crawls", noun: "crawls", steps: [1, 5, 10, 25, 50, 100] },
  { key: "km", noun: "km on foot", steps: [5, 10, 25, 50, 100, 250] },
  { key: "beers", noun: "beers logged", steps: [1, 10, 25, 50, 100, 250] },
  { key: "breweries", noun: "breweries", steps: [3, 10, 25, 50, 100] },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { symbol } = useCurrency();
  const { db, isReady } = useDatabase();

  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [allBeers, setAllBeers] = useState<Beer[]>([]);
  const [range, setRange] = useState<"week" | "month">("week");

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      Promise.all([
        db.select().from(sessions).orderBy(desc(sessions.startedAt)),
        db.select().from(beers).orderBy(desc(beers.createdAt)),
      ])
        .then(([s, b]) => {
          setAllSessions(s);
          setAllBeers(b);
        })
        .catch((err) => console.error("[home] load failed", err));
    }, [isReady])
  );

  const finished = useMemo(
    () => allSessions.filter((s) => s.endedAt),
    [allSessions]
  );
  const latest = finished[0] ?? null;

  const digest = useMemo(() => {
    const since = (range === "week" ? startOfWeek(new Date()) : startOfMonth(new Date())).getTime();
    const crawls = finished.filter((s) => new Date(s.startedAt).getTime() >= since);
    const bs = allBeers.filter(
      (b) => new Date(b.loggedAt ?? b.createdAt).getTime() >= since
    );
    return {
      crawls: crawls.length,
      distance: crawls.reduce((n, s) => n + (s.distance ?? 0), 0),
      beers: bs.length,
      breweries: new Set(bs.map((b) => b.brewery).filter(Boolean)).size,
      spend: bs.reduce((n, b) => n + (b.price ?? 0), 0),
    };
  }, [finished, allBeers, range]);

  const streak = useMemo(() => {
    const weeks = new Set(
      finished.map((s) => startOfWeek(new Date(s.startedAt)).getTime())
    );
    if (weeks.size === 0) return 0;
    let cursor = startOfWeek(new Date()).getTime();
    if (!weeks.has(cursor)) cursor -= WEEK; // this week doesn't have one yet — that's ok
    let n = 0;
    while (weeks.has(cursor)) {
      n++;
      cursor -= WEEK;
    }
    return n;
  }, [finished]);

  const { badges, nextUp } = useMemo(() => {
    const totals = {
      crawls: finished.length,
      km: finished.reduce((n, s) => n + (s.distance ?? 0), 0) / 1000,
      beers: allBeers.length,
      breweries: new Set(allBeers.map((b) => b.brewery).filter(Boolean)).size,
    };
    const badges: string[] = [];
    let nextUp: { label: string; value: number; target: number; ratio: number } | null = null;

    for (const m of MILESTONES) {
      const v = totals[m.key];
      const achieved = [...m.steps].reverse().find((s) => v >= s);
      const next = m.steps.find((s) => v < s);
      if (achieved) badges.push(`${achieved} ${m.noun}`);
      if (next) {
        const prev = achieved ?? 0;
        const ratio = (v - prev) / (next - prev);
        if (!nextUp || ratio > nextUp.ratio) {
          nextUp = { label: m.noun, value: v, target: next, ratio };
        }
      }
    }
    return { badges: badges.slice(-3), nextUp };
  }, [finished, allBeers]);

  const activity = useMemo(() => {
    type Item = {
      id: string;
      type: "crawl" | "beer";
      date: number;
      title: string;
      sub: string;
    };
    const items: Item[] = [];
    for (const s of finished) {
      const dur = durationSeconds(s);
      items.push({
        id: `s${s.id}`,
        type: "crawl",
        date: new Date(s.startedAt).getTime(),
        title: s.name,
        sub: `${formatDistance(s.distance ?? 0)}${dur != null ? ` · ${formatDuration(dur)}` : ""}`,
      });
    }
    for (const b of allBeers) {
      items.push({
        id: `b${b.id}`,
        type: "beer",
        date: new Date(b.loggedAt ?? b.createdAt).getTime(),
        title: b.name,
        sub: [b.brewery, b.abv != null ? `${b.abv}%` : null]
          .filter(Boolean)
          .join(" · "),
      });
    }
    return items.sort((a, b) => b.date - a.date).slice(0, 12);
  }, [finished, allBeers]);

  const nothingYet = allSessions.length === 0 && allBeers.length === 0;

  return (
    <Screen scroll>
      {/* Top bar: profile · notifications */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.profileChip}
          onPress={() => router.navigate("/(tabs)/profile")}
          hitSlop={6}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.accentSoft, borderColor: colors.border },
            ]}
          >
            <Text variant="bodyStrong" color="accent">
              {(user?.handle ?? "D").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text variant="bodyStrong" numberOfLines={1}>
            @{user?.handle ?? "you"}
          </Text>
        </Pressable>

        <IconButton
          icon="bell-o"
          variant="ghost"
          onPress={() => router.navigate("/notifications")}
          accessibilityLabel="Notifications"
        />
      </View>

      <Text variant="label" color="muted" style={{ marginTop: space.lg }}>
        {new Date().toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </Text>
      <Text variant="title" style={{ marginTop: 2 }}>
        {greeting()}
      </Text>

      {/* Quick actions */}
      <View style={styles.actions}>
        <Button
          title="Start a crawl"
          icon="play"
          onPress={() => router.navigate("/(tabs)")}
          fullWidth
          style={{ flex: 1 }}
        />
        <Button
          title="Log a beer"
          icon="camera"
          variant="secondary"
          onPress={() => router.navigate("/(tabs)/cellar")}
          fullWidth
          style={{ flex: 1 }}
        />
      </View>

      {nothingYet && (
        <Card style={{ marginTop: space.lg }}>
          <Text variant="heading">Your night starts here</Text>
          <Text variant="body" color="secondary" style={{ marginTop: space.sm }}>
            Track a crawl or log a beer and this page fills up — recent activity,
            streaks, milestones, the lot.
          </Text>
        </Card>
      )}

      {/* Latest crawl */}
      {latest && (
        <Card
          eyebrow="Latest crawl"
          onPress={() => router.navigate("/(tabs)")}
          style={{ marginTop: space.lg }}
        >
          <View style={styles.latestRow}>
            <RouteThumbnail
              segments={parsePath(latest.pathJson)}
              width={84}
              height={84}
            />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {latest.name}
              </Text>
              <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                {new Date(latest.startedAt).toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </Text>
              <View style={styles.latestTags}>
                <Tag label={formatDistance(latest.distance ?? 0)} />
                {latest.movingMs ? (
                  <Tag
                    label={formatDuration(Math.floor(latest.movingMs / 1000))}
                    tone="accent"
                  />
                ) : null}
              </View>
            </View>
          </View>
        </Card>
      )}

      {/* Digest */}
      <Card
        eyebrow={range === "week" ? "This week" : "This month"}
        right={
          <Pressable
            onPress={() => setRange((r) => (r === "week" ? "month" : "week"))}
            hitSlop={8}
          >
            <Text variant="label" color="accent">
              {range === "week" ? "MONTH →" : "WEEK →"}
            </Text>
          </Pressable>
        }
        style={{ marginTop: space.lg }}
      >
        <StatRow>
          <Stat value={digest.crawls} label="Crawls" align="center" />
          <Stat value={formatDistance(digest.distance)} label="On foot" align="center" />
          <Stat value={digest.beers} label="Beers" align="center" />
        </StatRow>
        <Divider spacing="md" />
        <StatRow>
          <Stat value={digest.breweries} label="Breweries" align="center" />
          <Stat
            value={`${symbol}${digest.spend.toFixed(0)}`}
            label="Spend"
            align="center"
          />
        </StatRow>
      </Card>

      {/* Streak + milestones */}
      <Card eyebrow="Progress" style={{ marginTop: space.lg }}>
        <View style={styles.streakRow}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 30, color: colors.accent }}>
            {streak}
          </Text>
          <Text variant="body" color="secondary" style={{ flex: 1 }}>
            {streak === 0
              ? "No streak yet — do a crawl this week to start one."
              : `week${streak === 1 ? "" : "s"} in a row with a crawl`}
          </Text>
        </View>

        {(badges.length > 0 || nextUp) && <Divider spacing="md" />}

        {badges.length > 0 && (
          <View style={styles.badges}>
            {badges.map((b) => (
              <Tag key={b} label={b} tone="accent" icon="trophy" />
            ))}
          </View>
        )}

        {nextUp && (
          <View style={{ marginTop: badges.length ? space.md : 0 }}>
            <Text variant="caption" color="muted">
              Next: {Math.floor(nextUp.value * 10) / 10} / {nextUp.target} {nextUp.label}
            </Text>
            <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: colors.accent,
                    width: `${Math.max(4, Math.min(100, nextUp.ratio * 100))}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </Card>

      {/* Recent activity */}
      {activity.length > 0 && (
        <>
          <Text variant="label" color="muted" style={styles.sectionLabel}>
            RECENT ACTIVITY
          </Text>
          <View style={{ gap: space.sm }}>
            {activity.map((it) => (
              <Card key={it.id} style={styles.activityRow}>
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: colors.accentSoft, borderColor: colors.border },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>
                    {it.type === "crawl" ? "🥾" : "🍺"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {it.title}
                  </Text>
                  {it.sub ? (
                    <Text variant="caption" color="muted" numberOfLines={1}>
                      {it.sub}
                    </Text>
                  ) : null}
                </View>
                <Text variant="caption" color="muted">
                  {relDate(it.date)}
                </Text>
              </Card>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function parsePath(json: string): { latitude: number; longitude: number }[][] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    // could be Coordinate[][] (new) or Coordinate[] (legacy)
    return Array.isArray(parsed[0]) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function relDate(ms: number): string {
  const days = Math.floor((Date.now() - ms) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d`;
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    flexShrink: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: "row",
    gap: space.md,
    marginTop: space.xl,
  },
  latestRow: {
    flexDirection: "row",
    gap: space.md,
    alignItems: "center",
  },
  latestTags: {
    flexDirection: "row",
    gap: 6,
    marginTop: space.sm,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: space.xs,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
  sectionLabel: {
    marginTop: space.xl,
    marginBottom: space.md,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
