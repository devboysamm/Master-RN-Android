# Master RN, Android (React Native CLI) Build Handoff

This document is the master plan for building the **Android version of Master RN** as a **bare React Native CLI** app (not Expo). The iOS app already exists and is live on the App Store as an Expo app; that one stays as is. This new project targets **Android only** and is published on Google Play under the **The Handi Nation** developer account, as a free learning initiative.

**Two architecture decisions specific to this Android build:**

1. **Guest first, no forced login.** On launch the user goes straight into the app as a guest. Signing up is optional and only needed to unlock the AI tutor and saved progress. There is no login wall.
2. **Its own independent backend.** For compliance and ownership separation, this Android app does NOT use the iOS app's backend or domain. It runs on a brand new server and domain controlled under The Handi Nation, with its own database, its own copy of the course content, its own admin panel, and its own keys. The backend CODE is reused from the repo; only the deployment, domain, and data are separate.

Claude Code: read this whole file before starting. Several sections tell you to read the existing repo and extract exact details rather than guess. Follow those instructions literally.

---

## CRITICAL RULE, a clean break from the previous project (highest priority, no exceptions)

**Nothing from any previous project may appear anywhere in this Android app or its new backend.** This is a compliance requirement and outranks every other instruction in this document. When in doubt, leave the old value out and use a new one.

**Forbidden carry-overs (must NOT appear in code, config, env, emails, the store listing, or the app):**
- The old domain or any of its subdomains (`masterreactnative.dev`, `api.masterreactnative.dev`, `admin.masterreactnative.dev`).
- The old server IP (`168.144.82.96`).
- The old support email (`support@masterreactnative.dev`) or any email address tied to a previous project.
- The old API base URLs, the OTP email "from" address, and any links inside verification or OTP emails.
- The old Gemini API key, JWT or session secret, SMTP credentials, Sentry DSN, or any other key from a previous project. Every key is generated fresh.
- The old store-review demo account. A new one is created on the new backend.

**Everything is new and independent:** new domain, new server, new database, new admin instance, new email sender, new keys, new demo account.

**What IS intentionally shared (do not strip these):** the product identity only, the name "Master RN", the logo and atom icon, the brand color tokens, the course content, and the UI design. The clean break is about infrastructure and contact identifiers (domains, IPs, emails, URLs, keys, accounts), not the brand.

**Sneaky places an old value leaks in when redeploying the backend code, check each one:**
- The OTP / verification email template (the from-address and the links inside it).
- CORS allowed origins in the backend config.
- Any hardcoded base URL or domain string in `backend-api` or `admin-panel`.
- Deep-link or app-link configuration.
- The Android `applicationId` (see Section 5, do not reuse the old package).

**Verification step, run before publishing.** Search the entire new backend, admin, and app codebase and config for every old identifier and confirm zero matches:

```
grep -rni "masterreactnative.dev" .
grep -rni "168.144.82.96" .
grep -rni "support@masterreactnative.dev" .
```

None of these may return a result anywhere in the new project. Replace any hit with the new value before shipping. Do the same for any old key or secret before going live.

---

## 0. Golden rules (read first)

1. **Do not guess the API.** The exact endpoint paths, request bodies, response shapes, and auth scheme must come from the existing backend code, not from memory. Step 1 generates an `API_REFERENCE.md`. Build every network call against that file. The only differences from the iOS setup are the base URL (the new domain) and that content must be readable by guests.
2. **The existing Expo app is the visual and functional reference.** It lives in `mobile-app/` in the repo `github.com/devboysamm/Master-RN` (local: `~/Projects/Master-RN/`). For every screen, match its layout, copy, brand, navigation, and behavior. Read `mobile-app/src/`.
3. **Reuse the backend and admin CODE, deploy a separate instance.** The Android app talks to a NEW backend on a NEW domain (Section 1), not the iOS one. Never point it at `masterreactnative.dev`.
4. **Reuse the assets.** Icon, images, fonts, and brand tokens come from the existing repo. Do not invent new ones.
5. **No em-dashes or en-dashes** in any user-facing copy. Use commas, periods, or restructure.
6. **Content is not rewritten.** All 17 modules and 304 lessons are imported into the new database from the existing content files. You are rebuilding the app shell and screens, not the curriculum.
7. **Guest first.** No screen forces login. An account is required only for the AI tutor and saving progress/bookmarks. See Section 3.
8. **Clean break from the previous project.** No domain, IP, email, URL, key, or account from any previous project may appear in this app or its backend. See the CRITICAL RULE section above and run the verification grep before publishing.

