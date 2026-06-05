# API_REFERENCE.md, Master RN (Android backend contract)

This file is the single source of truth for every network call the Android app makes. It was extracted directly from the existing backend code (`~/Projects/Master-RN/backend-api`, its `routes`, `controllers`, `models`, and `schema.sql`) and the existing app's API layer (`~/Projects/Master-RN/mobile-app/src/api` plus `src/context/AuthContext.tsx` and `src/storage/auth.ts`). Nothing here is guessed. Where the code and the handoff disagree, that is called out explicitly under "Gaps and decisions required".

The only intended differences from the iOS setup are:
1. the base URL (the new domain), and
2. content must stay readable by guests (it already is in this backend).

> Clean break: this document contains no secrets and no old-project identifiers. The base URL is shown as `https://api.masterreactnative.me`. Places where the existing code still hardcodes the old domain are listed in the last section as replace-before-deploy items, without reproducing the old values.

---

## 1. Base URL and environment

| Item | Value |
|---|---|
| Base URL (new) | `https://api.masterreactnative.me` |
| Content type | `application/json` for all request and response bodies (except multipart upload, admin-only) |
| Health check | `GET /health` |

In the iOS app the base URL comes from an Expo env var (`EXPO_PUBLIC_API_BASE_URL`) with a hardcoded fallback to the old domain (`src/api/client.ts`). The Android (React Native CLI) app must NOT carry that Expo var or that fallback. Put `https://api.masterreactnative.me` in one config constant and read it from the single API client, per the handoff Section 5.5.

---

## 2. Authentication scheme

- **Mechanism:** JSON Web Token (JWT), sent as a header: `Authorization: Bearer <token>`.
- **How the token is issued:** `POST /api/auth/verify-otp` (after signup) and `POST /api/auth/login` both return `{ token, user }`. The token is the raw JWT string.
- **Token payload:** `{ sub: <userId> }`. Lifetime is 30 days (`JWT_EXPIRES_IN = '30d'`). Signed server-side with `JWT_SECRET`.
- **Refresh:** there is no refresh token. The single 30-day JWT is the whole session. When it expires the user signs in again.
- **Validation middleware:** `requireAuth` reads the `Authorization` header, verifies the JWT, and attaches `req.user = { id }`. On a missing, malformed, invalid, or expired token it returns **401** with body `{ "error": "..." }`.
- **Admin token:** admin endpoints use a separate JWT carrying `role: 'admin'` (issued by `POST /api/admin/login`). The Android app never uses admin endpoints. Admin routes are listed in the appendix for completeness only.

### Guest model
A guest is simply a client with **no token**. There is no guest token and no anonymous session call. The app tracks "am I a guest" locally (see Section 7). Guests may call every public endpoint below. Gated features (AI tutor, and, once built, progress and bookmarks) must not be callable without a token.

---

## 3. Response envelope conventions (read this before coding the client)

This backend uses **two different response shapes**, split by area. The Android API client must handle both.

**A. Content and admin-style controllers** (modules, lessons, categories, app-content, legal, chat, notifications, problem-reports):
```jsonc
// success
{ "success": true, "data": <object | array> }
// chat is the one exception: { "success": true, "reply": "<string>" }
// error
{ "success": false, "message": "<human readable>" }
```

**B. Auth and account controllers** (signup, verify-otp, login, forgot-password, reset-password, GET/PATCH me):
```jsonc
// success: a BARE object, no "success" wrapper
{ "token": "...", "user": { ... } }   // or { "message": "..." } or { "user": { ... } }
// error
{ "error": "<human readable>" }        // note: "error", not "message"
```
Exception inside this group: `DELETE /api/account` returns the shape-A success form `{ "success": true, "message": "Account deleted" }`.

**Auth middleware 401s** (`requireAuth` / `requireAdmin`) always use `{ "error": "..." }`.
**Unmatched routes (404)** use `{ "success": false, "message": "Not found" }`.

### How the iOS client unwraps it (mirror this on Android)
From `src/api/client.ts`:
- A request is treated as failed if the HTTP status is not ok **or** the body has `success === false`.
- The error message is taken as `body.message || body.error || "Request failed (<status>)"`.
- On success it returns `body.data ?? body`. So shape-A callers get the inner `data`; shape-B callers get the whole object (since there is no `data` key).
- Default timeout is 30s (chat uses 45s). The token, when present, is attached as `Authorization: Bearer <token>`.

---

## 4. Guest access matrix (the critical table)

"Guest OK" means callable with no token. This is exactly what the handoff requires: content reads yes; AI/progress/bookmarks no.

