import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { StyleSheet } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { palette } from "@/constants/theme";

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface WebMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  kind: "venue" | "target" | "start";
  selected?: boolean;
}

export interface WebMapHandle {
  animateToRegion: (region: Region, duration?: number) => void;
}

interface Props {
  initialRegion: Region;
  /** One polyline per segment (a pause splits the crawl path). */
  segments?: { latitude: number; longitude: number }[][];
  markers?: WebMapMarker[];
  userLocation?: { latitude: number; longitude: number } | null;
  accent?: string;
  onReady?: () => void;
  /** Fired on map tap or the start of a pan — used to dismiss the keyboard. */
  onPress?: () => void;
  onMarkerPress?: (id: string) => void;
}

const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

/** Degrees of latitude span -> Leaflet zoom level. */
function zoomForDelta(delta: number): number {
  const z = Math.round(Math.log2(360 / (delta || 0.02)));
  return Math.max(3, Math.min(19, z));
}

function buildHtml(region: Region, accent: string): string {
  const zoom = zoomForDelta(region.latitudeDelta);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; background: ${palette.night}; }
  .leaflet-container { background: ${palette.night}; outline: none; }
  .leaflet-control-attribution {
    font-size: 9px; background: rgba(20,17,13,0.55); color: #8f8779;
  }
  .leaflet-control-attribution a { color: #b7ad9d; }
  .pin {
    width: 30px; height: 30px; border-radius: 15px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; line-height: 1;
    border: 1.5px solid ${accent}; background: ${palette.nightSurface};
    box-shadow: 0 2px 6px rgba(0,0,0,0.55);
  }
  .pin.sel { background: ${accent}; }
  .pin.start { border-color: ${accent}; }
  .pin.target { border: none; background: transparent; box-shadow: none; font-size: 30px; }
  .userdot {
    width: 16px; height: 16px; border-radius: 8px;
    background: #4aa3ff; border: 2px solid #fff;
    box-shadow: 0 0 0 6px rgba(74,163,255,0.22);
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var accent = ${JSON.stringify(accent)};
  var RN = window.ReactNativeWebView;
  function send(o) { if (RN) RN.postMessage(JSON.stringify(o)); }

  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([${region.latitude}, ${region.longitude}], ${zoom});

  L.tileLayer(${JSON.stringify(TILE_URL)}, {
    maxZoom: 20,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  map.on('click', function () { send({ type: 'press' }); });
  map.on('dragstart', function () { send({ type: 'press' }); });

  var pathLayer = L.layerGroup().addTo(map);
  var userDot = null;
  var markerLayer = L.layerGroup().addTo(map);

  window.__setSegments = function (segments) {
    pathLayer.clearLayers();
    (segments || []).forEach(function (coords) {
      if (coords && coords.length > 1) {
        L.polyline(coords, { color: accent, weight: 4, opacity: 0.9 }).addTo(pathLayer);
      }
    });
  };

  window.__setUser = function (c) {
    if (userDot) { map.removeLayer(userDot); userDot = null; }
    if (c) {
      userDot = L.marker([c.lat, c.lng], {
        icon: L.divIcon({ className: '', html: '<div class="userdot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
        interactive: false,
        keyboard: false
      }).addTo(map);
    }
  };

  window.__setMarkers = function (list) {
    markerLayer.clearLayers();
    (list || []).forEach(function (v) {
      var cls = v.kind === 'target' ? 'pin target'
        : v.kind === 'start' ? 'pin start'
        : 'pin venue' + (v.selected ? ' sel' : '');
      var glyph = v.kind === 'target' ? '📍' : v.kind === 'start' ? '🏁' : '🍺';
      var anchor = v.kind === 'target' ? [15, 30] : [15, 15];
      var icon = L.divIcon({ className: '', html: '<div class="' + cls + '">' + glyph + '</div>', iconSize: [30, 30], iconAnchor: anchor });
      var m = L.marker([v.lat, v.lng], { icon: icon }).addTo(markerLayer);
      m.on('click', function (e) {
        L.DomEvent.stopPropagation(e);
        send({ type: 'markerPress', id: v.id });
      });
    });
  };

  function zoomForDelta(d) {
    var z = Math.round(Math.log(360 / (d || 0.02)) / Math.LN2);
    return Math.max(3, Math.min(19, z));
  }
  window.__animate = function (r) {
    var latlng = [r.latitude, r.longitude];
    var z = zoomForDelta(r.latitudeDelta);
    if (!r.duration) {
      map.setView(latlng, z);
    } else {
      map.flyTo(latlng, z, { duration: r.duration / 1000 });
    }
  };

  // The WebView often reports its final size a beat after first paint;
  // recompute so tiles and centering aren't based on a 0-height container.
  map.whenReady(function () { map.invalidateSize(false); });
  setTimeout(function () { map.invalidateSize(false); }, 300);

  send({ type: 'ready' });
</script>
</body>
</html>`;
}

/**
 * A Leaflet map rendered in a WebView (CARTO dark tiles, OpenStreetMap data).
 * Runs in Expo Go — no native map module, no API key.
 */
export const WebMap = forwardRef<WebMapHandle, Props>(function WebMap(
  { initialRegion, segments, markers, userLocation, accent, onReady, onPress, onMarkerPress },
  ref
) {
  const webRef = useRef<WebView>(null);
  const ready = useRef(false);
  const queue = useRef<string[]>([]);

  const run = (js: string) => {
    const wrapped = js + ";true;";
    if (ready.current) webRef.current?.injectJavaScript(wrapped);
    else queue.current.push(wrapped);
  };

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 600) =>
      run(`window.__animate(${JSON.stringify({ ...region, duration })})`),
  }));

  useEffect(() => {
    const segs = (segments ?? []).map((seg) =>
      seg.map((p) => [p.latitude, p.longitude])
    );
    run(`window.__setSegments(${JSON.stringify(segs)})`);
  }, [segments]);

  useEffect(() => {
    const list = (markers ?? []).map((m) => ({
      id: m.id,
      lat: m.latitude,
      lng: m.longitude,
      kind: m.kind,
      selected: !!m.selected,
    }));
    run(`window.__setMarkers(${JSON.stringify(list)})`);
  }, [markers]);

  useEffect(() => {
    run(
      `window.__setUser(${
        userLocation
          ? JSON.stringify({ lat: userLocation.latitude, lng: userLocation.longitude })
          : "null"
      })`
    );
  }, [userLocation]);

  const html = useMemo(
    () => buildHtml(initialRegion, accent ?? palette.amberBright),
    // Region/accent are only the initial view; updates go through imperative calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: any;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === "ready") {
      ready.current = true;
      queue.current.forEach((js) => webRef.current?.injectJavaScript(js));
      queue.current = [];
      onReady?.();
    } else if (msg.type === "press") {
      onPress?.();
    } else if (msg.type === "markerPress") {
      onMarkerPress?.(msg.id);
    }
  };

  return (
    <WebView
      ref={webRef}
      source={{ html }}
      style={styles.web}
      originWhitelist={["*"]}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled
      // Leave the webview's own scroll enabled — the page can't scroll (100%
      // height, no overflow) and disabling it can swallow Leaflet's drag gesture
      // on iOS.
      scrollEnabled
      bounces={false}
      overScrollMode="never"
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      androidLayerType="hardware"
      setSupportMultipleWindows={false}
      startInLoadingState={false}
    />
  );
});

const styles = StyleSheet.create({
  web: {
    flex: 1,
    backgroundColor: palette.night,
  },
});
