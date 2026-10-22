# Karighar: Build, Renovate, Fix

Build the customer-facing web app for Karighar, mobile-first and fully responsive.

Brand feel: warm, trustworthy, craftsman-modern — authentic artisan warmth crossed with a professional project-management tool. NOT a generic "handyman app" look. Primary accent color: a warm terracotta (#B5551D). Clean neutrals, generous whitespace, rounded cards, real hierarchy — avoid cluttered admin-panel aesthetics anywhere a customer or professional will spend time.

Customer-side navigation is organised around three intents, not trade categories: Build (create something new), Renovate (improve something existing), Fix (repair or restore). A customer should never be required to know the professional category up front.

Professional-side identity: professionals have real business storefronts — profile, portfolio, services ("Gigs"), pricing, reviews, verification badges — not anonymous worker listings. Think artisan master storefront, not a gig-worker queue.

Pages / flows to include:
1. Landing page — hero with the line "Tell Karighar what you want done. We'll help you figure out how to get it done," a large Ask Karighar input, and three big entry cards for Build / Renovate / Fix, each with a short example ("Custom wardrobe," "Bathroom renovation," "Leaking pipe").
2. Ask Karighar flow — customer types a plain-language request (e.g. "I need someone tomorrow morning to fix my water tank in Andheri, budget around ₹2,000"). Show a brief "understanding your request" loading state, then render an editable Project Brief card: intent, problem summary, location, budget, timing, likely trade(s), estimated duration, estimated cost range — each field editable inline, clearly labelled as an estimate, not a guarantee. A prominent "Find Professionals" button at the bottom.
3. Professional results — a list/grid of mock professional cards matched to the brief: photo, name, trade, business name, rating, number of completed projects, starting price, 2–3 specific verification badges (not one generic "Verified" badge — show things like "Identity verified," "Skills verified"), and a short portfolio photo strip. Include a filter/sort bar (price, rating, availability).
4. Professional profile page — full storefront: cover photo, name, business name, bio, experience, skills, portfolio grid, reviews with ratings, their list of Gigs (services) with starting prices, service area, availability snapshot, and a "Request Quote" / "Book" button.
5. Project view — once a customer has hired someone, show a single Project workspace: overview, current status/stage, a simple progress bar, messages thread (mock), photos tab, and a cost summary (labour / materials / total) clearly broken down.

Use realistic mock data throughout (Indian names, cities, ₹ pricing). Make the Ask Karighar interaction feel like the centrepiece of the whole app — it should feel effortless and smart, not like a form.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://usekarighar.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c21f6479-a65e-492d-a1a4-4dd552239dad).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