---

## 0A. Working rules (how to work, follow strictly)

1. **Ask, don't assume.** If anything is unclear, ask before writing a line. No silent guesses about intent, architecture, or requirements.
2. **Simplest solution first.** Implement the minimum thing that works. No abstractions, helpers, or libraries that were not requested.
3. **Don't touch unrelated code.** If a file is not part of the current task, leave it alone.
4. **Flag uncertainty explicitly.** If you are not confident, say so before proceeding. Confidence without certainty causes more damage than admitting a gap.
5. **One screen at a time.** Never build multiple screens in a single task. Build one, stop, let me test it on the emulator, then continue. Building many screens at once is forbidden.
6. **Metro runs on port 8081 only.** Never start a second Metro instance, never change the port.
7. **Stop and show me after each task.** End every task by summarizing what changed and waiting for my review. Do not chain into the next screen or phase on your own.
8. **Match the Home screen's type scale and spacing.** All screens must match the Home screen's font sizes and spacing/gap conventions. Reuse the Home screen's type scale and spacing for equivalent elements. Do not invent new sizes or gaps.

Note: the phases in Section 9 are only the **order** of work. They do not override rule 5. Within any phase, build one screen, stop, and wait for review before the next.

---

## 1. The new independent backend stack (separate from iOS)

The Android app needs its own backend, separate from the iOS app. The backend code is the same as `backend-api/` in the repo, just deployed to a new server under a new domain, with its own database and its own content.

**Placeholders, replace once provisioned:**
- New domain: `masterreactnative.me`
- API base URL: `https://api.masterreactnative.me`
- Admin panel: `https://admin.masterreactnative.me`
- Privacy: `https://masterreactnative.me/privacy`, Terms: `https://masterreactnative.me/terms-condition`, Support: `https://masterreactnative.me/support`
- Support email: `support@masterreactnative.me`

**Stack:** Node + Express + MySQL on a DigitalOcean droplet, PM2, nginx, Let's Encrypt SSL. Same shape as the iOS backend.

**Guest access requirement (important).** Unlike the iOS backend, the new backend must allow **unauthenticated (guest) read access** to modules and lessons, so the app works with no account. Authentication is required only for the AI tutor, saving progress, and bookmarks. Confirm and adjust this when deploying the backend.

**Auth model:** email and password with OTP email verification. No social logins.

**Consequence to know.** Because this is a fully separate backend, Android accounts and progress are **independent** of the iOS app. An iOS user does not exist on Android and vice versa. If shared accounts across platforms are ever wanted, that means sharing one database instead of duplicating, which is a different setup, not this one.

---

## 1B. Provisioning checklist (do this first, then bring the values back)

Set these up, then report the values so this file and the app config can be filled in with real values instead of placeholders.

1. **Domain:** choose one domain for this app and point its DNS to the new droplet. Plan subdomains `api.`, `admin.`, and the root for the site and legal pages.
2. **DigitalOcean droplet:** Ubuntu, similar size to the current server. Note its IP.
3. **nginx + SSL:** serve `api.<domain>`, `admin.<domain>`, and `<domain>` with Let's Encrypt certificates.
4. **MySQL:** install it, create the database and a DB user, note the credentials.
5. **Deploy the backend:** clone `backend-api` to the droplet, set its env (below), run under PM2, put nginx in front.
6. **Backend env and keys to create:**
   - MySQL host, user, password, database name
   - A new JWT/session secret (random)
   - A **new Google Gemini API key** (from Google AI Studio)
   - **Email sending for OTP:** SMTP host/user/password, or an email API key (SendGrid, Resend, etc.)
   - Optional: a Sentry DSN
   - Anything else listed in the backend's `.env.example`
