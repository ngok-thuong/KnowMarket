// Package config loads environment-based settings for the API (shared kernel).
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds runtime settings loaded from the environment.
type Config struct {
	HTTPAddr      string
	DatabaseURL   string
	JWTSecret     string
	NonceTTL      time.Duration
	JWTTTL        time.Duration
	SIWEDomain    string
	SIWEURI       string
	SIWEChainID   int
	SIWEStatement string
}

// Load reads required env vars and applies defaults for optional ones.
func Load() (*Config, error) {
	nonceMin := 5
	if v := os.Getenv("AUTH_NONCE_TTL_MINUTES"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			return nil, fmt.Errorf("AUTH_NONCE_TTL_MINUTES: %w", err)
		}
		nonceMin = n
	}

	jwtDays := 7
	if v := os.Getenv("AUTH_JWT_TTL_DAYS"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			return nil, fmt.Errorf("AUTH_JWT_TTL_DAYS: %w", err)
		}
		jwtDays = n
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	addr := os.Getenv("HTTP_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	siweDomain := os.Getenv("SIWE_DOMAIN")
	if siweDomain == "" {
		return nil, fmt.Errorf("SIWE_DOMAIN is required (e.g. localhost for dev)")
	}
	siweURI := os.Getenv("SIWE_URI")
	if siweURI == "" {
		return nil, fmt.Errorf("SIWE_URI is required (e.g. http://localhost:3000)")
	}
	chainID := 8453
	if v := os.Getenv("SIWE_CHAIN_ID"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			return nil, fmt.Errorf("SIWE_CHAIN_ID: %w", err)
		}
		chainID = n
	}
	statement := strings.TrimSpace(os.Getenv("SIWE_STATEMENT"))

	return &Config{
		HTTPAddr:      addr,
		DatabaseURL:   dbURL,
		JWTSecret:     secret,
		NonceTTL:      time.Duration(nonceMin) * time.Minute,
		JWTTTL:        time.Duration(jwtDays) * 24 * time.Hour,
		SIWEDomain:    siweDomain,
		SIWEURI:       siweURI,
		SIWEChainID:   chainID,
		SIWEStatement: statement,
	}, nil
}
