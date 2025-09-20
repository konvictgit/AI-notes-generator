readme_content = """# Summara - AI Study Notes Generator

Summara is a full-stack GenAI project that automates **study notes generation** from PDFs and other content.  
It integrates modern web technologies, event streaming, caching, and cloud storage to build a scalable system.

---

## 🚀 Tech Stack

### Frontend (Next.js + React)

- **Framework**: Next.js 13.4
- **UI**: React 18, TailwindCSS, Lucide React, React Icons
- **API / Data fetching**: Axios
- **PDF Export**: jsPDF
- **Cloud / Storage**:
  - AWS SDK S3 client (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
  - Supabase (`@supabase/supabase-js`)
- **Streaming**: KafkaJS (for Kafka integration)
- **Build Tools**: PostCSS, Autoprefixer

### Worker / Backend

- **Framework**: Express.js
- **Env Management**: dotenv
- **Cache**: Redis (`ioredis`)
- **Streaming / Queue**: KafkaJS
- **Cloud / Storage**:
  - AWS SDK S3 client
  - Supabase
- **File Upload / Processing**: Multer
- **PDF Parsing**: pdf-parse
- **Security/Utility**: CORS, crypto-js, node-fetch

### Infrastructure

- **Containerization**: Docker + docker-compose
- **Cloud Storage**: AWS S3
- **Message Broker**: Apache Kafka
- **Cache**: Redis
- **Supabase**: Auth, metadata, and optional storage

---

## 📂 Project Structure

ai-study-notes-generator/
├── frontend/ # Next.js frontend
│ ├── pages/ # UI pages
│ ├── components/ # React components
│ └── package.json # Frontend dependencies
├── worker/ # Express.js worker
│ ├── index.js # Worker entrypoint
│ └── package.json # Worker dependencies
├── docker-compose.yml # Service orchestration
└── README.md

markdown
Always show details

Copy code

---

## 🔄 Architecture Overview

### High-Level Components

- **Frontend (Next.js)** → Handles file upload, user interface, and triggers jobs.
- **Kafka** → Queues job requests for asynchronous processing.
- **Worker (Express.js)** → Consumes Kafka jobs, processes documents, and interacts with Redis, AWS S3, Supabase.
- **Redis** → Caches intermediate processing states.
- **AWS S3** → Stores uploaded and processed files.
- **Supabase** → Stores metadata, auth, and job status.
- **PDF Tools** → `pdf-parse` (extraction) + `jsPDF` (export).

---

## 📊 Architecture Map

![Architecture Map](docs/architecture-map.png)

**Flow:**

- Frontend publishes jobs to Kafka.
- Worker consumes jobs and processes PDFs.
- Redis is used for caching.
- Results are stored in AWS S3 and Supabase.
- User gets downloadable study notes.

---

## 🔀 Sequence Flow

1. **User → Frontend (Next.js)** → Upload file/request summary.
2. **Frontend → AWS S3** → Upload file.
3. **Frontend → Supabase** → Store metadata/auth.
4. **Frontend → Kafka** → Publish job request.
5. **Kafka → Worker (Express.js)** → Worker consumes job.
6. **Worker → Redis** → Cache intermediate results.
7. **Worker → PDF Tools** → Parse/process PDF.
8. **Worker → AWS S3** → Store processed output.
9. **Worker → Supabase** → Store job status/result metadata.
10. **Worker → Frontend** → Send results back.
11. **Frontend → User** → Deliver summary/downloadable notes.

---

## 🐳 Running with Docker

```bash
docker-compose up --build
This starts:

Frontend on http://localhost:3000

Worker API on http://localhost:4000

Kafka Broker

Redis Server

Connected AWS S3 + Supabase

📦 Environment Variables
Frontend .env
env
Always show details

Copy code
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your-key
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your-secret
NEXT_PUBLIC_S3_BUCKET=your-bucket
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=your-key
Worker .env
env
Always show details

Copy code
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-bucket
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_KEY=your-key
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=broker1:9092,broker2:9092
📘 Use Cases
Generate study notes from PDFs.

Export AI summaries as downloadable PDFs.

Handle large file uploads asynchronously via Kafka.

Use Redis caching for fast retrieval.

Store documents securely in AWS S3.

Track job status and metadata in Supabase.

🧩 Future Enhancements
Add LLM-based summarization via Hugging Face / OpenAI.

Real-time WebSocket updates for job status.

Multi-user auth with Supabase.

Analytics dashboard for summaries generated.
"""
```
