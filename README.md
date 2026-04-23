<<<<<<< HEAD
# AI Splitwise Clone - Full Stack Expense Management 💸

Welcome to the **AI Splitwise Clone**! This is a modern, full-stack expense-sharing application built with Next.js, Convex, and AI-powered insights.

## ✨ Features

- **Split Expenses**: Split bills with friends, roommates, or groups easily.
- **AI Anomaly Detection**: Powered by **Groq (llama-3.3-70b-versatile)** to detect unusual spending patterns.
- **Spending Insights**: Monthly AI-generated financial advice based on your spending.
- **Real-time Updates**: Powered by **Convex** for a seamless, live experience.
- **Authentication**: Secure login and sign-up with **Clerk**.
- **Modern UI**: Clean and responsive design using **Tailwind CSS** and **Shadcn UI**.

## 🚀 Getting Started

Follow these steps to run the project locally:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd ai-splitwise-clone
```

### 3. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 4. Environment Variables
Create a `.env.local` file in the root directory and add the following:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Convex Backend
CONVEX_DEPLOYMENT=your_convex_deployment_name
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# AI (Groq)
GROQ_API_KEY=your_groq_api_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
```

### 5. Run the Project
You need to run two commands in separate terminals:

**Terminal 1: Convex Backend**
```bash
npx convex dev
```

**Terminal 2: Next.js Frontend**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## 🌐 Deployment

### Frontend (Next.js)
Deploy on **Vercel** by connecting your GitHub repository. Make sure to add all environment variables in the Vercel dashboard.

### Backend (Convex)
Convex manages its own serverless backend. When you deploy to production, Convex will provide a production URL. You do **not** need Render for this project.

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Database & Backend**: Convex
- **Auth**: Clerk
- **AI**: Groq SDK (Llama 3.3)
- **Styling**: Tailwind CSS + Shadcn UI
- **Background Jobs**: Inngest

---
Developed for **Sandesh** 🚀
=======

# 💸 Splitwise Clone (AI Splitwise App)

A full-stack expense-splitting web application inspired by Splitwise.  
This project allows users to split expenses, track balances, and manage group spending easily.

---

## 🚀 Features

- 👥 Create and manage groups
- 💰 Add and split expenses
- 📊 Track who owes whom
- 🔄 Real-time balance updates
- 🧾 Expense history tracking
- 📱 Responsive UI (mobile + desktop)

---

## 🛠️ Tech Stack

- Frontend: React.js / Vite (or your framework)
- Backend: Node.js / Express (if applicable)
- Database: MongoDB (or your DB)
- Styling: CSS / Tailwind CSS

---

## 📂 Project Structure
ai-splitwise-clone/
│── src/
│── public/
│── server/
│── package.json
│── README.md


---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/studentanni/Splitr.git
2. Move into project folder
cd Splitr
3. Install dependencies
npm install
4. Run the project
npm run dev
🌐 Environment Variables

Create a .env file in root directory:

PORT=5000
MONGO_URI=your_mongodb_connection_string
>>>>>>> 81ba1571295637f60b9d53637d1d26886a21267c
