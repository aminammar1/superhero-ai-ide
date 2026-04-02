ifeq ($(OS),Windows_NT)
SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -Command
PYTHON_CMD := py
NPM_CMD := npm.cmd
DEV_LOCAL_CMD := powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev-local.ps1
CLEAN_CMD := if (Test-Path .next) { Remove-Item -Recurse -Force .next }; if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
VENV_PYTHON := .venv\\Scripts\\python.exe
else
SHELL := /bin/bash
.SHELLFLAGS := -lc
PYTHON_CMD := python3
NPM_CMD := npm
DEV_LOCAL_CMD := bash scripts/dev-local.sh
CLEAN_CMD := rm -rf .next node_modules
VENV_PYTHON := .venv/bin/python
endif

.DEFAULT_GOAL := help

.PHONY: help venv install install-frontend-deps install-backend-deps dev dev-local frontend backend docker-build docker-up clean

help:
	@echo ""
	@echo "SuperHero AI IDE commands:"
	@echo "  make help         Show available commands"
	@echo "  make venv         Create Python virtual environment (.venv)"
	@echo "  make install      Install all project dependencies"
	@echo "  make install-frontend-deps Install frontend dependencies"
	@echo "  make install-backend-deps  Install backend dependencies"
	@echo "  make dev          Run frontend + backend with Docker Compose"
	@echo "  make dev-local    Run frontend + backend locally"
	@echo "  make frontend     Run Next.js frontend locally"
	@echo "  make backend      Run FastAPI microservices locally"
	@echo "  make docker-build Build Docker images"
	@echo "  make docker-up    Start Docker services"
	@echo "  make clean        Remove local build artifacts"
	@echo ""


venv:
	$(PYTHON_CMD) -m venv .venv

install: install-frontend-deps install-backend-deps

install-frontend-deps:
	$(NPM_CMD) install

install-backend-deps: venv
	$(VENV_PYTHON) -m pip install --upgrade pip
	$(VENV_PYTHON) -m pip install -r backend/requirements.txt

dev:
	docker compose up --build

dev-local: venv
	$(DEV_LOCAL_CMD)

frontend:
	$(NPM_CMD) install
	$(NPM_CMD) run dev

backend: venv
	$(VENV_PYTHON) backend/dev.py

docker-build:
	docker compose build

docker-up:
	docker compose up

clean:
	$(CLEAN_CMD)
