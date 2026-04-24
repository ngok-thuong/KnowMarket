-- Reverse order of creation (FK: payouts/answer_votes/answers → questions;
-- questions.winner_answer_id → answers is dropped implicitly with the table).
DROP TABLE IF EXISTS payouts;
DROP TABLE IF EXISTS answer_votes;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS questions;

DROP TYPE IF EXISTS vote_direction;
DROP TYPE IF EXISTS answer_status;
DROP TYPE IF EXISTS question_status;
