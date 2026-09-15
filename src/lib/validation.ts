import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const roleSchema = z.enum(["MEMBER", "ORGANIZER", "ADMIN"]);

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  role: roleSchema,
});

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: roleSchema.optional(),
});

export const successStorySchema = z.object({
  names: z.string().trim().min(1).max(150),
  location: z.string().trim().min(1).max(150),
  quote: z.string().trim().min(1).max(2000),
  order: z.coerce.number().int().default(0),
});

export const eventStatusSchema = z.enum(["OPEN", "CLOSED", "CANCELLED", "COMPLETED"]);

export const eventSchema = z.object({
  title: z.string().trim().min(1).max(150),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().min(1).max(500),
  longDescription: z.string().trim().min(1).max(5000),
  city: z.string().trim().min(1).max(100),
  venue: z.string().trim().min(1).max(200),
  startsAt: z.string().min(1),
  organizer: z.string().trim().min(1).max(150),
  capacity: z.coerce.number().int().min(0),
  status: eventStatusSchema,
});

export const homepageSectionSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().min(1).max(500),
});

export const homepageContentSchema = z.object({
  heroBadge: z.string().trim().min(1).max(150),
  heroTitle: z.string().trim().min(1).max(200),
  heroSubtitle: z.string().trim().min(1).max(500),
  howItWorks: z.array(homepageSectionSchema).max(10),
  trustPoints: z.array(homepageSectionSchema).max(10),
  ctaTitle: z.string().trim().min(1).max(200),
  ctaDescription: z.string().trim().min(1).max(500),
});

export const pageContentSchema = z.object({
  title: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1).max(20000),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  message: z.string().trim().min(10, "Message is too short").max(5000),
  website: z.string().optional(), // honeypot: bots tend to fill this in, humans never see it
  startedAt: z.coerce.number(),
});