| Endpoint | Method | Guest OK? | Notes |
|---|---|:--:|---|
| `/health` | GET | yes | liveness |
| `/api/modules` | GET | **yes** | content read |
| `/api/modules/:id` | GET | **yes** | content read |
| `/api/modules/:id/lessons` | GET | **yes** | content read |
| `/api/lessons/:id` (and `/api/lesson/:id`) | GET | **yes** | content read |
| `/api/categories` | GET | **yes** | content read |
| `/api/categories/:id` | GET | **yes** | content read |
| `/api/categories/:id/modules` | GET | **yes** | content read |
| `/api/app-content` | GET | **yes** | content read |
| `/api/legal/:key` | GET | **yes** | terms / privacy text |
| `/api/problem-reports` | POST | **yes** | report a problem, no account needed |
| `/api/auth/signup` `/verify-otp` `/login` `/forgot-password` `/reset-password` | POST | n/a | pre-auth, no token by nature |
| `/api/chat` (AI tutor) | POST | **currently yes, MUST become no** | see Gaps |
| `/api/auth/me` | GET | no | requires token |
| `/api/auth/me` | PATCH | no | requires token |
| `/api/account` | DELETE | no | requires token |
| `/api/notifications/register-token` | POST | no | requires token |
| `/api/notifications` | GET | no | requires token |
| progress save/read | any | **no (endpoint does not exist yet)** | see Gaps |
| bookmarks save/read | any | **no (endpoint does not exist yet)** | see Gaps |

---

## 5. Endpoint reference (app-facing)

For each: method, path, auth, request body, success response, error responses. All paths are relative to `https://api.masterreactnative.me`.

### 5.0 Health
**GET `/health`** — public.
- Success 200: `{ "success": true, "message": "API is running" }`

---

### 5.1 Auth and session

#### POST `/api/auth/signup` — public (no token)
Creates (or refreshes an unverified) account and emails a 6-digit OTP. Does NOT log the user in.
- Body: `{ "email": string, "name": string|null, "password": string }`
  - `email` must be valid, max 255 chars. `password` min 8 chars. `name` optional, trimmed.
- Success 200: `{ "message": "OTP sent" }`
- Errors: 400 `{ "error": "A valid email is required" }` / `{ "error": "Password must be at least 8 characters" }`; 409 `{ "error": "An account with that email already exists" }` (only when the existing account is already verified); 500 `{ "error": "Internal server error" }`.

#### POST `/api/auth/verify-otp` — public (no token)
Verifies the signup OTP, marks the email verified, and returns a session.
- Body: `{ "email": string, "code": string }` (`code` is exactly 6 digits)
- Success 200: `{ "token": string, "user": <PublicUser> }`
- Errors: 400 `{ "error": "A 6-digit code is required" }` / `"No verification code found, please sign up again"` / `"Code expired, request a new one"` / `"Incorrect code"`; 404 `{ "error": "Account not found" }`; 500.

#### POST `/api/auth/login` — public (no token)
- Body: `{ "email": string, "password": string }`
- Success 200: `{ "token": string, "user": <PublicUser> }`
- Errors: 400 (missing email/password); 401 `{ "error": "Invalid email or password" }`; 403 `{ "error": "Please verify your email before signing in" }` (email not yet verified); 500.

#### POST `/api/auth/forgot-password` — public (no token)
Always returns the same generic message so it never leaks which emails exist. Sends a reset OTP only if the account exists.
- Body: `{ "email": string }`
- Success 200: `{ "message": "If that email exists, a code was sent" }`
- Errors: 500 only.

#### POST `/api/auth/reset-password` — public (no token)
- Body: `{ "email": string, "code": string, "newPassword": string }` (`code` 6 digits, `newPassword` min 8 chars)
- Success 200: `{ "message": "Password updated" }`
- Errors: 400 (invalid email/code/password, no reset code, expired, incorrect); 404 `{ "error": "Account not found" }`; 500.

#### GET `/api/auth/me` — requires token
- Headers: `Authorization: Bearer <token>`
- Success 200: `{ "user": <PublicUser> }`
- Errors: 401 `{ "error": "..." }`; 404 `{ "error": "Account not found" }`; 500.

#### PATCH `/api/auth/me` — requires token
Updates the signed-in user's own profile. Only the provided fields change.
- Body (any subset, at least one): `{ "name"?: string, "bio"?: string }`
  - `name` 1 to 120 chars. `bio` max 300 chars (empty string clears it to null).
