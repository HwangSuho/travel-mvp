# AGENTS

You are Codex, a coding assistant working on the **Trip-Mate (트립메이트)** project.

The goal of this file is to explain:
- What this project is
- What the current scope is (web-only MVP)
- How you should modify code
- How you should talk to the human developer

---

## 1. Project Overview

**Name (working title)**  
- Trip-Mate (트립메이트) – a global travel planner.

**High-level goal**  
Build an **all-in-one intelligent travel planning and management platform** that:
- Integrates scattered travel information (maps, accommodations, restaurants, budget, reservations)
- Reduces the time and friction of planning trips
- Gradually evolves from a manual planner → smart planner → integrated hub → auto-pilot travel assistant

**Current focus**  
- ✅ **Web only (MVP)**  
- ⏸ Mobile apps (React Native / Flutter) are *out of scope for now*.

---

## 2. Target Users

Keep these personas in mind when designing features and UX:

1. **Beginner travelers**
   - Struggle with planning
   - Need recommended itineraries and basic budget management

2. **Intermediate travelers**
   - Currently juggle multiple apps (maps, booking, expense tracking)
   - Want one integrated place to manage everything

3. **Backpackers / long-term travelers**
   - Need efficient routes
   - Need detailed budget tracking and flexible re-planning

**UX rule of thumb**  
> Prefer clarity and simplicity over “smart but confusing” features.

---

## 3. Current MVP Scope (Phase 1)

We follow the roadmap, but **you are currently working on Phase 1: MVP (web)**.

### Phase 1 – MVP (what Codex should prioritize now)

Core goals:
- Users can log in
- Users can manually create and save itineraries
- Users can explore places on a map
- Data is persisted reliably (no fake/mock storage in production code)

Features to implement/refine now:

1. **Social login (F-9, minimal)**
   - Start with 1–2 providers (e.g., Google, Kakao) for easy onboarding
   - Basic sign-up / sign-in
   - Persistent session

2. **Manual itinerary creation (F-8, simplified)**
   - Date-based itinerary editor (days, time blocks, places, memos)
   - Drag & drop reordering if feasible
   - Store itineraries per user

3. **Google Maps integration (F-1 base)**
   - Show map for selected city/destination
   - Show markers for chosen places

4. **Google Places integration (F-3 base)**
   - Search places (restaurants, cafés, attractions)
   - Show basic info: name, rating, address, opening hours link, etc.
   - Option to add a place into the itinerary

5. **Persistence**
   - Save itinerary and place selections for logged-in users
   - Simple sharing (e.g., shareable link) is a bonus but not mandatory in Phase 1

**Out of scope for Phase 1 (don’t start unless explicitly asked):**
- Automatic route optimization (advanced Directions usage)
- Automatic budget estimation
- Reservation email parsing
- Real-time weather or emergency features
- Long-term AI personalization

---

## 4. Preferred Tech Stack (Web MVP)

When you generate or modify code, assume:

- **Frontend framework**
  - React / Next.js (SPA/SSR hybrid)
- **Language**
  - TypeScript preferred if the repo already uses it, otherwise JavaScript
- **Styling**
  - Tailwind CSS or CSS-in-JS depending on what the repo already uses
- **Backend / APIs**
  - Next.js API routes or a simple Node/Express backend in the same repo
- **Persistence**
  - Firebase (Auth + Firestore) or similar BaaS if already configured
- **Map / travel APIs**
  - Google Maps Platform:
    - Maps SDK – map rendering
    - Places API – search & place details
    - Directions API (later phases) – route optimization

**Important:**  
> Respect whatever stack and folder structure is already present in the repository.  
> Do not introduce a completely new framework unless explicitly requested.

---

## 5. How You Should Work

### 5.1 General behavior

- Always **explain what you are about to do before you do it.**
- Propose a plan (steps) before applying big changes.
- Default to **small, incremental changes** instead of huge refactors.
- When you modify code, keep diffs **coherent and reviewable**.

### 5.2 Approvals and safety

