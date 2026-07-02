
# Online Voting App for TUM Fesher Welcome 2026 🗳️

A full-stack web application built for the IT Fresher 2026 voting event. This project provides a secure, real-time voting interface for users, backed by robust anti-cheat mechanisms, and a comprehensive Admin Dashboard to manage the event.

> [!NOTE]
> **Production Proven:** This exact codebase was hosted on a live production server and successfully used in the real TUM Fresher Welcome 2026 event. The database included in this repository contains the actual voting data from the event for demonstration purposes.

## ✨ Features

- **Real-Time Voting:** Clean, responsive, and intuitive interface for casting votes.
- **Advanced Anti-Cheat System:** 
  - **Hardware Fingerprinting & IP Tracking:** Prevents multiple votes from the same device or network.
  - **Dynamic Rate Limiting:** Enforces maximum votes per IP hotspot (configurable by Admin).
  - **Strict Voter ID Binding:** Ensures one vote per category per person.
- **Admin Dashboard:**
  - Real-time statistics and voting charts.
  - Live system status controls (Open/Close voting).
  - Detailed, paginated voting logs for auditing.
- **High Performance:** Uses SQLite in WAL (Write-Ahead Logging) mode for fast concurrent database writes.

## 🛠️ Tech Stack

**Frontend:**
- [React 18](https://reactjs.org/) & [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for data visualization
- [Lucide React](https://lucide.dev/) for iconography

**Backend:**
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- [SQLite3](https://www.sqlite.org/) for lightweight, persistent data storage

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites
- [Node.js](https://nodejs.org/en/download/) (v16 or higher recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AungPhyoeNaing/tum-voting-2026.git
   cd tum-voting-2026
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

### Running Locally

This project runs a separated frontend (Vite) and backend (Express) in development. You will need to start both.

1. **Start the Backend Server (Port 3005):**
   ```bash
   npm run server
   ```

2. **Start the Frontend Dev Server (Port 3000):**
   Open a new terminal window and run:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`. The Vite server automatically proxies `/api` requests to the Express backend.

## 🔒 Admin Access
To access the admin panel, navigate to `http://localhost:3000/admin`.


## ☁️ Deployment Notes (Vercel)

This project has been configured to deploy seamlessly to **Vercel**:

- The `vercel.json` file configures Vercel to build the frontend and serve `server.js` using the `@vercel/node` runtime.
- **Database Behavior on Vercel:** Vercel's Serverless environment has a Read-Only filesystem. To prevent the app from crashing, `server.js` detects when it's running on Vercel and temporarily copies the included `votes.db` into the writable `/tmp` directory. 
- **Disclaimer:** Because Serverless functions are stateless, any new votes cast on the live Vercel URL will only be saved temporarily in memory and will reset when the function sleeps. This setup is **ideal for presentation/interview purposes** as it ensures your sample data is always preserved. For production usage, it is recommended to host this on a persistent server (like Render, Railway, or a VPS).
