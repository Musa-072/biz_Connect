insert into public.profiles (id, email, full_name, role)
values
  ('11111111-1111-4111-8111-111111111111', 'admin@bizconnect.test', 'BizConnect Admin', 'admin'),
  ('22222222-2222-4222-8222-222222222222', 'seller@bizconnect.test', 'Sample Seller', 'business_owner'),
  ('33333333-3333-4333-8333-333333333333', 'buyer@bizconnect.test', 'Sample Buyer', 'customer')
on conflict (id) do nothing;

insert into public.businesses (id, owner_id, name, category, location, description, website, approved)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'Soshanguve Fresh Produce', 'Fresh produce', 'Soshanguve Block H, Tshwane', 'Fresh fruit and vegetables from a neighbourhood seller.', null, true),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'Block K Home Kitchen', 'Prepared food', 'Soshanguve Block K, Tshwane', 'Home-prepared meals and local collection by arrangement.', null, true)
on conflict (id) do nothing;

insert into public.products (id, business_id, name, description, category, price, currency, stock, featured)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Brand Strategy Sprint', 'A 30-day brand growth sprint for startups and founders.', 'Services', 1200.00, 'ZAR', 10, true),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Smart Desk Lamp', 'Minimal ergonomic reading lamp with wireless charging.', 'Home', 890.00, 'ZAR', 24, true),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Wellness Starter Kit', 'Giftable starter collection for a calmer daily routine.', 'Lifestyle', 650.00, 'ZAR', 18, false)
on conflict (id) do nothing;
