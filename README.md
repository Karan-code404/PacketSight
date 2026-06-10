# PacketSight – API Traffic & Network Intelligence Analyzer

**PacketSight** is a professional, full-stack MERN (MongoDB, Express, React, Node.js) web application designed for developers, DevOps teams, and network engineers to execute, log, and analyze REST API traffic. It delivers real-time protocol diagnostics, aggregates historical traffic statistics, monitors endpoint health status, and generates automated structural recommendations.

---

## 🚀 Key Features

### 1. Request Builder & Analyzer
* **Flexible REST Client**: Supports executing HTTP requests using `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` with custom headers and bodies.
* **Protocol Intelligence**: Extracts detailed connection and protocol metadata (e.g., protocol version, server, scheme, connection type, cache-control, and content encoding).
* **JSON Structure Tree**: Formats and explores response schemas dynamically with collapsible paths and structure highlights.

### 2. Searchable Paginated Request History
* **Full Logs Inspection**: Browse previously executed API queries with advanced filters (by status, speed, or URL).
* **Logs Drawer**: View detailed protocol metrics, response payloads, security checklist items, and deep key analysis in a slide-out drawer.
* **Re-run Prefilling**: Click "Re-run Request" to automatically populate the active builder parameters and test again.

### 3. Traffic Analytics Dashboard
* **Response Time Trends**: Visualizes latencies over time with threshold lines.
* **Status Distribution**: Donut charts showing the breakdown of successful (`2xx`), redirect (`3xx`), and client/server errors (`4xx`/`5xx`).
* **Request Methods & Payload Sizes**: Bar charts displaying method frequency and transfer size categories.
* **Hourly Traffic & Ranks**: Daily heatmap activity trackers and host frequency ranking tables.

### 4. API Uptime Health Monitor
* **Availability & Performance Tracker**: Automatically tracks host availability percentages and average response speeds.
* **7-Day Traffic Sparklines**: Renders weekly traffic patterns per host showing success vs. failure ratios.
* **Failures Feed**: Captures the last 20 client or server failures for quick diagnostic inspection.

### 5. Smart Insights Engine
* **Automated Security Check**: Runs rule-based audits on headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) and scores security.
* **Global Optimization Warnings**: Aggregates recurring performance issues (e.g. latencies over 1s, missing cache headers, large payloads) and recommends actions.

---

## 🔮 Future Roadmap: Raw Network Packet Analyzer

PacketSight is designed to evolve beyond HTTP API traffic tracking. The next phase of development focuses on turning it into a **fully fledged raw network packet analyzer**. 

### Upcoming Capabilities:
* **Live Sniffing**: Sniffing live network interfaces using raw socket capture or Libpcap/WinPcap bindings.
* **PCAP File Ingestion**: Uploading and dissecting `.pcap` and `.pcapng` network capture files.
* **Deep Packet Inspection (DPI)**: Reconstructing TCP/UDP flows and parsing non-HTTP protocols (e.g. DNS, TLS, SMTP, FTP) at the frame level.
* **Traffic Flow Mapping**: Visualizing transport layer packet distributions and diagnosing packet loss, retransmissions, and network bottlenecks.

---

## 🛠️ Technology Stack

* **Frontend**: React 19 (Vite), Tailwind CSS, Recharts (for analytics visualizations), Sonner (for toast notifications), React Router.
* **Backend**: Node.js, Express.js, Mongoose/MongoDB (data storage).
* **Client Service**: Axios (network client).

---

## 📦 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org) (v18+ recommended)
* [MongoDB](https://www.mongodb.com) (local instance or MongoDB Atlas URI)

### Setup & Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Karan-code404/PacketSight.git
   cd PacketSight
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the `server` root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/packetsight
   ```

3. **Install Dependencies & Start Backend Server**
   ```bash
   cd server
   npm install
   npm start
   ```

4. **Install Dependencies & Start Frontend Client**
   Open a new terminal window:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.