- Success 200: `{ "user": <PublicUser> }`
- Errors: 400 `{ "error": "Name must be between 1 and 120 characters" }` / `"Bio must be 300 characters or fewer" }` / `"Nothing to update" }`; 401; 404; 500.

---

### 5.2 Account deletion

#### DELETE `/api/account` — requires token
Permanently deletes the signed-in user and all their personal data in one transaction (their `users` row, their `device_tokens`, their `otp_codes`; their problem-report rows are kept but the email is scrubbed to `deleted-user`). Idempotent.
- Headers: `Authorization: Bearer <token>`
- Success 200: `{ "success": true, "message": "Account deleted" }`  (note: shape-A, unlike the other auth endpoints)
- Errors: 401 `{ "error": "..." }`; 500 `{ "error": "Internal server error" }`.

---

### 5.3 Modules (content, guest reads)

Reads are public. Writes are admin-only (appendix).

#### GET `/api/modules` — public
- Success 200: `{ "success": true, "data": <Module[]> }` (ordered by `order_index`, then `id`)

#### GET `/api/modules/:id` — public
- Success 200: `{ "success": true, "data": <Module> }`
- Errors: 400 `{ "success": false, "message": "Invalid module id" }`; 404 `{ "success": false, "message": "Not found" }`.

#### GET `/api/modules/:id/lessons` — public
Lessons for one module, ordered by `lesson_order`, then `id`.
- Success 200: `{ "success": true, "data": <Lesson[]> }`
- Errors: 400 (invalid id); 404 (module not found).

---

### 5.4 Lessons (content, guest reads)

#### GET `/api/lessons/:id` — public  (alias: GET `/api/lesson/:id`)
Returns one full lesson including its HTML body (`content`).
- Success 200: `{ "success": true, "data": <Lesson> }`
- Errors: 400 (invalid id); 404 (not found).

There is no "list all lessons" endpoint; lessons are fetched per module (5.3) or by id.

---

### 5.5 Categories (content, guest reads)

Categories are the Home-screen filters (All, Beginner, etc.).

#### GET `/api/categories` — public
- Success 200: `{ "success": true, "data": <Category[]> }` — each item includes a computed `module_count`.

#### GET `/api/categories/:id` — public
- Success 200: `{ "success": true, "data": { ...<Category>, "module_ids": number[] } }`
- Errors: 400 (invalid id); 404 (not found).

#### GET `/api/categories/:id/modules` — public
Modules in a category, ordered by `order_index`, then `id`.
- Success 200: `{ "success": true, "data": <Module[]> }`
- Errors: 400 (invalid id); 404 (category not found).

---

### 5.6 App content (content, guest read)

Single editable content row that drives welcome copy, motivation text, the featured module, premium teaser copy, legal URLs, and support/contact fields.

#### GET `/api/app-content` — public
- Success 200: `{ "success": true, "data": <AppContent> }`
- Errors: 404 `{ "success": false, "message": "Not found" }` (only if no row has been seeded); 500.

---

### 5.7 Legal (content, guest read)

#### GET `/api/legal/:key` — public
`:key` must be `terms` or `privacy`. Always returns a body, even an empty shell, so the screen has something to render.
- Success 200: `{ "success": true, "data": { "key": string, "body": string, "updated_at": string|null } }`
- Errors: 400 `{ "success": false, "message": "Invalid legal key" }`.

Note: the iOS app's API layer does not call this; the iOS app links to the website's legal pages instead. The endpoint exists and is available if the Android app prefers to render legal text in-app.

---

### 5.8 AI tutor (Native AI chat)

Proxies the conversation to Google Gemini server-side so the key never reaches the app. Model: `gemini-flash-latest`. The app sends the running transcript and gets one reply back.

#### POST `/api/chat`
- **Auth in the existing code: NONE (public).** Per the handoff this MUST require a token on the new backend (guests are not allowed to use the AI tutor). See Gaps.
- Body: `{ "messages": [ { "role": "user" | "assistant", "content": string }, ... ] }` (non-empty)
- Success 200: `{ "success": true, "reply": string }`
- Errors: 400 `{ "success": false, "message": "A non-empty messages array is required" }` / `"No valid messages provided"`; 500 `{ "success": false, "message": "AI is not configured on the server." }` (when `GEMINI_API_KEY` is unset) or a passed-through Gemini error / `"The AI did not return a response. Please try again."`.
- Client note: the iOS app uses a 45s timeout for this call.

---

### 5.9 Device push token and notifications

