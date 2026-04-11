package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/knowmarket/backend/internal/identity/application"
)

type AuthHandler struct {
	svc *application.AuthService
}

func NewAuthHandler(svc *application.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

type nonceReq struct {
	WalletAddress string `json:"wallet_address"`
}

type nonceResp struct {
	Nonce     string `json:"nonce"`
	ExpiresAt string `json:"expires_at"`
	SIWE      struct {
		Domain    string `json:"domain"`
		URI       string `json:"uri"`
		ChainID   int    `json:"chainId"`
		Statement string `json:"statement,omitempty"`
	} `json:"siwe"`
}

func (h *AuthHandler) PostNonce(w http.ResponseWriter, r *http.Request) {
	var req nonceReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}
	res, err := h.svc.RegisterNonce(r.Context(), req.WalletAddress)
	if err != nil {
		if errors.Is(err, application.ErrInvalidWallet) {
			http.Error(w, `{"error":"invalid wallet_address"}`, http.StatusBadRequest)
			return
		}
		http.Error(w, `{"error":"server error"}`, http.StatusInternalServerError)
			return
	}
	w.Header().Set("Content-Type", "application/json")
	out := nonceResp{
		Nonce:     res.Nonce,
		ExpiresAt: res.ExpiresAt.Format(time.RFC3339Nano),
	}
	out.SIWE.Domain = res.Domain
	out.SIWE.URI = res.URI
	out.SIWE.ChainID = res.ChainID
	out.SIWE.Statement = res.Statement
	_ = json.NewEncoder(w).Encode(out)
}

type verifyReq struct {
	Message   string `json:"message"`
	Signature string `json:"signature"`
}

type userDTO struct {
	ID            string `json:"id"`
	WalletAddress string `json:"wallet_address"`
}

type verifyResp struct {
	AccessToken string  `json:"access_token"`
	ExpiresAt   string  `json:"expires_at"`
	User        userDTO `json:"user"`
}

func (h *AuthHandler) PostVerify(w http.ResponseWriter, r *http.Request) {
	var req verifyReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}
	res, err := h.svc.CompleteSiweLogin(r.Context(), req.Message, req.Signature)
	if err != nil {
		st := http.StatusUnauthorized
		if errors.Is(err, application.ErrForbidden) {
			st = http.StatusForbidden
		}
		http.Error(w, `{"error":"authentication failed"}`, st)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(verifyResp{
		AccessToken: res.AccessToken,
		ExpiresAt:   res.ExpiresAt.Format(time.RFC3339Nano),
		User: userDTO{
			ID:            res.UserID.String(),
			WalletAddress: res.Wallet,
		},
	})
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	a, ok := authFrom(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(userDTO{
		ID:            a.UserID.String(),
		WalletAddress: a.Wallet,
	})
}

func (h *AuthHandler) PostLogout(w http.ResponseWriter, r *http.Request) {
	a, ok := authFrom(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	if err := h.svc.Logout(r.Context(), a.JTI); err != nil {
		http.Error(w, `{"error":"server error"}`, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
