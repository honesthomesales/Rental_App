# Retail Store Dashboard

A web application that displays schedule and performance information for a retail store by connecting to Google Sheets.

## Features

- 📅 **Schedule Display**: View employee schedules and shifts
- 📊 **Performance Metrics**: Monitor sales, KPIs, and store performance
- 🔄 **Auto-Update**: Real-time data from Google Sheets
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Data Source**: Google Sheets API
- **Styling**: Tailwind CSS

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Google Sheets API credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up Google Sheets API:
   - Create a Google Cloud Project
   - Enable Google Sheets API
   - Create service account credentials
   - Share your Google Sheet with the service account email

4. Configure environment variables:
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your Google Sheets credentials
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
├── server/                # Node.js backend
│   ├── routes/            # API routes
│   ├── services/          # Google Sheets service
│   └── config/            # Configuration files
└── docs/                  # Documentation
```

## Google Sheets Setup

1. Create a Google Sheet with the following structure:
   - **Schedule Sheet**: Employee names, dates, shifts, hours
   - **Performance Sheet**: Sales data, KPIs, metrics

2. Set up Google Cloud Project:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Sheets API
   - Create a service account
   - Download the JSON credentials file

3. Share your Google Sheet with the service account email

## Environment Variables

Create a `.env` file in the `server` directory:

```env
GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials/service-account.json
GOOGLE_SHEET_ID=your-google-sheet-id
PORT=5000
NODE_ENV=development
```

## API Endpoints

- `GET /api/schedule` - Get employee schedule data
- `GET /api/performance` - Get performance metrics
- `GET /api/health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT 