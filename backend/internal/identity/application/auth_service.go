package application

import (
	"context"
	"fmt"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/google/uuid"

	appconfig "github.com/knowmarket/backend/internal/shared/config"
)

// AuthService orchestrates Identity login (nonce + SIWE + session + JWT).
type AuthService struct {
	cfg      *appconfig.Config
	nonces   NonceRepository
	users    UserRepository
	sessions SessionRepository
	tokens   TokenSigner
}

func NewAuthService(
	cfg *appconfig.Config,
	nonces NonceRepository,
	users UserRepository,
	sessions SessionRepository,
	tokens TokenSigner,
) *AuthService {
	return &AuthService{
		cfg:      cfg,
		nonces:   nonces,
		users:    users,
		sessions: sessions,
		tokens:   tokens,
	}
}

// NonceResult is returned to the client to build a SIWE message.
type NonceResult struct {
	Nonce     string
	ExpiresAt time.Time
	Domain    string
	URI       string
	ChainID   int
	Statement string
}

// RegisterNonce creates a server-issued nonce for SIWE (must match message.nonce).
func (s *AuthService) RegisterNonce(ctx context.Context, wallet string) (*NonceResult, error) {
	if !common.IsHexAddress(wallet) {
		return nil, fmt.Errorf("%w", ErrInvalidWallet)
	}
	nonce := uuid.New()
	exp := time.Now().UTC().Add(s.cfg.NonceTTL)
	if err := s.nonces.Insert(ctx, wallet, nonce, exp); err != nil {
		return nil, err
	}
	stmt := s.cfg.SIWEStatement
	return &NonceResult{
		Nonce:     nonce.String(),
		ExpiresAt: exp,
		Domain:    s.cfg.SIWEDomain,
		URI:       s.cfg.SIWEURI,
		ChainID:   s.cfg.SIWEChainID,
		Statement: stmt,
	}, nil
}

// LoginResult is issued after successful SIWE verification.
type LoginResult struct {
	AccessToken string
	ExpiresAt   time.Time
	UserID      uuid.UUID
	Wallet      string
}

// CompleteSiweLogin verifies SIWE, consumes nonce, upserts user, creates session + JWT.
func (s *AuthService) CompleteSiweLogin(ctx context.Context, message, signature string) (*LoginResult, error) {
	wallet, nonceStr, err := VerifySiweLogin(s.cfg, message, signature)
	if err != nil {
		return nil, err
	}
	nonceID, err := uuid.Parse(nonceStr)
	if err != nil {
		return nil, fmt.Errorf("invalid nonce in message")
	}
	ok, err := s.nonces.Consume(ctx, wallet, nonceID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, fmt.Errorf("nonce expired or already used")
	}
	userID, err := s.users.UpsertByWallet(ctx, wallet)
	if err != nil {
		return nil, err
	}
	w, active, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if !active {
		return nil, fmt.Errorf("%w", ErrForbidden)
	}
	jti := uuid.New().String()
	token, expTime, err := s.tokens.Sign(userID, w, jti, s.cfg.JWTTTL)
	if err != nil {
		return nil, err
	}
	if err := s.sessions.Create(ctx, userID, jti, expTime); err != nil {
		return nil, err
	}
	return &LoginResult{
		AccessToken: token,
		ExpiresAt:   expTime,
		UserID:      userID,
		Wallet:      w,
	}, nil
}

// Logout revokes the current session (identified by jti from JWT).
func (s *AuthService) Logout(ctx context.Context, jti string) error {
	return s.sessions.Revoke(ctx, jti)
}

// Authenticate validates Bearer JWT + session row + active user.
func (s *AuthService) Authenticate(ctx context.Context, rawJWT string) (userID uuid.UUID, wallet string, jti string, err error) {
	uid, jtiVal, err := s.tokens.ParseSubjectAndJTI(rawJWT)
	if err != nil {
		return uuid.Nil, "", "", fmt.Errorf("%w: %v", ErrUnauthorized, err)
	}
	sid, ok, err := s.sessions.ValidUserID(ctx, jtiVal)
	if err != nil {
		return uuid.Nil, "", "", err
	}
	if !ok || sid != uid {
		return uuid.Nil, "", "", ErrUnauthorized
	}
	w, active, err := s.users.GetByID(ctx, uid)
	if err != nil {
		return uuid.Nil, "", "", fmt.Errorf("%w: %v", ErrUnauthorized, err)
	}
	if !active {
		return uuid.Nil, "", "", ErrForbidden
	}
	return uid, w, jtiVal, nil
}
