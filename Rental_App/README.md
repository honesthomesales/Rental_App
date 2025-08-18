# Rental Management App

Production-grade rental management application with Supabase backend.

## 🌐 Live Demo

**GitHub Pages**: https://honesthomesales.github.io/Rental_App/

## 🚀 Quick Start

### Web App
```bash
cd apps/web
npm install
npm run dev
```
Open: http://localhost:3000

### Android App
```bash
cd apps/android
npm install
npm run android
```

## 📱 Features

- **Web App**: Next.js dashboard with Supabase backend
- **Android App**: React Native mobile application
- **Property Management**: Add, edit, and track properties
- **Tenant Management**: Manage tenant information and leases
- **Payment Tracking**: Monitor rent payments and expenses
- **Profit Analysis**: Financial reporting and analytics

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Mobile**: React Native, Expo
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Database**: PostgreSQL with RENT_* tables
- **Deployment**: GitHub Pages, Vercel

## 📦 Project Structure

```
Rental_App/
├── apps/
│   ├── web/          # Next.js web application
│   ├── android/      # React Native Android app
│   └── tablet/       # Tablet-specific app
├── packages/
│   ├── api/          # Supabase client and services
│   ├── ui/           # Shared UI components
│   └── scraper/      # Data scraping utilities
└── supabase/         # Database migrations and schema
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Android Studio (for Android development)
- Supabase account

### Setup
1. Clone the repository
2. Install dependencies: `npm run install:all`
3. Set up environment variables
4. Run database migrations: `npm run db:setup`

## 📊 Database Schema

The app uses tables prefixed with `RENT_`:
- `RENT_properties` - Property information
- `RENT_tenants` - Tenant details
- `RENT_payments` - Payment tracking
- `RENT_leases` - Lease agreements

## 🚀 Deployment

### GitHub Pages
- Automatically deploys on push to main branch
- Static export for compatibility
- Available at: https://honesthomesales.github.io/Rental_App/

### Vercel (Recommended for Production)
- Better Next.js support
- Automatic deployments
- Custom domain support

## 📄 License

Private project for Honest Home Sales.

## 🤝 Contributing

This is a private project. Please contact the development team for contributions. 