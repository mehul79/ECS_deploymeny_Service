# Launchbay

A lightweight, Vercel-style preview deployment platform built on AWS ECS and S3, with real-time build logs streamed to the browser.

Paste a GitHub repository URL and the system spins up an isolated ECS Fargate task, builds the project, uploads the static output to S3, and serves it through a subdomain-based reverse proxy — with live build logs the whole way through.

## Demo

https://github.com/user-attachments/assets/c4c05fcf-dd54-4089-b479-2c1d60f29374

## Architecture

```
Frontend (Next.js)
      │  POST /project { gitURL }
      ▼
API Server (Express, :9000)
      │  ECS RunTaskCommand
      ▼
ECS Fargate Task (build_service image)
      │  clone → install → build
      ├──────────────► Redis (logs:{PROJECT_ID}) ──► Socket Server (:8080) ──► Frontend (live logs)
      └──────────────► S3 (__outputs/{PROJECT_ID}/...)
                              │
                              ▼
                    S3 Reverse Proxy (:8000)
                              │  subdomain → S3 path
                              ▼
                    Browser (preview URL)
```

Each deployment runs in its own ephemeral container and gets a unique preview URL (`{project-slug}.localhost:8000` in local development).

## How it works

1. The user submits a GitHub repository URL from the frontend.
2. The API server launches an ECS Fargate task from the build_service image, passing the repo URL and a generated project ID as container overrides.
3. Inside the container, the build server clones the repo, runs `npm install && npm run build`, and streams stdout/stderr to Redis as they happen.
4. The socket server subscribes to Redis and rebroadcasts log messages to any client subscribed to that project's ID.
5. Once the build finishes, the container uploads the contents of `dist/` to S3 under `__outputs/{PROJECT_ID}/`.
6. The S3 reverse proxy maps incoming subdomains to the matching S3 path, serving the deployed project.

## Services

This is a monorepo of independently deployable services — there's no shared workspace or root package manager; each directory is installed and run on its own.

| Service | Description | Port |
|---|---|---|
| `api-server/` | Express API that triggers ECS Fargate tasks | 9000 |
| `build_service/` | Dockerized build runner that executes inside ECS: clones, builds, and uploads to S3 | — (runs in ECS) |
| `socket-server/` | Subscribes to Redis and streams build logs to clients over Socket.IO | 8080 |
| `s3-reverse-proxy/` | Routes subdomains to their corresponding S3-hosted build output | 8000 |
| `frontend-nextjs/` | UI for submitting deployments and viewing live logs | 3000 |

## Tech stack

**Frontend** — Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Socket.IO client

**Backend** — Node.js, Express, Socket.IO, Redis (pub/sub), AWS SDK v3

**Infrastructure** — AWS ECS (Fargate), Docker, AWS S3

## Getting started

Each service is configured and run independently.

```bash
cd <service>
cp .env.example .env   # fill in the required values
npm install
npm start              # or `npm run dev` for frontend-nextjs
```

Required environment variables per service:

- **api-server** — `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CLUSTER`, `TASK`
- **build_service** — `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY` (S3-scoped IAM credentials), `REDIS`
- **socket-server** — `REDIS`
- **s3-reverse-proxy** — `BASE_PATH`

`build_service` is not meant to be run as a standalone local process — it's built into a Docker image and executed as the ECS task container.

## Features

- One-click GitHub deployments
- Real-time, per-project build logs
- Isolated, ephemeral build containers per deployment
- Serverless build execution via ECS Fargate
- Unique preview URL per deployment

## Roadmap

- Custom domains
- HTTPS via ACM
- Authentication and rate limiting
- Build caching
- GitHub webhook triggers
- Automatic cleanup of stale previews

## Author

Built by **Mehul** — Infrastructure, full-stack, and platform engineering.