> Platform note: the existing backend speaks **Expo Push** (`exp.host`). The Android app is React Native CLI with **FCM**. The token-registration endpoint below stores whatever token string you send (it is platform-agnostic at the DB level), so the app can register its FCM token through it. But the backend's *send* path is Expo-only and will not deliver to raw FCM tokens. Delivery for Android requires new backend work (handoff Section 6, deferred). See Gaps.

#### POST `/api/notifications/register-token` — requires token
Upserts the signed-in user's device token (token is unique, so re-registering updates the row).
- Headers: `Authorization: Bearer <token>`
- Body: `{ "token": string, "platform": string|null }` (`token` max 255 chars; `platform` max 20 chars, e.g. `"android"`)
- Success 200: `{ "success": true }`
- Errors: 400 `{ "success": false, "message": "A push token is required" }`; 401; 500.

#### GET `/api/notifications` — requires token
Recent broadcast notifications for the in-app bell list, newest first, max 50.
- Headers: `Authorization: Bearer <token>`
- Success 200: `{ "success": true, "data": <Notification[]> }`
- Errors: 401; 500.

The "mark as seen" state for the bell badge is **local only** in the iOS app (AsyncStorage), not a server call.

---

### 5.10 Problem reports (report a problem, guest OK)

#### POST `/api/problem-reports` — public (no token)
- Body: `{ "message": string (required), "category"?: string, "app_version"?: string, "platform"?: string, "user_email"?: string }`
  - `message` max 5000 chars; `category`/`app_version`/`platform` max 40; `user_email` max 190.
- Success 201: `{ "success": true, "data": <ProblemReport> }`
- Errors: 400 `{ "success": false, "message": "A problem description is required" }`; 500.

---

## 6. Data shapes (exact fields returned)

These are the literal columns the models select. Types are MySQL-origin (numbers are JSON numbers; `*_at` are datetime strings; `content`/`description` may be null).

**PublicUser** (what auth endpoints return; password is never included):
```jsonc
{ "id": number, "email": string, "name": string|null, "bio": string|null }
```

**Module:**
```jsonc
{
  "id": number,
  "title": string,
  "description": string|null,
  "prerequisites": string|null,
  "icon": string,                 // e.g. "book"
  "image_url": string|null,       // http(s) URL or data: URI
  "background_color": string,     // 6-digit hex, e.g. "#61DAFB"
  "order_index": number,
  "created_at": string,
  "updated_at": string
}
```

**Lesson:**
```jsonc
{
  "id": number,
  "module_id": number,
  "title": string,
  "description": string|null,
  "content": string|null,         // lesson HTML (headings, paragraphs, <pre><code> blocks); the core render target
  "read_time": number,            // minutes
  "lesson_order": number,
  "created_at": string,
  "updated_at": string
}
```

**Category:**
```jsonc
{
  "id": number,
  "name": string,
  "icon": string,
  "color": string,                // 6-digit hex
  "order_index": number,
  "created_at": string,
  "updated_at": string,
  "module_count": number          // present on the list endpoint
  // GET /api/categories/:id adds: "module_ids": number[]
}
```

**AppContent:**
```jsonc
{
  "id": number,
  "welcome_title": string,
  "welcome_description": string,
  "motivation_text": string,
  "motivation_quote": string,
  "welcome_subtitle": string|null,
  "welcome_footer": string|null,
  "app_description": string|null,
  "terms_url": string|null,
  "privacy_url": string|null,
  "featured_module_id": number|null,
  "premium_title": string|null,
  "premium_description": string|null,
  "support_email": string|null,
  "contact_url": string|null,
  "help_content": string|null,
  "updated_at": string
}
```

**Notification:**
```jsonc
{ "id": number, "title": string, "body": string|null, "created_at": string }
```

**ProblemReport** (returned from create):
```jsonc
{
  "id": number, "message": string, "category": string|null,
  "app_version": string|null, "platform": string|null,
  "user_email": string|null, "status": "new"|"seen"|"resolved", "created_at": string
}
```

---

## 7. Auth / session flow and token storage (how the iOS app does it)

