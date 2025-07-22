# Small Business Assistant - Setup Guide

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js 18+ and npm 9+
- Git
- PostgreSQL (for database)
- React Native development environment (for mobile app)

### Step 1: Environment Setup

1. **Copy environment file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file with your configuration:**
   ```bash
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/small_business_assistant"
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # API Configuration
   API_PORT=3001
   NODE_ENV=development
   ```

### Step 2: Install Dependencies

**Option A: Install all packages at once (Recommended)**
```bash
npm install
```

**Option B: Install packages individually**
```bash
# Install shared package
cd packages/shared
npm install

# Install API package
cd ../api
npm install

# Install web package
cd ../web
npm install

# Install mobile package (requires React Native setup)
cd ../mobile
npm install
```

### Step 3: Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Download from: https://www.postgresql.org/download/
   - Create a database named `small_business_assistant`

2. **Set up Prisma:**
   ```bash
   cd packages/api
   npx prisma generate
   npx prisma migrate dev --name init
   ```

3. **Seed the database (optional):**
   ```bash
   npx prisma db seed
   ```

### Step 4: Start Development Servers

**Start all services:**
```bash
npm run dev
```

**Or start individually:**
```bash
# Start API server
cd packages/api
npm run dev

# Start web dashboard
cd packages/web
npm run dev

# Start mobile app (requires React Native setup)
cd packages/mobile
npm start
```

## 📱 Mobile App Setup

### React Native Environment Setup

1. **Install React Native CLI:**
   ```bash
   npm install -g @react-native-community/cli
   ```

2. **Install Android Studio** (for Android development)
   - Download from: https://developer.android.com/studio
   - Set up Android SDK and emulator

3. **Install Xcode** (for iOS development - macOS only)
   - Available from Mac App Store

4. **Set up mobile app:**
   ```bash
   cd packages/mobile
   npx react-native init SmallBusinessAssistant --template react-native-template-typescript
   ```

## 🌐 Web Dashboard Setup

The web dashboard uses Vite for fast development:

```bash
cd packages/web
npm run dev
```

Access at: http://localhost:3000

## 🔧 API Server Setup

The API server runs on Express with Prisma:

```bash
cd packages/api
npm run dev
```

Access at: http://localhost:3001
Health check: http://localhost:3001/health

## 🗄️ Database Management

### Prisma Commands

```bash
cd packages/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Database Schema

The database includes the following main tables:
- `users` - User accounts and authentication
- `jobs` - Job records with status and details
- `locations` - GPS coordinates and addresses
- `photos` - Before/after photos for jobs
- `time_entries` - Time tracking data
- `quotes` - Customer quotes
- `invoices` - Generated invoices
- `voice_commands` - Voice command history

## 🔐 Authentication Setup

The API uses JWT authentication:

1. **Register a user:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "firstName": "John",
       "lastName": "Doe"
     }'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

## 🧪 Testing

### Run Tests

```bash
# Test all packages
npm test

# Test specific package
cd packages/api && npm test
cd packages/web && npm test
cd packages/mobile && npm test
```

### API Testing

Use the health check endpoint to verify the API is running:
```bash
curl http://localhost:3001/health
```

## 🚀 Production Deployment

### Build for Production

```bash
# Build all packages
npm run build

# Build individual packages
cd packages/api && npm run build
cd packages/web && npm run build
cd packages/mobile && npm run build
```

### Environment Variables for Production

Update `.env` with production values:
```bash
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Find process using port
   netstat -ano | findstr :3001
   # Kill process
   taskkill /PID <process-id> /F
   ```

2. **Database connection issues:**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Ensure database exists

3. **React Native issues:**
   - Clear Metro cache: `npx react-native start --reset-cache`
   - Clean and rebuild: `cd android && ./gradlew clean`

4. **Dependency issues:**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Getting Help

1. Check the logs in each package directory
2. Verify all environment variables are set
3. Ensure all prerequisites are installed
4. Check the development plan in `docs/DEVELOPMENT_PLAN.md`

## 📚 Next Steps

After setup, continue with:

1. **Phase 2: Core API Development** - Implement job management endpoints
2. **Phase 3: Mobile App MVP** - Build voice recognition and GPS tracking
3. **Phase 4: Web Dashboard MVP** - Create management interface

See `docs/DEVELOPMENT_PLAN.md` for detailed roadmap.

## 🎯 Project Structure

```
Small_Business_Assistant/
├── packages/
│   ├── shared/          # Shared types and utilities
│   ├── api/             # Backend API server
│   ├── web/             # React web dashboard
│   └── mobile/          # React Native mobile app
├── docs/                # Documentation
├── .taskmaster/         # Task management
├── README.md            # Project overview
├── env.example          # Environment template
└── setup.md             # This file
```

---

*For detailed development information, see `docs/DEVELOPMENT_PLAN.md`* 