# Content consolidation for the Master Blueprint
content = """# 🍺 Project: Draft
**The "Strava for Beer Lovers"**

## 1. Product Vision
**Draft** is a high-performance mobile application for the craft beer community. It captures the physical journey of a night out ("The Stumble Path"), logs the specifics of every pour via AI vision, and facilitates a hyper-local, Reddit-style social layer for real-time intel on prices, vibes, and taps.

### Core Value Props
- **Movement Tracking:** Visualizing pub crawls with Strava-style maps.
- **Economic Transparency:** Community-driven price tracking for pints.
- **Low-Friction Logging:** AI-powered receipt and label scanning.
- **Social Discovery:** Geofenced threads for neighborhoods and specific bars.

---

## 2. The 2026 Tech Stack
| Component | Technology | Role |
| :--- | :--- | :--- |
| **Dev Environment** | Cursor + Antigravity (Agent) | Autonomous and pair-programming. |
| **AI Brain** | OpenAI GPT-4o (Vision/API) | Extracting beer data from photos. |
| **Design & UI** | Claude Design + Icon Composer | Liquid Glass aesthetics and UX iteration. |
| **Mobile Framework** | React Native + Expo | Cross-platform performance. |
| **Navigation** | Expo Router | Deep-linking into zones and threads. |
| **Local Database** | SQLite | Offline-first logging for low-signal bars. |
| **Payments** | RevenueCat | Pro-tier subscriptions and analytics. |
| **Analytics** | PostHog | Funnels, session recording, and crash reporting. |
| **Infrastructure** | Vercel (Web), Namecheap (DNS) | Landing page and domain management. |
| **Creative Assets** | Photoshop, Rotato, CapCut | 3D renders and marketing trailers. |

---

## 3. Community & Social Architecture
Draft uses a tiered discovery system to keep conversations relevant:

- **The Global Brewhouse:** Open forums for beer news, memes, and homebrewing tips.
- **Zone Boards:** Geofenced sub-reddits (e.g., #Soho, #BrooklynHeights). Automatically joins users based on location.
- **Session Threads:** Ephemeral threads tied to a specific "Live Crawl." Friends can comment on your path in real-time.
- **The Price Watch:** A community-led ledger tracking the "Price Per Pint" across the city.

---

## 4. Pre-Requisites Checklist
Before starting **Phase 1**, ensure these are ready:

- [ ] **Hardware/Local:** Node.js, Bun, Antigravity, Xcode/Android Studio.
- [ ] **Obsidian:** Vault created with this file as `[[Project_Draft]]`.
- [ ] **GitHub:** Private repository `draft-mobile` initialized.
- [ ] **API Keys:** OpenAI (Vision access), Mapbox (Public Token), RevenueCat, PostHog.
- [ ] **Accounts:** Apple Developer Program, Expo (EAS), Namecheap.

---

## 5. Antigravity Execution Plan (Agent Directives)

### Phase 1: Scaffolding & Navigation
**Prompt:** "Initialize a new Expo project using the `tabs` template with **Expo Router**. Set up **NativeWind** for styling. Configure **SQLite** for local storage. Define a schema for `Sessions` (map paths), `Beers` (logs/prices), and `Threads` (social). Layout: Map, Taproom, Cellar."

### Phase 2: The Stumble Path (GPS)
**Prompt:** "Build a 'Session Manager' using `expo-location`. Track GPS coordinates in the background and store them as JSON in SQLite. Render the live path on a **Mapbox** component on the Home screen. Handle 'Start/Stop' logic."

### Phase 3: The Beer Brain (AI Vision)
**Prompt:** "Integrate **OpenAI Vision API**. Create a service to scan photos of labels/receipts. Extract: Beer Name, Brewery, ABV, and Price. Build a 'Confirmation Sheet' UI to allow users to verify AI data before saving."

### Phase 4: The Taproom (Social)
**Prompt:** "Build the Reddit-style Taproom feed. Implement threaded comments, upvote/downvote logic, and geofencing filters (show threads within 5km). Build UI for 'Zone Boards' that auto-trigger based on user location."

### Phase 5: Monetization & Launch
**Prompt:** "Configure **RevenueCat** for a 'Pro' tier. Integrate **PostHog** for event tracking. Set up **Formspree** for a waitlist on the Vercel landing page. Prepare `app.json` for EAS Build."

---

## 6. Design & Brand Guidelines
- **Aesthetic:** "Liquid Glass" (Apple 2026 style). Translucency, depth, and frosted textures.
- **Palette:** Deep Amber, Slate Grey, and Crisp Foam White.
- **Icon:** Frosted amber glass texture with a minimalist path-line overlay.
- **Tone:** Technical, social, and slightly irreverent.

---

## 7. Licensing & Strategy
- **License:** **Apache 2.0** or **Private/Proprietary**. (Recommended: Keep repo Private until App Store approval).
- **GitHub Strategy:** Use a `dev` branch for Antigravity's work; manually merge to `main` after "Vibe-Checking" the build on a physical device via Expo Go.
"""