7. **Import the content:** run the import scripts so all 17 modules and 304 lessons load into the new database.
8. **Deploy the admin panel:** build `admin-panel` pointed at `https://api.<domain>`, serve it at `https://admin.<domain>`, and create the admin user on the new server.
9. **Legal and support pages:** host privacy, terms, and support on the new domain (the app cannot reuse masterreactnative.dev). A working privacy policy URL is required for Google Play.

**Bring back:** the domain, the API base URL, the admin URL, the privacy/terms/support URLs, a support email, and confirmation that the server is up, content imported, Gemini key set, and OTP email working. Then the placeholders here get replaced with real values.

---

## 2. Step 1, extract the exact API contract (do this in code first)

Generate a precise API reference from the existing backend code so nothing is guessed. Read `backend-api/src/routes`, `backend-api/src/controllers`, and the existing app's API layer in `mobile-app/src/api`. Produce `API_REFERENCE.md` documenting, for every endpoint the app uses:

- HTTP method and full path (with the new base URL)
- Whether auth is required and exactly how the token is sent (header name and format)
- Request body fields and types
- Response JSON shape for success and error

Also document the auth/session flow (signup, OTP verify, login, token storage, any refresh), how modules and lessons are fetched, how progress and bookmarks are saved, how the AI tutor endpoint is called, how device push tokens are registered, and how account deletion works. **Confirm which endpoints allow guest (unauthenticated) access**, content reads must, AI/progress/bookmarks must not. Do not include secrets.

**Every network call in the new app must match `API_REFERENCE.md` exactly.**

---

## 3. The app, screens and functionality

Rebuild each of these in React Native CLI to match the existing Expo app. Read the matching screen in `mobile-app/src/screens` for exact layout, copy, and behavior.

### Launch and guest mode (no login wall)
- **Splash:** brand splash, then straight into the app as a **guest**. No login screen blocks entry.
- **Guest can:** browse all modules and lessons and read full content.
- **Guest cannot:** use the AI tutor, save progress, or bookmark. Those show a friendly "sign up to unlock" prompt.
- **Sign up and sign in are reached from Profile** (or from a gated feature prompt), never forced at launch.

### Auth (optional, reached from Profile or a gated feature)
- **Sign up:** name, email, password. Triggers an OTP email.
- **OTP verification:** enter the emailed code.
- **Sign in:** email and password, with "Forgot password".
- **Forgot / reset password.**

### Main app
- **Home / dashboard ("Pick Up. Press Play."):** welcome header, a primary "Start / continue lesson" action, an Explore area with module filters (All, Beginner, Components, Hooks and State), module cards with progress, and Quick links (Cheat sheets, Help and feedback). For guests, progress shows zero and prompts sign up when relevant.
- **Learning Path / All Modules:** the 17 modules with lesson counts, durations, and progress. Header shows total lessons and total time.
- **Module detail:** module header with topic chips, and the ordered lessons with read time and completion state.
- **Lesson screen:** renders the lesson HTML (headings, paragraphs, worked code blocks, practice questions and answers). Tap a code block to copy, section progress, Next button, bookmark toggle (bookmark prompts sign up for guests). This is the core screen, get HTML and code blocks right.
- **AI tutor ("Native AI"):** a chat screen. Requires an account; guests see a sign-up prompt. The app calls the backend AI endpoint and renders the answer (including code) cleanly.
- **Cheat sheets:** quick reference sheets with copyable code snippets (available to guests).
- **Profile:** for a guest, shows Sign up / Sign in to unlock the AI tutor and saved progress. For a signed-in user, edit profile (update name) and a clearly separated **Delete account** action with confirmation.
- **About, Help and feedback, Report a problem:** Report a problem submits to the backend.
- **Bookmarks and progress:** the signed-in user's saved lessons and progress, persisted via the API.
- **Settings:** notification toggle and any existing options.

### Cross-cutting
- **Guest vs signed-in state:** one source of truth for whether a user is a guest. Gate AI, progress, and bookmarks on it, and route gated taps to sign up.
- **Session persistence:** store the auth token securely (`@react-native-async-storage/async-storage` or `react-native-keychain`) and restore the session on launch. A guest simply has no token.
- **Push notifications:** see Section 6 (Android uses FCM).
- **Brand theme:** apply the Section 4 tokens globally.
- **Empty, loading, and error states** for every network screen.

---

## 4. Brand and assets

- **Colors:** primary coral `#F26A4A`, deep coral `#D9532F`, soft coral `#FBD7C8`, cream `#F5EFE6`, card cream `#FBF6EE`, ink `#161311`, soft ink `#3B342F`, yellow `#F5C24B`, mint `#9EC9A8`, splash background `#0B0907`.
- **Fonts:** Manrope for UI, JetBrains Mono for code. Bundle the font files and link them in the RN CLI project.
- **App icon:** the React atom mark on a coral rounded square. Reuse the existing icon asset; generate Android mipmap densities and the adaptive icon from it.
- **Reuse** all images and brand tokens from `mobile-app/`. Read `mobile-app/src/theme` for the exact token file and port it.

---

## 5. React Native CLI project setup

1. Create a fresh React Native CLI project (latest stable RN), target **Android** only.
2. **Android applicationId:** do NOT reuse `dev.masterreactnative.app`, it is derived from the previous project's domain. Create a new applicationId from the NEW domain (reverse-DNS of `masterreactnative.me`): use `me.masterreactnative.app`. It is permanent on Play once published, so confirm it before the first upload.
3. **Suggested libraries** (confirm against the existing app, match versions where it matters):
   - Navigation: `@react-navigation/native` with native-stack and bottom-tabs.
   - HTTP: `axios` or `fetch`, wrapped in one API client that reads the base URL and attaches the auth header per `API_REFERENCE.md`.
   - Storage: `@react-native-async-storage/async-storage` (and/or `react-native-keychain`).
   - Lesson HTML: `react-native-render-html` (or the equivalent the Expo app uses) plus a code-block component with copy (`@react-native-clipboard/clipboard`).
   - Fonts/icons: `react-native-vector-icons` or the existing icon set.
   - Push: `@react-native-firebase/app` and `@react-native-firebase/messaging` (Section 6).
   - Optional crash reporting: `@sentry/react-native`.
4. **Project structure:** mirror the existing app (`src/screens`, `src/components`, `src/api`, `src/context`, `src/theme`, `src/navigation`).
5. **Config:** put the new API base URL (`https://api.masterreactnative.me`) in one config file. No secrets in the app, and no old-project values anywhere.

---

## 6. Android-specific deltas

