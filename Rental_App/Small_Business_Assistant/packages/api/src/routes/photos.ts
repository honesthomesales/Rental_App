import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all photos for a job
router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
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

    const photos = await prisma.photo.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { photos },
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch photos',
    });
  }
});

// Upload a photo for a job
router.post('/upload/:jobId', [
  body('type').isIn(['before', 'after']).withMessage('Type must be before or after'),
  body('description').optional().isString(),
], upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No photo file provided',
      });
    }

    const { jobId } = req.params;
    const { type, description } = req.body;
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

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        url: `/uploads/photos/${req.file.filename}`,
        type: type as 'before' | 'after',
        description,
        jobId,
      },
    });

    res.status(201).json({
      success: true,
      data: { photo },
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload photo',
    });
  }
});

// Upload multiple photos for a job
router.post('/upload-multiple/:jobId', [
  body('type').isIn(['before', 'after']).withMessage('Type must be before or after'),
], upload.array('photos', 10), async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No photo files provided',
      });
    }

    const { jobId } = req.params;
    const { type } = req.body;
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

    // Create photo records for all uploaded files
    const photos = await Promise.all(
      (req.files as Express.Multer.File[]).map(file =>
        prisma.photo.create({
          data: {
            url: `/uploads/photos/${file.filename}`,
            type: type as 'before' | 'after',
            jobId,
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      data: { photos },
    });
  } catch (error) {
    console.error('Upload multiple photos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload photos',
    });
  }
});

// Get a specific photo
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const photo = await prisma.photo.findFirst({
      where: {
        id,
        job: { userId },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            customerName: true,
          },
        },
      },
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
      });
    }

    res.json({
      success: true,
      data: { photo },
    });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch photo',
    });
  }
});

// Update photo description
router.put('/:id', [
  body('description').optional().isString(),
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
    const { description } = req.body;
    const userId = req.user!.id;

    // Verify photo belongs to user's job
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id,
        job: { userId },
      },
    });

    if (!existingPhoto) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
      });
    }

    const photo = await prisma.photo.update({
      where: { id },
      data: { description },
    });

    res.json({
      success: true,
      data: { photo },
    });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update photo',
    });
  }
});

// Delete a photo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify photo belongs to user's job
    const photo = await prisma.photo.findFirst({
      where: {
        id,
        job: { userId },
      },
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
      });
    }

    // Delete the file from disk
    const filePath = path.join(__dirname, '../../', photo.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete photo',
    });
  }
});

// Get photo statistics for a job
router.get('/stats/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
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

    const [beforeCount, afterCount, totalCount] = await Promise.all([
      prisma.photo.count({
        where: { jobId, type: 'before' },
      }),
      prisma.photo.count({
        where: { jobId, type: 'after' },
      }),
      prisma.photo.count({
        where: { jobId },
      }),
    ]);

    res.json({
      success: true,
      data: {
        beforeCount,
        afterCount,
        totalCount,
      },
    });
  } catch (error) {
    console.error('Get photo stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch photo statistics',
    });
  }
});

export default router; 