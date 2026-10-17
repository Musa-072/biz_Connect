# Phase 2: Supabase integration plan

## 1. Configure the environment

Create a `.env.local` file from `.env.example` and add your project values:

```bash
cp .env.example .env.local
```

Then populate:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. Create the Supabase project

1. Create a project in Supabase.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Optionally run `supabase/seed.sql` for test records.

## 3. Connect the frontend

The static frontend already loads the Supabase JavaScript SDK on account and business forms when configured in `assets/js/supabase-config.js`. It uses Supabase Auth for:

- sign up and sign in
- automatic `profiles` creation through the `on_auth_user_created` trigger
- business onboarding through the `businesses` table

The local demo fallback remains available when the config values are empty.

## 4. Protect access

Add Row Level Security policies for:

- customer-only order creation
- business-owner product CRUD
- admin moderation actions

## 5. Next milestones

- Add server-side order creation and payment confirmation
- Load `products` and `businesses` dynamically from the database
- Add checkout and review workflows
