const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheets');

// GET /api/performance - Get all performance data
router.get('/', async (req, res) => {
  try {
    const performanceData = await googleSheetsService.getPerformanceData();
    
    res.json({
      success: true,
      data: performanceData,
      count: performanceData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance data',
      message: error.message
    });
  }
});

// GET /api/performance/today - Get today's performance
router.get('/today', async (req, res) => {
  try {
    const performanceData = await googleSheetsService.getPerformanceData();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const todaysPerformance = performanceData.filter(record => {
      const recordDate = record.Date || record.date || record.DATE;
      return recordDate === today;
    });
    
    res.json({
      success: true,
      data: todaysPerformance,
      count: todaysPerformance.length,
      date: today,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching today\'s performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s performance',
      message: error.message
    });
  }
});

// GET /api/performance/week - Get this week's performance
router.get('/week', async (req, res) => {
  try {
    const performanceData = await googleSheetsService.getPerformanceData();
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    
    const thisWeeksPerformance = performanceData.filter(record => {
      const recordDate = new Date(record.Date || record.date || record.DATE);
      return recordDate >= startOfWeek && recordDate <= endOfWeek;
    });
    
    res.json({
      success: true,
      data: thisWeeksPerformance,
      count: thisWeeksPerformance.length,
      weekStart: startOfWeek.toISOString().split('T')[0],
      weekEnd: endOfWeek.toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching week performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch week performance',
      message: error.message
    });
  }
});

// GET /api/performance/month - Get this month's performance
router.get('/month', async (req, res) => {
  try {
    const performanceData = await googleSheetsService.getPerformanceData();
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const thisMonthsPerformance = performanceData.filter(record => {
      const recordDate = new Date(record.Date || record.date || record.DATE);
      return recordDate >= startOfMonth && recordDate <= endOfMonth;
    });
    
    res.json({
      success: true,
      data: thisMonthsPerformance,
      count: thisMonthsPerformance.length,
      monthStart: startOfMonth.toISOString().split('T')[0],
      monthEnd: endOfMonth.toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching month performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch month performance',
      message: error.message
    });
  }
});

// GET /api/performance/summary - Get performance summary statistics
router.get('/summary', async (req, res) => {
  try {
    const performanceData = await googleSheetsService.getPerformanceData();
    
    // Calculate summary statistics
    let totalSales = 0;
    let totalTransactions = 0;
    let totalCustomers = 0;
    const dailyData = {};
    
    performanceData.forEach(record => {
      const date = record.Date || record.date || record.DATE;
      const sales = parseFloat(record.Sales || record.sales || record.SALES || 0);
      const transactions = parseInt(record.Transactions || record.transactions || record.TRANSACTIONS || 0);
      const customers = parseInt(record.Customers || record.customers || record.CUSTOMERS || 0);
      
      totalSales += sales;
      totalTransactions += transactions;
      totalCustomers += customers;
      
      if (date) {
        if (!dailyData[date]) {
          dailyData[date] = {
            sales: 0,
            transactions: 0,
            customers: 0
          };
        }
        dailyData[date].sales += sales;
        dailyData[date].transactions += transactions;
        dailyData[date].customers += customers;
      }
    });
    
    // Calculate averages
    const daysCount = Object.keys(dailyData).length;
    const avgDailySales = daysCount > 0 ? totalSales / daysCount : 0;
    const avgDailyTransactions = daysCount > 0 ? totalTransactions / daysCount : 0;
    const avgDailyCustomers = daysCount > 0 ? totalCustomers / daysCount : 0;
    
    const summary = {
      totalSales: Math.round(totalSales * 100) / 100,
      totalTransactions,
      totalCustomers,
      avgDailySales: Math.round(avgDailySales * 100) / 100,
      avgDailyTransactions: Math.round(avgDailyTransactions * 100) / 100,
      avgDailyCustomers: Math.round(avgDailyCustomers * 100) / 100,
      daysCount,
      dailyData,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error generating performance summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance summary',
      message: error.message
    });
  }
});

// GET /api/performance/metrics - Get specific performance metrics
router.get('/metrics', async (req, res) => {
  try {
    const { metric } = req.query;
    const performanceData = await googleSheetsService.getPerformanceData();
    
    if (!metric) {
      return res.status(400).json({
        success: false,
        error: 'Metric parameter is required (e.g., ?metric=sales)'
      });
    }
    
    const metricData = performanceData.map(record => ({
      date: record.Date || record.date || record.DATE,
      value: parseFloat(record[metric] || record[metric.toUpperCase()] || 0)
    })).filter(item => item.date && !isNaN(item.value));
    
    res.json({
      success: true,
      metric,
      data: metricData,
      count: metricData.length,
      total: metricData.reduce((sum, item) => sum + item.value, 0),
      average: metricData.length > 0 ? metricData.reduce((sum, item) => sum + item.value, 0) / metricData.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance metrics',
      message: error.message
    });
  }
});

module.exports = router; 