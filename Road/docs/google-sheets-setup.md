# Google Sheets API Setup Guide

This guide will walk you through setting up Google Sheets API access for the Retail Store Dashboard.

## Prerequisites

- A Google account
- Basic knowledge of Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Retail Store Dashboard")
5. Click "Create"

## Step 2: Enable Google Sheets API

1. In your new project, go to the [APIs & Services > Library](https://console.cloud.google.com/apis/library)
2. Search for "Google Sheets API"
3. Click on "Google Sheets API"
4. Click "Enable"

## Step 3: Create Service Account Credentials

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - **Name**: `retail-dashboard-service`
   - **Description**: `Service account for retail store dashboard`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 4: Generate JSON Key

1. In the credentials page, find your service account and click on it
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Click "Create"
6. The JSON file will download automatically

## Step 5: Set Up Your Google Sheet

1. Create a new Google Sheet or use an existing one
2. Create two sheets:
   - **Schedule**: For employee schedule data
   - **Performance**: For sales and performance data

### Schedule Sheet Structure
Create headers in the first row:
```
Date | Employee | Shift | Start | End | Hours | Position
```

Example data:
```
2024-01-15 | John Smith | Morning | 09:00 | 17:00 | 8 | Cashier
2024-01-15 | Jane Doe | Evening | 14:00 | 22:00 | 8 | Manager
```

### Performance Sheet Structure
Create headers in the first row:
```
Date | Sales | Transactions | Customers | Revenue
```

Example data:
```
2024-01-15 | 2500.50 | 45 | 38 | 2500.50
2024-01-16 | 3200.75 | 52 | 45 | 3200.75
```

## Step 6: Share Your Google Sheet

1. In your Google Sheet, click the "Share" button
2. Add your service account email (found in the JSON file under `client_email`)
3. Give it "Viewer" permissions
4. Click "Send"

## Step 7: Configure the Application

1. Copy the downloaded JSON file to `server/credentials/service-account.json`
2. Copy the Google Sheet ID from the URL:
   - Your sheet URL looks like: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`
   - Copy the `YOUR_SHEET_ID` part

3. Create a `.env` file in the `server` directory:
```env
GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials/service-account.json
GOOGLE_SHEET_ID=your-sheet-id-here
PORT=5000
NODE_ENV=development
```

## Step 8: Test the Setup

1. Start the backend server:
```bash
cd server
npm install
npm run dev
```

2. Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

3. Test the schedule endpoint:
```bash
curl http://localhost:5000/api/schedule
```

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Make sure the JSON file path is correct
   - Verify the service account email has access to the sheet

2. **"Sheet not found" error**
   - Check that the sheet ID is correct
   - Ensure the sheet names match exactly (case-sensitive)

3. **"Permission denied" error**
   - Make sure you've shared the sheet with the service account email
   - Check that the service account has at least "Viewer" permissions

### Security Best Practices

1. **Never commit credentials to version control**
   - Add `credentials/` to your `.gitignore` file
   - Use environment variables for sensitive data

2. **Limit API access**
   - Only enable the Google Sheets API
   - Use the minimum required permissions

3. **Regular credential rotation**
   - Periodically regenerate service account keys
   - Monitor API usage in Google Cloud Console

## API Rate Limits

Google Sheets API has the following limits:
- 100 requests per 100 seconds per user
- 300 requests per 60 seconds per project

The application includes rate limiting to stay within these limits.

## Support

If you encounter issues:
1. Check the Google Cloud Console for API usage and errors
2. Verify your Google Sheet structure matches the expected format
3. Check the server logs for detailed error messages
4. Ensure all environment variables are set correctly 