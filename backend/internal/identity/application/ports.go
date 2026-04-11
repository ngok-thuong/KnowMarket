package application

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// NonceRepository persists login nonces (single-use, TTL).
type NonceRepository interface {
	Insert(ctx context.Context, wallet string, nonce uuid.UUID, expiresAt time.Time) error
	Consume(ctx context.Context, wallet string, nonce uuid.UUID) (ok bool, err error)
}

// UserRepository stores off-chain user rows keyed by wallet.
type UserRepository interface {
	UpsertByWallet(ctx context.Context, wallet string) (id uuid.UUID, err error)
	GetByID(ctx context.Context, id uuid.UUID) (wallet string, active bool, err error)
}

// SessionRepository tracks JWT sessions (jti) for revocation.
type SessionRepository interface {
	Create(ctx context.Context, userID uuid.UUID, jti string, expiresAt time.Time) error
	Revoke(ctx context.Context, jti string) error
	ValidUserID(ctx context.Context, jti string) (userID uuid.UUID, ok bool, err error)
}

// TokenSigner issues access tokens after successful login.
type TokenSigner interface {
	Sign(userID uuid.UUID, wallet string, jti string, ttl time.Duration) (token string, expiresAt time.Time, err error)
	ParseSubjectAndJTI(token string) (userID uuid.UUID, jti string, err error)
}
