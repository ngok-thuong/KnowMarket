- Idea 
    - Q&A in on and off chain 
- Tool 
    - FE 
        - NestJs, React 
    - BE 
        - Golang 
    - Database 
        - Postgre
    - Infrastructor 
        - CI-CD github 
    - SmartContracts 
        - EVM 
    - Event Listener

- MVP - V1 
    - Usecase 
    - Entities 
        - Relationship 



#  Explain the entity role 

## CLUSTER 1 (Identity/Auth) -> Manager by BE 

** USERS Entity

- The User folder  -> save the user wallet address 

    - The important attributes in Users Entity 
        - ID (PK)
        - wallet_address
        - handle -> show the name (it depended)
        - is_active -> ban/suspend users at the platform layer (the normal layer)

** USER_ROLES Entity

- The platform static role -> include 

    - user_id (FK users) : who can accept role
    - Role : ADMIN / MODERATOR / USER (COMMON, PROJECT)
    - grant_by (FK users) : who give the role 
    - revoked_at : recall the role 

** USER_SESSIONS

- monotor (theo doi) JWT to the "jti" for revoke multi device (thiet bi)

    - user_id (FK users)
    - jti (test, UK - unique key) : the JWT ID unique 
    - expires_at, revoked_at: epired, logout 

??????? Where is the refresh token?

** AUTH_NONCES 

- Prevent the replace attack 

    - nonce (uuid, PK): Challenge 
    - wallet_address (text): It not FK (because the nonce is  generated before the user exist)
    - expires_at, used_at: TLT, single-use 

## CLUSTER 2 Q&A loop (+AI UX)

** questions 

- The role -> read model (mo hinh) the question from chain 

    - chain_id: multi chain 
    - onchain_question_id (text, UK folow to chain) : uint256 stringify 
    - asker_wallet (text): join to users.wallet_address
    - bounty_token, bounty_amount: The escrow info 
    - deadline_at 
    - status (enum)
    - Winer_answer_id (FK answers, nullable) : back-pointer wehn resolve the question 

** ANSWERS 

- The answers belong to the questions  

    - question_id (FK questions)
    - onchain_answer_id (text, UK)
    - answerer_wallet (text) ??????
    - answer_cid (text): the content exist on the IPFS (plaintext)
    - status (enum): winner/lost/submitted
    - vote_count (int) : denormalize (khong chuan hoa) for short quickly 

** ANSWERS_VOTES 

- The role -> vote, enforce a wallet/1 ticket/a question

    - question_id (FK) : unique to the question 
    - answer_id (FK) : answer voted 
    - voter_wallet (text) ->  what is it used?
    - direction (enum) ->  what is it used?
    - weight (int) -> what is it used?
    - question_voter (unique) : just one question for anser_votes -> it is invariant (bat bien)

** PAYOUTS 

- The role -> Audit payout from the QuestionResolved 

    - question_id (FK): Unique to question 
    - answer_id (FK): answer voted by people 
    - amount (numberic)
    - payout_type (text): winner/refund/platform_fee/treasury...
    - tshash: trace on-chain 

** AI_RANKINGS 

- The role -> AI raitings answers -> UX only 

    - question_id (FK, unique)
    - answer_id (FK, unique)
    - ai_score 
    - rank_position
    - reason 

** AI_SUMMARIES 

- The role -> AI will summary the thread to question 
        
        - question_id (FK, Unique) -> 1 summary - 1 question 
        - summary 
        - highlights (Jsonb)

## CLUSTER 3 Content & Paywall (+key delivery)

** PROJECTS 

- The role -> The content group (course series/research project), direct the reviewer + policy (chinh sach)

    - owner_id (FK users)
    - slug (UK)
    - title 
    - contribution_policy (enum)
    - status (enum)

** PROJECT_REVIEWERS 

- The role -> The junction N:M project <-> users 

    - project_id (FK to the projects)
    - reviewer_id (FK to the reviewer)
    - granted_by 
    - revoked_at 

** POSTS

- The role -> Registry post on-chain (free/premium)

    - chain_id 
    - onchain_post_id (UK to chain)
    - creator_wallet (text): join to user 
    - project_id: (FK, nullable) ???? why can nullable?
    - access_type (enum)
    - price_amount 
    - current_revision_id (FK post_revisions): back-pointer  for read quickly 
    - is_suspended (bool) : moderation. 

** POST_REVISIONS 

- The role -> History of the revision immutable 

    - post_id (FK)
    - revision_number 
    - content_cid (free=plaintext, premium=ciphertext) 
        - 2 types   
            - can read immediatly -> free type 
            - encrypted -> pay type 
    - is_encrypted
    - encryption_alg 
    - Unique (post_id, revision_number)

** POST_ACCESS 

- The role -> The interest when buy premium (pending -> confirmed -> reverted)

    - post_id (FK, UK)
    - buyer_wallet (UK)
    - status 
    - purchase_tx_hash 
    - confirmed_at  

** CONTENT_KEYS 

- The role -> Save encrypted content key 

    - chain_id (UK)
    - onchain_post_id (UK) -> join with text, no use FK UUID
    - encrypted_key (bytea)
    - key_version 

** KEY_REQUEST_NONCES 

- The role 