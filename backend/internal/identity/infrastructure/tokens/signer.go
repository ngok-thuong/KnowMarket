package tokens

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/knowmarket/backend/internal/identity/application"
)

// HS256Signer implements application.TokenSigner.
type HS256Signer struct {
	secret []byte
}

func NewHS256Signer(secret string) *HS256Signer {
	return &HS256Signer{secret: []byte(secret)}
}

type claims struct {
	UserID uuid.UUID `json:"uid"`
	Wallet string    `json:"wallet"`
	jwt.RegisteredClaims
}

func (s *HS256Signer) Sign(userID uuid.UUID, wallet, jti string, ttl time.Duration) (string, time.Time, error) {
	now := time.Now().UTC()
	exp := now.Add(ttl)
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims{
		UserID: userID,
		Wallet: wallet,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			ID:        jti,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	})
	raw, err := t.SignedString(s.secret)
	if err != nil {
		return "", time.Time{}, err
	}
	return raw, exp, nil
}

func (s *HS256Signer) ParseSubjectAndJTI(token string) (uuid.UUID, string, error) {
	t, err := jwt.ParseWithClaims(token, &claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return s.secret, nil
	})
	if err != nil {
		return uuid.Nil, "", err
	}
	c, ok := t.Claims.(*claims)
	if !ok || !t.Valid || c.ID == "" {
		return uuid.Nil, "", fmt.Errorf("invalid token")
	}
	if c.UserID == uuid.Nil {
		return uuid.Nil, "", fmt.Errorf("invalid token")
	}
	return c.UserID, c.ID, nil
}

var _ application.TokenSigner = (*HS256Signer)(nil)
