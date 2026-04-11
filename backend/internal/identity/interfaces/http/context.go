package http

import (
	"context"

	"github.com/google/uuid"
)

type ctxKey int

const authCtxKey ctxKey = 1

// Auth holds authenticated caller identity (set by middleware).
type Auth struct {
	UserID uuid.UUID
	Wallet string
	JTI    string
}

func withAuth(ctx context.Context, a Auth) context.Context {
	return context.WithValue(ctx, authCtxKey, a)
}

func authFrom(ctx context.Context) (Auth, bool) {
	v, ok := ctx.Value(authCtxKey).(Auth)
	return v, ok
}
