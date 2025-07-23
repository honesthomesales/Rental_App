# Rental Management App

A production-grade rental property management application built with Next.js, React Native, and Supabase.

## 🏗️ Project Structure

```
Rental_App/
├── apps/
│   ├── web/                 # Next.js web application
│   ├── android/             # React Native Android app
│   └── tablet/              # React Native tablet app
├── packages/
│   ├── api/                 # Shared API client & types
│   ├── ui/                  # Shared UI components
│   └── scraper/             # Payment scraping services
└── supabase/
    ├── migrations/          # Database migrations
    └── seed.sql            # Seed data
```

## 🚀 Features

### ✅ Core Features
- **Dashboard**: Outstanding balances, profit tracking, bank balances, date range filters
- **Properties**: Full CRUD with sale/rent flags, insurance fields, owner information
- **Tenants**: Complete tenant management with lease PDF upload, payment history, late flags
- **Transactions**: Record buy/sell/rent/loan payments with invoice image upload and OCR
- **Notices**: Late tenant management, late fees, and eviction notice generation
- **Loans**: House loan tracking and payment management
- **Bank Accounts**: Manual balance tracking with outstanding amounts
- **Scrapers**: Gmail, SMS, and CashApp payment parsing and proposal
- **Payment Proof**: Check photo uploads for payment verification

### 🔧 Technical Features
- **Multi-platform**: Web, Android, and tablet support
- **Real-time**: Supabase real-time subscriptions
- **File Storage**: Supabase Storage for PDFs and images
- **OCR Integration**: Google Cloud Vision API for invoice processing
- **Payment Processing**: Twilio SMS and SendGrid email integration
- **Responsive Design**: Tailwind CSS with mobile-first approach

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud account (for Vision API)
- Twilio account (for SMS)
- SendGrid account (for email)

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm run install:all
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Copy your project URL and anon key
3. Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase (if not already done)
supabase init

# Push migrations to your project
npm run db:migrate

# Seed the database
npm run db:seed
```

### 4. Build Packages

```bash
# Build shared packages
npm run build:packages

# Build web app
npm run build:web
```

### 5. Start Development

```bash
# Start all apps in development mode
npm run dev

# Or start individual apps
npm run dev:web
npm run dev:android
npm run dev:tablet
```

## 📱 Platform-Specific Setup

### Web App (Next.js)
- Navigate to `apps/web`
- Run `npm run dev`
- Open http://localhost:3000

### Android App
- Navigate to `apps/android`
- Install React Native CLI: `npm install -g react-native-cli`
- Run `npx react-native run-android`

### Tablet App
- Navigate to `apps/tablet`
- Follow React Native setup instructions
- Run `npx react-native run-android`

## 🗄️ Database Schema

### Core Tables
- **properties**: Property information, insurance, owner details
- **tenants**: Tenant data, lease information, payment history
- **transactions**: All financial transactions with image uploads
- **loans**: Property loan tracking
- **bank_accounts**: Bank account management
- **scraped_payments**: Temporary payment data from scrapers

### Key Features
- UUID primary keys for all tables
- Automatic `updated_at` timestamps
- Proper foreign key relationships
- Indexed queries for performance
- JSONB fields for flexible data storage

## 🔌 API Services

### Properties Service
```typescript
import { PropertiesService } from '@rental-app/api'

// Get all properties
const properties = await PropertiesService.getAll()

// Create property
const newProperty = await PropertiesService.create(propertyData)

// Update property
const updated = await PropertiesService.update({ id, ...data })

// Delete property
await PropertiesService.delete(id)
```

### Available Services
- `PropertiesService`: Property CRUD operations
- `TenantsService`: Tenant management
- `TransactionsService`: Financial transactions
- `LoansService`: Loan tracking
- `BankAccountsService`: Account management
- `ScrapedPaymentsService`: Payment processing

## 🎨 UI Components

### Shared Components
```typescript
import { Button, Card, Input, Badge } from '@rental-app/ui'

// Usage
<Button variant="primary" size="lg">
  Add Property
</Button>

<Card>
  <Card.Header>
    <Card.Title>Property Details</Card.Title>
  </Card.Header>
  <Card.Content>
    {/* Content */}
  </Card.Content>
</Card>
```

### Design System
- **Colors**: Primary, success, warning, danger variants
- **Typography**: Inter font family
- **Spacing**: Consistent 4px grid system
- **Components**: Button, Card, Input, Badge, Modal, etc.

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/property-crud

# Make changes
# Test locally
npm run test

# Commit changes
git commit -m "feat: add property CRUD operations"
```

### 2. Testing
```bash
# Run all tests
npm run test

# Run specific app tests
npm run test:web
npm run test:api
```

### 3. Building
```bash
# Build all packages
npm run build

# Build specific packages
npm run build:api
npm run build:ui
npm run build:web
```

## 📊 Business Logic

### Late Fee Calculation
- 5+ days late: Late fee applied
- 10+ days late: Eviction notice generated
- Automatic status updates based on payment history

### Payment Processing
1. **Scraping**: Gmail, SMS, CashApp data collection
2. **Parsing**: Amount extraction and tenant matching
3. **Proposal**: Suggested transaction creation
4. **Approval**: Manual review and confirmation
5. **Processing**: Transaction creation and status updates

### Financial Tracking
- Monthly income vs expenses
- Outstanding balances per tenant
- Bank account reconciliation
- Profit/loss calculations

## 🔐 Security

### Authentication
- Supabase Auth for single-user system
- Row Level Security (RLS) policies
- Secure API key management

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention
- File upload security
- Environment variable protection

## 🚀 Deployment

### Web App
```bash
# Build for production
npm run build:web

# Deploy to Vercel/Netlify
vercel --prod
```

### Mobile Apps
```bash
# Build Android APK
cd apps/android
npx react-native build-android --mode=release

# Build iOS (requires macOS)
cd apps/tablet
npx react-native build-ios --mode=release
```

## 📝 Environment Variables

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Optional (for advanced features)
```env
GOOGLE_CLOUD_VISION_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SENDGRID_API_KEY=
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

---

**Built with ❤️ for rental property management** 