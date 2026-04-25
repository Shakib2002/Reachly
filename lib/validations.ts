import { z } from 'zod';

export const leadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  company: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  phone: z.string().max(20).optional().nullable(),
  salary: z.string().max(50).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  status: z.enum(['new', 'applied', 'interview', 'offer', 'closed']),
  source: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const emailSchema = z.object({
  to: z.string().email('Valid email required'),
  subject: z.string().min(1, 'Subject required').max(200),
  body: z.string().min(1, 'Body required').max(5000),
});

export const templateSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  subject: z.string().min(1, 'Subject required').max(200),
  body: z.string().min(1, 'Body required').max(5000),
});

export const settingsSchema = z.object({
  full_name: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  bio: z.string().max(160).optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
});
