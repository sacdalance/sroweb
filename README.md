# 📚 All-In-One SRO Web App

A centralized web application for the UP Baguio Student Relations Office (SRO) that digitizes and streamlines the processing of activity requests, annual reports, and organization recognition applications.

---

## 🧠 Project by Group SpaceBar (CMSC 128)

- **Melle Jefferson Larua** – Full Stack Developer
- **Deidrick Jethro Nisay** – Frontend Developer, UI/UX Designer
- **Lea Angeli Cuadra** – UI/UX Designer, Documentation
- **Clarence Kyle Pagunsan** – Backend Developer
- **Lance Gabriel Sacdalan** – Backend Developer, Project Manager

---

## 🚀 Tech Stack

### Frontend
- **React.js** with **Vite**
- **Tailwind CSS** + **ShadCN UI**
- **Lucide Icons**
- **Figma** (UI/UX Design Reference)

### Backend
- **Node.js** with **Express.js**
- **Supabase** (Auth, initial database)
- **PostgreSQL** (Main database)
- **Google Drive API** (Document uploads and storage)
- **Docker** (for local testing and containerization)

### Deployment
- **Vercel** (temporary cloud deployment)
- **Virtual Machine** (for final on-prem deployment by UPB)

### File Management
/frontend     → React + Tailwind + ShadCN UI
/backend      → Express routes, Supabase, DB logic
/docs         → Documentation (Proposal, User Manual, etc.)
/database     → SQL schema or migrations
---

## 📦 Features Overview

### 🧑‍🎓 Student Features
- Submit **Activity Requests** (w/ file uploads)
- Submit **Annual Reports** (Form D & F)
- Submit **Organization Recognition** (Forms A, B1, B2, C, E)
- Book Interview Schedules
- Submit appeals or cancellations
- View status and history of all submissions

### 👩‍💼 Admin (SRO/ODSA) Features
- View all submissions (Activity, Org Rec, Annual Report)
- Approve/Reject with remarks
- Generate recognition certificates and probation notices
- View summaries and logs per organization
- Editable submission tracking (inc. physical log time entry)

### 🛠 Superadmin (Dev/Debug)
- Access to all features for testing and troubleshooting
- Full control over database and logs

---

## 🔒 Access Control
Role	Permissions
Student	Submit forms, track status
SRO Admin	Approve activity requests, org rec, annual reports
ODSA Admin	Secondary approval, certificate generation
SuperAdmin	Full access to all tools and data

## 🛠 Setup Instructions

### 🔧 1. Clone the Repository

```bash
touch CMSC128
cd CMSC128
git clone https://github.com/your-username/sro-web-app.git
cd srowebapp


# For frontend
cd sroapp
npm install

VITE_BACKEND_URL=http://localhost:3000
VITE_SUPABASE_URL="fill"
VITE_SUPABASE_ANON_KEY="fill"

# For backend
cd srobackend
npm install

PORT=3000
VITE_SUPABASE_URL="fill"
VITE_SUPABASE_SERVICE_ROLE_KEY="fill"
GDRIVE_FOLDER_ID="fill"
GDRIVE_ANNUAL_REPORT_FOLDER_ID="fill"
GDRIVE_ORG_APP_FOLDER_ID="fill"
GDRIVE_CLIENT_EMAIL="fill"
GDRIVE_PROJECT_ID="fill"
GDRIVE_PRIVATE_KEY="fill"
