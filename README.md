# ⚡ ECS Preview Deployment Service

> A lightweight **Vercel-like preview deployment platform** built on **AWS ECS + S3**, with real-time build logs streamed to the browser.

Deploy any GitHub repository by pasting its URL.  
The system spins up an isolated ECS task, builds the project, uploads static assets to S3, and serves them via a subdomain-based reverse proxy — all with **live logs**.

---

## 🎬 Demo

📹 **Demo Video:**  
https://github.com/user-attachments/assets/c4c05fcf-dd54-4089-b479-2c1d60f29374

---

## 🚀 What is this?

This project is a **preview deployment platform** similar to Vercel or Netlify, but built entirely using open infrastructure components.

It:
- Uses **AWS ECS Fargate** for ephemeral builds
- Streams **real-time build logs** to the UI
- Deploys static assets to **AWS S3**
- Serves preview deployments via **subdomain-based routing**
- Requires **zero manual server management**

Each deployment gets its own isolated build container and unique preview URL.

---

## 🧠 High-Level Architecture

User → Frontend (Next.js)  
→ API Server (Express)  
→ AWS ECS Task (Build Container)  
→ S3 (Static Assets)  
→ Reverse Proxy (Subdomain Routing)  

Logs flow from ECS → Redis → WebSocket → Browser in real time.

---

## 🧩 How It Works

1. User submits a GitHub repository URL
2. API server triggers an ECS Fargate task
3. Build container:
   - Clones repo
   - Runs install & build
   - Uploads `dist/` to S3
4. Build logs are published to Redis
5. Socket server streams logs to the frontend
6. Project is accessible via a preview URL

---

## 🛠 Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Socket.IO

### Backend
- Node.js
- Express
- Socket.IO
- Redis (Pub/Sub)

### Infrastructure
- AWS ECS (Fargate)
- Docker
- AWS S3
- AWS SDK v3

---

## 📁 Monorepo Structure

api-server/ – Triggers ECS tasks  
build-server/ – Dockerized build runner  
socket-server/ – Redis → WebSocket log streaming  
s3-reverse-proxy/ – Subdomain → S3 routing  
frontend-nextjs/ – UI + live logs  

---

## ✨ Features

- One-click GitHub deployments
- Real-time build logs
- Isolated Docker builds
- Serverless ECS execution
- Preview URLs per deployment

---

## 🔮 Future Improvements

- Custom domains
- HTTPS with ACM
- Auth & rate limiting
- Build caching
- GitHub webhooks
- Automatic cleanup of old previews

---

## 🧑‍💻 Author

Built by **Mehul**  
Infra • Full-stack • Platform Engineering