- Treat this project as a **real project**, not a throwaway demo.
- **Ask for approval** before:
  - Deleting files
  - Large-scale refactors (e.g., renaming many components)
  - Changing configuration like environment variables, API keys, Firebase / Google Cloud settings
- You may make small, local code changes without asking for approval if the session settings allow it, but:
  - Always show the changes (diff) and
  - Explain your reasoning.

### 5.3 Coding style guidelines

- Prefer **clear and maintainable** code over clever hacks.
- Use **meaningful names** (English) for variables, functions, and components.
- Keep UI text and labels in **Korean** when they are user-facing.
- For React/Next.js:
  - Use functional components
  - Use hooks (`useState`, `useEffect`, `useMemo`, etc.)
  - Avoid class components unless the project is already built that way
- For asynchronous work:
  - Use `async/await`
  - Handle errors gracefully (try/catch, user-friendly error messages)

### 5.4 Communication style

- The primary developer is Korean.
- When you respond in the Codex UI:
  - **Explain things in Korean**, unless explicitly asked for English.
  - You may use English identifiers in code, but comments can be in Korean for clarity.
- Always include:
  - A short summary of what you did
  - How to run / test the change
  - Any follow-up work or TODOs

---

## 6. Feature Breakdown by Function Group

Use these groupings when the user asks for help by “F-number”.

### F-1: Intelligent itinerary & route planning (Google Maps)

- Phase 1 (now):
  - Manual itinerary creation with map view
- Later phases:
  - Automatic route optimization (Directions API)
  - Time and cost estimation between points

### F-2: Accommodation recommendation & price comparison

- Short-term:
  - Link out to Agoda / Google Hotels with affiliate links
- Later:
  - Integrate real booking APIs and price comparison logic

### F-3: Route-based restaurant & attraction recommendations

- Phase 1:
  - Place search + basic card UI with name, rating, address
  - Add place into an itinerary day
- Later:
  - Contextual recommendations along a route
  - Advanced filtering (price, type, opening hours, etc.)

### F-4: Budget management

- Later:
  - Start with manual expense tracking (simple travel expense log)
  - Then automatic budget estimation and visualization

### F-5: Reservation auto-import

- Later phases only:
  - Gmail API + email parsing
  - High complexity and sensitive data → do not start unless explicitly requested

### F-6: Travel convenience & safety

- Later:
  - Cultural tips, emergency contact info, simple static content
  - Potential integration with translation APIs and offline guides

### F-7: Personalization & real-time re-planning

- Later:
  - Analyze past likes/saves to infer “travel style”
  - Support re-planning when conditions change (e.g., weather, delays)

### F-8: UX/UI & integrations

- Phase 1:
  - Drag & drop itinerary editor if feasible
  - Clean, intuitive layout with clear separation of:
    - Map
    - Itinerary list
    - Place search results
- Later:
  - Google Calendar integration

### F-9: Authentication and social login

- Phase 1:
  - Social login with 1–2 providers (e.g., Google, Kakao)
  - Simple profile storage
- Later:
  - More providers (Naver, Apple)
  - Account linking and security hardening

---

## 7. What You Should NOT Do (unless explicitly asked)

- Do **not**:
  - Hardcode API keys or secrets into the repo
  - Commit credentials or private keys
  - Introduce heavy or obscure dependencies without explaining why
  - Change deployment configuration (CI/CD, DNS, cloud infra) unless it’s part of a clearly stated task
- Be careful with:
  - Google Maps Platform usage (API quotas and billing)
  - Sensitive user data (reservation details, email access in later phases)

---

## 8. How to Prioritize Work

When the user gives you a vague request (e.g., “기능 좀 만들어줘”), follow this order:

1. **Confirm which phase / feature group** it belongs to (Phase 1 vs later).
2. If it’s Phase 1:
   - Focus on:
     - Social login
     - Manual itinerary editor
     - Map + place search
     - Reliable persistence
3. If it’s a later-phase request:
   - Propose a **simplified version** that fits into the current MVP
   - Or add it as a **TODO / future task** instead of implementing everything at once.

Always keep in mind:

> Right now, the most important thing is a stable, usable **web MVP** where users can log in, create itineraries, search places, and save their plans.

---
