/*
# Club registration, messages, members and admin dashboard

## Plain-English summary
Adds the database behind the public registration and contact forms and the private admin dashboard.
Visitors can submit applications and messages, but they can never read them. Only club administrators
(accounts listed in the admins table) can view and manage applications, messages and members.

## 1. New tables
- `admins`: user accounts (from sign-in) that are allowed into the admin dashboard.
- `applications`: membership applications with status pending, approved or rejected.
  Each email address can only be used for one application (case-insensitive).
- `messages`: contact messages with status new, read or replied, and an optional reply.
- `members`: approved club members, with generation (2027 or 2026), position and biography.

## 2. Public functions (callable by visitors)
- `submit_application(...)`: validates and stores an application, returns its registration ID.
- `submit_message(...)`: validates and stores a contact message, returns its reference ID.

## 3. Admin functions (signed-in administrators only)
- `is_admin()`: true when the signed-in user is listed in admins.
- `approve_application(...)`: marks an application approved and creates the matching member record.
- `reject_application(...)`: marks an application rejected.

## 4. Security
- Row level security is enabled on every table.
- Visitors have no direct table access; they can only call the two submit functions.
- Administrators can read applications and messages, update message status and replies, and manage members.
- Administrators cannot change application details directly; decisions go through approve or reject.
- The admins table has no API access; administrators are granted by the project owner.

## 5. Notes
- Email addresses are unique across all applications, so a rejected applicant cannot reapply with the same email.
- Functions run with restricted search paths and are not callable by anonymous users, except the two submit functions.
*/

CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('APP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 80),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 3 AND 40),
  gender text CHECK (gender IS NULL OR char_length(gender) <= 40),
  generation text NOT NULL CHECK (generation IN ('2027', '2026', 'applicant')),
  school_class text NOT NULL CHECK (char_length(school_class) BETWEEN 2 AND 120),
  motivation text NOT NULL CHECK (char_length(motivation) BETWEEN 20 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS applications_email_key ON applications (lower(email));
CREATE INDEX IF NOT EXISTS applications_status_created_idx ON applications (status, created_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('MSG-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  sender_name text NOT NULL CHECK (char_length(sender_name) BETWEEN 2 AND 80),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  body text NOT NULL CHECK (char_length(body) BETWEEN 10 AND 2000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  reply text CHECK (reply IS NULL OR char_length(reply) <= 2000),
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_status_created_idx ON messages (status, created_at DESC);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 80),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  gender text CHECK (gender IS NULL OR char_length(gender) <= 40),
  generation text NOT NULL CHECK (generation IN ('2027', '2026')),
  position text NOT NULL DEFAULT 'Member' CHECK (char_length(position) <= 80),
  biography text NOT NULL DEFAULT '' CHECK (char_length(biography) <= 1000),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  source_application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS members_generation_idx ON members (generation);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION submit_application(
  p_full_name text,
  p_email text,
  p_phone text,
  p_gender text,
  p_generation text,
  p_school_class text,
  p_motivation text,
  p_agreed boolean
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference text;
BEGIN
  IF NOT coalesce(p_agreed, false) THEN
    RAISE EXCEPTION 'You must agree to the club values to apply.';
  END IF;

  INSERT INTO applications (full_name, email, phone, gender, generation, school_class, motivation)
  VALUES (
    trim(p_full_name),
    lower(trim(p_email)),
    trim(p_phone),
    nullif(trim(coalesce(p_gender, '')), ''),
    p_generation,
    trim(p_school_class),
    trim(p_motivation)
  )
  RETURNING reference INTO v_reference;

  RETURN v_reference;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'An application with this email already exists. Contact us if you need help.';
  WHEN check_violation THEN
    RAISE EXCEPTION 'Please check your details and try again.';
END;
$$;

CREATE OR REPLACE FUNCTION submit_message(
  p_sender_name text,
  p_email text,
  p_body text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference text;
BEGIN
  INSERT INTO messages (sender_name, email, body)
  VALUES (trim(p_sender_name), lower(trim(p_email)), trim(p_body))
  RETURNING reference INTO v_reference;

  RETURN v_reference;
EXCEPTION
  WHEN check_violation THEN
    RAISE EXCEPTION 'Please check your details and try again.';
END;
$$;

CREATE OR REPLACE FUNCTION approve_application(
  p_application_id uuid,
  p_generation text,
  p_position text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app applications%ROWTYPE;
  v_member_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized.';
  END IF;

  SELECT * INTO v_app FROM applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found.';
  END IF;
  IF v_app.status <> 'pending' THEN
    RAISE EXCEPTION 'This application has already been reviewed.';
  END IF;

  UPDATE applications SET status = 'approved', reviewed_at = now() WHERE id = v_app.id;

  INSERT INTO members (full_name, email, phone, gender, generation, position, source_application_id)
  VALUES (
    v_app.full_name,
    v_app.email,
    v_app.phone,
    v_app.gender,
    p_generation,
    coalesce(nullif(trim(p_position), ''), 'Member'),
    v_app.id
  )
  RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION reject_application(p_application_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized.';
  END IF;

  UPDATE applications
  SET status = 'rejected', reviewed_at = now()
  WHERE id = p_application_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or already reviewed.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_application(text, text, text, text, text, text, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION submit_message(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION approve_application(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION reject_application(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION submit_application(text, text, text, text, text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_message(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_application(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_application(uuid) TO authenticated;

GRANT SELECT ON applications TO authenticated;
GRANT SELECT ON messages TO authenticated;
GRANT UPDATE (status, reply, replied_at) ON messages TO authenticated;
GRANT SELECT, DELETE ON members TO authenticated;
GRANT INSERT ON members TO authenticated;
GRANT UPDATE (full_name, email, phone, gender, generation, position, biography, status) ON members TO authenticated;

DROP POLICY IF EXISTS "admins_select_applications" ON applications;
CREATE POLICY "admins_select_applications" ON applications FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admins_select_messages" ON messages;
CREATE POLICY "admins_select_messages" ON messages FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admins_update_messages" ON messages;
CREATE POLICY "admins_update_messages" ON messages FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admins_select_members" ON members;
CREATE POLICY "admins_select_members" ON members FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admins_insert_members" ON members;
CREATE POLICY "admins_insert_members" ON members FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admins_update_members" ON members;
CREATE POLICY "admins_update_members" ON members FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admins_delete_members" ON members;
CREATE POLICY "admins_delete_members" ON members FOR DELETE
  TO authenticated USING (is_admin());
