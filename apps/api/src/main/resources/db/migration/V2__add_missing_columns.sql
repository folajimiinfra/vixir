-- V2: columns that exist in entities but were absent from V1 schema

ALTER TABLE attempt
    ADD COLUMN IF NOT EXISTS anon_token_hash text;

ALTER TABLE submission
    ADD COLUMN IF NOT EXISTS idempotency_key text;
