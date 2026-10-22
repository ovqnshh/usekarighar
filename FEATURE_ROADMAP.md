# Karighar Competitive Advantage & Feature Innovation Blueprint
> **Strategic Product Roadmap for Indian Home Services & Craftsmanship Platform**
> 
> *Target Competitors: Urban Company, JustDial, NoBroker, Sulekha*  
> *Core Mission: Eliminating pricing distrust, empowering skilled craftsmen, and creating permanent homeowner retention.*

---

## Executive Summary & Feature Matrix

The following 18 high-impact features are engineered specifically for the Indian domestic services ecosystem. Each feature solves a verified bottleneck in trust, logistics, blue-collar workflow, or billing integrity.

| # | Feature Concept | Category | Core Competitive Differentiator | Impact | Feasibility |
|---|---|---|---|:---:|:---:|
| 1 | **AI Visual Damage & Material Estimator** | Trust & Transparency | Prevents quote inflation before worker arrival | 🟢 High | Easy |
| 2 | **Society "Karighar Day" Cluster Booking** | Operations & Virality | High margin, zero artisan travel deadhead | 🟢 High | Moderate |
| 3 | **Voice-First Hinglish AI Dispatch** | Accessibility & UX | Solves blue-collar & elderly usability barriers | 🟢 High | Easy |
| 4 | **Digital Home Health Passport (Flat DigiLocker)** | Customer Retention | Creates high switching costs for homeowners | 🟢 High | Easy |
| 5 | **Karighar Micro-Storefronts (`karighar.in/@pro`)** | Organic Growth | Artisans market the platform for free | 🟢 High | Easy |
| 6 | **Live Emergency "SOS Rapid Dispatch" (15–30 Min)** | On-Demand Utility | Monopolizes urgent, high-margin night calls | 🟡 Medium | Moderate |
| 7 | **Material Transparency Scanner (Anti-Piracy Check)** | Quality Assurance | Guarantees genuine ISI / CPVC / Finolex materials | 🟡 Medium | Easy |
| 8 | **Milestone Escrow for Large Renovations (₹25k–₹5L)** | Fintech & Escrow | Unlocks high-ticket residential contracts | 🟢 High | Moderate |
| 9 | **AR Room & Pipe Dimension Estimator (Web-AR)** | Tech Delight | Eliminates dimension misunderstandings | 🟡 Medium | Moderate |
| 10 | **Pro Tool & Safety Equipment Verification (PPE Check)** | Trust & Safety | Elevates brand perception over roadside labor | 🟡 Medium | Easy |
| 11 | **Artisan Micro-Advance & Credit Score** | Pro Retention | Guarantees worker loyalty during peak season | 🟢 High | Moderate |
| 12 | **Interactive Split Before-After Transformation Showcase** | Conversion Rate | Shows tangible proof of craftsmanship | 🟡 Medium | Easy |
| 13 | **Multi-Trade "Contractor Crew Assembly"** | High-Ticket PM | Automated sequencing of multi-step renovations | 🟢 High | Moderate |
| 14 | **Society Gate Pre-Pass (MyGate/NoBrokerHood)** | Friction Reduction | Solves society security entry friction | 🟡 Medium | Easy |
| 15 | **Warranty AI Dispute Arbitrator** | Ops Efficiency | Reduces manual customer support headcount | 🟡 Medium | Easy |
| 16 | **Surplus Material Buyback & Recycling Corner** | Eco & Cost Savings | Reduces customer renovation leftover waste | 🟡 Medium | Easy |
| 17 | **Verified Hardware & Supply Store Locator** | Local Ecosystem | Solves emergency part runs during active jobs | 🟢 High | Easy |
| 18 | **Live Spare Part Price Finder & MRP Benchmark** | Pricing Honesty | Ends "bhaiya dukan pe mehenga mila" disputes | 🟢 High | Easy |

---

## Comprehensive Deep-Dive: All 18 Features

```
                                      ┌─── AI Visual Damage Estimator (#1)
                                      ├─── Material Price Finder (#18)
           ┌── 1. Trust & Honesty ────┼─── Hardware Store Locator (#17)
           │                          └─── Anti-Piracy Scanner (#7)
           │
           │                          ┌─── Society Cluster Bookings (#2)
           ├── 2. Density & Growth ───┼─── Micro-Storefronts (#5)
KARIGHAR ──┤                          └─── Voice Hinglish Dispatch (#3)
INNOVATION │
ECOSYSTEM  │                          ┌─── Home Health Passport (#4)
           ├── 3. Lifetime Value ─────┼─── Milestone Renovation Escrow (#8)
           │                          └─── Multi-Trade Crew Assembly (#13)
           │
           │                          ┌─── SOS Emergency Dispatch (#6)
           └── 4. Operational Speed ──┼─── Society Gate Pre-Pass (#14)
                                      └─── Warranty AI Arbitrator (#15)
```

