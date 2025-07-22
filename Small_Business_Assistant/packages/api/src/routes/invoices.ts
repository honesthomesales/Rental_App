import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Get all invoices for the authenticated user
router.get('/', [
  query('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
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

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
          quote: {
            select: {
              id: true,
              customerName: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices',
    });
  }
});

// Get a specific invoice by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const invoice = await prisma.invoice.findFirst({
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
        quote: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
          },
        },
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice',
    });
  }
});

// Create a new invoice
router.post('/', [
  body('jobId').optional().isString(),
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('customerEmail').optional().isEmail(),
  body('customerPhone').optional().isMobilePhone('any'),
  body('customerAddress').trim().notEmpty().withMessage('Customer address is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),
  body('tax').optional().isFloat({ min: 0 }),
  body('total').isFloat({ min: 0 }).withMessage('Total must be a positive number'),
  body('dueDate').isISO8601().withMessage('Due date is required'),
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
      customerAddress,
      subtotal,
      tax,
      total,
      dueDate,
      notes,
      items,
    } = req.body;

    const userId = req.user!.id;

    // Verify job belongs to user if provided
    if (jobId) {
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId },
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found',
        });
      }
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { userId },
    });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        jobId,
        userId,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        subtotal,
        tax,
        total,
        dueDate: new Date(dueDate),
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
      data: { invoice },
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice',
    });
  }
});

// Update an invoice
router.put('/:id', [
  body('customerName').optional().trim().notEmpty(),
  body('customerEmail').optional().isEmail(),
  body('customerPhone').optional().isMobilePhone('any'),
  body('customerAddress').optional().trim().notEmpty(),
  body('subtotal').optional().isFloat({ min: 0 }),
  body('tax').optional().isFloat({ min: 0 }),
  body('total').optional().isFloat({ min: 0 }),
  body('dueDate').optional().isISO8601(),
  body('notes').optional().isString(),
  body('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
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

    // Verify invoice belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    const updateData: any = { ...req.body };
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    // Set paid date if status is being set to paid
    if (updateData.status === 'paid' && existingInvoice.status !== 'paid') {
      updateData.paidDate = new Date();
    }

    const invoice = await prisma.invoice.update({
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
      data: { invoice },
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice',
    });
  }
});

// Delete an invoice
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Prevent deletion of paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete paid invoice',
      });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete invoice',
    });
  }
});

// Mark invoice as paid
router.post('/:id/mark-paid', [
  body('paidDate').optional().isISO8601(),
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
    const { paidDate } = req.body;
    const userId = req.user!.id;

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Invoice is already marked as paid',
      });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'paid',
        paidDate: paidDate ? new Date(paidDate) : new Date(),
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

    res.json({
      success: true,
      data: { invoice: updatedInvoice },
    });
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark invoice as paid',
    });
  }
});

// Update invoice items
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

    // Verify invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Prevent updates to paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update items on paid invoice',
      });
    }

    // Delete existing items
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    // Create new items
    await prisma.invoiceItem.createMany({
      data: items.map((item: any) => ({
        invoiceId: id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    });

    // Recalculate totals
    const total = items.reduce((sum: number, item: any) => sum + Number(item.total), 0);
    const subtotal = total - (Number(invoice.tax) || 0);

    // Update invoice totals
    await prisma.invoice.update({
      where: { id },
      data: { subtotal, total },
    });

    const updatedInvoice = await prisma.invoice.findFirst({
      where: { id },
      include: {
        items: true,
      },
    });

    res.json({
      success: true,
      data: { invoice: updatedInvoice },
    });
  } catch (error) {
    console.error('Update invoice items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice items',
    });
  }
});

// Get invoice statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [totalInvoices, draftInvoices, sentInvoices, paidInvoices, overdueInvoices, cancelledInvoices] = await Promise.all([
      prisma.invoice.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId, status: 'draft' } }),
      prisma.invoice.count({ where: { userId, status: 'sent' } }),
      prisma.invoice.count({ where: { userId, status: 'paid' } }),
      prisma.invoice.count({ where: { userId, status: 'overdue' } }),
      prisma.invoice.count({ where: { userId, status: 'cancelled' } }),
    ]);

    const [totalValue, paidValue, outstandingValue] = await Promise.all([
      prisma.invoice.aggregate({
        where: { userId },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: 'paid' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: { in: ['sent', 'overdue'] } },
        _sum: { total: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalInvoices,
        draftInvoices,
        sentInvoices,
        paidInvoices,
        overdueInvoices,
        cancelledInvoices,
        totalValue: totalValue._sum.total || 0,
        paidValue: paidValue._sum.total || 0,
        outstandingValue: outstandingValue._sum.total || 0,
      },
    });
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice statistics',
    });
  }
});

export default router; 