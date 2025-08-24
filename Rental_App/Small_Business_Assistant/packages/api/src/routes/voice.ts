import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Process voice command for job creation
router.post('/create-job', [
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
    let extractedInfo: any = {};

    // Extract customer name patterns
    const customerPatterns = [
      /(?:customer|client|for)\s+([a-zA-Z\s]+?)(?:\s+(?:phone|email|address|job|work|service))/,
      /(?:new job|create job|job for)\s+([a-zA-Z\s]+?)(?:\s+(?:phone|email|address|job|work|service))/,
      /([a-zA-Z\s]+?)\s+(?:needs|wants|requested|asked for)/,
    ];

    for (const pattern of customerPatterns) {
      const match = processedText.match(pattern);
      if (match) {
        jobData.customerName = match[1].trim();
        extractedInfo.customerName = match[1].trim();
        break;
      }
    }

    // Extract phone number
    const phoneMatch = processedText.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      jobData.customerPhone = phoneMatch[1];
      extractedInfo.customerPhone = phoneMatch[1];
    }

    // Extract email
    const emailMatch = processedText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      jobData.customerEmail = emailMatch[0];
      extractedInfo.customerEmail = emailMatch[0];
    }

    // Extract job title/description
    const jobPatterns = [
      /(?:job|work|service|repair|install|fix)\s+(.+?)(?:\s+(?:for|at|customer|client))/,
      /(?:need|want|requested|asked for)\s+(.+?)(?:\s+(?:service|work|job))/,
      /(?:plumbing|electrical|hvac|heating|cooling|repair|installation)\s+(.+?)(?:\s+(?:service|work|job))/,
    ];

    for (const pattern of jobPatterns) {
      const match = processedText.match(pattern);
      if (match) {
        jobData.title = match[1].trim();
        jobData.description = match[1].trim();
        extractedInfo.jobTitle = match[1].trim();
        break;
      }
    }

    // Determine priority
    if (processedText.includes('urgent') || processedText.includes('emergency') || processedText.includes('asap')) {
      jobData.priority = 'high';
      extractedInfo.priority = 'high';
    } else if (processedText.includes('low priority') || processedText.includes('not urgent')) {
      jobData.priority = 'low';
      extractedInfo.priority = 'low';
    } else {
      jobData.priority = 'medium';
      extractedInfo.priority = 'medium';
    }

    // Extract estimated duration
    const durationMatch = processedText.match(/(\d+)\s*(?:hour|hr|hours|minute|min|minutes)/);
    if (durationMatch) {
      const duration = parseInt(durationMatch[1]);
      if (processedText.includes('minute') || processedText.includes('min')) {
        jobData.estimatedDuration = duration;
      } else {
        jobData.estimatedDuration = duration * 60; // Convert hours to minutes
      }
      extractedInfo.estimatedDuration = jobData.estimatedDuration;
    }

    // Store voice command
    const voiceCommand = await prisma.voiceCommand.create({
      data: {
        type: 'create_job',
        text,
        processedText: JSON.stringify(extractedInfo),
        confidence,
        metadata,
      },
    });

    res.json({
      success: true,
      data: {
        voiceCommand,
        extractedInfo,
        jobData,
        suggestedAction: 'create_job',
      },
    });
  } catch (error) {
    console.error('Voice create job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice command',
    });
  }
});

// Process voice command for job updates
router.post('/update-job/:jobId', [
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

    const { jobId } = req.params;
    const { text, confidence, metadata } = req.body;
    const userId = req.user!.id;

    // Verify job belongs to user
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const processedText = text.toLowerCase();
    let updateData: any = {};
    let extractedInfo: any = {};

    // Extract status updates
    if (processedText.includes('start') || processedText.includes('begin') || processedText.includes('in progress')) {
      updateData.status = 'in_progress';
      extractedInfo.status = 'in_progress';
    } else if (processedText.includes('complete') || processedText.includes('finished') || processedText.includes('done')) {
      updateData.status = 'completed';
      extractedInfo.status = 'completed';
    } else if (processedText.includes('cancel') || processedText.includes('cancelled')) {
      updateData.status = 'cancelled';
      extractedInfo.status = 'cancelled';
    } else if (processedText.includes('hold') || processedText.includes('pause')) {
      updateData.status = 'on_hold';
      extractedInfo.status = 'on_hold';
    }

    // Extract notes
    const notesMatch = processedText.match(/(?:note|notes|comment|remark):\s*(.+)/);
    if (notesMatch) {
      updateData.notes = notesMatch[1].trim();
      extractedInfo.notes = notesMatch[1].trim();
    }

    // Extract actual duration
    const durationMatch = processedText.match(/(\d+)\s*(?:hour|hr|hours|minute|min|minutes)\s*(?:took|spent|used)/);
    if (durationMatch) {
      const duration = parseInt(durationMatch[1]);
      if (processedText.includes('minute') || processedText.includes('min')) {
        updateData.actualDuration = duration;
      } else {
        updateData.actualDuration = duration * 60; // Convert hours to minutes
      }
      extractedInfo.actualDuration = updateData.actualDuration;
    }

    // Extract costs
    const costMatch = processedText.match(/(\d+(?:\.\d{2})?)\s*(?:dollar|dollars|buck|bucks)/);
    if (costMatch) {
      const cost = parseFloat(costMatch[1]);
      if (processedText.includes('labor') || processedText.includes('work')) {
        updateData.laborCost = cost;
        extractedInfo.laborCost = cost;
      } else {
        updateData.totalCost = cost;
        extractedInfo.totalCost = cost;
      }
    }

    // Store voice command
    const voiceCommand = await prisma.voiceCommand.create({
      data: {
        type: 'update_job',
        text,
        processedText: JSON.stringify(extractedInfo),
        confidence,
        metadata,
        jobId,
      },
    });

    res.json({
      success: true,
      data: {
        voiceCommand,
        extractedInfo,
        updateData,
        suggestedAction: 'update_job',
      },
    });
  } catch (error) {
    console.error('Voice update job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice command',
    });
  }
});

