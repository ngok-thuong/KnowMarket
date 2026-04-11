package persistence

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NonceRepo struct {
	pool *pgxpool.Pool
}

func NewNonceRepo(pool *pgxpool.Pool) *NonceRepo {
	return &NonceRepo{pool: pool}
}

func (r *NonceRepo) Insert(ctx context.Context, wallet string, nonce uuid.UUID, expiresAt time.Time) error {
	wallet = normWallet(wallet)
	_, err := r.pool.Exec(ctx, `
		INSERT INTO auth_nonces (nonce, wallet_address, expires_at)
		VALUES ($1, $2, $3)
	`, nonce, wallet, expiresAt)
	return err
}

func (r *NonceRepo) Consume(ctx context.Context, wallet string, nonce uuid.UUID) (bool, error) {
	wallet = normWallet(wallet)
	cmd, err := r.pool.Exec(ctx, `
		UPDATE auth_nonces
		SET used_at = now()
		WHERE nonce = $1
		  AND wallet_address = $2
		  AND used_at IS NULL
		  AND expires_at > now()
	`, nonce, wallet)
	if err != nil {
		return false, err
	}
	return cmd.RowsAffected() == 1, nil
}
