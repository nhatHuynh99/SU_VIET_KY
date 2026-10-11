-- ==============================================================================
-- SỬ VIỆT KÝ — CẤU HÌNH SUPABASE AUTH & CƠ SỞ DỮ LIỆU
-- Hướng dẫn: Mở Supabase Dashboard -> Vào mục SQL Editor -> Dán toàn bộ file này -> Nhấn RUN
-- ==============================================================================

-- 1. Kích hoạt tiện ích mã hóa mật khẩu
create extension if not exists pgcrypto;

-- 2. TẠO HOẶC CẬP NHẬT TÀI KHOẢN ADMIN TRONG SUPABASE AUTH
-- Tài khoản: admin@suvietky.vn (hoặc gõ nhanh admin@123) | Mật khẩu: Admin@123456
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@suvietky.vn',
  crypt('Admin@123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Ban Biên Tập Quốc Sử","role":"admin"}'::jsonb,
  now(),
  now(),
  ''
where not exists (
  select 1 from auth.users where email = 'admin@suvietky.vn'
);

update auth.users
set encrypted_password = crypt('Admin@123456', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    raw_user_meta_data = '{"name":"Ban Biên Tập Quốc Sử","role":"admin"}'::jsonb,
    updated_at = now()
where email = 'admin@suvietky.vn';

-- 3. TẠO HOẶC CẬP NHẬT TÀI KHOẢN USER TRONG SUPABASE AUTH
-- Tài khoản: docgia@suvietky.vn | Mật khẩu: User@123456
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'docgia@suvietky.vn',
  crypt('User@123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Độc Giả Sử Việt","role":"user"}'::jsonb,
  now(),
  now(),
  ''
where not exists (
  select 1 from auth.users where email = 'docgia@suvietky.vn'
);

update auth.users
set encrypted_password = crypt('User@123456', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    raw_user_meta_data = '{"name":"Độc Giả Sử Việt","role":"user"}'::jsonb,
    updated_at = now()
where email = 'docgia@suvietky.vn';

-- 3.1. ĐỒNG BỘ AUTH.IDENTITIES (Để Supabase GoTrue nhận diện phương thức đăng nhập email)
do $$
begin
  begin
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    select
      u.id::text,
      u.id,
      jsonb_build_object('sub', u.id::text, 'email', u.email),
      'email',
      u.id::text,
      now(),
      now(),
      now()
    from auth.users u
    where u.email in ('admin@suvietky.vn', 'docgia@suvietky.vn')
      and not exists (select 1 from auth.identities i where i.user_id = u.id);
  exception when others then
    -- Bỏ qua nếu cấu trúc auth.identities được phiên bản Supabase tự động quản lý
    null;
  end;
end $$;

-- 3.2. SỬA TRIỆT ĐỂ LỖI 500 "Database error querying schema"
-- Chỉ gán chuỗi rỗng '' cho các cột token (loại trừ cột phone để không vi phạm ràng buộc UNIQUE users_phone_key)
do $$
declare
  col text;
begin
  for col in 
    select column_name 
    from information_schema.columns 
    where table_schema = 'auth' 
      and table_name = 'users' 
      and column_name in (
        'confirmation_token', 'recovery_token', 'email_change_token_new',
        'email_change', 'email_change_token_current', 'reauthentication_token'
      )
  loop
    execute format('update auth.users set %I = '''' where %I is null and email in (''admin@suvietky.vn'', ''docgia@suvietky.vn'')', col, col);
  end loop;
end $$;

-- 4. BẢNG HỒ SƠ NGƯỜI DÙNG (PROFILES)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- Đồng bộ hồ sơ cho các tài khoản vừa tạo
insert into public.profiles (id, name, role)
select id, coalesce(raw_user_meta_data->>'name', email), coalesce(raw_user_meta_data->>'role', 'user')
from auth.users
where email in ('admin@suvietky.vn', 'docgia@suvietky.vn')
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role;

-- 5. BẢNG QUẢN LÝ SÁCH & CỔ THƯ (BOOKS)
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null default '',
  era text not null default '',
  type text not null default 'Tư liệu lịch sử',
  description text not null default '',
  image text,
  source text,
  source_name text,
  full_text text,
  translation text,
  audio_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. BẢNG THÔNG BÁO HỆ THỐNG (NOTIFICATIONS)
create table if not exists public.notifications (
  id bigint generated by default as identity primary key,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

-- 7. BẢNG GHI NHẬN LƯỢT TRUY CẬP (SITE_VIEWS)
create table if not exists public.site_views (
  id bigint generated by default as identity primary key,
  path text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 8. KÍCH HOẠT ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.notifications enable row level security;
alter table public.site_views enable row level security;

-- Phân quyền RLS
drop policy if exists "Public can read books" on public.books;
create policy "Public can read books" on public.books for select using (true);

drop policy if exists "Admins can manage books" on public.books;
create policy "Admins can manage books" on public.books for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid());

drop policy if exists "Public insert site views" on public.site_views;
create policy "Public insert site views" on public.site_views for insert with check (true);

drop policy if exists "Public read notifications" on public.notifications;
create policy "Public read notifications" on public.notifications for select using (true);

-- 9. TRIGGER TỰ ĐỘNG TẠO PROFILE KHI CÓ USER MỚI ĐĂNG KÝ TRÊN SUPABASE
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do update set
    name = excluded.name,
    role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
