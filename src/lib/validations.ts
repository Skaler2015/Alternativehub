import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(64),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[a-zA-Z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(20, "Review must be at least 20 characters").max(4000),
});

export const submitToolSchema = z.object({
  name: z.string().min(2).max(80),
  websiteUrl: z.string().url("Enter a valid URL"),
  description: z.string().min(40, "Please write at least 40 characters").max(4000),
  categorySlug: z.string().min(1, "Pick a category"),
  pricingModel: z.enum([
    "FREE", "FREEMIUM", "PAID", "SUBSCRIPTION", "ONE_TIME", "OPEN_SOURCE", "CONTACT",
  ]),
  tagline: z.string().max(120).optional(),
});

export const reportSchema = z.object({
  reason: z.enum([
    "BROKEN_LINK", "INCORRECT_INFO", "SPAM", "DUPLICATE", "OFFENSIVE", "MALWARE", "OTHER",
  ]),
  detail: z.string().max(1000).optional(),
});

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const voteSchema = z.object({
  type: z.enum(["UP", "DOWN"]),
});

export const adminToolUpdateSchema = z.object({
  action: z.enum(["approve", "reject", "feature", "unfeature", "verify", "archive", "restore", "delete"]),
});

export const trackEventSchema = z.object({
  type: z.enum(["PAGE_VIEW", "TOOL_VIEW", "SEARCH", "CLICK_OUT", "AFFILIATE_CLICK", "COMPARE_VIEW", "SHARE"]),
  path: z.string().max(500).optional(),
  toolId: z.string().max(64).optional(),
  query: z.string().max(200).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(160),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(4000),
  // Honeypot: bots fill hidden fields; humans leave it empty.
  website: z.string().max(0).optional(),
});
