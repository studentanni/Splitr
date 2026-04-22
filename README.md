# Splitr - AI-Powered Splitwise Clone by Sandesh 

![splitr](https://github.com/user-attachments/assets/11e138c4-efcf-4a85-8586-f2993da118d8)

A modern, AI-powered expense splitting application built with Next.js, Convex, and Groq AI. Features smart expense categorization, real-time updates, and seamless bill splitting.

## Features

- **AI-Powered Categorization** - Automatically categorize expenses using Groq AI
- **Real-time Updates** - Live expense tracking and balance updates
- **Smart Bill Splitting** - Equal, percentage, and exact amount splits
- **Group Management** - Create and manage expense groups
- **Beautiful Dashboard** - Track spending patterns and monthly insights
- **Secure Authentication** - Powered by Clerk
- **Mobile Responsive** - Works perfectly on all devices

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS, Shadcn UI
- **Backend**: Convex (Database + Real-time)
- **AI**: Groq AI (Llama 3) for expense categorization
- **Authentication**: Clerk
- **Deployment**: Vercel + Convex Cloud

## Getting Started

### Prerequisites

- Node.js 18+ 
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/splitr.git
cd splitr
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud
CONVEX_DEPLOYMENT_KEY=your_convex_deployment_key_here

# Groq AI for expense categorization
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional: Resend Email
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Running the App

1. Start the Convex backend:
```bash
npx convex dev
```

2. Start the Next.js frontend:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Keys Setup

### 1. Clerk Authentication
- Go to [Clerk Dashboard](https://dashboard.clerk.com/)
- Create a new project
- Copy your Publishable and Secret keys

### 2. Convex Backend
- Go to [Convex Dashboard](https://dashboard.convex.dev/)
- Create a new project
- Copy your deployment URL and key

### 3. Groq AI (Free)
- Go to [Groq Console](https://console.groq.com/)
- Sign up and get your API key
- Free tier includes plenty of requests for testing

## Deployment

### Vercel (Frontend)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Convex (Backend)

```bash
npx convex deploy
```

## Project Structure

```
splitr/
|-- app/                 # Next.js app router
|-- components/          # React components
|-- convex/              # Convex backend functions
|-- lib/                 # Utility functions
|-- public/              # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Built by Sandesh

A modern expense splitting solution for the digital age.
