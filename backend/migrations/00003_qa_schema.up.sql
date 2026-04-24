-- Q&A bounded context: read model fed by the indexer from QnA contract events.
-- Tables: questions, answers, answer_votes, payouts.
-- Invariants enforced here:
--   I6 — questions.status='resolved' ↔ winner_answer_id IS NOT NULL
--   I7 — UNIQUE(question_id, voter_wallet) — 1 wallet = 1 vote per question

CREATE TYPE question_status AS ENUM (
    'open',
    'resolved',
    'refunded',
    'expired',
    'treasury',
    'extended'
);

CREATE TYPE answer_status AS ENUM (
    'submitted',
    'winner',
    'lost'
);

CREATE TYPE vote_direction AS ENUM (
    'up',
    'down'
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id INT NOT NULL,
    onchain_question_id TEXT NOT NULL,
    asker_wallet TEXT NOT NULL
        CONSTRAINT chk_questions_asker CHECK (asker_wallet ~ '^0x[a-f0-9]{40}$'),
    title TEXT,
    question_cid TEXT,
    bounty_token TEXT NOT NULL
        CONSTRAINT chk_questions_bounty_token CHECK (bounty_token ~ '^0x[a-f0-9]{40}$'),
    bounty_amount NUMERIC(78, 0) NOT NULL
        CONSTRAINT chk_questions_bounty_amount CHECK (bounty_amount > 0),
    deadline_at TIMESTAMPTZ NOT NULL,
    status question_status NOT NULL DEFAULT 'open',
    winner_answer_id UUID,
    resolution_type TEXT
        CONSTRAINT chk_questions_resolution_type CHECK (
            resolution_type IS NULL OR resolution_type IN (
                'winner_by_votes', 'no_answer', 'no_votes', 'refunded', 'treasury', 'extended'
            )
        ),
    payout_amount NUMERIC(78, 0)
        CONSTRAINT chk_questions_payout_amount CHECK (payout_amount IS NULL OR payout_amount >= 0),
    payout_token TEXT
        CONSTRAINT chk_questions_payout_token CHECK (payout_token IS NULL OR payout_token ~ '^0x[a-f0-9]{40}$'),
    created_tx_hash TEXT NOT NULL
        CONSTRAINT chk_questions_created_tx_hash CHECK (created_tx_hash ~ '^0x[a-f0-9]{64}$'),
    created_block_number BIGINT NOT NULL
        CONSTRAINT chk_questions_created_block CHECK (created_block_number >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    CONSTRAINT uq_questions_onchain UNIQUE (chain_id, onchain_question_id),
    CONSTRAINT chk_questions_resolved_winner CHECK (
        (status = 'resolved' AND winner_answer_id IS NOT NULL) OR
        (status <> 'resolved' AND winner_answer_id IS NULL)
    )
);

CREATE INDEX idx_questions_status_deadline ON questions (status, deadline_at);
CREATE INDEX idx_questions_asker_created ON questions (asker_wallet, created_at DESC);

CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    chain_id INT NOT NULL,
    onchain_answer_id TEXT NOT NULL,
    answerer_wallet TEXT NOT NULL
        CONSTRAINT chk_answers_answerer CHECK (answerer_wallet ~ '^0x[a-f0-9]{40}$'),
    answer_cid TEXT NOT NULL,
    status answer_status NOT NULL DEFAULT 'submitted',
    vote_count INT NOT NULL DEFAULT 0
        CONSTRAINT chk_answers_vote_count CHECK (vote_count >= 0),
    created_tx_hash TEXT NOT NULL
        CONSTRAINT chk_answers_created_tx_hash CHECK (created_tx_hash ~ '^0x[a-f0-9]{64}$'),
    created_block_number BIGINT NOT NULL
        CONSTRAINT chk_answers_created_block CHECK (created_block_number >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_answers_onchain UNIQUE (chain_id, onchain_answer_id)
);

CREATE INDEX idx_answers_question_votes ON answers (question_id, vote_count DESC);
CREATE INDEX idx_answers_question_created ON answers (question_id, created_at);

-- Deferred FK: questions.winner_answer_id → answers.id (chicken-and-egg broken here).
ALTER TABLE questions
    ADD CONSTRAINT fk_questions_winner_answer
    FOREIGN KEY (winner_answer_id) REFERENCES answers (id) ON DELETE SET NULL;

CREATE TABLE answer_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    answer_id UUID NOT NULL REFERENCES answers (id) ON DELETE CASCADE,
    voter_wallet TEXT NOT NULL
        CONSTRAINT chk_answer_votes_voter CHECK (voter_wallet ~ '^0x[a-f0-9]{40}$'),
    direction vote_direction NOT NULL DEFAULT 'up',
    weight INT NOT NULL DEFAULT 1
        CONSTRAINT chk_answer_votes_weight CHECK (weight > 0),
    vote_tx_hash TEXT NOT NULL
        CONSTRAINT chk_answer_votes_tx_hash CHECK (vote_tx_hash ~ '^0x[a-f0-9]{64}$'),
    vote_block_number BIGINT NOT NULL
        CONSTRAINT chk_answer_votes_block CHECK (vote_block_number >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_answer_votes_question_voter UNIQUE (question_id, voter_wallet)
);

CREATE INDEX idx_answer_votes_answer ON answer_votes (answer_id);
CREATE INDEX idx_answer_votes_question ON answer_votes (question_id);

CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id INT NOT NULL,
    question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    recipient_wallet TEXT NOT NULL
        CONSTRAINT chk_payouts_recipient CHECK (recipient_wallet ~ '^0x[a-f0-9]{40}$'),
    amount NUMERIC(78, 0) NOT NULL
        CONSTRAINT chk_payouts_amount CHECK (amount > 0),
    token TEXT NOT NULL
        CONSTRAINT chk_payouts_token CHECK (token ~ '^0x[a-f0-9]{40}$'),
    payout_type TEXT NOT NULL
        CONSTRAINT chk_payouts_type CHECK (payout_type IN ('winner', 'refund', 'platform_fee', 'treasury')),
    tx_hash TEXT NOT NULL
        CONSTRAINT chk_payouts_tx_hash CHECK (tx_hash ~ '^0x[a-f0-9]{64}$'),
    block_number BIGINT NOT NULL
        CONSTRAINT chk_payouts_block CHECK (block_number >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_payouts_tx_type UNIQUE (chain_id, tx_hash, payout_type)
);

CREATE INDEX idx_payouts_question ON payouts (question_id);
CREATE INDEX idx_payouts_recipient ON payouts (recipient_wallet, created_at DESC);
