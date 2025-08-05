const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheets');

// GET /api/schedule - Get all schedule data
router.get('/', async (req, res) => {
  try {
    const scheduleData = await googleSheetsService.getScheduleData();
    
    res.json({
      success: true,
      data: scheduleData,
      count: scheduleData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule data',
      message: error.message
    });
  }
});

// GET /api/schedule/today - Get today's schedule
router.get('/today', async (req, res) => {
  try {
    const scheduleData = await googleSheetsService.getScheduleData();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const todaysSchedule = scheduleData.filter(shift => {
      const shiftDate = shift.Date || shift.date || shift.DATE;
      return shiftDate === today;
    });
    
    res.json({
      success: true,
      data: todaysSchedule,
      count: todaysSchedule.length,
      date: today,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching today\'s schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s schedule',
      message: error.message
    });
  }
});

// GET /api/schedule/week - Get this week's schedule
router.get('/week', async (req, res) => {
  try {
    const scheduleData = await googleSheetsService.getScheduleData();
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    
    const thisWeeksSchedule = scheduleData.filter(shift => {
      const shiftDate = new Date(shift.Date || shift.date || shift.DATE);
      return shiftDate >= startOfWeek && shiftDate <= endOfWeek;
    });
    
    res.json({
      success: true,
      data: thisWeeksSchedule,
      count: thisWeeksSchedule.length,
      weekStart: startOfWeek.toISOString().split('T')[0],
      weekEnd: endOfWeek.toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching week schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch week schedule',
      message: error.message
    });
  }
});

// GET /api/schedule/employee/:name - Get schedule for specific employee
router.get('/employee/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const scheduleData = await googleSheetsService.getScheduleData();
    
    const employeeSchedule = scheduleData.filter(shift => {
      const employeeName = shift.Employee || shift.Name || shift.EMPLOYEE || shift.NAME;
      return employeeName && employeeName.toLowerCase().includes(name.toLowerCase());
    });
    
    res.json({
      success: true,
      data: employeeSchedule,
      count: employeeSchedule.length,
      employee: name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching employee schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee schedule',
      message: error.message
    });
  }
});

// GET /api/schedule/summary - Get schedule summary statistics
router.get('/summary', async (req, res) => {
  try {
    const scheduleData = await googleSheetsService.getScheduleData();
    
    // Group by employee
    const employeeSummary = {};
    scheduleData.forEach(shift => {
      const employeeName = shift.Employee || shift.Name || shift.EMPLOYEE || shift.NAME;
      if (employeeName) {
        if (!employeeSummary[employeeName]) {
          employeeSummary[employeeName] = {
            totalShifts: 0,
            totalHours: 0,
            shifts: []
          };
        }
        employeeSummary[employeeName].totalShifts++;
        employeeSummary[employeeName].shifts.push(shift);
        
        // Calculate hours if available
        const hours = parseFloat(shift.Hours || shift.hours || shift.HOURS || 0);
        employeeSummary[employeeName].totalHours += hours;
      }
    });
    
    const summary = {
      totalShifts: scheduleData.length,
      totalEmployees: Object.keys(employeeSummary).length,
      employeeSummary,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error generating schedule summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate schedule summary',
      message: error.message
    });
  }
});

module.exports = router; 