---

### 1. AI Visual Damage & Material Estimator
* **The Problem**: Homeowners have acute pricing anxiety before hiring any technician. Plumbers or electricians often arrive, diagnose a problem vaguely, and quote ₹2,000 for what might be a ₹100 rubber gasket.
* **The Solution**: The customer snaps a photo or records a 5-second video of the leaking fixture, sparked switch, or damaged woodwork. Gemini Vision API identifies the exact fixture brand, failure cause, standard spare parts list with current MRP ranges, and expected labor time.
* **Benefits**: Instantly earns user trust, prevents overbilling disputes before the worker sets foot in the flat, and provides realistic expectations.
* **How to Do It**:
  - Integrate image upload directly into the "Ask Karighar" hero widget.
  - Send the image to Google Gemini 2.5 Flash with a structured JSON schema:
    ```json
    {
      "fixture_type": "Wall-mounted Diverter",
      "likely_issue": "Internal cartridge washer worn out",
      "estimated_part_cost": "₹150 - ₹350",
      "estimated_labor_mins": 45,
      "recommended_sop": "Cartridge replacement with pressure test"
    }
    ```
  - Display an interactive "Pre-Inspection Estimate Card" on the customer's screen.
* **Short Plan of Action**:
  1. Add image capture button to `src/components/ask-karighar-autocomplete.tsx`.
  2. Implement backend endpoint / server function parsing the visual input via Gemini Vision.
  3. Render the diagnosis preview with itemized part ranges before booking confirmation.

---

### 2. Society "Karighar Day" Cluster Booking
* **The Problem**: Travel deadhead kills artisan income. Spending 2 hours navigating Mumbai traffic for a single ₹350 job makes independent work unprofitable and causes worker fatigue.
* **The Solution**: Geo-clustered group bookings by residential societies (e.g., *Hiranandani Gardens, Powai* or *Oberoi Springs, Andheri*). When 3 or more flats in the same building or gated complex book on the same Saturday:
  - Customers get an automatic 15%–20% group discount.
  - The artisan gets 4–6 jobs back-to-back in the same elevator bank with zero travel time.
  - Karighar earns 4x platform fees in a single afternoon.
* **Benefits**: Dramatically improves technician retention, lowers customer prices, and drives organic word-of-mouth in society WhatsApp groups.
* **How to Do It**:
  - Capture residential society names from user address inputs.
  - Maintain a public `society_deals` feed displaying active booking progress (e.g., *"2 of 4 neighbors joined for Saturday AC Service"*).
  - Broadcast bulk route offers exclusively to top-rated nearby artisans.
* **Short Plan of Action**:
  1. Add `society_name` field to user saved addresses.
  2. Build a "Society Deals" banner on the homepage showing neighbor booking counters.
  3. Batch dispatch linked projects to a single artisan with an optimized time slot schedule.

---

### 3. Voice-First Hinglish AI Dispatch
* **The Problem**: Blue-collar artisans struggle with long English forms, and elderly homeowners or busy homemakers find typing technical descriptions difficult.
* **The Solution**: A prominent, WhatsApp-style microphone button on the homepage. The user speaks naturally in Hindi, Marathi, or Hinglish:
  > *"Bhaiya, master bedroom ke bathroom ka pipe leak ho raha hai aur kitchen ka switchboard jal gaya hai."*
  The engine transcribes the audio, detects multiple trades (Plumbing + Electrical), extracts the urgency, and auto-fills the project ticket. For the artisan, the brief can be listened to in audio with one tap.
* **Benefits**: Eliminates onboarding friction for non-English speakers and allows workers to listen to instructions on their bike or while working.
* **How to Do It**: Use the native Web Speech API or Whisper server function, parse with Gemini multilingual translation, and store a short voice memo for the pro.
* **Short Plan of Action**:
  1. Add microphone recording UI next to the main search bar.
  2. Pipe audio to speech transcription API.
  3. Pass transcript into `askKarigharEngine()` to extract trade tags and location.
  4. Render an audio playback player inside `projects.$id.tsx`.

---

