# Local Development Setup

## Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

## Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd Rental_App
   ```

2. **Install dependencies for all packages:**
   ```bash
   # Install root dependencies
   npm install
   
   # Install API package dependencies
   cd packages/api
   npm install
   npm run build
   cd ../..
   
   # Install web app dependencies
   cd apps/web
   npm install
   cd ../..
   ```

3. **Set up environment variables:**
   - Copy `env.example` to `apps/web/.env.local`
   - Update the Supabase credentials in `.env.local`

4. **Start the development server:**
   ```bash
   cd apps/web
   npm run dev
   ```

   Or use the batch file:
   ```bash
   run_web_local.bat
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Build for Production

To build the app for production (static export):

```bash
cd apps/web
npm run build:no-lint
```

The static files will be generated in the `out/` directory.

## Troubleshooting

### Build Errors
- If you get ESLint errors during build, use `npm run build:no-lint`
- Make sure all dependencies are installed in both root and packages

### API Package Issues
- If the web app can't find API types, rebuild the API package:
  ```bash
  cd packages/api
  npm run build
  ```

### Environment Variables
- Ensure `.env.local` exists in `apps/web/` directory
- Check that Supabase credentials are correct

## Project Structure

```
Rental_App/
├── apps/
│   └── web/           # Next.js web application
├── packages/
│   ├── api/           # API services and types
│   └── ui/            # Shared UI components
└── .github/workflows/ # GitHub Actions for deployment
```

## Available Scripts

### Web App (`apps/web/`)
- `npm run dev` - Start development server
- `npm run build` - Build with linting
- `npm run build:no-lint` - Build without linting
- `npm run start` - Start production server

### API Package (`packages/api/`)
- `npm run build` - Build TypeScript
- `npm run dev` - Watch mode (if configured)
