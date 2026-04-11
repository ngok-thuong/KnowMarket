package persistence

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SessionRepo struct {
	pool *pgxpool.Pool
}

func NewSessionRepo(pool *pgxpool.Pool) *SessionRepo {
	return &SessionRepo{pool: pool}
}

func (r *SessionRepo) Create(ctx context.Context, userID uuid.UUID, jti string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO user_sessions (user_id, jti, expires_at)
		VALUES ($1, $2, $3)
	`, userID, jti, expiresAt)
	return err
}

func (r *SessionRepo) Revoke(ctx context.Context, jti string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE user_sessions SET revoked_at = now() WHERE jti = $1 AND revoked_at IS NULL
	`, jti)
	return err
}

func (r *SessionRepo) ValidUserID(ctx context.Context, jti string) (uuid.UUID, bool, error) {
	var uid uuid.UUID
	err := r.pool.QueryRow(ctx, `
		SELECT user_id FROM user_sessions
		WHERE jti = $1 AND revoked_at IS NULL AND expires_at > now()
	`, jti).Scan(&uid)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, false, nil
	}
	if err != nil {
		return uuid.Nil, false, err
	}
	return uid, true, nil
}
