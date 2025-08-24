import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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

// Get current user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
  }
});

// Update user profile
router.put('/profile', [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone('any'),
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

    const { firstName, lastName, phone } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// Upload profile photo
router.post('/profile/photo', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No photo file provided',
      });
    }

    const userId = req.user!.id;

    // Get current user to check if they have an existing photo
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    });

    // Delete old profile photo if it exists
    if (currentUser?.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, '../../', currentUser.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update user with new photo
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        profilePhoto: `/uploads/profiles/${req.file.filename}`,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile photo',
    });
  }
});

// Delete profile photo
router.delete('/profile/photo', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    });

    if (!user?.profilePhoto) {
      return res.status(404).json({
        success: false,
        error: 'No profile photo found',
      });
    }

    // Delete the file from disk
    const photoPath = path.join(__dirname, '../../', user.profilePhoto);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Update user to remove photo reference
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete profile photo',
    });
  }
});

// Get user statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [totalJobs, completedJobs, pendingJobs, totalQuotes, totalInvoices, paidInvoices] = await Promise.all([
      prisma.job.count({ where: { userId } }),
      prisma.job.count({ where: { userId, status: 'completed' } }),
      prisma.job.count({ where: { userId, status: { in: ['pending', 'in_progress'] } } }),
      prisma.quote.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId, status: 'paid' } }),
    ]);

    // Calculate total earnings
    const earnings = await prisma.invoice.aggregate({
      where: { userId, status: 'paid' },
      _sum: { total: true },
    });

    // Calculate average job duration
    const avgDuration = await prisma.job.aggregate({
      where: { userId, actualDuration: { not: null } },
      _avg: { actualDuration: true },
    });

    res.json({
      success: true,
      data: {
        totalJobs,
        completedJobs,
        pendingJobs,
        totalQuotes,
        totalInvoices,
        paidInvoices,
        totalEarnings: earnings._sum.total || 0,
        averageJobDuration: avgDuration._avg.actualDuration || 0,
        completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
        paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
    });
  }
});

// Get user activity summary
router.get('/activity', [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
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

    const { days = 30 } = req.query;
    const userId = req.user!.id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const [recentJobs, recentQuotes, recentInvoices, recentVoiceCommands] = await Promise.all([
      prisma.job.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.quote.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          customerName: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.invoice.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          invoiceNumber: true,
          customerName: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.voiceCommand.findMany({
        where: {
          job: { userId },
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          type: true,
          text: true,
          createdAt: true,
          job: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        recentJobs,
        recentQuotes,
        recentInvoices,
        recentVoiceCommands,
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity',
    });
  }
});

// Change password (placeholder for future implementation)
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
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

    // This is a placeholder - in a real app, you'd implement password change logic
    res.json({
      success: true,
      message: 'Password change functionality will be implemented in a future update',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
  }
});

// Deactivate account
router.post('/deactivate', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate account',
    });
  }
});

export default router; 