This is the behavior the Android app should reproduce (storage library is the app's choice; the handoff allows AsyncStorage or Keychain).

**Storage keys (AsyncStorage in iOS):**
- `mrn_auth` holds the whole session as JSON: `{ token, user }`.
- `mrn.guest` holds `"1"` when the user has chosen to continue as a guest (absent otherwise).

**Sign-up flow:**
1. `POST /api/auth/signup` with `{ email, name, password }`. This only sends the OTP; it does not authenticate.
2. App shows the OTP screen. `POST /api/auth/verify-otp` with `{ email, code }`. On success it returns `{ token, user }`.
3. App persists `{ token, user }` under `mrn_auth`, clears the guest flag, and is now authenticated.

**Sign-in flow:**
1. `POST /api/auth/login` with `{ email, password }` returns `{ token, user }` (or 403 if the email is unverified).
2. Persist the session as above.

**Password reset:** `POST /api/auth/forgot-password` (always generic response), then `POST /api/auth/reset-password` with `{ email, code, newPassword }`.

**Session restore on launch:**
1. Read `mrn_auth`. If a token exists, optimistically set the UI to authenticated using the stored user (no auth-flow flash).
2. Validate by calling `GET /api/auth/me`. On success, refresh and re-persist the user.
3. Only a real **401** clears the session and logs the user out. A network failure (offline) keeps the session so the user is not bounced out.

**OTP rules (server):** 6-digit numeric code, 10-minute TTL, single-use (`consumed`), separate `purpose` of `signup` vs `reset`. A still-valid code is reused rather than minting a new one on repeat requests.

**Profile edit / delete:** `PATCH /api/auth/me` to update name/bio; `DELETE /api/account` to delete. Both require the token. The app deletes server-side first, then clears the local session.

---

## 8. Gaps and decisions required (where code and handoff diverge)

These are the items to resolve when standing up the new backend. The app cannot fully meet the handoff without them.

1. **AI tutor is not gated.** `POST /api/chat` has no `requireAuth` in the current backend, so a guest could call it. The handoff requires the AI tutor to be account-only. **Action:** add `requireAuth` to the chat route on the new backend, and have the app gate the Chat screen behind sign-in. Until then the app must still enforce the gate client-side.

2. **No progress persistence exists.** There is no progress route, controller, table, or app API call anywhere. In the iOS app, lesson completion is stored locally (`src/storage/completed.ts`, AsyncStorage) and last-opened lesson in `src/storage/lastLesson.ts`. The handoff wants progress saved via the API and gated behind auth. **Action (decision needed):** either (a) build new authenticated endpoints plus tables (e.g. `GET/PUT /api/progress`) on the new backend, or (b) keep progress device-local for v1 and treat "saved progress" as a sign-in benefit to add later. This is net-new backend code, not a redeploy.

3. **No bookmarks persistence exists.** Same situation. iOS stores bookmarks locally (`src/storage/bookmarks.ts`, AsyncStorage). The handoff wants them API-persisted and auth-gated. **Action (decision needed):** build new authenticated endpoints plus a table (e.g. `GET/POST/DELETE /api/bookmarks`), or keep local for v1.

4. **Push is Expo, app is FCM.** Token registration (`POST /api/notifications/register-token`) is reusable as-is (it just stores a token string and platform). But the broadcast path (`POST /api/notifications/send`, admin-only) delivers via Expo's push service, which does not accept raw FCM tokens. **Action:** add FCM sending on the new backend before Android push works. The handoff already scopes this as its own deferred phase; the app is fully functional without it.

5. **Two response shapes.** Not a bug, but the Android API client must handle both the `{ success, data }` content shape and the bare `{ token, user }` / `{ error }` auth shape (Section 3). Build the one client wrapper to unwrap `data ?? body` and read `message || error`, exactly as iOS does.

---

## 9. Clean-break: replace-before-deploy items in the reused backend code

Per the CRITICAL RULE, these spots in `~/Projects/Master-RN/backend-api` still carry the old project's domain and must be changed when the code is deployed to the new server. (Listed by location only; the old values are not reproduced here.)

- **CORS allow-list**, `src/app.js`: the `ALLOWED_ORIGINS` array hardcodes the old admin and root domains. Replace with `https://admin.masterreactnative.me` and `https://masterreactnative.me` (localhost entries can stay for local dev).
- **OTP email From address**, `src/utils/email.js`: the `FROM` constant uses a no-reply sender on the old domain. Replace with a no-reply sender on the new domain (and verify it in the email provider). The email subject and brand text say "Master RN", which is intentionally shared and can stay.
- **Mobile client fallback base URL**, iOS `src/api/client.ts`: falls back to the old API domain. The Android app must point only at `https://api.masterreactnative.me` with no old fallback.
- **Fresh keys/secrets**: `JWT_SECRET`, `GEMINI_API_KEY`, and the email provider key (`RESEND_API_KEY` in the current code) are all generated new for this project and live only in the new server's environment, never in the app or in git.

Run the handoff's verification grep against the new backend, admin, and app before publishing to confirm zero old-domain, old-IP, and old-email matches.

---

_Generated by reading the existing backend and mobile API code directly. Every endpoint, body, and response shape above is transcribed from source, not inferred._
