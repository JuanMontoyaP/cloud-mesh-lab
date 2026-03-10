# Cloud Mesh Lab

A distributed microservices application built with FastAPI and deployed on AWS using ECS Fargate, Aurora MySQL, and an Application Load Balancer. Infrastructure is managed with AWS CDK (TypeScript).

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Services](#services)
  - [Users Service](#users-service)
  - [Tasks Service](#tasks-service)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
  - [Prerequisites](#prerequisites)
  - [Run All Services](#run-all-services)
  - [Run a Single Service](#run-a-single-service)
  - [Database Migrations](#database-migrations)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Infrastructure](#infrastructure)
  - [CDK Stacks](#cdk-stacks)
  - [Deploying to AWS](#deploying-to-aws)
- [CI/CD](#cicd)

---

## Overview

Cloud Mesh Lab is a lab project showcasing a production-grade microservices architecture. It consists of two independent REST API services (Users and Tasks), each with its own MySQL database, deployed behind an Application Load Balancer on AWS ECS Fargate.

Each service:

- Is independently deployable via Docker
- Owns its own database with Alembic-managed schema migrations
- Supports read/write database splitting for scalability
- Exposes an OpenAPI-documented REST API

---

## Architecture

```
                        ┌─────────────────────────────────────────────────┐
                        │                   AWS VPC (10.0.0.0/16)          │
                        │                                                   │
 ┌──────────┐           │  ┌────────────────────────────────────────────┐  │
 │  Client  │──HTTP:80──┼─►│           Application Load Balancer        │  │
 └──────────┘           │  │  /users/*  ──────────►  users-tg           │  │
                        │  │  /tasks/*  ──────────►  tasks-tg           │  │
                        │  └─────────────────────────────────────────── ┘  │
                        │                    │                │             │
                        │                    ▼                ▼             │
                        │  ┌──────────────────┐  ┌──────────────────┐     │
                        │  │   ECS (Fargate)   │  │   ECS (Fargate)  │     │
                        │  │  Users Service    │  │  Tasks Service   │     │
                        │  │  (port 80)        │  │  (port 80)       │     │
                        │  └────────┬──────────┘  └────────┬─────────┘     │
                        │           │                       │               │
                        │           └───────────┬───────────┘               │
                        │                       ▼                           │
                        │         ┌─────────────────────────┐              │
                        │         │  Aurora MySQL Cluster   │              │
                        │         │  (ServiceMeshDB)        │              │
                        │         │  users_db | tasks_db    │              │
                        │         └─────────────────────────┘              │
                        └─────────────────────────────────────────────────┘
```

Traffic routing:

- `GET /users/*` → Users Service
- `GET /tasks/*` → Tasks Service

---

## Services

### Users Service

Manages user accounts. Runs on port `8001` locally and on path prefix `/users` in production.

**Responsibilities:** Create, retrieve, update, and delete users. Passwords are stored as bcrypt hashes.

### Tasks Service

Manages tasks associated with users. Runs on port `8002` locally and on path prefix `/tasks` in production.

**Responsibilities:** Create, retrieve, update, and delete tasks; list all tasks for a given user.

---

## Tech Stack

| Layer              | Technology                    |
| ------------------ | ----------------------------- |
| Language           | Python 3.14                   |
| Framework          | FastAPI                       |
| ORM                | SQLAlchemy (async)            |
| Migrations         | Alembic                       |
| Database (local)   | MySQL 8.0                     |
| Database (AWS)     | Aurora MySQL (ServerlessV2)   |
| Packaging          | `uv`                          |
| Containerization   | Docker (multi-stage, Alpine)  |
| Orchestration      | AWS ECS Fargate               |
| Infrastructure     | AWS CDK (TypeScript)          |
| Secrets            | AWS Secrets Manager           |
| Load Balancing     | AWS Application Load Balancer |
| Container Registry | AWS ECR                       |
| CI/CD              | GitHub Actions + OIDC         |

---

## Project Structure

```
cloud-mesh-lab/
├── app/
│   ├── docker-compose.all.yml     # Compose file to run all services together
│   ├── docker-compose.db.yml      # Shared MySQL + Adminer
│   ├── scripts/
│   │   └── init-db.sql            # Database and user initialization
│   ├── make/
│   │   └── service.mk             # Shared Makefile targets for all services
│   ├── users/                     # Users microservice
│   │   ├── src/
│   │   │   ├── api/               # Route handlers
│   │   │   ├── core/              # Config, dependencies, logging
│   │   │   ├── db/                # Engine and session setup
│   │   │   ├── helpers/           # Password hashing utilities
│   │   │   ├── schemas/           # Pydantic models
│   │   │   └── services/          # Repository pattern (data access)
│   │   ├── alembic/               # Migration scripts
│   │   ├── Dockerfile
│   │   ├── Dockerfile.migrations
│   │   └── pyproject.toml
│   └── tasks/                     # Tasks microservice
│       ├── src/
│       │   ├── api/               # Route handlers
│       │   ├── core/              # Config, dependencies, logging
│       │   ├── db/                # Engine and session setup
│       │   ├── schemas/           # Pydantic models
│       │   └── services/          # Repository pattern (data access)
│       ├── alembic/               # Migration scripts
│       ├── Dockerfile
│       ├── Dockerfile.migrations
│       └── pyproject.toml
├── infra/                         # AWS CDK infrastructure (TypeScript)
│   ├── bin/infra.ts               # CDK app entry point
│   └── lib/
│       ├── stacks/                # One file per CDK stack
│       └── constructs/            # Reusable CDK constructs
├── lambda/
│   └── db-init/                   # Lambda for database initialization on AWS
└── scripts/
    ├── configure-aws-oidc.sh      # Set up GitHub Actions OIDC role
    └── configure-gh-secrets.sh    # Populate GitHub Actions secrets
```

---

## Local Development

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- `make`
- AWS CLI (only for push/deploy operations)

### Run All Services

Start MySQL, the Users service, and the Tasks service together:

```bash
make run
# equivalent to:
make run SERVICE=all
```

This command:

1. Builds Docker images for all services in parallel
2. Starts the shared MySQL database and Adminer
3. Runs Alembic migrations for each service

| Service          | URL                   |
| ---------------- | --------------------- |
| Users Service    | http://localhost:8001 |
| Tasks Service    | http://localhost:8002 |
| Adminer (DB GUI) | http://localhost:8080 |

### Run a Single Service

```bash
# Run only the users service (with its own DB)
make run SERVICE=users

# Run only the tasks service (with its own DB)
make run SERVICE=tasks
```

To run a service locally without Docker (with hot reload):

```bash
cd app/users   # or app/tasks
make dev
```

This syncs dependencies via `uv`, starts the shared database container, and launches Uvicorn with `--reload`.

### Stop and Clean Up

```bash
make clean          # Stop all containers (removes volumes)
make clean SERVICE=users  # Stop only the users service
```

### View Logs

```bash
make logs SERVICE=users
make logs SERVICE=tasks
```

### Database Migrations

Migrations are managed with Alembic. Run them inside a service directory:

```bash
cd app/users
make migrations   # runs: uv run alembic upgrade head

cd app/tasks
make migrations
```

---

## Environment Variables

Each service reads its configuration from environment variables (or a `.env` file in development).

| Variable             | Required | Default         | Description                               |
| -------------------- | -------- | --------------- | ----------------------------------------- |
| `DATABASE_HOST`      | Yes      | —               | MySQL host                                |
| `DATABASE_PORT`      | Yes      | —               | MySQL port                                |
| `DATABASE_USER`      | Yes      | —               | MySQL user                                |
| `DATABASE_PASSWORD`  | Yes      | —               | MySQL password                            |
| `DATABASE_NAME`      | Yes      | —               | MySQL database name                       |
| `DATABASE_READ_HOST` | No       | `DATABASE_HOST` | Read-replica host (falls back to primary) |
| `DB_POOL_SIZE`       | No       | `20`            | SQLAlchemy connection pool size           |
| `DB_MAX_OVERFLOW`    | No       | `30`            | Max connections above pool size           |
| `DB_POOL_TIMEOUT`    | No       | `30`            | Pool checkout timeout (seconds)           |
| `DB_POOL_RECYCLE`    | No       | `1800`          | Connection recycle time (seconds)         |
| `ENVIRONMENT`        | No       | `development`   | Runtime environment label                 |
| `DEBUG`              | No       | `False`         | Enable debug mode                         |
| `LOG_LEVEL`          | No       | `INFO`          | Logging level                             |

**Local defaults (from `docker-compose.yml`):**

| Service | `DATABASE_USER` | `DATABASE_PASSWORD` | `DATABASE_NAME` |
| ------- | --------------- | ------------------- | --------------- |
| Users   | `users_user`    | `users_password`    | `users_db`      |
| Tasks   | `tasks_user`    | `tasks_password`    | `tasks_db`      |

---

## API Reference

Both services expose interactive Swagger docs at `/docs` and a health check at `/health`.

## Database Schema

### `users` table

| Column            | Type         | Notes                             |
| ----------------- | ------------ | --------------------------------- |
| `id`              | INT          | Primary key, auto-increment       |
| `email`           | VARCHAR(255) | Unique index                      |
| `name`            | VARCHAR(100) |                                   |
| `lastname`        | VARCHAR(100) |                                   |
| `hashed_password` | VARCHAR(255) | bcrypt hash                       |
| `is_active`       | BOOLEAN      | Composite index with `created_at` |
| `created_at`      | DATETIME     | Auto set on insert                |
| `updated_at`      | DATETIME     | Auto updated on change            |

### `tasks` table

| Column        | Type         | Notes                       |
| ------------- | ------------ | --------------------------- |
| `id`          | INT          | Primary key, auto-increment |
| `user_id`     | INT          | References a user           |
| `title`       | VARCHAR(255) |                             |
| `description` | VARCHAR(255) |                             |
| `complete`    | BOOLEAN      |                             |
| `created_at`  | DATETIME     | Auto set on insert          |
| `updated_at`  | DATETIME     | Auto updated on change      |

---

## Infrastructure

The AWS infrastructure is defined as code in the `infra/` directory using AWS CDK with TypeScript.

### CDK Stacks

| Stack                       | Description                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `cloud-mesh-dev-ecr`        | ECR repositories for `users-service` and `tasks-service`                            |
| `cloud-mesh-dev-vpc`        | VPC (`10.0.0.0/16`), public/private subnets, security groups                        |
| `cloud-mesh-dev-ecs`        | ECS cluster (`MeshLab`) and CloudWatch log group                                    |
| `cloud-mesh-dev-db`         | Aurora MySQL cluster (`ServiceMeshDB`), Secrets Manager credentials, phpMyAdmin GUI |
| `cloud-mesh-dev-migrations` | One-off ECS task definitions for running Alembic migrations                         |
| `cloud-mesh-dev-alb`        | Application Load Balancer with path-based routing rules                             |
| `cloud-mesh-dev-services`   | ECS Fargate services for users and tasks, wired to ALB target groups                |

**Security groups:**

| Group         | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `http-sg`     | Allows inbound HTTP (port 80) from anywhere                    |
| `services-sg` | Allows inbound port 80 from the ALB only                       |
| `db-sg`       | Allows inbound MySQL (port 3306) from services and Lambda only |
| `lambda-sg`   | Attached to Lambda functions that need DB access               |

### Deploying to AWS

**Prerequisites:**

- AWS CLI configured with appropriate credentials
- Node.js and npm installed
- CDK bootstrapped in the target account/region: `npx cdk bootstrap`

```bash
cd infra
npm install

# Preview changes
npx cdk diff

# Deploy all stacks
npx cdk deploy --all

# Deploy a specific stack
npx cdk deploy cloud-mesh-dev-ecr
```

**Build and push Docker images to ECR:**

```bash
# From the project root
make push SERVICE=all   # builds and pushes both services

make push SERVICE=users
make push SERVICE=tasks
```

> Images are tagged as `dev-<YYYYMMDD>-<git-sha>` and `latest`.

---

## CI/CD

GitHub Actions is used for CI/CD. Authentication to AWS is done via OIDC (no long-lived credentials).

**Set up OIDC and GitHub secrets:**

```bash
# 1. Create the IAM role and OIDC provider
./scripts/configure-aws-oidc.sh

# 2. Store the role ARN and other AWS config in GitHub Actions secrets
./scripts/configure-gh-secrets.sh
```

---
