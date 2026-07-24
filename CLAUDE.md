# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Vercel-like preview deployment platform: paste a GitHub repo URL, it spins up an
isolated AWS ECS Fargate task to build the project, uploads the built assets to S3,
and serves them via subdomain-based reverse proxy, with build logs streamed live to
the browser over Redis pub/sub + WebSockets.

This is a monorepo of 5 independent Node/Next.js services — there is no shared
package manager workspace, no root `package.json`, and no shared build/lint/test
tooling. Each subdirectory is installed and run independently (`cd <service> && npm install`).

## Services (each is its own deployable unit)

- **api-server/** — Express server (port 9000). `POST /project` accepts `{gitURL, slug}`
  and calls `RunTaskCommand` (AWS SDK v3 `@aws-sdk/client-ecs`) to launch a Fargate task
  from the `build-server` Docker image, injecting `GIT_REPOSITORY__URL` and `PROJECT_ID`
  as container env overrides. Returns the preview URL immediately (`{projectSlug}.localhost:8000`)
  without waiting for the build.
- **build-server/** — the Dockerized build runner that actually runs *inside* ECS, not
  run directly on a dev machine. `main.sh` (the container ENTRYPOINT) clones the repo
  into `/home/app/output` then execs `script.js`, which runs `npm install && npm run build`
  on the cloned project, streams stdout/stderr to Redis (`publisher.publish("logs:{PROJECT_ID}", ...)`),
  then walks `output/dist` and uploads every file to S3 under `__outputs/{PROJECT_ID}/...`
  before exiting. Changes here require rebuilding and pushing the Docker image, then
  updating the ECS task definition to reference it — editing the file alone does nothing
  to already-running infra.
- **socket-server/** — Socket.IO server (port 8080) with no HTTP framework. Subscribes to
  Redis pattern `logs:*` and rebroadcasts each message to the matching Socket.IO room
  (clients `subscribe` to a `PROJECT_ID` room from the frontend to watch their own build).
- **s3-reverse-proxy/** — Express + `http-proxy` (port 8000). Derives the S3 "subdomain"
  from `req.hostname` and proxies to `${BASE_PATH}/{subdomain}` (an S3 static-hosting path),
  rewriting `/` to `/index.html`.
- **frontend-nextjs/** — Next.js 14 (App Router) + Tailwind + shadcn/ui. Posts to the
  api-server, then opens a socket to socket-server and joins the `PROJECT_ID` room to
  render live logs.

## Log/data flow (cross-cutting — spans multiple services, not obvious from any single file)

```
Frontend --POST /project--> api-server --RunTaskCommand--> ECS Fargate task (build-server image)
                                                                    |
                                                        clone -> install -> build
                                                                    |
                                                    publish logs --> Redis (logs:{PROJECT_ID})
                                                                    |
                                                          upload dist/ --> S3
                                                                    |
socket-server (psubscribe logs:*) <---------------------------------
        |
        v
Frontend (joined to PROJECT_ID room) renders live logs
```

Final asset serving is a separate path: browser -> s3-reverse-proxy (subdomain routing) -> S3.

## Running locally

Each service needs its own `.env` (copy from that service's `.env.example`) and its own
`npm install`, then `node index.js` (api-server, socket-server, s3-reverse-proxy) or
`npm run dev` (frontend-nextjs). `build-server` is not meant to be run locally as a plain
Node process — it expects to be the ECS container and clones into a hardcoded local path.

Ports: api-server `9000`, s3-reverse-proxy `8000`, socket-server `8080`, frontend `3000` (Next.js default).

There are no test suites, linters (beyond Next's default `next lint`), or CI configured
for the backend services — `npm test` in each is a stub that exits with an error.

## Known rough edges (don't "fix" without checking with the user first — may be intentional prototype shortcuts per the README's "Future Improvements")

- `api-server/index.js` hardcodes empty `subnets`/`securityGroups` arrays in the ECS
  `networkConfiguration` — these must be filled in with real AWS resource IDs to work.
- No auth, rate limiting, HTTPS, or webhook triggers anywhere in the stack.
- `build-server` uploads to a hardcoded bucket name (`vercel-prod-bucket`) rather than an env var.
