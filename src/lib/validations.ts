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
  useCase: z.string().max(120).optional().or(z.literal("")),
  industry: z.string().max(60).optional().or(z.literal("")),
  companySize: z.string().max(40).optional().or(z.literal("")),
});

export const reviewReplySchema = z.object({
  reply: z.string().trim().min(2, "Reply is too short").max(2000),
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

const PRICING = ["FREE", "FREEMIUM", "PAID", "SUBSCRIPTION", "ONE_TIME", "OPEN_SOURCE", "CONTACT"] as const;

/** Create/edit a tool from the admin panel. */
export const toolWriteSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words separated by hyphens").max(120),
  tagline: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(6000),
  websiteUrl: z.string().url("Enter a valid website URL").max(500),
  affiliateUrl: z.string().url().max(500).optional().or(z.literal("")),
  downloadUrl: z.string().url().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Pick a category"),
  pricingModel: z.enum(PRICING),
  tier: z.enum(["STANDARD", "PREMIUM", "SPONSORED"]).optional(),
  status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "REJECTED", "ARCHIVED"]).optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  isOpenSource: z.boolean().optional(),
  launchYear: z.number().int().min(1970).max(2100).optional().nullable(),
  pros: z.array(z.string().max(200)).max(20).optional(),
  cons: z.array(z.string().max(200)).max(20).optional(),
  bestFor: z.array(z.string().max(120)).max(20).optional(),
  tags: z.array(z.string().max(60)).max(30).optional(),
  seoTitle: z.string().max(160).optional().or(z.literal("")),
  seoDesc: z.string().max(320).optional().or(z.literal("")),
});

/** Create/edit a blog post from the admin panel. */
export const blogWriteSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(200),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words separated by hyphens").max(200),
  excerpt: z.string().trim().min(10, "Write a short excerpt").max(500),
  content: z.string().trim().min(20, "Content is too short"),
  coverUrl: z.string().url().max(500).optional().or(z.literal("")),
  category: z.enum(["NEWS", "TOP_LISTS", "COMPARISONS", "BUYING_GUIDES", "TUTORIALS"]),
  published: z.boolean().optional(),
  seoTitle: z.string().max(160).optional().or(z.literal("")),
  seoDesc: z.string().max(320).optional().or(z.literal("")),
  keywords: z.array(z.string().max(60)).max(30).optional(),
});

/** Admin ops / automation triggers. */
export const opsActionSchema = z.object({
  action: z.enum(["recompute-scores", "enrich-batch", "check-links", "recompute-reputation", "send-digest", "detect-alternatives", "generate-tools"]),
});

export const companyEditSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  websiteUrl: z.string().url().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),
  foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
  founder: z.string().trim().max(160).optional().or(z.literal("")),
  employees: z.string().trim().max(40).optional().or(z.literal("")),
  funding: z.string().trim().max(60).optional().or(z.literal("")),
});

export const collectionSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  isPublic: z.boolean().optional(),
});

export const collectionItemSchema = z.object({
  toolId: z.string().min(1),
  note: z.string().trim().max(280).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(160),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(4000),
  // Honeypot: bots fill hidden fields; humans leave it empty.
  website: z.string().max(0).optional(),
});