### 4. Digital Home Health Passport (Flat DigiLocker)
* **The Problem**: When buying, selling, or renting a home in India, there is zero historical documentation of past repairs, concealed plumbing routes, paint shades, or warranty cards.
* **The Solution**: Every completed project on Karighar is permanently compiled into the homeowner's **"Home Health Passport"**:
  - Chronological timeline of all repairs, parts replaced, and contractor invoices.
  - Verified Before & After photos.
  - Live countdown timers for warranties (e.g., *"Waterproofing Warranty: 184 days active"*).
  - One-click exportable PDF "Home Maintenance Certificate" for property resale or tenant handover.
* **Benefits**: Creates insurmountable switching costs—homeowners will not use another app because all their home maintenance records live on Karighar.
* **How to Do It**:
  - Create a `property_passports` table in Supabase indexed by flat address.
  - On End-OTP verification, automatically append job evidence, replaced parts, and invoices.
* **Short Plan of Action**:
  1. Build a new route `/account/home-passport` in the customer portal.
  2. Display active warranty badges, service milestones, and photo history.
  3. Add a "Download Maintenance Certificate" button generating a clean PDF.

---

### 5. Karighar Micro-Storefronts (`karighar.in/@pro-name`)
* **The Problem**: Craftsmen rely on outdated paper visiting cards or low-quality WhatsApp status posts to find work.
* **The Solution**: Every verified artisan receives an instant, professional personal micro-website:
  - Custom URL: `karighar.in/@arjun-carpentry`.
  - Showcases their SafePay verification badge, client ratings, photo gallery of completed work, and standard pricing.
  - Includes a prominent **"Book Me on Karighar"** button.
  - Auto-generates a printable visiting card PDF with a scannable QR code.
* **Benefits**: Artisans actively market your platform in their personal networks and society WhatsApp groups for free, giving you an organic Customer Acquisition Cost (CAC) of **₹0**.
* **How to Do It**:
  - Route `/p/:slug` as an ultra-fast, mobile-optimized landing page.
  - Embed dynamic OpenGraph meta tags so links shared on WhatsApp render rich preview cards.
* **Short Plan of Action**:
  1. Implement public route `src/routes/p.$slug.tsx`.
  2. Add a "Download My Karighar Visiting Card" QR generator in the Pro Dashboard.
  3. Track bookings originating from pro profile links.

---

### 6. Live Emergency "SOS Rapid Dispatch" (15–30 Min Turnaround)
* **The Problem**: Water tank overflows, burst pipes, burning electrical smells, and lockouts cannot wait for "Tomorrow at 10 AM".
* **The Solution**: A high-visibility **"SOS Emergency"** banner. When triggered:
  - Broadcasts an audio alert to all active verified Karighars within a 3 km radius.
  - The first worker to accept gets the job instantly.
  - Displays Uber-style live technician ETA and direct phone connect.
  - Premium pricing structure (e.g., ₹499 emergency visit fee + standard repair cost).
* **Benefits**: High-margin platform fee capture and builds immense brand reliability during household emergencies.
* **How to Do It**:
  - Introduce an `is_emergency: boolean` flag in the `projects` table.
  - Implement a 90-second timeout dispatcher offer mechanism.
* **Short Plan of Action**:
  1. Add an "SOS Emergency" quick-trigger button in the mobile navigation header.
  2. Build an artisan "On-Duty Emergency Mode" toggle in the Pro Dashboard.
  3. Create an active SOS tracking view with live countdown timer.

---

### 7. Material Transparency Scanner (Anti-Piracy Check)
* **The Problem**: The Indian construction market is flooded with counterfeit electrical wires and substandard PVC pipes that cause fires and wall seepage.
* **The Solution**: On-site material verification. The technician scans the manufacturer QR/barcode or uploads a clear photo of the material packaging (Finolex, Polycab, Astral, Asian Paints, Havells) before installing it.
* **Benefits**: Guarantees genuine ISI-marked materials, protects homeowners from fire/flood hazards, and cements Karighar's reputation as a premium service.
* **How to Do It**:
  - Add a "Scan / Upload Material Receipt" step in the on-site technician job completion checklist.
  - Extract brand and ISI certification numbers, logging them in the project warranty ledger.
* **Short Plan of Action**:
  1. Add a "Material Verification" card in the project progress screen.
  2. Store scanned images in Supabase storage under `project_materials`.
  3. Display a "Verified Genuine Materials Used" seal on the customer's completion invoice.

---

