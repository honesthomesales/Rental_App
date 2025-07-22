import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Get all jobs for the authenticated user
router.get('/', [
  query('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { status, priority, page = 1, limit = 20 } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          address: true,
          photos: { take: 1 },
          timeEntries: {
            orderBy: { startTime: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.job.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
    });
  }
});

// Get a specific job by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const job = await prisma.job.findFirst({
      where: { id, userId },
      include: {
        address: true,
        photos: true,
        timeEntries: {
          orderBy: { startTime: 'desc' },
        },
        quotes: {
          include: { items: true },
        },
        invoices: {
          include: { items: true },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      data: { job },
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job',
    });
  }
});

// Create a new job
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('customerPhone').optional().isMobilePhone('any'),
  body('customerEmail').optional().isEmail(),
  body('description').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('estimatedDuration').optional().isInt({ min: 1 }),
  body('address').optional().isObject(),
  body('address.latitude').optional().isFloat(),
  body('address.longitude').optional().isFloat(),
  body('address.address').optional().isString(),
  body('address.city').optional().isString(),
  body('address.state').optional().isString(),
  body('address.zipCode').optional().isString(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const {
      title,
      customerName,
      customerPhone,
      customerEmail,
      description,
      priority = 'medium',
      estimatedDuration,
      address,
    } = req.body;

    const userId = req.user!.id;

    const job = await prisma.job.create({
      data: {
        title,
        customerName,
        customerPhone,
        customerEmail,
        description,
        priority,
        estimatedDuration,
        userId,
        address: address ? {
          create: {
            latitude: address.latitude,
            longitude: address.longitude,
            address: address.address,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
          },
        } : undefined,
      },
      include: {
        address: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { job },
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job',
    });
  }
});

// Update a job
router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('customerName').optional().trim().notEmpty(),
  body('customerPhone').optional().isMobilePhone('any'),
  body('customerEmail').optional().isEmail(),
  body('description').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']),
  body('estimatedDuration').optional().isInt({ min: 1 }),
  body('actualDuration').optional().isInt({ min: 1 }),
  body('laborCost').optional().isFloat({ min: 0 }),
  body('totalCost').optional().isFloat({ min: 0 }),
  body('notes').optional().isString(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const userId = req.user!.id;

    // Check if job exists and belongs to user
    const existingJob = await prisma.job.findFirst({
      where: { id, userId },
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const updateData: any = { ...req.body };
    
    // Set completedAt if status is being set to completed
    if (updateData.status === 'completed' && existingJob.status !== 'completed') {
      updateData.completedAt = new Date();
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        address: true,
      },
    });

    res.json({
      success: true,
      data: { job },
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job',
    });
  }
});

// Delete a job
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const job = await prisma.job.findFirst({
      where: { id, userId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    await prisma.job.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete job',
    });
  }
});

// Start time tracking for a job
router.post('/:id/start-timer', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const job = await prisma.job.findFirst({
      where: { id, userId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Check if there's already an active time entry
    const activeTimeEntry = await prisma.timeEntry.findFirst({
      where: {
        jobId: id,
        endTime: null,
      },
    });

    if (activeTimeEntry) {
      return res.status(400).json({
        success: false,
        error: 'Time tracking already active for this job',
      });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        jobId: id,
        startTime: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      data: { timeEntry },
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start timer',
    });
  }
});

// Stop time tracking for a job
router.post('/:id/stop-timer', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const job = await prisma.job.findFirst({
      where: { id, userId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        jobId: id,
        endTime: null,
      },
    });

    if (!timeEntry) {
      return res.status(400).json({
        success: false,
        error: 'No active time tracking found for this job',
      });
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - timeEntry.startTime.getTime()) / (1000 * 60)); // minutes

    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        endTime,
        duration,
      },
    });

    res.json({
      success: true,
      data: { timeEntry: updatedTimeEntry },
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop timer',
    });
  }
});

// Process voice command for job creation/update
router.post('/voice-command', [
  body('text').trim().notEmpty().withMessage('Voice command text is required'),
  body('confidence').optional().isFloat({ min: 0, max: 1 }),
  body('metadata').optional().isObject(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { text, confidence, metadata } = req.body;
    const userId = req.user!.id;

    // Simple voice command processing - in a real app, you'd use NLP/AI
    const processedText = text.toLowerCase();
    let jobData: any = {};
    let commandType = 'unknown';

    // Extract customer name (simple pattern matching)
    const customerMatch = processedText.match(/(?:customer|client|for)\s+([a-zA-Z\s]+?)(?:\s+(?:phone|email|address|job|work|service))/);
    if (customerMatch) {
      jobData.customerName = customerMatch[1].trim();
    }

    // Extract phone number
    const phoneMatch = processedText.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      jobData.customerPhone = phoneMatch[1];
    }

    // Extract job title/description
    const jobMatch = processedText.match(/(?:job|work|service|repair|install|fix)\s+(.+?)(?:\s+(?:for|at|customer|client))/);
    if (jobMatch) {
      jobData.title = jobMatch[1].trim();
      jobData.description = jobMatch[1].trim();
    }

    // Determine priority
    if (processedText.includes('urgent') || processedText.includes('emergency')) {
      jobData.priority = 'high';
    } else if (processedText.includes('low priority')) {
      jobData.priority = 'low';
    } else {
      jobData.priority = 'medium';
    }

    // Determine command type
    if (processedText.includes('new job') || processedText.includes('create job')) {
      commandType = 'create_job';
    } else if (processedText.includes('update job') || processedText.includes('modify job')) {
      commandType = 'update_job';
    } else if (processedText.includes('start timer') || processedText.includes('begin work')) {
      commandType = 'start_timer';
    } else if (processedText.includes('stop timer') || processedText.includes('end work')) {
      commandType = 'stop_timer';
    }

    // Store voice command
    const voiceCommand = await prisma.voiceCommand.create({
      data: {
        type: commandType as any,
        text,
        processedText: JSON.stringify(jobData),
        confidence,
        metadata,
      },
    });

    res.json({
      success: true,
      data: {
        voiceCommand,
        processedData: jobData,
        commandType,
      },
    });
  } catch (error) {
    console.error('Voice command processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice command',
    });
  }
});

export default router; 