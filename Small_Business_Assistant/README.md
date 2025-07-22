# Small Business Assistant

A voice-driven mobile and web assistant designed for manual laborers and small business owners. The app prioritizes voice interaction, minimal screen time, and automatic job tracking to help field workers focus on their work while handling administrative tasks seamlessly.

## 🎯 Project Overview

**Target Users:** Plumbers, electricians, HVAC technicians, and other field workers who need simple, efficient job management tools.

**Key Features:**
- 🎤 Voice-driven job creation and management
- 📍 GPS-based automatic time tracking
- 📸 Before/after photo capture and attachment
- 💰 Voice-generated quotes and invoices
- 📱 Mobile app (iOS & Android) for field work
- 💻 Web dashboard for management and review

## 🏗️ Architecture

This project uses a monorepo structure with the following packages:

- **`packages/mobile`** - React Native mobile app (iOS & Android)
- **`packages/web`** - React web dashboard
- **`packages/api`** - Node.js/Express backend API
- **`packages/shared`** - Shared types, utilities, and components

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- React Native development environment (for mobile)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Small_Business_Assistant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers:**

   **Option 1: Using npm (Recommended)**
   ```bash
   npm run dev
   ```

   **Option 2: Using PowerShell script**
   ```powershell
   .\start-dev.ps1
   ```

   **Option 3: Using Windows batch file**
   ```cmd
   start-dev.bat
   ```

This will start:
- Mobile app development server (Expo)
- Web dashboard development server (Vite)  
- Backend API server (Express)

## 📱 Mobile App

The mobile app is built with React Native and focuses on voice-first interaction:

- **Voice Commands:** Create jobs, generate quotes, and manage invoices hands-free
- **GPS Tracking:** Automatic time tracking based on location
- **Photo Capture:** Before/after photos with job records
- **Offline Support:** Works without internet connection

### Mobile Setup

```bash
cd packages/mobile
npm install
npm start
```

## 💻 Web Dashboard

The web dashboard provides management and review capabilities:

- **Job Overview:** View all jobs, status, and progress
- **Invoice Management:** Review and download invoices
- **Photo Gallery:** Browse before/after photos
- **Analytics:** Time tracking and job performance metrics

### Web Setup

```bash
cd packages/web
npm install
npm start
```

## 🔧 Backend API

The backend provides REST/GraphQL APIs for:

- **Job Management:** CRUD operations for jobs
- **Voice Processing:** Speech-to-text and natural language processing
- **File Storage:** Photo upload and management
- **Geolocation:** GPS tracking and time calculation
- **Invoice Generation:** PDF creation and management

### API Setup

```bash
cd packages/api
npm install
npm run dev
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all packages for production
- `npm run test` - Run tests across all packages
- `npm run lint` - Lint all packages

### Technology Stack

- **Frontend:** React Native (mobile), React (web)
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Voice Recognition:** Platform-native ASR (Siri/Google)
- **File Storage:** AWS S3 or similar
- **Deployment:** Docker, cloud hosting

## 📋 Project Status

This project is currently in **planning and setup phase**. The development roadmap includes:

1. ✅ Project structure and setup
2. 🔄 Backend API development
3. 📱 Mobile app MVP
4. 💻 Web dashboard MVP
5. 🧪 Testing and QA
6. 🚀 Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 👤 Author

**Billy Rochester** - Project Owner

---

*Built for field workers who want to focus on their craft, not paperwork.* 