### 8. Milestone Escrow for High-Ticket Renovations (₹25,000 – ₹5,00,000)
* **The Problem**: Existing home service platforms only do small ₹300 fixes. High-value kitchen remodels, custom wardrobe carpentry, and full-flat renovations are left to unorganized contractors where payment disputes are rampant.
* **The Solution**: Multi-stage Milestone Escrow:
  - **Milestone 1 (30%)**: Demolition, rough-in plumbing, and structural framing.
  - **Milestone 2 (40%)**: Tiling, electrical wiring, and cabinetry installation.
  - **Milestone 3 (30%)**: Final polish, fittings, and snagging clearance.
  - Funds are locked in platform escrow and released stage-by-stage only after homeowner sign-off.
* **Benefits**: Positions Karighar to capture massive transaction volumes (10% commission on a ₹2,50,000 modular kitchen renovation is ₹25,000 from one job).
* **How to Do It**:
  - Create a `project_milestones` table linked to `projects`.
  - Customers fund each milestone via net banking / UPI into escrow.
  - Artisan requests release; customer approves with photo verification.
* **Short Plan of Action**:
  1. Create database schema for `project_milestones` (title, amount, status, inspection_photos).
  2. Build a visual milestone progress bar in the customer project dashboard.
  3. Implement staged escrow release logic.

---

### 9. AR Room & Pipe Dimension Estimator (Web-AR)
* **The Problem**: Homeowners misjudge room dimensions, wall square footage, or pipe lengths, leading to inaccurate quotes and awkward arguments with workers on site.
* **The Solution**: A lightweight web-based AR measuring tool. The customer points their phone camera at the wall or bathroom floor, taps two corners, and the app calculates the exact square footage (for tiling/painting) or linear feet (for plumbing).
* **Benefits**: Eliminates dimensional disputes, reduces quoting friction, and provides a futuristic user experience.
* **How to Do It**: Use browser WebXR Device API or a guided photo-scaling canvas overlay with standard reference objects.
* **Short Plan of Action**:
  1. Build an interactive square-footage calculator with visual room presets (10x10, 12x15).
  2. Provide a photo attachment upload with grid scale overlays.
  3. Auto-calculate material quantities (paint liters, tile boxes) based on measurements.

---

### 10. Pro Tool & Safety Equipment Verification (PPE Check)
* **The Problem**: Unprofessional laborers showing up in flip-flops with blunt, dangerous tools damages luxury fittings and makes affluent homeowners uncomfortable.
* **The Solution**: Verified Professional Gear Standard. Before taking high-tier jobs, artisans upload a selfie wearing insulated safety gloves, safety shoes, and displaying their standard organized tool kit.
* **Benefits**: Elevates brand standard, protects workers from injuries, and justifies premium pricing to customers.
* **How to Do It**:
  - Add an equipment checklist in the artisan verification portal.
  - Award a **"Equipped with Industrial Grade Tools"** badge on their storefront.
* **Short Plan of Action**:
  1. Add a "Safety & Tools" verification section in the Pro Dashboard verification wizard.
  2. Verify uploaded toolkit photos during artisan onboarding.
  3. Surface the verified PPE badge on search cards and quote views.

---

### 11. Artisan Micro-Advance & Credit Score
* **The Problem**: Skilled craftsmen often lack working capital to purchase expensive hardware or tools for upcoming jobs, leading them to borrow from predatory local moneylenders.
* **The Solution**: A performance-based Karighar Artisan Credit Score. Artisans with consistent 4.8+ ratings and 20+ completed jobs get:
  - Instant same-day wallet withdrawals.
  - Zero-interest micro-advances (e.g., ₹2,000–₹5,000) specifically earmarked to purchase materials for confirmed bookings.
* **Benefits**: Total artisan loyalty. Workers will never leave the platform because it provides them with dignified financial stability.
* **How to Do It**:
  - Compute a live trust score from completion rate, rating average, and on-time arrival.
  - Deduct advances automatically from the final milestone escrow payout.
* **Short Plan of Action**:
  1. Add `credit_tier` and `advance_balance` columns to `karigar_wallets`.
  2. Implement an "Instant Material Advance" request button in the Pro Dashboard.
  3. Automatically reconcile advances upon job completion.

---

### 12. Interactive Split Before-After Transformation Showcase
* **The Problem**: Plain photo galleries look static and unconvincing. Homeowners cannot appreciate the difficulty of craftsmanship without seeing the initial mess.
* **The Solution**: An interactive, touch-draggable split before-and-after slider widget:
  - Left side: Rusted, calcified pipes or damaged wooden cabinet.
  - Right side: Gleaming brass fittings or flawless walnut-finish wardrobe.
