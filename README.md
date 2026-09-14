# Local AI Document Intelligence

A full-stack, local document processing pipeline built entirely in **Next.js 16 (App Router)**. This application ingests unstructured data (PDFs), splits it into structural chunks, generates text embeddings, performs vector similarity math, and delivers both global executive summaries and interactive targeted Q&A (RAG mode)—running **100% locally, for free, and completely offline** on standard consumer hardware.
---

## Why This Repository Exists

Most modern RAG (Retrieval-Augmented Generation) tutorials rely on heavy Python backends, proprietary third-party APIs (OpenAI/Anthropic), and cloud-hosted vector databases. This introduces corporate compliance risks, vendor lock-in, and unpredictable token bills.

This project provides a native full-stack TypeScript alternative. By pairing Next.js with **Ollama**, it demonstrates how to orchestrate text extraction, mathematical vector representation (`nomic-embed-text`), and local text generation (**Meta's Llama 3.2:1B**) without creating any wasteful network or cloud infrastructure overhead.

---

## Core Technical Features

- **Level 1 - Summarization:** Streams multi-part form payloads, extracts text via unpdf (built on Mozilla's PDF.js), and returns a global document summary.
- **Level 2 Architecture (Local RAG):** Splits text into overlapping chunks, generates embeddings, and runs similarity search against them on your own CPU/GPU.
- **Live Document Preview:** enders an interactive, side-by-side file preview using the browser's native URL.createObjectURL API — no external rendering plugin required.
- **Developer Performance Logging:** Microsecond execution timers on the server API layer, so you can see model latency in your terminal as you go.
---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, TypeScript, Tailwind CSS)
- **AI Core:** OpenAI Official Node SDK
- **Local AI Orchestration:** Ollama
- **Models:** Meta Llama 3.2 (1B Parameter Quantized) & Nomic Embed Text (274 MB)
- **Text Processing Ingestion:** `unpdf`

---

## Step-by-Step Installation Guide

### Prerequisites
Ensure you have [Node.js](https://nodejs.org) installed and your local machine has at least 8GB to 16GB of system memory.

### 1. Set Up the Local AI Infrastructure
Download and install the native server engine from the official website or run the terminal utility package:
* **Ollama Platform:** [Ollama Official Site](https://ollama.com)

Once installed, ensure the daemon service is running in your taskbar system tray. Open a terminal/PowerShell window and pull down the required model weights:
```bash
# Pull down the text embedding model weights (274 MB)
ollama pull nomic-embed-text

# Pull down and verify the core intelligence generation model weights (1.3 GB)
ollama pull llama3.2:1b
```

### 2. Clone and Configure the Application Workspace
Clone this repository to your local directory machine:
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 3. Install the dependencies
Install the dependencies. This project pairs Next.js 16 with some packages that haven't updated their peer dependency ranges yet, so install with the legacy peer flag:
```bash
npm install --legacy-peer-deps
```

### 4. Set Up Environment Variables

The project comes with fallback defaults tailored for local development. However, if you want to explicitly define your environment configuration or swap providers later, copy the template file in the root directory to create a local environment file:

```bash
cp .env.example .env.local
```

*Note: `.env.local` is ignored by Git, so your local adjustments will never be pushed to your public repository.*
```
```

### 5. Start the Development Server
Make sure Ollama is running in the background, then start the dev server:
```bash
npm run dev

Open http://localhost:3000 to use the app.

---

##License

Distributed under the **MIT License**. See `LICENSE` for more information. Anyone is free to clone, branch, study, and redistribute this architecture.