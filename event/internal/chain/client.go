package chain

import (
	"context"
	"fmt"

	"github.com/ethereum/go-ethereum/ethclient"
)

// Dial connects to the RPC endpoint and verifies that its chain id matches the expected value.
func Dial(ctx context.Context, rpcURL string, expectedChainID int64) (*ethclient.Client, error) {
	c, err := ethclient.DialContext(ctx, rpcURL)
	if err != nil {
		return nil, fmt.Errorf("dial rpc %s: %w", rpcURL, err)
	}
	got, err := c.ChainID(ctx)
	if err != nil {
		c.Close()
		return nil, fmt.Errorf("get chain id: %w", err)
	}
	if got.Int64() != expectedChainID {
		c.Close()
		return nil, fmt.Errorf("chain id mismatch: rpc returned %d, expected %d", got.Int64(), expectedChainID)
	}
	return c, nil
}
