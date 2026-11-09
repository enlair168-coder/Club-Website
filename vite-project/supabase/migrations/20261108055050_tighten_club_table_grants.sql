/*
# Tighten table privileges for the club database

## Plain-English summary
New tables in this project were created with broad default privileges for the public API roles.
This migration removes all of them and grants only what each role needs. Visitors can only submit
through the two public functions. Administrators can only read what they need and change the
specific fields the dashboard is designed to change.

## 1. Security changes
- Removes every table privilege from the public (anonymous) and signed-in roles on all club tables.
- admins: no API access at all; administrators are added by the project owner.
- applications: administrators can read; all changes happen through approve and reject functions.
- messages: administrators can read, and can only change status, reply, and reply time.
- members: administrators can read, add, delete, and edit member details. The link back to the
  original application cannot be changed.

## 2. Notes
- Row level security policies from the previous migration remain in place and still apply.
- Public registration and contact submissions continue to work through the two submit functions.
*/

REVOKE ALL ON admins FROM anon, authenticated;
REVOKE ALL ON applications FROM anon, authenticated;
REVOKE ALL ON messages FROM anon, authenticated;
REVOKE ALL ON members FROM anon, authenticated;

GRANT SELECT ON applications TO authenticated;

GRANT SELECT ON messages TO authenticated;
GRANT UPDATE (status, reply, replied_at) ON messages TO authenticated;

GRANT SELECT, DELETE ON members TO authenticated;
GRANT INSERT (full_name, email, phone, gender, generation, position, biography, status) ON members TO authenticated;
GRANT UPDATE (full_name, email, phone, gender, generation, position, biography, status) ON members TO authenticated;
