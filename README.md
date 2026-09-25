<div align="center">
  
  <img src="https://capsule-render.vercel.app/api?type=waving&color=3b82f6&height=200&section=header&text=Zero-Click%20Store%20&%20Chattify&fontSize=50&fontAlignY=38&desc=Autonomous%20AI%20Kirana%20Operator&descAlignY=55&descAlign=50" />

  [![Typing SVG](https://readme-typing-svg.demolab.com?font=Outfit&size=24&pause=1000&color=3B82F6&center=true&vCenter=true&width=500&lines=Seamless+Natural+Language+Ordering;Real-Time+MongoDB+Inventory;Automated+AI+Operator+Agent)](https://git.io/typing-svg)

  <p align="center">
    <a href="https://shop-ai-ten-sage.vercel.app"><img src="https://img.shields.io/badge/Live_Dashboard-Vercel-black?style=for-the-badge&logo=vercel" alt="Vercel App"></a>
    <a href="https://chattify-zzsr.onrender.com"><img src="https://img.shields.io/badge/Live_Chattify-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render Chat App"></a>
  </p>

</div>

---

# 🚀 Overview

This repository harbors a highly sophisticated, two-part microservice architecture. On one side, we have **Chattify**—a dynamic chat interface. On the other side, we have the **Zero-Click Store Operator**—a centralized dashboard and automated agent management engine. 

Both systems are natively integrated using **LlaMA 3.3 (via Groq)** to process semantic natural language orders and automatically reserve inventory against a unified **MongoDB Atlas** database, providing a 100% autonomous, zero-click e-commerce experience.

---

## 🔗 Live Deployments

| Application | Platform | URL |
| :--- | :--- | :--- |
| **Zero-Click Store Dashboard** | Vercel | [https://shop-ai-ten-sage.vercel.app](https://shop-ai-ten-sage.vercel.app) |
| **Chattify (Customer UI)** | Render | [https://chattify-zzsr.onrender.com](https://chattify-zzsr.onrender.com) |

---

## 🧠 System Architecture & Flowchart

The system runs completely decoupled across two different deployments, linked purely by the database and AI agent calls.

```mermaid
graph TD
    classDef user fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff;
    classDef app fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef ai fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef db fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff;

    Customer((Customer)):::user
    Admin((Store Owner)):::user

    subgraph "Chattify App (Render)"
        ChatUI[Chattify Frontend UI]:::app
        ChatBackend[Chattify Node.js Backend]:::app
        StoreOperator[storeOperator.js Agent]:::ai
    end

    subgraph "Zero-Click Store (Vercel)"
        DashboardUI[React / Vite Dashboard]:::app
        Serverless[Vercel Serverless API]:::app
    end

    CloudDB[(MongoDB Atlas)]:::db
    GroqLLM{Groq LLaMA 3.3}:::ai

    Customer -- "Types semantic order" --> ChatUI
    ChatUI -- "Sends Message" --> ChatBackend
    ChatBackend -- "Routes to Bot" --> StoreOperator
    
    StoreOperator -- "Decides Tools & Parsed Intent" --> GroqLLM
    StoreOperator -- "Atomically syncs stock" --> CloudDB
    
    Admin -- "Views Live Stock & Sales" --> DashboardUI
    DashboardUI -- "/api/orders" --> Serverless
    Serverless -- "Fetches documents" --> CloudDB
```

---

## 🛠️ Detailed Tech Stack

### 🧑‍💻 Frontend
* **React 18** (Vite Bundler for instant HMR)
* **Tailwind CSS v4** (Modern utility-first styling with custom Google Fonts)
* **Framer Motion / CSS Animations** (Custom animated intro screens)
* **Context API & Axios** 

### 🖧 Backend & Operator
* **Node.js & Express / Serverless**
* **MongoDB & Mongoose** (With strict schema mapping and atomic `$inc` stock logic)
* **Groq SDK (LLaMA 3.3 70B)** (For blazing-fast natural language parsing and JSON tool calling)
* **Socket.io** (For real-time chat sync)

---

## 💻 Local Setup & Commands

To run these completely separated systems on your own machine, you will effectively run two different servers on different ports.

### 1. Database Requirement
Before running either app, ensure you create a `.env` file in **both** directories holding the exact same connection string:
```bash
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.../chattify_db?appName=Cluster0"
GROQ_API_KEY="gsk_your_groq_key_here..."
```

### 2. Running Zero-Click Store (Dashboard)
This acts as your administrative console to view products, simulated health checks, and tracked orders.
```bash
cd zero-click-store
# Install Dependencies
npm install
# Run the local development server (Frontend + Backend on Port 3000/3001)
npm run dev
```

### 3. Running Chattify
This is where the user interacts with the bot via a chat interface.
```bash
# Terminal 1: Run the backend (Port 5001)
cd chattify/backend
npm install
npm run dev

# Terminal 2: Run the frontend (Port 5173)
cd chattify/frontend
npm install
npm run dev
```

---

<div align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWdzYWZ0NzZzcnE3aDV2amFvMzcyNTdoNmNpZHN0ZG9zY3E1MzQweCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/12xWjwX02E4EUM/giphy.gif" width="300" alt="Robot Animation">
  <br/>
  <i>Engineered with ❤️ to eliminate clicks in commerce!</i>
</div>
