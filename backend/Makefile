# Makefile for database migrations
# Run from backend/: make migrate-auth-up
# Requires container: knowmarket-postgres (docker compose in infra/compose)

.PHONY: migrate-auth-up migrate-auth-down run

run:
	go run ./cmd/api

migrate-auth-up:
	docker exec -i knowmarket-postgres psql -U knowmarket -d knowmarket < migrations/00001_auth_schema.up.sql

migrate-auth-down:
	docker exec -i knowmarket-postgres psql -U knowmarket -d knowmarket < migrations/00001_auth_schema.down.sql