* **Benefits**: Massive increase in conversion rates on artisan portfolios and landing pages.
* **How to Do It**:
  - Require the artisan to upload 1 "Before" photo at Start-OTP and 1 "After" photo at End-OTP.
  - Pair the photos automatically into an interactive slider component.
* **Short Plan of Action**:
  1. Integrate `BeforeAfterSlider` component into artisan storefronts and project pages.
  2. Enforce before/after photo capture in the technician job completion workflow.
  3. Feature top transformation pairs on the homepage.

---

### 13. Multi-Trade "Contractor Crew Assembly"
* **The Problem**: A bathroom leak often requires 3 different trades working in strict sequence:
  1. Plumber breaks the wall and replaces the leaking pipe.
  2. Mason / Plasterer seals the brickwork and waterproofs the slab.
  3. Tiler lays matching tiles and grouts.
  Homeowners struggle to coordinate 3 different independent workers.
* **The Solution**: Intelligent Multi-Trade Sequencing. A single project brief creates linked sub-tasks across trades. The system dispatches the Plasterer only after the Plumber enters their End-OTP, and dispatches the Tiler only after the plaster dries.
* **Benefits**: Solves the biggest headache in home repair and allows Karighar to act as an automated general contractor without hiring full-time staff.
* **How to Do It**:
  - Support `parent_project_id` and `dependency_stage` in the `projects` table.
  - Automatically trigger dispatch for Stage N+1 upon completion of Stage N.
* **Short Plan of Action**:
  1. Allow multi-trade selection during project creation.
  2. Build a Gantt-style progress stepper in the customer project tracker.
  3. Auto-notify the next scheduled trade when the prior phase is marked completed.

---

### 14. Society Gate Pre-Pass (MyGate / NoBrokerHood Integration)
* **The Problem**: Artisans waste 15–20 minutes arguing with security guards at housing society gates, delaying appointments and frustrating residents.
* **The Solution**: Digital Karighar Gate Pass:
  - Displays the technician's verified photo, Government ID number, vehicle registration, and destination flat number.
  - Contains a scannable QR code that security guards can scan to see instant verification.
  - 1-click "Share Gate Pass to WhatsApp" so the homeowner can approve entry in their society security app before the worker arrives.
* **Benefits**: Smooth, friction-free arrival experience and professional brand appearance at upscale residential societies.
* **How to Do It**: Generate a lightweight public pass view at `/gate-pass/:projectId` containing verified credentials.
* **Short Plan of Action**:
  1. Build a mobile-optimized `/gate-pass` screen.
  2. Add a "Share Gate Pass to WhatsApp" button on the customer tracking page.
  3. Display the pass prominently on the artisan's active job screen.

---

### 15. Warranty AI Dispute Arbitrator
* **The Problem**: If a repaired tap leaks 2 weeks later, the customer accuses the worker of doing shoddy work, while the worker claims the customer broke a new part. Manual dispute mediation drains platform operations.
* **The Solution**: An automated AI claim review system:
  - Customer uploads photo/video of the recurring issue.
  - System cross-references the new visual evidence against the original Start/End job photos and replaced parts list.
  - If identical: Automatically approves a free 30-day rework dispatch.
  - If different: Generates an honest explanation and offers a discounted follow-up ticket.
* **Benefits**: Resolves 80% of warranty claims in under 60 seconds without requiring a massive customer support call center.
* **How to Do It**: Pass original completion photos and new complaint photos to Gemini Vision with comparative prompt instructions.
* **Short Plan of Action**:
  1. Add a "Claim 30-Day Warranty" button on completed project records.
  2. Implement photo comparison API call.
  3. Automatically schedule a warranty rework dispatch if verified.

---

### 16. Surplus Material Buyback & Recycling Corner
* **The Problem**: After completing a renovation, homeowners are left with half-bags of premium cement, 4 unused luxury tiles, and 20 meters of electrical conduit taking up space on balconies.
* **The Solution**: An in-app surplus material marketplace. Homeowners list leftover materials at a discount, and verified Karighars can buy them at a 40% discount for their upcoming small jobs.
* **Benefits**: Saves homeowners money, provides cheaper materials for artisans, and positions Karighar as an eco-conscious green platform.
* **How to Do It**: Simple customer-to-artisan classifieds table (`surplus_items`) with neighborhood filtering.
* **Short Plan of Action**:
  1. Add a prompt on job completion: *"Have leftover materials? List them to get instant credit."*
  2. Create a "Surplus Bargains" tab in the Pro Dashboard.
  3. Credit proceeds directly to the homeowner's Karighar wallet.

