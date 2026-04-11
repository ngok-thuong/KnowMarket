// Package application implements Identity use cases and orchestrates ports.
package application

import (
	"fmt"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	siwe "github.com/spruceid/siwe-go"

	appconfig "github.com/knowmarket/backend/internal/shared/config"
)

// VerifySiweLogin parses EIP-4361, checks domain/URI/chain against config, verifies signature.
// Returns wallet (lowercase hex) and nonce for persistence / nonce consumption.
func VerifySiweLogin(cfg *appconfig.Config, message, signature string) (wallet string, nonce string, err error) {
	if strings.TrimSpace(message) == "" || strings.TrimSpace(signature) == "" {
		return "", "", fmt.Errorf("message and signature are required")
	}

	msg, err := siwe.ParseMessage(message)
	if err != nil {
		return "", "", fmt.Errorf("siwe parse: %w", err)
	}

	if msg.GetDomain() != cfg.SIWEDomain {
		return "", "", fmt.Errorf("siwe domain mismatch")
	}
	uri := msg.GetURI()
	if normalizeURI(uri.String()) != normalizeURI(cfg.SIWEURI) {
		return "", "", fmt.Errorf("siwe uri mismatch")
	}
	if msg.GetChainID() != cfg.SIWEChainID {
		return "", "", fmt.Errorf("siwe chain id mismatch")
	}

	if stmt := msg.GetStatement(); cfg.SIWEStatement != "" {
		if stmt == nil || *stmt != cfg.SIWEStatement {
			return "", "", fmt.Errorf("siwe statement mismatch")
		}
	}

	domain := cfg.SIWEDomain
	n := msg.GetNonce()
	now := time.Now().UTC()
	if _, err := msg.Verify(signature, &domain, &n, &now); err != nil {
		return "", "", fmt.Errorf("siwe verify: %w", err)
	}

	addr := msg.GetAddress()
	if addr == (common.Address{}) {
		return "", "", fmt.Errorf("siwe address missing")
	}

	return strings.ToLower(addr.Hex()), n, nil
}

func normalizeURI(u string) string {
	return strings.TrimSuffix(strings.TrimSpace(u), "/")
}
