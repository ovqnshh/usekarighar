# Karighar — Architecture & Flow (Draft)

This is a technical companion to `karighar-blueprint.md`. That document is
the *why* and *what*. This document is the *how it actually behaves* —
system architecture, data relationships, state machines, and step-by-step
flows for every major journey in the app. Nothing here is a build
instruction; it's the shared mental model to build from.

---

## 1. System Architecture (high level)

```mermaid
flowchart LR
    subgraph Client["React App (Vite + TS)"]
        UI[Pages & Components]
        State[Client state: React Query / context]
    end

    subgraph Supabase
        Auth[Supabase Auth]
        DB[(Postgres + RLS)]
        Storage[(Storage buckets)]
        Realtime[Realtime channels]
        Edge[Edge Functions]
    end

    LLM[LLM API\nAsk Karighar parsing]
    Payments[Payment Provider\ntest mode]

    UI --> Auth
    UI --> DB
    UI --> Storage
    UI <-->|subscribe| Realtime
    UI --> Edge
    Edge --> LLM
    Edge --> DB
    UI -.future.-> Payments
```

**Principle:** the client never talks to the LLM or holds secrets. All AI
calls and anything requiring a secret key route through a Supabase Edge
Function. The client talks to Postgres directly only through RLS-protected
queries — RLS is the real authorization boundary, not the UI.

---

## 2. Core Objects & Relationships

```mermaid
erDiagram
    PROFILES ||--o{ USER_ROLES : has
    PROFILES ||--o| KARIGHARS : "may become"
    KARIGHARS ||--o{ GIGS : offers
    KARIGHARS ||--o{ PORTFOLIO_ITEMS : shows
    KARIGHARS ||--o{ KARIGHAR_VERIFICATIONS : holds
    PROFILES ||--o{ PROJECTS : creates
    GIGS ||--o{ PROJECTS : "may originate"
    PROJECTS ||--o{ QUOTES : receives
    KARIGHARS ||--o{ QUOTES : submits
    PROJECTS ||--o{ MESSAGES : contains
    PROJECTS ||--o{ PROJECT_PHOTOS : contains
    PROJECTS ||--o| REVIEWS : "gets one, once completed"
    PROFILES ||--o{ SAVED_KARIGHARS : saves
    KARIGHARS ||--o{ SAVED_KARIGHARS : "saved by"
```

**Why the Project sits at the center:** every other object (quotes,
messages, photos, review) points back to a Project, never to a Karighar
or Gig directly. That's what lets a two-hour repair and a six-week
renovation share the same system — the Project is the one object that
persists and accumulates history. Karighars and Gigs are discovery and
identity; Projects are where the actual work and trust record lives.

---

## 3. Roles & Auth Flow

A single `profiles` row per user. Roles are additive, not exclusive — a
person can be a customer, become a Karighar later, and remain both.

```mermaid
flowchart TD
    A[Visitor] -->|Sign up| B[profiles row created\nvia DB trigger]
    B --> C{Chooses path}
    C -->|"I need work done"| D[role: customer]
    C -->|"I'm a Karighar"| E[Become a Karighar onboarding]
    E --> F[role: karighar + karighars row]
    D -->|later clicks Become a Karighar| E
    F --> G[Has both roles]
    D --> G
    G --> H[Role switcher in profile menu]
```

Session rule: protected routes check auth state before render; an
unauthenticated user hitting a protected route is redirected to sign-in
and returned to the original destination after success — never dropped on
a generic home page.

---

## 4. Customer Flow — Two Entry Paths (always both visible)

```mermaid
flowchart TD
    Start([Customer lands on app]) --> Choice{How do they start?}

    Choice -->|Knows who they want| Search[Search Karighars]
    Choice -->|Doesn't know the trade| Ask[Ask Karighar]

    Search --> Filter[Filter: trade, city, rating, price, verification]
    Filter --> Results[Karighar result cards]
    Results --> Profile[Karighar storefront]

    Ask --> Input[Type plain-language request]
    Input --> Parse[Edge Function calls LLM]
    Parse --> Brief[Editable Project Brief shown]
    Brief -->|customer edits/approves| CreateProject[Project created\nstatus: requesting_quotes]
    CreateProject --> Matches[Matching Karighars shown]
    Matches --> Profile

    Profile --> HowToHire{How to hire}
    HowToHire -->|Fixed-price gig| Book[Book Now on a gig]
    HowToHire -->|Needs a quote| ReqQuote[Request Quote]

    Book --> ProjectFixed[Project created directly\nstatus: scheduled]
    ReqQuote --> QuotePending[quotes row: pending]
    QuotePending --> Submitted[Karighar submits structured quote]
    Submitted --> Compare[Customer compares quotes side by side]
    Compare --> Accept[Accept one quote]
    Accept --> ProjectScheduled[Project status: scheduled\nother quotes: declined]

    ProjectFixed --> Workspace[Project Workspace]
    ProjectScheduled --> Workspace
    Workspace --> Complete[Karighar marks complete]
    Complete --> Review[Customer leaves one review]
    Review --> RatingUpdate[Karighar rating_avg / rating_count updated]
```

---

## 5. Karighar (Professional) Flow

