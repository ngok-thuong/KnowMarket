-- Auth cluster (users, nonces, sessions, roles) — KnowMarket API
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL
        CONSTRAINT chk_users_wallet CHECK (wallet_address ~ '^0x[a-f0-9]{40}$'),
    handle TEXT,
    avatar_cid TEXT,
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_wallet UNIQUE (wallet_address),
    CONSTRAINT uq_users_handle UNIQUE (handle)
);

CREATE INDEX idx_users_created_at ON users (created_at DESC);

CREATE TABLE auth_nonces (
    nonce UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL
        CONSTRAINT chk_auth_nonces_wallet CHECK (wallet_address ~ '^0x[a-f0-9]{40}$'),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_nonces_wallet_expires ON auth_nonces (wallet_address, expires_at);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    jti TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_sessions_jti UNIQUE (jti)
);

CREATE INDEX idx_user_sessions_user ON user_sessions (user_id);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    granted_by UUID REFERENCES users (id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles (user_id);
