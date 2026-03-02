# Admin Studio & APS Architecture

This consolidated document details the architecture, UI isolation, user activation flows, and the Autodesk Platform Services (APS) integration within the Standlo Admin Studio (`admin/` Next.js application).

---

## 1. UI Isolation (Admin vs Main App)

**Goal:** Separating the CSS and React Components of the `admin/` workspace from the main `src/` app to prevent Tailwind v4 "bleeding classes" and maintain independent layouts.

### Implementation Strategy
1. **Component Forking:** Core UI components (Button, Input, Card, ErrorGuard, FormList) and utilities (`utils.ts`) are physically copied from `src/components/` to `admin/app/components/`.
2. **Path Aliasing:** `admin/tsconfig.json` forces `@/components/*` to resolve to `./app/components/*` instead of `../src/components/*`.
3. **Tailwind Independence:** `admin/app/globals.css` is detached from `src/`, containing its own independent `@theme` configuration with only the necessary Kaktus/Standlo palette colors.

---

## 2. Admin Control Panel & User Activation

**Goal:** Secure the platform by ensuring non-customer users (designers, providers) require manual activation via the Admin panel.

### Implementation Strategy
1. **Backend Namespace:** Administrative data (stats, security alerts) is isolated into an `admin` namespace in Firestore (e.g., `admin/security/alerts`).
2. **Orchestrator Actions:**
   - `activate_user`: An admin-only action that updates Custom Claims (`active: true`) and Firestore documents for a pending user.
   - `get_admin_kpis`: Aggregates stats like Total Users and Pending Users.
3. **UI Integration:**
   - High-level KPIs displayed on the Admin homepage.
   - A Data Table interface at `/partner/admin/users` to list and activate pending users.
   - An Alert Visualizer reading from `admin/security/alerts`.

---

## 3. APS (Autodesk Platform Services) Manager

**Goal:** An interactive Control Panel within the Admin Studio to test and manage 2-Legged and 3-Legged OAuth connections with Autodesk Fusion Team Hubs.

### Implementation Strategy
1. **API Routes (Backend Proxy):**
   - `GET /api/aps/auth/2legged`: Generates Server-to-Server tokens.
   - `GET /api/aps/auth/url`: Generates 3-Legged Auth URL.
   - `POST /api/aps/auth/token`: Exchanges OAuth code for 3-Legged token.
   - `GET /api/aps/hubs`: Fetches accessible Fusion Hubs using the 3-Legged token.
2. **Frontend Dashboard (`admin/app/aps/page.tsx`):**
   - Sections to test 2-Legged auth, initiate 3-Legged auth flows (with callback handling in `aps/callback/page.tsx`), and a Hub Explorer to list accessible data.
   - Protected by `AdminAuthGuard.tsx` to ensure only `kalex@standlo.com` can access these tools.