```mermaid
flowchart TD
    A[Existing user] --> B[Clicks Become a Karighar]
    B --> C[Step 1: Basics — name, phone, city, photo]
    C --> D[Step 2: Profession — trade, experience, skills]
    D --> E[Step 3: Business — name, bio, service area, hours]
    E --> F[Step 4: Portfolio uploads]
    F --> G[Step 5: First gig, optional]
    G --> H[Step 6: Review and publish]
    H --> I[karighars row created\nrole: karighar added\nverifications: all pending]
    I --> J[Redirected to Karighar Dashboard]

    J --> K[Dashboard tabs: Home / Gigs / Calendar / Projects / Messages]
    K --> L[Home: stat cards from real data]
    K --> M[Gigs: create/edit/delete gigs]
    K --> N[Projects: incoming requests]
    N --> O{Request type}
    O -->|Direct booking| P[Already scheduled — prep for the job]
    O -->|Quote request| Q[Submit structured quote]
    Q --> R{Customer accepts?}
    R -->|Yes| S[Project assigned, moves to scheduled]
    R -->|No / another accepted| T[Quote marked declined]
    S --> U[Calendar shows the job]
    U --> V[Accept / decline / reschedule]
    V --> W[Mark started, in_progress]
    W --> X[Upload progress photos, message customer]
    X --> Y[Mark complete]
    Y --> Z[Awaits customer review\nrating updates storefront]
```

---

## 6. Project Status — State Machine

```mermaid
stateDiagram-v2
    [*] --> draft: Ask Karighar brief created,\nnot yet confirmed
    draft --> requesting_quotes: Customer confirms brief
    draft --> scheduled: Direct gig booking (skips quotes)
    requesting_quotes --> scheduled: Customer accepts a quote
    requesting_quotes --> cancelled: Customer cancels
    scheduled --> in_progress: Karighar marks started
    scheduled --> cancelled: Either side cancels before start
    in_progress --> completed: Karighar marks complete
    in_progress --> cancelled: Cancelled mid-work (rare, logged)
    completed --> [*]
    cancelled --> [*]
```

**Who can trigger which transition:**
| Transition | Who | Notes |
|---|---|---|
| draft → requesting_quotes | Customer | Confirms the AI brief |
| draft → scheduled | Customer | Only via direct gig "Book Now" |
| requesting_quotes → scheduled | Customer | Accepting a quote; other quotes auto-decline |
| → cancelled | Either, with reason | Logged, visible in project history |
| scheduled → in_progress | Karighar | Marks arrival/start |
| in_progress → completed | Karighar | Customer is prompted to review afterward |

---

## 7. Quote Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending: Customer requests a quote
    pending --> submitted: Karighar fills in the structured quote
    submitted --> accepted: Customer accepts this one
    submitted --> declined: Customer accepts a different one,\nor explicitly declines
    pending --> declined: Karighar declines the request
    accepted --> [*]
    declined --> [*]
```

Accepting one quote is a single transaction: set that quote to `accepted`,
set all sibling quotes on the same Project to `declined`, and move the
Project to `scheduled`.

---

## 8. Ask Karighar — Request Flow in Detail

```mermaid
sequenceDiagram
    participant U as Customer
    participant C as Client App
    participant E as Edge Function
    participant L as LLM
    participant D as Postgres

    U->>C: Types plain-language request
    C->>E: POST /ask-karighar { text, location? }
    E->>L: Structured prompt: extract intent, type,\nlocation, budget, timing, trade, duration, cost
    L-->>E: JSON brief
    E-->>C: Structured Project Brief (draft, not saved)
    C-->>U: Editable brief card, every field editable
    U->>C: Edits/confirms fields
    C->>D: INSERT projects (status: requesting_quotes)
    D-->>C: project_id
    C->>D: SELECT karighars WHERE trade matches, city matches\nORDER BY rating DESC
    D-->>C: Matching Karighars
    C-->>U: Shows matches + link to full search
```

**Failure handling:** if the LLM call fails, fall back to a simple
keyword-based parser so the flow never dead-ends.

---

## 9. Messaging & Realtime

Each Project has exactly one message thread. A user only subscribes to
Realtime channels for Projects they're a participant in (enforced by RLS).

---

## 10. Screen / Route Map

| Route | Who | Purpose |
|---|---|---|
| `/` | Everyone | Landing: hero, dual search, Build/Renovate/Fix, featured Karighars |
| `/search` | Everyone | Search Karighars results, filters, sort |
| `/ask` | Everyone | Ask Karighar input → editable brief → matches |
| `/karighar/:id` | Everyone | Karighar storefront: bio, portfolio, reviews, badges, gigs |
| `/gig/:id` | Everyone | Gig detail, Book Now / Request Quote |
| `/project/:id` | Customer + assigned Karighar only | Project Workspace |
| `/my-projects` | Customer | List of customer's own projects |
| `/saved` | Customer | Saved Karighars |
| `/become-a-karighar` | Signed-in user | Multi-step onboarding |
| `/dashboard` | Karighar | Home: stat cards, alerts |
| `/dashboard/gigs` | Karighar | Gigs CRUD |
| `/dashboard/calendar` | Karighar | Day/week/month view |
| `/dashboard/projects` | Karighar | Incoming requests, active jobs |
| `/dashboard/messages` | Karighar | Cross-project message inbox |
| `/settings` | Signed-in user | Profile edit, role switcher |
| `/sign-in`, `/sign-up`, `/reset-password` | Visitor | Auth |
| `*` | Everyone | 404 |

---

## 11. What This Draft Deliberately Leaves Open

Scope of Work approval, Change Orders, Resolution Center, Warranty
tracking, payments/payout state, and Business/Contractor mode with
multi-worker assignment are not designed yet. Those belong in Part 2 once
Phase 1's flow is validated in the live app.
