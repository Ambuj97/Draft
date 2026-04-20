# 🍺 Draft

**The "Strava for Beer Lovers"**

Draft is a high-performance mobile application for the craft beer community. It captures the physical journey of a night out ("The Stumble Path"), logs the specifics of every pour via AI vision, and facilitates a hyper-local, Reddit-style social layer for real-time intel on prices, vibes, and taps.

## Tech Stack

| Component | Technology |
|:---|:---|
| Mobile Framework | React Native + Expo (SDK 54) |
| Navigation | Expo Router (file-based, typed routes) |
| Styling | NativeWind v4 (Tailwind CSS for RN) |
| Local Database | SQLite (expo-sqlite) + Drizzle ORM |
| Design System | "Liquid Glass" — Deep Amber, Slate Grey, Foam White |

## Getting Started

```bash
# Install dependencies
npm install

# Start the Expo dev server
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone, or press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web (limited — SQLite not supported on web)

## Project Structure

```
Draft/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigation
│   │   ├── _layout.tsx     # Tab config (Map, Taproom, Cellar)
│   │   ├── index.tsx       # Map — The Stumble Path
│   │   ├── taproom.tsx     # Taproom — Social feed
│   │   └── cellar.tsx      # Cellar — Beer log
│   ├── _layout.tsx         # Root layout (DB provider, theme)
│   ├── modal.tsx           # About screen
│   └── +not-found.tsx      # 404
├── components/
│   └── ui/                 # Design system
│       ├── Button.tsx      # Amber gradient button
│       ├── EmptyState.tsx  # Empty state with CTA
│       ├── GlassCard.tsx   # Frosted glass card
│       ├── GradientBackground.tsx  # Mesh gradient BG
│       └── TabBar.tsx      # Custom Liquid Glass tab bar
├── constants/
│   └── Colors.ts           # Brand colour palette
├── db/
│   ├── schema.ts           # Drizzle ORM schema
│   ├── client.ts           # SQLite + Drizzle client
│   └── provider.tsx        # Database context provider
├── tailwind.config.js      # NativeWind theme tokens
├── metro.config.js         # Metro + NativeWind
├── babel.config.js         # Babel + NativeWind
└── app.json                # Expo app config
```

## Roadmap

- [x] **Phase 1:** Scaffolding & Navigation
- [ ] **Phase 2:** The Stumble Path (GPS tracking)
- [ ] **Phase 3:** The Beer Brain (AI Vision scanning)
- [ ] **Phase 4:** The Taproom (Social feed)
- [ ] **Phase 5:** Monetization & Launch

## License

Apache 2.0 — see [LICENSE](./LICENSE)