1. **Push uses FCM, not APNs.**
   - Create a **new, separate** Firebase project for this app (do not reuse any previous project's Firebase), add an Android app with the new applicationId, and put `google-services.json` in `android/app/`.
   - The app gets an **FCM token** via `@react-native-firebase/messaging` and registers it through the device-token endpoint in `API_REFERENCE.md`.
   - **Backend note:** the new backend must send push via FCM for Android tokens. This needs a small addition on the new backend. It can be deferred, the app is fully functional without push. Treat push delivery as its own phase.
2. **Build output is an AAB,** not an APK: `cd android && ./gradlew bundleRelease`.
3. **App signing:** generate an upload keystore, configure it in `android/app/build.gradle` and `gradle.properties` (keep keystore and passwords out of git), enroll in **Play App Signing**. Losing the keystore blocks future updates, so save it safely.
4. **SDK levels:** `minSdkVersion` 24, `targetSdkVersion` at the level Google Play currently requires for new submissions (verify at submission time).
5. **Permissions:** only what is used (internet, notifications). No location, camera, contacts.

---

## 7. Build and test

1. Run on emulator and a physical device: `npx react-native run-android`.
2. Verify against the existing iOS app screen by screen.
3. Test: launch as guest, browse modules and read a lesson (HTML and code copy), cheat sheets, then sign up, OTP verify, sign in, AI tutor, progress, bookmarks, edit profile, delete account, forgot/reset password.
4. Confirm the app reads and writes the **new backend** (create a test account, see it in the **new** admin panel).
5. Build the release AAB and install it on a device before uploading.

---

## 8. Google Play Console publishing (under The Handi Nation)

1. **Create the app:** name "Master RN", default language English, category Education, free.
2. **Store listing:** short and full description (platform-neutral, clean), app icon 512 x 512, feature graphic 1024 x 500 (the banner from Claude Design), phone screenshots (reuse or re-render the Master RN marketing shots, no other-platform references or disallowed text).
3. **Data safety form:** declare what is collected (name, email, user ID, app interactions, crash data), no data sold, no tracking. Note that data is collected only after the user signs up, guests provide nothing. Privacy policy URL: `https://masterreactnative.me/privacy`.
4. **Content rating:** complete the IARC questionnaire (educational, no mature content).
5. **Target audience and content:** teens and up, consistent with the app's stated 14-plus audience.
6. **App access:** the app is guest-first, so reviewers can use most of it without logging in. Still provide a demo account so they can test the AI tutor and signed-in features. Create a **new** demo account on the new backend with a **new email** (not the iOS demo account), and keep it active. Do not store its password in this file or in git.
7. **Upload the signed AAB** (internal testing first, then production).
8. **Roll out** once the listing is complete and review passes.

---

## 9. Suggested build order

0. **Phase 0, provision the backend:** complete Section 1B, bring back the real domain and URLs, and replace the placeholders here.
1. **Phase 1, foundation:** generate `API_REFERENCE.md`, create the RN CLI project, port theme and assets, set up the API client and the guest/session state, and build splash to guest Home (no login wall).
2. **Phase 2, core app:** learning path, module detail, lesson screen (HTML and code copy). The heart of the app.
3. **Phase 3, auth and gated features:** the sign up / OTP / sign in / reset flow (reached from Profile), then the AI tutor, progress, and bookmarks gated behind it.
4. **Phase 4, the rest:** cheat sheets, profile and delete account, about, help, report a problem, settings.
5. **Phase 5, polish:** empty/loading/error states, brand pass against the iOS app.
6. **Phase 6, Android release prep:** signing, release AAB, Firebase/FCM (and backend FCM sending if push is in scope), on-device testing.
7. **Phase 7, Play submission:** listing, feature graphic, screenshots, data safety, content rating, demo account, upload, roll out.

Remember rule 5: one screen at a time within every phase.

---

## 10. What is reused vs what you provision

**Reused (from the repo, no rebuild):**
- Backend and admin panel CODE.
- The 17 modules / 304 lesson content files.
- The brand, icon, fonts, and assets.
- The app's screens and UI as a reference (the Expo app).

**You provision fresh (separate from iOS):**
- A new DigitalOcean droplet, domain, DNS, SSL.
- A new MySQL database, with the content imported into it.
- A deployed backend instance and a deployed admin panel on the new domain.
- New keys: Gemini API key, JWT secret, OTP email credentials.
- New legal and support pages on the new domain.
- A new demo account for store review.
- Zero identifiers from any previous project (see the CRITICAL RULE section, run the verification grep before publishing).

Your build job is the Android client: rebuild the app in React Native CLI, guest first, wired to the new backend per `API_REFERENCE.md`, matching the existing iOS app's UI/UX, and ship it on Google Play under The Handi Nation.
