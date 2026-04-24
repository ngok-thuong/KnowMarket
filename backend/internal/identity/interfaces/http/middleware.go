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
			raw := ""
			if len(h) >= 8 && strings.HasPrefix(h, "Bearer ") {
				raw = strings.TrimSpace(h[7:])
			} else if c, err := r.Cookie("km_access_token"); err == nil && c != nil {
				raw = strings.TrimSpace(c.Value)
			}
			if raw == "" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
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
