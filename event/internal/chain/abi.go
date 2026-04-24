// Package chain wires up the EVM client and the QnA contract ABI.
package chain

import (
	_ "embed"
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
)

//go:embed QnA.abi.json
var qnaABIJSON string

// Event names — locked by docs/spec/events.md.
const (
	EventQuestionCreated  = "QuestionCreated"
	EventAnswerSubmitted  = "AnswerSubmitted"
	EventVoteCast         = "VoteCast"
	EventQuestionResolved = "QuestionResolved"
)

// QnA holds the parsed ABI, a BoundContract for log decoding, and a topic lookup.
type QnA struct {
	ABI               abi.ABI
	Bound             *bind.BoundContract
	Address           common.Address
	TopicsByEventName map[string]common.Hash
}

// LoadQnA parses the embedded ABI and prepares topic hashes for the 4 Q&A events.
func LoadQnA(addr common.Address) (*QnA, error) {
	parsed, err := abi.JSON(strings.NewReader(qnaABIJSON))
	if err != nil {
		return nil, fmt.Errorf("parse QnA abi: %w", err)
	}
	bound := bind.NewBoundContract(addr, parsed, nil, nil, nil)
	topics := map[string]common.Hash{}
	for _, name := range []string{
		EventQuestionCreated,
		EventAnswerSubmitted,
		EventVoteCast,
		EventQuestionResolved,
	} {
		ev, ok := parsed.Events[name]
		if !ok {
			return nil, fmt.Errorf("event %q missing in ABI", name)
		}
		topics[name] = ev.ID
	}
	return &QnA{
		ABI:               parsed,
		Bound:             bound,
		Address:           addr,
		TopicsByEventName: topics,
	}, nil
}

// AllTopic0 returns the topic[0] filter for every indexed Q&A event.
func (q *QnA) AllTopic0() []common.Hash {
	out := make([]common.Hash, 0, len(q.TopicsByEventName))
	for _, h := range q.TopicsByEventName {
		out = append(out, h)
	}
	return out
}

// EventNameFromTopic0 resolves a log's topic[0] to a known event name, or "" if unknown.
func (q *QnA) EventNameFromTopic0(topic common.Hash) string {
	for name, h := range q.TopicsByEventName {
		if h == topic {
			return name
		}
	}
	return ""
}
