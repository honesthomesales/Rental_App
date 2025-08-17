const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.scheduleSheetName = process.env.SCHEDULE_SHEET_NAME || 'Schedule';
    this.performanceSheetName = process.env.PERFORMANCE_SHEET_NAME || 'Performance';
    
    // For testing purposes, allow missing sheet ID
    if (!this.spreadsheetId) {
      console.warn('⚠️  GOOGLE_SHEET_ID not set - using mock data for testing');
      this.spreadsheetId = 'test-sheet-id';
    }
  }

  async authenticate() {
    try {
      const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH;
      
      if (!credentialsPath) {
        console.warn('⚠️  GOOGLE_SHEETS_CREDENTIALS_PATH not set - using mock data for testing');
        this.sheets = null;
        return;
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ Google Sheets authentication successful');
    } catch (error) {
      console.warn('⚠️  Google Sheets authentication failed - using mock data for testing:', error.message);
      this.sheets = null;
    }
  }

  async getSheetData(sheetName, range = null) {
    if (!this.sheets) {
      await this.authenticate();
    }

    // Return mock data if Google Sheets is not configured
    if (!this.sheets) {
      console.log(`📊 Returning mock data for sheet: ${sheetName}`);
      return this.getMockData(sheetName);
    }

    try {
      const sheetRange = range || `${sheetName}!A:Z`;
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: sheetRange,
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        console.log(`No data found in sheet: ${sheetName}`);
        return [];
      }

      // Convert to array of objects using first row as headers
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      return data;
    } catch (error) {
      console.error(`Error fetching data from sheet ${sheetName}:`, error.message);
      throw error;
    }
  }

  getMockData(sheetName) {
    if (sheetName === 'Schedule' || sheetName === this.scheduleSheetName) {
      return [
        {
          Date: '2024-01-15',
          Employee: 'John Smith',
          Shift: 'Morning',
          Start: '09:00',
          End: '17:00',
          Hours: '8',
          Position: 'Cashier'
        },
        {
          Date: '2024-01-15',
          Employee: 'Jane Doe',
          Shift: 'Evening',
          Start: '14:00',
          End: '22:00',
          Hours: '8',
          Position: 'Manager'
        },
        {
          Date: '2024-01-16',
          Employee: 'Mike Johnson',
          Shift: 'Morning',
          Start: '08:00',
          End: '16:00',
          Hours: '8',
          Position: 'Stock Clerk'
        }
      ];
    } else if (sheetName === 'Performance' || sheetName === this.performanceSheetName) {
      return [
        {
          Date: '2024-01-15',
          Sales: '2500.50',
          Transactions: '45',
          Customers: '38',
          Revenue: '2500.50'
        },
        {
          Date: '2024-01-16',
          Sales: '3200.75',
          Transactions: '52',
          Customers: '45',
          Revenue: '3200.75'
        },
        {
          Date: '2024-01-17',
          Sales: '2800.25',
          Transactions: '48',
          Customers: '42',
          Revenue: '2800.25'
        }
      ];
    }
    return [];
  }

  async getScheduleData() {
    return await this.getSheetData(this.scheduleSheetName);
  }

  async getPerformanceData() {
    return await this.getSheetData(this.performanceSheetName);
  }

  async getSheetMetadata() {
    if (!this.sheets) {
      await this.authenticate();
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      return {
        title: response.data.properties.title,
        sheets: response.data.sheets.map(sheet => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          rowCount: sheet.properties.gridProperties.rowCount,
          columnCount: sheet.properties.gridProperties.columnCount
        }))
      };
    } catch (error) {
      console.error('Error fetching sheet metadata:', error.message);
      throw error;
    }
  }

  // Helper method to validate sheet structure
  async validateSheetStructure() {
    try {
      const metadata = await this.getSheetMetadata();
      const sheetNames = metadata.sheets.map(sheet => sheet.title);
      
      const requiredSheets = [this.scheduleSheetName, this.performanceSheetName];
      const missingSheets = requiredSheets.filter(sheet => !sheetNames.includes(sheet));
      
      if (missingSheets.length > 0) {
        throw new Error(`Missing required sheets: ${missingSheets.join(', ')}`);
      }

      console.log('✅ Sheet structure validation passed');
      return true;
    } catch (error) {
      console.error('❌ Sheet structure validation failed:', error.message);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService(); 