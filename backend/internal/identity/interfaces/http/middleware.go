package http

import (
	"errors"
	"net/http"
	"strings"

	"github.com/knowmarket/backend/internal/identity/application"
)

func AuthMiddleware(svc *application.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := r.Header.Get("Authorization")
			if len(h) < 8 || !strings.HasPrefix(h, "Bearer ") {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			raw := strings.TrimSpace(h[7:])
			uid, wallet, jti, err := svc.Authenticate(r.Context(), raw)
			if err != nil {
				if errors.Is(err, application.ErrForbidden) {
					http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
					return
				}
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r.WithContext(withAuth(r.Context(), Auth{
				UserID: uid,
				Wallet: wallet,
				JTI:    jti,
			})))
		})
	}
}