---

### 17. Verified Hardware & Supply Store Locator (Nearby Part Depots)
* **The Problem**: During 80% of jobs, the technician stops work because a specific pipe nipple, MCB switch, or brass screw is required. Neither the customer nor the technician knows which nearby local shop is open, stocked, and fair.
* **The Solution**: An interactive, localized hardware supply locator map:
  - Filter by trade: *"Plumbing & Sanitary"*, *"Electrical & Switchgear"*, *"Plywood & Hardware"*, *"Paint & Waterproofing"*.
  - Displays distance in km/mins, open/closed status, phone numbers, and a 1-tap **"Navigate via Google Maps"** button.
  - Shows **"Karighar Preferred Partner Store"** badges where artisans get 5% trade discounts.
* **Benefits**:
  - Cuts on-site job delays by half.
  - Huge B2B monetization: Local hardware stores pay a monthly listing fee or offer trade discounts to be featured on Karighar.
  - Homeowners can verify that the store is real and nearby.
* **How to Do It**:
  - Build an interactive map using Leaflet / OpenStreetMap or Google Maps JavaScript API.
  - Store local hardware store coordinates, categories, and contact details in a `stores` table.
* **Short Plan of Action**:
  1. Create a `stores` database table (name, category, address, lat/lng, phone, partner_discount).
  2. Build a dedicated `/hardware-locator` route with category filter pills and interactive pins.
  3. Add a "Find Nearby Parts" shortcut directly on the technician's active project screen.

---

### 18. Live Spare Part Price Finder & MRP Benchmark
* **The Problem**: The number-one reason homeowners suspect artisans of overcharging is spare parts: *"Bhaiya, shopkeeper charged ₹650 for this ball valve."* The homeowner suspects the real cost was ₹250 and that the worker pocketed the difference.
* **The Solution**: An authoritative, searchable **Karighar Price Index** for the top 200 standard household replacement parts:
  - Users or workers type any part name (*"1-inch CPVC Ball Valve Astral"*, *"Anchor Roma 16A Switch"*, *"Godrej 6-lever mortise lock"*).
  - Displays the Brand, Technical Spec, MRP, and Fair Market Trade Price range (e.g., ₹180 – ₹220).
  - Cash Memo Scanner: Technician uploads a photo of the shop cash memo, and the system matches the price against the benchmark.
* **Benefits**: Completely eliminates price arguments between homeowners and technicians.
* **How to Do It**:
  - Seed a `material_catalog` table with verified Mumbai market prices for leading brands (Astral, Supreme, Havells, Schneider, Godrej, Asian Paints).
  - Build an instant autocomplete lookup widget accessible on the website and inside chat threads.
* **Short Plan of Action**:
  1. Create a `materials_catalog` table with benchmark price ranges.
  2. Build a `/price-index` public search tool for quick price checks.
  3. Integrate the price checker into the quote generation and invoice adjustment modals.

---

## Technical Architecture & Phased Rollout Plan

```mermaid
flowchart TD
    subgraph Phase 1: Trust, Transparency & Core Conversion
        P1A[1. AI Visual Damage Estimator]
        P1B[18. Live Spare Part Price Finder]
        P1C[17. Verified Hardware Store Locator]
        P1D[5. Karighar Micro-Storefronts]
        P1E[12. Split Before-After Showcase]
    end

    subgraph Phase 2: Operations, Retention & Accessibility
        P2A[4. Digital Home Health Passport]
        P2B[3. Voice-First Hinglish AI]
        P2C[14. Society Gate Pre-Pass]
        P2D[7. Material Transparency Scanner]
        P2E[15. Warranty AI Dispute Arbitrator]
    end

    subgraph Phase 3: High-Ticket Monetization & Scale
        P3A[2. Society 'Karighar Day' Bulk Deals]
        P3B[8. Milestone Escrow Renovations]
        P3C[13. Multi-Trade Crew Assembly]
        P3D[6. Live SOS Emergency Dispatch]
        P3E[11. Artisan Micro-Advance & Credit]
    end

    Phase 1 --> Phase 2 --> Phase 3
```

---

## File Location in Codebase
This master strategic roadmap is saved at:
📁 [`FEATURE_ROADMAP.md`](file:///c:/Users/vansh/OneDrive/Desktop/ds_Projects/full_stack/karighar/FEATURE_ROADMAP.md)
