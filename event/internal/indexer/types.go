package indexer

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

// Decoded event payloads. Field names are the PascalCase form of the Solidity
// argument names so that go-ethereum's abi reflection can populate them via
// BoundContract.UnpackLog.

type QuestionCreatedEvt struct {
	QuestionId   *big.Int
	Asker        common.Address
	BountyToken  common.Address
	BountyAmount *big.Int
	QuestionCid  string
	Deadline     uint64
}

type AnswerSubmittedEvt struct {
	QuestionId *big.Int
	AnswerId   *big.Int
	Answerer   common.Address
	AnswerCid  string
}

type VoteCastEvt struct {
	QuestionId *big.Int
	AnswerId   *big.Int
	Voter      common.Address
	Direction  int8
	Weight     uint32
}

type QuestionResolvedEvt struct {
	QuestionId     *big.Int
	WinnerAnswerId *big.Int
	Winner         common.Address
	PayoutToken    common.Address
	PayoutAmount   *big.Int
	Resolution     uint8
}
