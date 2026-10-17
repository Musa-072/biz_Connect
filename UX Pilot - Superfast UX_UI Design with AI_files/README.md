# BizConnect Marketplace

BizConnect Marketplace is a responsive marketplace prototype for connecting buyers, local businesses and service providers. The project is organized into a clean frontend structure and includes a proper Phase 2 foundation for Supabase authentication and database design.

## Project structure

- `app/public/` — public discovery pages: home, marketplace, businesses, about and contact
- `app/account/` — customer login and sign-up pages
- `app/business/` — business-owner onboarding page
- `assets/css/` — shared styles and design tokens
- `assets/js/` — frontend logic and future Supabase integration helpers
- `assets/images/` — organized image library split into brand, icon, and export assets
- `supabase/` — SQL schema, sample seed data and setup notes
- `docs/` — implementation documentation
- `package.json` — basic project metadata

## Local preview

Use any static server that can serve the project root. For example:

```bash
python -m http.server 8000
```

Then open:

- http://localhost:8000/
- http://localhost:8000/app/
- http://localhost:8000/app/public/home.html
- http://localhost:8000/app/public/marketplace.html

## Phase 1 status

- Responsive brand system completed
- Homepage, marketplace, directory, about, contact, login, signup and business onboarding pages connected
- Navigation and demo validation logic linked across screens
- Customer, account and business-owner pages organized into clear user-flow folders

## Phase 2 status

- Supabase schema draft created under `supabase/schema.sql`
- Seed data and setup notes added under `supabase/`
- `.env.example` prepared for project environment variables
- Frontend hooks prepared for connecting to Supabase later without breaking the current static workflow

## Files of interest

- `app/public/home.html` — landing page and marketplace hero
- `app/public/marketplace.html` — search and filtering demo
- `app/account/login.html` — customer sign-in flow
- `app/account/signup.html` — customer or business-owner account creation flow
- `app/business/onboarding.html` — business registration flow
- `docs/user-flow.md` — page map and customer/business user journeys
- `assets/css/main.css` — shared design system
- `assets/js/main.js` — interactive frontend logic
- `assets/images/brand/` — logo and brand image assets
- `assets/images/icons/` — SVG and UI icons
- `assets/images/exports/` — exported product and campaign imagery
- `supabase/schema.sql` — primary database schema
- `docs/phase2.md` — Phase 2 setup notes

## Notes

Authentication uses Supabase Auth when configured and falls back to the local demo flow when it is not. To enable live auth, put your project URL and anon key in `assets/js/supabase-config.js`; never put the service role key in browser code.