// Process voice command for time tracking
router.post('/time-tracking/:jobId', [
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

    const { jobId } = req.params;
    const { text, confidence, metadata } = req.body;
    const userId = req.user!.id;

    // Verify job belongs to user
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const processedText = text.toLowerCase();
    let action = '';
    let extractedInfo: any = {};

    // Determine time tracking action
    if (processedText.includes('start') || processedText.includes('begin') || processedText.includes('clock in')) {
      action = 'start_timer';
      extractedInfo.action = 'start_timer';
    } else if (processedText.includes('stop') || processedText.includes('end') || processedText.includes('clock out')) {
      action = 'stop_timer';
      extractedInfo.action = 'stop_timer';
    } else if (processedText.includes('pause') || processedText.includes('break')) {
      action = 'pause_timer';
      extractedInfo.action = 'pause_timer';
    } else if (processedText.includes('resume') || processedText.includes('continue')) {
      action = 'resume_timer';
      extractedInfo.action = 'resume_timer';
    }

    // Store voice command
    const voiceCommand = await prisma.voiceCommand.create({
      data: {
        type: action as any,
        text,
        processedText: JSON.stringify(extractedInfo),
        confidence,
        metadata,
        jobId,
      },
    });

    res.json({
      success: true,
      data: {
        voiceCommand,
        extractedInfo,
        action,
        suggestedAction: action,
      },
    });
  } catch (error) {
    console.error('Voice time tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice command',
    });
  }
});

// Process voice command for photo capture
router.post('/photo-capture/:jobId', [
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

    const { jobId } = req.params;
    const { text, confidence, metadata } = req.body;
    const userId = req.user!.id;

    // Verify job belongs to user
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const processedText = text.toLowerCase();
    let photoType = '';
    let extractedInfo: any = {};

    // Determine photo type
    if (processedText.includes('before') || processedText.includes('start') || processedText.includes('initial')) {
      photoType = 'before';
      extractedInfo.photoType = 'before';
    } else if (processedText.includes('after') || processedText.includes('complete') || processedText.includes('finished')) {
      photoType = 'after';
      extractedInfo.photoType = 'after';
    }

    // Extract description
    const descriptionMatch = processedText.match(/(?:photo|picture|image)\s+(?:of|showing)\s+(.+)/);
    if (descriptionMatch) {
      extractedInfo.description = descriptionMatch[1].trim();
    }

    // Store voice command
    const voiceCommand = await prisma.voiceCommand.create({
      data: {
        type: 'photo_capture',
        text,
        processedText: JSON.stringify(extractedInfo),
        confidence,
        metadata,
        jobId,
      },
    });

    res.json({
      success: true,
      data: {
        voiceCommand,
        extractedInfo,
        photoType,
        suggestedAction: 'capture_photo',
      },
    });
  } catch (error) {
    console.error('Voice photo capture error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice command',
    });
  }
});

// Get voice command history
router.get('/history', [
  query('jobId').optional().isString(),
  query('type').optional().isString(),
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

    const { jobId, type, page = 1, limit = 20 } = req.query;
    const userId = req.user!.id;

    const where: any = {};
    if (jobId) where.jobId = jobId;
    if (type) where.type = type;

    // Only show commands for user's jobs
    if (jobId) {
      const job = await prisma.job.findFirst({
        where: { id: jobId as string, userId },
      });
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found',
        });
      }
    } else {
      // Filter by jobs that belong to the user
      const userJobs = await prisma.job.findMany({
        where: { userId },
        select: { id: true },
      });
      where.jobId = { in: userJobs.map(job => job.id) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [commands, total] = await Promise.all([
      prisma.voiceCommand.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              customerName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.voiceCommand.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        commands,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get voice command history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voice command history',
    });
  }
});

// Get voice command statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user's job IDs
    const userJobs = await prisma.job.findMany({
      where: { userId },
      select: { id: true },
    });

    const jobIds = userJobs.map(job => job.id);

    const [totalCommands, createJobCommands, updateJobCommands, timeTrackingCommands, photoCommands] = await Promise.all([
      prisma.voiceCommand.count({
        where: { jobId: { in: jobIds } },
      }),
      prisma.voiceCommand.count({
        where: { jobId: { in: jobIds }, type: 'create_job' },
      }),
      prisma.voiceCommand.count({
        where: { jobId: { in: jobIds }, type: 'update_job' },
      }),
      prisma.voiceCommand.count({
        where: { 
          jobId: { in: jobIds }, 
          type: { in: ['start_timer', 'stop_timer', 'pause_timer', 'resume_timer'] } 
        },
      }),
      prisma.voiceCommand.count({
        where: { jobId: { in: jobIds }, type: 'photo_capture' },
      }),
    ]);

    // Get average confidence
    const avgConfidence = await prisma.voiceCommand.aggregate({
      where: { jobId: { in: jobIds } },
      _avg: { confidence: true },
    });

    res.json({
      success: true,
      data: {
        totalCommands,
        createJobCommands,
        updateJobCommands,
        timeTrackingCommands,
        photoCommands,
        averageConfidence: avgConfidence._avg.confidence || 0,
      },
    });
  } catch (error) {
    console.error('Get voice command stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voice command statistics',
    });
  }
});

export default router; 