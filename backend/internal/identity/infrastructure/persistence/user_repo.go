package persistence

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{pool: pool}
}

func (r *UserRepo) UpsertByWallet(ctx context.Context, wallet string) (uuid.UUID, error) {
	wallet = normWallet(wallet)
	var id uuid.UUID
	err := r.pool.QueryRow(ctx, `
		INSERT INTO users (wallet_address)
		VALUES ($1)
		ON CONFLICT (wallet_address) DO UPDATE
			SET updated_at = now()
		RETURNING id
	`, wallet).Scan(&id)
	return id, err
}

func (r *UserRepo) GetByID(ctx context.Context, id uuid.UUID) (wallet string, active bool, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT wallet_address, is_active FROM users WHERE id = $1
	`, id).Scan(&wallet, &active)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", false, fmt.Errorf("user not found: %w", err)
		}
		return "", false, err
	}
	return wallet, active, nil
}

func normWallet(w string) string {
	return strings.ToLower(strings.TrimSpace(w))
}
