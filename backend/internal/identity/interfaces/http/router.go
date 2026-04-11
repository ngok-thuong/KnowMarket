package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/knowmarket/backend/internal/identity/application"
)

// NewRouter mounts Identity HTTP routes under /v1.
func NewRouter(svc *application.AuthService) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	h := NewAuthHandler(svc)

	r.Route("/v1", func(r chi.Router) {
		r.Post("/auth/nonce", h.PostNonce)
		r.Post("/auth/verify", h.PostVerify)
		r.Group(func(r chi.Router) {
			r.Use(AuthMiddleware(svc))
			r.Get("/me", h.GetMe)
			r.Post("/auth/logout", h.PostLogout)
		})
	})

	return r
}
