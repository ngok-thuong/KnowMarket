-- Reverse order of creation (FKs: roles/sessions depend on users)
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS auth_nonces;
DROP TABLE IF EXISTS users;
