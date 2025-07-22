import { z } from 'zod';

// Base schemas
export const LocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const PhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  type: z.enum(['before', 'after']),
  timestamp: z.date(),
  description: z.string().optional(),
});

export const TimeEntrySchema = z.object({
  id: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  location: LocationSchema,
  duration: z.number().optional(), // in minutes
});

// Job related schemas
export const JobStatusSchema = z.enum([
  'pending',
  'in-progress',
  'completed',
  'cancelled',
  'on-hold'
]);

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  customerName: z.string(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  address: LocationSchema,
  status: JobStatusSchema,
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  estimatedDuration: z.number().optional(), // in minutes
  actualDuration: z.number().optional(), // in minutes
  materials: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
    cost: z.number(),
  })).optional(),
  laborCost: z.number().optional(),
  totalCost: z.number().optional(),
  beforePhotos: z.array(PhotoSchema).default([]),
  afterPhotos: z.array(PhotoSchema).default([]),
  timeEntries: z.array(TimeEntrySchema).default([]),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

// Quote related schemas
export const QuoteStatusSchema = z.enum([
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired'
]);

export const QuoteSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unit: z.string(),
    unitPrice: z.number(),
    total: z.number(),
  })),
  subtotal: z.number(),
  tax: z.number().optional(),
  total: z.number(),
  status: QuoteStatusSchema,
  validUntil: z.date(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Invoice related schemas
export const InvoiceStatusSchema = z.enum([
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled'
]);

export const InvoiceSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  quoteId: z.string().optional(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unit: z.string(),
    unitPrice: z.number(),
    total: z.number(),
  })),
  subtotal: z.number(),
  tax: z.number().optional(),
  total: z.number(),
  status: InvoiceStatusSchema,
  dueDate: z.date(),
  paidDate: z.date().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User related schemas
export const UserRoleSchema = z.enum(['admin', 'worker', 'manager']);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  role: UserRoleSchema,
  isActive: z.boolean().default(true),
  profilePhoto: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Voice command schemas
export const VoiceCommandTypeSchema = z.enum([
  'create_job',
  'start_job',
  'end_job',
  'add_photo',
  'create_quote',
  'create_invoice',
  'add_note',
  'update_status'
]);

export const VoiceCommandSchema = z.object({
  id: z.string(),
  type: VoiceCommandTypeSchema,
  text: z.string(),
  processedText: z.string().optional(),
  confidence: z.number().optional(),
  jobId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
});

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types
export type Location = z.infer<typeof LocationSchema>;
export type Photo = z.infer<typeof PhotoSchema>;
export type TimeEntry = z.infer<typeof TimeEntrySchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type Job = z.infer<typeof JobSchema>;
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type VoiceCommandType = z.infer<typeof VoiceCommandTypeSchema>;
export type VoiceCommand = z.infer<typeof VoiceCommandSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// Utility types
export type CreateJobRequest = Omit<Job, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateJobRequest = Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>>;
export type CreateQuoteRequest = Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateInvoiceRequest = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateUserRequest = Omit<User, 'id' | 'createdAt' | 'updatedAt'>; 