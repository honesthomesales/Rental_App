import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Get all quotes for the authenticated user
router.get('/', [
  query('status').optional().isIn(['draft', 'sent', 'accepted', 'rejected', 'expired']),
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

    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              customerName: true,
              status: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        quotes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quotes',
    });
  }
});

// Get a specific quote by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const quote = await prisma.quote.findFirst({
      where: { id, userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            status: true,
          },
        },
        items: true,
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    res.json({
      success: true,
      data: { quote },
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quote',
    });
  }
});

// Create a new quote
router.post('/', [
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('customerEmail').optional().isEmail(),
  body('customerPhone').optional().isMobilePhone('any'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),
  body('tax').optional().isFloat({ min: 0 }),
  body('total').isFloat({ min: 0 }).withMessage('Total must be a positive number'),
  body('validUntil').isISO8601().withMessage('Valid until date is required'),
  body('notes').optional().isString(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.description').trim().notEmpty().withMessage('Item description is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('items.*.unit').trim().notEmpty().withMessage('Item unit is required'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unit price must be positive'),
  body('items.*.total').isFloat({ min: 0 }).withMessage('Item total must be positive'),
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
      jobId,
      customerName,
      customerEmail,
      customerPhone,
      subtotal,
      tax,
      total,
      validUntil,
      notes,
      items,
    } = req.body;

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

    const quote = await prisma.quote.create({
      data: {
        jobId,
        userId,
        customerName,
        customerEmail,
        customerPhone,
        subtotal,
        tax,
        total,
        validUntil: new Date(validUntil),
        notes,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            customerName: true,
          },
        },
        items: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { quote },
    });
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create quote',
    });
  }
});

// Update a quote
router.put('/:id', [
  body('customerName').optional().trim().notEmpty(),
  body('customerEmail').optional().isEmail(),
  body('customerPhone').optional().isMobilePhone('any'),
  body('subtotal').optional().isFloat({ min: 0 }),
  body('tax').optional().isFloat({ min: 0 }),
  body('total').optional().isFloat({ min: 0 }),
  body('validUntil').optional().isISO8601(),
  body('notes').optional().isString(),
  body('status').optional().isIn(['draft', 'sent', 'accepted', 'rejected', 'expired']),
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

    // Verify quote belongs to user
    const existingQuote = await prisma.quote.findFirst({
      where: { id, userId },
    });

    if (!existingQuote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    const updateData: any = { ...req.body };
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            customerName: true,
          },
        },
        items: true,
      },
    });

    res.json({
      success: true,
      data: { quote },
    });
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update quote',
    });
  }
});

// Delete a quote
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const quote = await prisma.quote.findFirst({
      where: { id, userId },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    // Check if quote has been converted to invoice
    const hasInvoices = await prisma.invoice.findFirst({
      where: { quoteId: id },
    });

    if (hasInvoices) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete quote that has been converted to invoice',
      });
    }

    await prisma.quote.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete quote',
    });
  }
});

// Convert quote to invoice
router.post('/:id/convert-to-invoice', [
  body('dueDate').isISO8601().withMessage('Due date is required'),
  body('customerAddress').trim().notEmpty().withMessage('Customer address is required'),
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
    const { dueDate, customerAddress } = req.body;
    const userId = req.user!.id;

    // Verify quote belongs to user
    const quote = await prisma.quote.findFirst({
      where: { id, userId },
      include: {
        items: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { userId },
    });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        jobId: quote.jobId,
        quoteId: quote.id,
        userId,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        customerAddress,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        dueDate: new Date(dueDate),
        items: {
          create: quote.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            customerName: true,
          },
        },
        items: true,
      },
    });

    // Update quote status to accepted
    await prisma.quote.update({
      where: { id },
      data: { status: 'accepted' },
    });

    res.status(201).json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    console.error('Convert quote to invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert quote to invoice',
    });
  }
});

// Update quote items
router.put('/:id/items', [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.description').trim().notEmpty().withMessage('Item description is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('items.*.unit').trim().notEmpty().withMessage('Item unit is required'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unit price must be positive'),
  body('items.*.total').isFloat({ min: 0 }).withMessage('Item total must be positive'),
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
    const { items } = req.body;
    const userId = req.user!.id;

    // Verify quote belongs to user
    const quote = await prisma.quote.findFirst({
      where: { id, userId },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    // Delete existing items
    await prisma.quoteItem.deleteMany({
      where: { quoteId: id },
    });

    // Create new items
    const newItems = await prisma.quoteItem.createMany({
      data: items.map((item: any) => ({
        quoteId: id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    });

    // Recalculate totals
    const total = items.reduce((sum: number, item: any) => sum + Number(item.total), 0);
    const subtotal = total - (Number(quote.tax) || 0);

    // Update quote totals
    await prisma.quote.update({
      where: { id },
      data: { subtotal, total },
    });

    const updatedQuote = await prisma.quote.findFirst({
      where: { id },
      include: {
        items: true,
      },
    });

    res.json({
      success: true,
      data: { quote: updatedQuote },
    });
  } catch (error) {
    console.error('Update quote items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update quote items',
    });
  }
});

// Get quote statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [totalQuotes, draftQuotes, sentQuotes, acceptedQuotes, rejectedQuotes, expiredQuotes] = await Promise.all([
      prisma.quote.count({ where: { userId } }),
      prisma.quote.count({ where: { userId, status: 'draft' } }),
      prisma.quote.count({ where: { userId, status: 'sent' } }),
      prisma.quote.count({ where: { userId, status: 'accepted' } }),
      prisma.quote.count({ where: { userId, status: 'rejected' } }),
      prisma.quote.count({ where: { userId, status: 'expired' } }),
    ]);

    const totalValue = await prisma.quote.aggregate({
      where: { userId },
      _sum: { total: true },
    });

    res.json({
      success: true,
      data: {
        totalQuotes,
        draftQuotes,
        sentQuotes,
        acceptedQuotes,
        rejectedQuotes,
        expiredQuotes,
        totalValue: totalValue._sum.total || 0,
      },
    });
  } catch (error) {
    console.error('Get quote stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quote statistics',
    });
  }
});

export default router; 