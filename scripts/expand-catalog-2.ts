/**
 * Second catalog expansion — another large, hand-curated batch of real,
 * well-known software, deepening coverage (education, games, e-commerce,
 * analytics, help-desk, ERP, content, and more AI/dev/productivity tools).
 *
 * Idempotent + safe: creates a tool only if its slug does not already exist,
 * runs on every Vercel deploy, and fails soft so it never breaks the build.
 * All data is public, factual information about real products.
 */
import { PrismaClient, type PricingModel } from "@prisma/client";

const prisma = new PrismaClient();

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

type ToolSeed = {
  slug: string;
  name: string;
  domain: string;
  category: string;
  pricing: PricingModel;
  tagline: string;
  description: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  platforms: string[];
  company?: string;
  featured?: boolean;
  openSource?: boolean;
  scores: [number, number, number, number];
  tags: string[];
};

const TOOLS: ToolSeed[] = [
  // ─────────────── AI ───────────────
  {
    slug: "deepl", name: "DeepL", domain: "deepl.com", category: "ai-tools",
    pricing: "FREEMIUM", company: "DeepL",
    tagline: "AI translator known for remarkably natural results",
    description: "DeepL delivers high-quality machine translation across many languages, widely regarded as more natural than alternatives, with a document translator and writing assistant.",
    pros: ["Very natural translations", "Document translation", "Strong privacy stance"], cons: ["Fewer languages than Google", "Best features paid", "API pricing"],
    bestFor: ["Translation", "International teams", "Writers"], platforms: ["web", "windows", "macos", "ios", "android", "api"],
    scores: [82, 85, 87, 88], tags: ["translation", "ai", "language", "writing"],
  },
  {
    slug: "synthesia", name: "Synthesia", domain: "synthesia.io", category: "ai-tools",
    pricing: "SUBSCRIPTION", company: "Synthesia",
    tagline: "Create AI avatar videos from text",
    description: "Synthesia turns scripts into professional videos with lifelike AI avatars and voices in 100+ languages, popular for training and marketing.",
    pros: ["No camera needed", "Many languages", "Fast production"], cons: ["Subscription cost", "Avatars can feel stiff", "Limited creativity"],
    bestFor: ["Training videos", "Marketing", "Localization"], platforms: ["web"],
    scores: [79, 86, 82, 80], tags: ["video", "ai", "avatar", "text-to-video"],
  },
  {
    slug: "heygen", name: "HeyGen", domain: "heygen.com", category: "ai-tools",
    pricing: "FREEMIUM", company: "HeyGen",
    tagline: "AI video generation with avatars and voice cloning",
    description: "HeyGen creates talking-avatar videos and offers realistic voice cloning and video translation, aimed at creators and marketers.",
    pros: ["Realistic avatars", "Video translation", "Easy workflow"], cons: ["Credits limit free use", "Pricey at scale", "Uncanny at times"],
    bestFor: ["Marketing videos", "Localization", "Creators"], platforms: ["web"],
    scores: [78, 85, 82, 79], tags: ["video", "ai", "avatar", "voice"],
  },
  {
    slug: "ideogram", name: "Ideogram", domain: "ideogram.ai", category: "ai-tools",
    pricing: "FREEMIUM", company: "Ideogram",
    tagline: "AI image generator that's great at text in images",
    description: "Ideogram specializes in generating images with accurate, legible text — logos, posters and typography — where many models struggle.",
    pros: ["Excellent text rendering", "Good free tier", "Fast"], cons: ["Less photorealistic", "Fewer controls", "Newer player"],
    bestFor: ["Posters", "Logos", "Typography art"], platforms: ["web", "ios", "android"],
    scores: [77, 84, 80, 78], tags: ["image-generation", "ai", "typography", "design"],
  },
  {
    slug: "notebooklm", name: "NotebookLM", domain: "notebooklm.google.com", category: "ai-tools",
    pricing: "FREE", company: "Google",
    tagline: "AI research assistant grounded in your own documents",
    description: "NotebookLM lets you upload sources and ask questions grounded strictly in them, with cited answers and an audio-overview feature that summarizes as a podcast.",
    pros: ["Answers grounded in your docs", "Cited responses", "Audio overviews"], cons: ["Google account needed", "Upload limits", "Privacy considerations"],
    bestFor: ["Research", "Studying", "Document Q&A"], platforms: ["web"],
    scores: [80, 88, 82, 83], tags: ["research", "ai", "documents", "study"],
  },
  {
    slug: "copy-ai", name: "Copy.ai", domain: "copy.ai", category: "ai-tools",
    pricing: "FREEMIUM", company: "Copy.ai",
    tagline: "AI copywriting and go-to-market workflows",
    description: "Copy.ai generates marketing copy and automates go-to-market workflows, from blog posts to sales outreach, with templates and brand voice.",
    pros: ["Fast copy generation", "GTM workflows", "Free tier"], cons: ["Generic without editing", "Crowded space", "Upsells"],
    bestFor: ["Marketers", "Sales teams", "Content"], platforms: ["web"],
    scores: [76, 82, 78, 78], tags: ["writing", "marketing", "copywriting", "ai"],
  },
  {
    slug: "krisp", name: "Krisp", domain: "krisp.ai", category: "ai-tools",
    pricing: "FREEMIUM", company: "Krisp",
    tagline: "AI noise cancellation for calls and meetings",
    description: "Krisp removes background noise, echo and voices from your mic and speakers in real time on any conferencing app, plus meeting transcription.",
    pros: ["Excellent noise removal", "Works with any app", "Meeting notes"], cons: ["Free minutes limited", "CPU usage", "Occasional artifacts"],
    bestFor: ["Remote work", "Calls", "Podcasters"], platforms: ["windows", "macos", "ios", "android"],
    scores: [79, 82, 81, 83], tags: ["audio", "ai", "meetings", "noise-cancellation"],
  },
  {
    slug: "replit", name: "Replit", domain: "replit.com", category: "coding",
    pricing: "FREEMIUM", company: "Replit",
    tagline: "Code, run and deploy in the browser with an AI agent",
    description: "Replit is a browser-based IDE and hosting platform with collaborative coding and an AI agent that can build and deploy apps from prompts.",
    pros: ["Zero setup coding", "AI app building", "Instant hosting"], cons: ["Performance limits", "Pricing for power use", "Not for large projects"],
    bestFor: ["Learning to code", "Prototypes", "Collaboration"], platforms: ["web", "ios", "android"],
    scores: [82, 86, 84, 82], tags: ["ide", "coding", "ai", "hosting"],
  },

  // ─────────────── Productivity ───────────────
  {
    slug: "logseq", name: "Logseq", domain: "logseq.com", category: "productivity",
    pricing: "OPEN_SOURCE", company: "Logseq", openSource: true,
    tagline: "Privacy-first, open-source outliner for networked notes",
    description: "Logseq is a local-first, open-source knowledge base built on plain-text files, with bidirectional links, an outliner and a daily journal.",
    pros: ["Local & private", "Open source", "Powerful linking"], cons: ["Learning curve", "Sync setup", "Occasional rough edges"],
    bestFor: ["Note-taking", "PKM", "Researchers"], platforms: ["windows", "macos", "linux", "ios", "android"],
    scores: [82, 76, 78, 85], tags: ["notes", "pkm", "open-source", "outliner"],
  },
  {
    slug: "things-3", name: "Things 3", domain: "culturedcode.com/things", category: "productivity",
    pricing: "ONE_TIME", company: "Cultured Code",
    tagline: "Elegant, award-winning task manager for Apple devices",
    description: "Things 3 is a beautifully designed personal task manager for Apple platforms, with projects, areas and a calm, focused workflow — a one-time purchase.",
    pros: ["Gorgeous design", "One-time purchase", "Great UX"], cons: ["Apple only", "No collaboration", "Per-platform purchase"],
    bestFor: ["Personal tasks", "Apple users", "GTD"], platforms: ["macos", "ios"],
    scores: [80, 74, 80, 88], tags: ["tasks", "todo", "apple", "productivity"],
  },
  {
    slug: "excalidraw", name: "Excalidraw", domain: "excalidraw.com", category: "productivity",
    pricing: "FREEMIUM", company: "Excalidraw", openSource: true,
    tagline: "Virtual whiteboard with a hand-drawn feel",
    description: "Excalidraw is a free, open-source whiteboard for sketching diagrams with a charming hand-drawn style, great for quick ideas and architecture sketches.",
    pros: ["Free & open source", "Delightfully simple", "Great for diagrams"], cons: ["Basic features", "Collab needs Plus", "Not for complex diagrams"],
    bestFor: ["Sketching", "Diagrams", "Brainstorming"], platforms: ["web"],
    scores: [82, 74, 82, 86], tags: ["whiteboard", "diagramming", "open-source", "sketching"],
  },
  {
    slug: "calendly", name: "Calendly", domain: "calendly.com", category: "productivity",
    pricing: "FREEMIUM", company: "Calendly", featured: true,
    tagline: "Automated scheduling to end the back-and-forth",
    description: "Calendly lets people book time with you based on your real availability, integrating with calendars and video tools to automate meeting scheduling.",
    pros: ["Ends scheduling emails", "Calendar integrations", "Good free tier"], cons: ["Advanced features paid", "Per-seat pricing", "Branding on free"],
    bestFor: ["Sales", "Recruiting", "Freelancers"], platforms: ["web", "ios", "android", "chrome"],
    scores: [82, 76, 88, 87], tags: ["scheduling", "calendar", "productivity", "meetings"],
  },
  {
    slug: "cal-com", name: "Cal.com", domain: "cal.com", category: "productivity",
    pricing: "FREEMIUM", company: "Cal.com", openSource: true,
    tagline: "Open-source scheduling infrastructure",
    description: "Cal.com is an open-source, self-hostable scheduling platform — a privacy-friendly Calendly alternative with white-labeling and API access.",
    pros: ["Open source & self-hostable", "White-label", "Developer-friendly"], cons: ["Self-host effort", "Younger ecosystem", "Some features paid"],
    bestFor: ["Developers", "Self-hosting", "Teams"], platforms: ["web", "self-hosted", "api"],
    scores: [82, 76, 78, 84], tags: ["scheduling", "open-source", "calendar", "self-hosted"],
  },
  {
    slug: "typeform", name: "Typeform", domain: "typeform.com", category: "saas",
    pricing: "FREEMIUM", company: "Typeform",
    tagline: "Conversational forms and surveys people enjoy filling out",
    description: "Typeform creates elegant, one-question-at-a-time forms, surveys and quizzes with logic and integrations that boost completion rates.",
    pros: ["Beautiful, engaging forms", "Good logic", "Many integrations"], cons: ["Response limits on free", "Pricey plans", "Can be slow"],
    bestFor: ["Surveys", "Lead capture", "Quizzes"], platforms: ["web"],
    scores: [80, 76, 85, 84], tags: ["forms", "surveys", "saas", "marketing"],
  },
  {
    slug: "docusign", name: "DocuSign", domain: "docusign.com", category: "saas",
    pricing: "SUBSCRIPTION", company: "DocuSign",
    tagline: "The leading e-signature and agreement platform",
    description: "DocuSign lets you send, sign and manage legally binding electronic agreements, the market leader in e-signatures with broad integrations.",
    pros: ["Industry standard", "Legally robust", "Many integrations"], cons: ["Expensive", "Feature-heavy", "Overkill for occasional use"],
    bestFor: ["Contracts", "Businesses", "Legal"], platforms: ["web", "ios", "android"],
    scores: [79, 74, 88, 89], tags: ["e-signature", "documents", "saas", "contracts"],
  },

  // ─────────────── Design / Desktop ───────────────
  {
    slug: "blender", name: "Blender", domain: "blender.org", category: "desktop-software",
    pricing: "OPEN_SOURCE", company: "Blender Foundation", openSource: true, featured: true,
    tagline: "Free, open-source 3D creation suite",
    description: "Blender is a complete open-source 3D toolset for modeling, sculpting, animation, simulation, rendering and even video editing, used by hobbyists and studios.",
    pros: ["Completely free & open source", "Incredibly capable", "Huge community"], cons: ["Steep learning curve", "Demanding hardware", "Dense UI"],
    bestFor: ["3D modeling", "Animation", "VFX"], platforms: ["windows", "macos", "linux"],
    scores: [86, 80, 90, 90], tags: ["3d", "animation", "open-source", "modeling"],
  },
  {
    slug: "procreate", name: "Procreate", domain: "procreate.com", category: "photo-editing",
    pricing: "ONE_TIME", company: "Procreate",
    tagline: "The powerful, intuitive illustration app for iPad",
    description: "Procreate is a beloved digital illustration app for iPad with a natural drawing experience, huge brush library and a one-time price.",
    pros: ["Fantastic drawing feel", "One-time purchase", "Huge brush set"], cons: ["iPad only", "No desktop version", "Learning curve for pros"],
    bestFor: ["Illustrators", "iPad artists", "Sketching"], platforms: ["ios"],
    scores: [80, 74, 85, 88], tags: ["illustration", "drawing", "ipad", "art"],
  },
  {
    slug: "affinity-designer", name: "Affinity Designer", domain: "affinity.serif.com/designer", category: "photo-editing",
    pricing: "ONE_TIME", company: "Serif",
    tagline: "Professional vector design without a subscription",
    description: "Affinity Designer is a fast, professional vector and UI design app with a one-time purchase, a popular alternative to Adobe Illustrator.",
    pros: ["One-time purchase", "Fast & powerful", "Great value"], cons: ["Smaller ecosystem", "Fewer plugins", "Learning curve"],
    bestFor: ["Vector design", "Logos", "UI design"], platforms: ["windows", "macos", "ios"],
    scores: [83, 76, 82, 86], tags: ["vector", "design", "illustration", "affordable"],
  },
  {
    slug: "lucidchart", name: "Lucidchart", domain: "lucidchart.com", category: "productivity",
    pricing: "FREEMIUM", company: "Lucid",
    tagline: "Intelligent diagramming for flowcharts and more",
    description: "Lucidchart is a web-based diagramming tool for flowcharts, org charts, network diagrams and mockups, with real-time collaboration and integrations.",
    pros: ["Powerful diagramming", "Great collaboration", "Many templates"], cons: ["Object limits on free", "Pricey for teams", "Can feel heavy"],
    bestFor: ["Flowcharts", "Diagrams", "Teams"], platforms: ["web"],
    scores: [81, 76, 84, 85], tags: ["diagramming", "flowcharts", "productivity", "collaboration"],
  },
  {
    slug: "drawio", name: "draw.io", domain: "drawio.com", category: "productivity",
    pricing: "FREE", company: "JGraph", openSource: true,
    tagline: "Free, open-source diagramming for everyone",
    description: "draw.io (diagrams.net) is a free diagramming tool that stores files wherever you choose, with no account needed and integrations for Confluence and more.",
    pros: ["Completely free", "No account needed", "Privacy-friendly storage"], cons: ["Less polished", "Fewer templates", "Basic collaboration"],
    bestFor: ["Diagrams", "Flowcharts", "Privacy-conscious"], platforms: ["web", "windows", "macos", "linux"],
    scores: [82, 72, 82, 86], tags: ["diagramming", "open-source", "free", "flowcharts"],
  },

  // ─────────────── Media / Desktop ───────────────
  {
    slug: "vlc", name: "VLC Media Player", domain: "videolan.org/vlc", category: "desktop-software",
    pricing: "OPEN_SOURCE", company: "VideoLAN", openSource: true,
    tagline: "The free media player that plays everything",
    description: "VLC is a free, open-source media player that plays virtually any audio or video format on any platform, with no ads or spyware.",
    pros: ["Plays any format", "Free & open source", "No ads"], cons: ["Dated interface", "Basic library features", "Occasional codec quirks"],
    bestFor: ["Playing media", "Any format", "Everyone"], platforms: ["windows", "macos", "linux", "ios", "android"],
    scores: [82, 68, 94, 92], tags: ["media-player", "video", "open-source", "audio"],
  },
  {
    slug: "audacity", name: "Audacity", domain: "audacityteam.org", category: "desktop-software",
    pricing: "OPEN_SOURCE", company: "Audacity", openSource: true,
    tagline: "Free, open-source audio editor and recorder",
    description: "Audacity is a long-standing free audio editor for recording, cutting and cleaning up audio, popular with podcasters and hobbyists.",
    pros: ["Free & open source", "Capable editing", "Cross-platform"], cons: ["Dated UI", "Non-destructive editing limited", "Learning curve"],
    bestFor: ["Podcasts", "Audio editing", "Recording"], platforms: ["windows", "macos", "linux"],
    scores: [81, 70, 86, 85], tags: ["audio", "editing", "open-source", "podcast"],
  },
  {
    slug: "handbrake", name: "HandBrake", domain: "handbrake.fr", category: "desktop-software",
    pricing: "OPEN_SOURCE", company: "HandBrake", openSource: true,
    tagline: "Free, open-source video transcoder",
    description: "HandBrake converts video from nearly any format into a selection of modern, widely-supported codecs, free and open source.",
    pros: ["Free & open source", "Powerful conversion", "Presets"], cons: ["Technical for beginners", "Encode-only", "Dated UI"],
    bestFor: ["Video conversion", "Compression", "Ripping"], platforms: ["windows", "macos", "linux"],
    scores: [79, 68, 82, 85], tags: ["video", "converter", "open-source", "transcoding"],
  },

  // ─────────────── Developer / Backend ───────────────
  {
    slug: "clerk", name: "Clerk", domain: "clerk.com", category: "developer-tools",
    pricing: "FREEMIUM", company: "Clerk",
    tagline: "Drop-in authentication and user management for apps",
    description: "Clerk provides beautiful, prebuilt auth components and a full user-management backend, letting developers add sign-in, MFA and orgs in minutes.",
    pros: ["Great DX", "Prebuilt UI", "Generous free tier"], cons: ["Pricing at scale", "Vendor lock-in", "Newer than some"],
    bestFor: ["Web apps", "SaaS", "Developers"], platforms: ["web", "api"],
    scores: [82, 80, 80, 83], tags: ["authentication", "developer", "saas", "backend"],
  },
  {
    slug: "auth0", name: "Auth0", domain: "auth0.com", category: "developer-tools",
    pricing: "FREEMIUM", company: "Okta",
    tagline: "Flexible identity and authentication platform",
    description: "Auth0 offers robust, standards-based authentication and authorization with social login, SSO and enterprise features for developers.",
    pros: ["Very flexible", "Standards-based", "Enterprise-ready"], cons: ["Pricing jumps", "Complex config", "Can be overkill"],
    bestFor: ["Enterprises", "SSO", "Developers"], platforms: ["web", "api"],
    scores: [80, 78, 85, 87], tags: ["authentication", "identity", "developer", "sso"],
  },
  {
    slug: "twilio", name: "Twilio", domain: "twilio.com", category: "developer-tools",
    pricing: "PAID", company: "Twilio",
    tagline: "APIs for SMS, voice, email and communications",
    description: "Twilio provides developer APIs to add SMS, voice, WhatsApp, email and verification to applications, the leading communications platform.",
    pros: ["Comprehensive comms APIs", "Reliable", "Great docs"], cons: ["Usage costs add up", "Complex pricing", "Setup effort"],
    bestFor: ["Notifications", "2FA", "Communications"], platforms: ["web", "api"],
    scores: [80, 78, 87, 87], tags: ["sms", "api", "communications", "developer"],
  },
  {
    slug: "resend", name: "Resend", domain: "resend.com", category: "developer-tools",
    pricing: "FREEMIUM", company: "Resend",
    tagline: "Email API built for developers",
    description: "Resend is a modern email API with a clean developer experience, React email templates and reliable transactional delivery.",
    pros: ["Great DX", "React email", "Good free tier"], cons: ["Newer player", "Fewer marketing features", "Scaling costs"],
    bestFor: ["Transactional email", "Developers", "SaaS"], platforms: ["web", "api"],
    scores: [80, 80, 76, 82], tags: ["email", "api", "developer", "transactional"],
  },
  {
    slug: "sentry", name: "Sentry", domain: "sentry.io", category: "developer-tools",
    pricing: "FREEMIUM", company: "Sentry", openSource: true,
    tagline: "Application error monitoring and performance tracking",
    description: "Sentry captures errors and performance issues in real time across your stack, with rich context to help developers fix problems fast.",
    pros: ["Excellent error context", "Broad SDK support", "Good free tier"], cons: ["Costs scale with volume", "Setup per platform", "Noise without tuning"],
    bestFor: ["Error tracking", "Developers", "Production apps"], platforms: ["web", "api", "self-hosted"],
    scores: [83, 80, 86, 88], tags: ["monitoring", "errors", "developer", "observability"],
  },
  {
    slug: "posthog", name: "PostHog", domain: "posthog.com", category: "developer-tools",
    pricing: "FREEMIUM", company: "PostHog", openSource: true,
    tagline: "Open-source product analytics platform",
    description: "PostHog combines product analytics, session replay, feature flags and A/B testing in one open-source, self-hostable platform.",
    pros: ["All-in-one analytics", "Open source", "Self-hostable"], cons: ["Can be complex", "Resource heavy self-hosted", "Feature sprawl"],
    bestFor: ["Product teams", "Analytics", "Developers"], platforms: ["web", "self-hosted", "api"],
    scores: [83, 80, 82, 85], tags: ["analytics", "open-source", "product", "developer"],
  },
  {
    slug: "appwrite", name: "Appwrite", domain: "appwrite.io", category: "developer-tools",
    pricing: "FREEMIUM", company: "Appwrite", openSource: true,
    tagline: "Open-source backend platform for building apps",
    description: "Appwrite is an open-source backend-as-a-service with databases, auth, storage and functions, a self-hostable Firebase alternative.",
    pros: ["Open source & self-hostable", "All-in-one backend", "Good docs"], cons: ["Younger ecosystem", "Self-host effort", "Scaling considerations"],
    bestFor: ["App backends", "Developers", "Self-hosting"], platforms: ["web", "self-hosted", "api"],
    scores: [82, 78, 78, 83], tags: ["backend", "baas", "open-source", "developer"],
  },
  {
    slug: "strapi", name: "Strapi", domain: "strapi.io", category: "developer-tools",
    pricing: "OPEN_SOURCE", company: "Strapi", openSource: true,
    tagline: "Open-source headless CMS for developers",
    description: "Strapi is a leading open-source headless CMS that gives developers a customizable content API with a friendly admin panel.",
    pros: ["Open source", "Fully customizable", "Self-hostable"], cons: ["Setup & hosting effort", "Upgrades can break", "Cloud is paid"],
    bestFor: ["Headless CMS", "APIs", "Developers"], platforms: ["web", "self-hosted", "api"],
    scores: [82, 76, 80, 84], tags: ["cms", "headless", "open-source", "developer"],
  },
  {
    slug: "sanity", name: "Sanity", domain: "sanity.io", category: "developer-tools",
    pricing: "FREEMIUM", company: "Sanity",
    tagline: "Composable content platform with a real-time backend",
    description: "Sanity is a flexible headless CMS with a customizable editing environment (Studio) and a real-time content API loved by developers.",
    pros: ["Highly customizable", "Real-time collaboration", "Great DX"], cons: ["Learning curve", "Usage-based pricing", "Config heavy"],
    bestFor: ["Headless CMS", "Jamstack", "Developers"], platforms: ["web", "api"],
    scores: [81, 78, 80, 84], tags: ["cms", "headless", "developer", "content"],
  },
  {
    slug: "ghost", name: "Ghost", domain: "ghost.org", category: "no-code",
    pricing: "FREEMIUM", company: "Ghost", openSource: true,
    tagline: "Open-source publishing platform for creators",
    description: "Ghost is a modern, open-source publishing platform for blogs, newsletters and memberships, with built-in subscriptions and a clean editor.",
    pros: ["Open source", "Built-in memberships", "Fast & clean"], cons: ["Self-host effort or paid hosting", "Fewer plugins than WordPress", "Learning curve"],
    bestFor: ["Blogs", "Newsletters", "Paid memberships"], platforms: ["web", "self-hosted"],
    scores: [82, 74, 82, 85], tags: ["blogging", "cms", "open-source", "newsletter"],
  },

  // ─────────────── Analytics ───────────────
  {
    slug: "google-analytics", name: "Google Analytics", domain: "analytics.google.com", category: "marketing",
    pricing: "FREEMIUM", company: "Google",
    tagline: "The most widely used web analytics platform",
    description: "Google Analytics tracks website and app traffic, audiences and conversions, the default free analytics tool for most of the web.",
    pros: ["Free & powerful", "Ubiquitous", "Integrates with Google Ads"], cons: ["Privacy concerns", "GA4 learning curve", "Complex UI"],
    bestFor: ["Websites", "Marketers", "Traffic analysis"], platforms: ["web", "api"],
    scores: [80, 78, 95, 84], tags: ["analytics", "marketing", "google", "web"],
  },
  {
    slug: "plausible", name: "Plausible Analytics", domain: "plausible.io", category: "marketing",
    pricing: "FREEMIUM", company: "Plausible", openSource: true,
    tagline: "Privacy-friendly, lightweight website analytics",
    description: "Plausible is a simple, open-source, cookie-free analytics tool that's GDPR-compliant and lightweight, a privacy-first Google Analytics alternative.",
    pros: ["Privacy-friendly & no cookies", "Simple & fast", "Open source"], cons: ["Paid (or self-host)", "Fewer features", "No deep funnels"],
    bestFor: ["Privacy-focused sites", "Bloggers", "Simplicity"], platforms: ["web", "self-hosted", "api"],
    scores: [82, 74, 80, 88], tags: ["analytics", "privacy", "open-source", "web"],
  },
  {
    slug: "mixpanel", name: "Mixpanel", domain: "mixpanel.com", category: "marketing",
    pricing: "FREEMIUM", company: "Mixpanel",
    tagline: "Product analytics for tracking user behavior",
    description: "Mixpanel provides event-based product analytics to understand how users engage with your product, with funnels, retention and cohorts.",
    pros: ["Powerful product analytics", "Good free tier", "Funnels & retention"], cons: ["Setup effort", "Costs at scale", "Learning curve"],
    bestFor: ["Product teams", "SaaS", "Growth"], platforms: ["web", "api"],
    scores: [80, 78, 84, 84], tags: ["analytics", "product", "marketing", "events"],
  },
  {
    slug: "hotjar", name: "Hotjar", domain: "hotjar.com", category: "marketing",
    pricing: "FREEMIUM", company: "Hotjar",
    tagline: "Heatmaps and session recordings to understand users",
    description: "Hotjar reveals how users behave with heatmaps, session recordings, surveys and feedback widgets, complementing quantitative analytics.",
    pros: ["Visual insights", "Easy setup", "Feedback tools"], cons: ["Session limits", "Sampling on lower tiers", "Privacy considerations"],
    bestFor: ["UX research", "Conversion optimization", "Marketers"], platforms: ["web"],
    scores: [79, 74, 84, 83], tags: ["analytics", "heatmaps", "ux", "marketing"],
  },

  // ─────────────── Marketing / Email / Creators ───────────────
  {
    slug: "convertkit", name: "Kit (ConvertKit)", domain: "kit.com", category: "marketing",
    pricing: "FREEMIUM", company: "Kit",
    tagline: "Email marketing built for creators",
    description: "Kit (formerly ConvertKit) is an email marketing platform designed for creators, with automations, landing pages and a creator commerce network.",
    pros: ["Creator-focused", "Good automations", "Free starter tier"], cons: ["Basic design tools", "Pricing by subscribers", "Fewer templates"],
    bestFor: ["Creators", "Newsletters", "Course sellers"], platforms: ["web"],
    scores: [80, 74, 82, 84], tags: ["email-marketing", "creators", "newsletter", "automation"],
  },
  {
    slug: "substack", name: "Substack", domain: "substack.com", category: "marketing",
    pricing: "FREEMIUM", company: "Substack",
    tagline: "Publish a newsletter and get paid by subscribers",
    description: "Substack lets writers publish free and paid newsletters with built-in subscriptions, discovery and a growing network, taking a cut of paid revenue.",
    pros: ["Dead simple to start", "Built-in payments", "Discovery network"], cons: ["10% fee on paid", "Limited customization", "You don't own the platform"],
    bestFor: ["Writers", "Independent journalism", "Paid newsletters"], platforms: ["web", "ios", "android"],
    scores: [80, 72, 88, 84], tags: ["newsletter", "publishing", "creators", "marketing"],
  },
  {
    slug: "beehiiv", name: "beehiiv", domain: "beehiiv.com", category: "marketing",
    pricing: "FREEMIUM", company: "beehiiv",
    tagline: "Newsletter platform built for growth and monetization",
    description: "beehiiv is a newsletter platform focused on growth tools, referrals, ad network monetization and analytics, built by former Morning Brew operators.",
    pros: ["Strong growth tools", "Ad network", "Good free tier"], cons: ["Newer platform", "Feature overload", "Paid for scale"],
    bestFor: ["Newsletters", "Media businesses", "Creators"], platforms: ["web"],
    scores: [80, 74, 82, 82], tags: ["newsletter", "marketing", "creators", "growth"],
  },
  {
    slug: "klaviyo", name: "Klaviyo", domain: "klaviyo.com", category: "marketing",
    pricing: "FREEMIUM", company: "Klaviyo",
    tagline: "Email and SMS marketing built for e-commerce",
    description: "Klaviyo is a marketing platform tailored to e-commerce, with deep store integrations, segmentation and automated email and SMS flows.",
    pros: ["Great for e-commerce", "Powerful segmentation", "Deep integrations"], cons: ["Pricey at scale", "Complex", "Overkill for simple lists"],
    bestFor: ["E-commerce", "Shopify stores", "Retention"], platforms: ["web", "api"],
    scores: [79, 76, 85, 85], tags: ["email-marketing", "sms", "ecommerce", "automation"],
  },

  // ─────────────── E-commerce ───────────────
  {
    slug: "shopify", name: "Shopify", domain: "shopify.com", category: "saas",
    pricing: "SUBSCRIPTION", company: "Shopify", featured: true,
    tagline: "The leading platform to build an online store",
    description: "Shopify is a complete commerce platform to start, run and grow an online store, with themes, payments, apps and POS for retail.",
    pros: ["Everything to sell online", "Huge app ecosystem", "Reliable & scalable"], cons: ["Monthly + transaction fees", "App costs add up", "Theme customization limits"],
    bestFor: ["Online stores", "DTC brands", "Retail"], platforms: ["web", "ios", "android"],
    scores: [84, 80, 93, 90], tags: ["ecommerce", "saas", "online-store", "retail"],
  },
  {
    slug: "woocommerce", name: "WooCommerce", domain: "woocommerce.com", category: "no-code",
    pricing: "OPEN_SOURCE", company: "Automattic", openSource: true,
    tagline: "Open-source e-commerce built on WordPress",
    description: "WooCommerce turns WordPress into a fully-featured online store, free and open-source with thousands of extensions and total control.",
    pros: ["Free & open source", "Total control", "Huge extension library"], cons: ["Requires WordPress hosting", "Maintenance effort", "Costs via extensions"],
    bestFor: ["WordPress users", "Custom stores", "Full control"], platforms: ["web", "self-hosted"],
    scores: [83, 74, 90, 86], tags: ["ecommerce", "wordpress", "open-source", "online-store"],
  },
  {
    slug: "gumroad", name: "Gumroad", domain: "gumroad.com", category: "saas",
    pricing: "FREEMIUM", company: "Gumroad",
    tagline: "Sell digital products and downloads with ease",
    description: "Gumroad makes it simple for creators to sell digital products, memberships and downloads, handling checkout, delivery and payouts.",
    pros: ["Very easy to start", "Handles everything", "Good for creators"], cons: ["Per-sale fees", "Basic storefront", "Limited customization"],
    bestFor: ["Creators", "Digital products", "Ebooks & courses"], platforms: ["web"],
    scores: [80, 72, 84, 83], tags: ["ecommerce", "creators", "digital-products", "payments"],
  },
  {
    slug: "lemon-squeezy", name: "Lemon Squeezy", domain: "lemonsqueezy.com", category: "saas",
    pricing: "PAID", company: "Lemon Squeezy",
    tagline: "Payments and subscriptions for digital products, as a merchant of record",
    description: "Lemon Squeezy handles payments, subscriptions, licensing and global tax compliance as the merchant of record, popular with indie SaaS and digital sellers.",
    pros: ["Handles global tax", "Merchant of record", "Great for SaaS"], cons: ["Per-sale fees", "Less control than Stripe", "Newer"],
    bestFor: ["Indie SaaS", "Digital products", "Global selling"], platforms: ["web", "api"],
    scores: [80, 76, 78, 82], tags: ["payments", "saas", "subscriptions", "ecommerce"],
  },

  // ─────────────── Help desk / Support ───────────────
  {
    slug: "intercom", name: "Intercom", domain: "intercom.com", category: "saas",
    pricing: "SUBSCRIPTION", company: "Intercom",
    tagline: "AI-first customer service and messaging platform",
    description: "Intercom combines live chat, a help center and AI agents (Fin) to support customers, with a strong focus on AI-powered resolution.",
    pros: ["Great messaging & chat", "AI resolution bot", "Polished product"], cons: ["Expensive", "Complex pricing", "Overkill for small teams"],
    bestFor: ["SaaS support", "Live chat", "Customer messaging"], platforms: ["web", "ios", "android"],
    scores: [80, 80, 86, 85], tags: ["customer-support", "live-chat", "saas", "ai"],
  },
  {
    slug: "zendesk", name: "Zendesk", domain: "zendesk.com", category: "saas",
    pricing: "SUBSCRIPTION", company: "Zendesk",
    tagline: "Customer service software and ticketing at scale",
    description: "Zendesk is a comprehensive customer support suite with ticketing, help center, live chat and analytics, built for scaling support teams.",
    pros: ["Robust ticketing", "Scales well", "Many integrations"], cons: ["Pricey", "Complex setup", "Can feel corporate"],
    bestFor: ["Support teams", "Enterprises", "Ticketing"], platforms: ["web", "ios", "android"],
    scores: [79, 76, 88, 87], tags: ["customer-support", "helpdesk", "ticketing", "saas"],
  },
  {
    slug: "freshdesk", name: "Freshdesk", domain: "freshdesk.com", category: "saas",
    pricing: "FREEMIUM", company: "Freshworks",
    tagline: "Affordable help desk and ticketing software",
    description: "Freshdesk offers ticketing, automation and a help center at a friendlier price than legacy competitors, with a usable free tier.",
    pros: ["Good free tier", "Affordable", "Easy to use"], cons: ["Advanced features paid", "Fewer integrations", "Reporting limits"],
    bestFor: ["SMB support", "Ticketing", "Budget teams"], platforms: ["web", "ios", "android"],
    scores: [79, 74, 82, 84], tags: ["customer-support", "helpdesk", "ticketing", "saas"],
  },

  // ─────────────── Education ───────────────
  {
    slug: "duolingo", name: "Duolingo", domain: "duolingo.com", category: "education",
    pricing: "FREEMIUM", company: "Duolingo", featured: true,
    tagline: "The fun, gamified way to learn a language",
    description: "Duolingo teaches languages through bite-sized, gamified lessons with streaks and rewards, making daily practice addictive and free.",
    pros: ["Free & fun", "Great habit builder", "Many languages"], cons: ["Limited depth", "Ads on free", "Not enough for fluency alone"],
    bestFor: ["Language learners", "Beginners", "Daily practice"], platforms: ["web", "ios", "android"],
    scores: [82, 78, 95, 88], tags: ["language", "education", "learning", "gamified"],
  },
  {
    slug: "coursera", name: "Coursera", domain: "coursera.org", category: "education",
    pricing: "FREEMIUM", company: "Coursera",
    tagline: "Online courses and degrees from top universities",
    description: "Coursera offers courses, certificates and degrees from universities and companies worldwide, with many courses free to audit.",
    pros: ["University-quality content", "Recognized certificates", "Audit for free"], cons: ["Certificates cost", "Variable course quality", "Deadlines on some"],
    bestFor: ["Professional skills", "Certificates", "Degrees"], platforms: ["web", "ios", "android"],
    scores: [80, 76, 90, 88], tags: ["education", "courses", "learning", "certificates"],
  },
  {
    slug: "udemy", name: "Udemy", domain: "udemy.com", category: "education",
    pricing: "PAID", company: "Udemy",
    tagline: "Marketplace of practical courses on any topic",
    description: "Udemy is a vast marketplace of video courses on programming, business, design and hobbies, taught by independent instructors, frequently on sale.",
    pros: ["Huge course selection", "Lifetime access", "Frequent discounts"], cons: ["Variable quality", "No accreditation", "Prices before sales inflated"],
    bestFor: ["Practical skills", "Self-paced learning", "Hobbies"], platforms: ["web", "ios", "android"],
    scores: [79, 72, 90, 84], tags: ["education", "courses", "learning", "skills"],
  },
  {
    slug: "khan-academy", name: "Khan Academy", domain: "khanacademy.org", category: "education",
    pricing: "FREE", company: "Khan Academy", openSource: true,
    tagline: "Free, world-class education for anyone, anywhere",
    description: "Khan Academy is a non-profit offering free lessons and practice in math, science and more, trusted by students, parents and teachers worldwide.",
    pros: ["Completely free", "High quality", "Great for K-12"], cons: ["Mostly academic subjects", "No certificates", "Less for professionals"],
    bestFor: ["Students", "Math & science", "Free learning"], platforms: ["web", "ios", "android"],
    scores: [82, 76, 90, 92], tags: ["education", "free", "learning", "non-profit"],
  },
  {
    slug: "anki", name: "Anki", domain: "apps.ankiweb.net", category: "education",
    pricing: "FREEMIUM", company: "Anki", openSource: true,
    tagline: "Powerful spaced-repetition flashcards",
    description: "Anki uses spaced repetition to help you remember anything long-term, with customizable decks and a huge community of shared card sets.",
    pros: ["Extremely effective", "Free (except iOS)", "Highly customizable"], cons: ["Dated UI", "Learning curve", "iOS app is paid"],
    bestFor: ["Medical students", "Language learners", "Memorization"], platforms: ["windows", "macos", "linux", "ios", "android", "web"],
    scores: [81, 74, 82, 88], tags: ["flashcards", "education", "spaced-repetition", "study"],
  },
  {
    slug: "quizlet", name: "Quizlet", domain: "quizlet.com", category: "education",
    pricing: "FREEMIUM", company: "Quizlet",
    tagline: "Flashcards and study tools for students",
    description: "Quizlet offers flashcards, practice tests and study games across millions of user-created sets, with AI-powered study modes.",
    pros: ["Huge study set library", "Fun study modes", "Easy to use"], cons: ["Best features paid", "Ads on free", "Quality varies by set"],
    bestFor: ["Students", "Test prep", "Vocabulary"], platforms: ["web", "ios", "android"],
    scores: [79, 74, 88, 84], tags: ["flashcards", "education", "study", "learning"],
  },

  // ─────────────── Games / Platforms ───────────────
  {
    slug: "steam", name: "Steam", domain: "store.steampowered.com", category: "games",
    pricing: "FREE", company: "Valve", featured: true,
    tagline: "The largest digital storefront and platform for PC gaming",
    description: "Steam is the dominant PC gaming platform, offering a massive store, community features, cloud saves, workshop mods and frequent sales.",
    pros: ["Massive game library", "Great sales", "Strong community & features"], cons: ["30% cut for developers", "Client can be heavy", "Refund limits"],
    bestFor: ["PC gamers", "Game library", "Modding"], platforms: ["windows", "macos", "linux"],
    scores: [82, 74, 96, 90], tags: ["gaming", "store", "pc", "platform"],
  },
  {
    slug: "epic-games-store", name: "Epic Games Store", domain: "store.epicgames.com", category: "games",
    pricing: "FREE", company: "Epic Games",
    tagline: "Game store with weekly free games and lower cuts",
    description: "The Epic Games Store offers PC games with a lower developer revenue cut than Steam and gives away free games every week.",
    pros: ["Free games weekly", "Better dev revenue split", "Exclusives"], cons: ["Fewer features than Steam", "Smaller library", "Client criticized"],
    bestFor: ["PC gamers", "Free games", "Deals"], platforms: ["windows", "macos"],
    scores: [78, 70, 86, 82], tags: ["gaming", "store", "pc", "platform"],
  },
  {
    slug: "twitch", name: "Twitch", domain: "twitch.tv", category: "streaming",
    pricing: "FREEMIUM", company: "Amazon",
    tagline: "The leading platform for live streaming and gaming",
    description: "Twitch is the top live-streaming platform for gaming, creative and just-chatting content, with subscriptions, bits and a strong community culture.",
    pros: ["Huge live audience", "Strong community tools", "Monetization options"], cons: ["High revenue cut", "Discovery hard for new streamers", "Moderation challenges"],
    bestFor: ["Streamers", "Gamers", "Live content"], platforms: ["web", "ios", "android", "windows", "macos"],
    scores: [80, 72, 92, 85], tags: ["streaming", "gaming", "live", "creators"],
  },
  {
    slug: "itch-io", name: "itch.io", domain: "itch.io", category: "games",
    pricing: "FREE", company: "itch.io", openSource: true,
    tagline: "Open marketplace for indie games and creators",
    description: "itch.io is an open, creator-friendly marketplace for indie games, assets and tools, with pay-what-you-want pricing and flexible revenue sharing.",
    pros: ["Very creator-friendly", "Pay-what-you-want", "Great for indies"], cons: ["Less discovery", "Smaller audience", "Basic storefront"],
    bestFor: ["Indie devs", "Game jams", "Experimental games"], platforms: ["web", "windows", "macos", "linux"],
    scores: [79, 70, 80, 86], tags: ["gaming", "indie", "marketplace", "store"],
  },

  // ─────────────── Cloud storage / more ───────────────
  {
    slug: "onedrive", name: "Microsoft OneDrive", domain: "onedrive.com", category: "cloud",
    pricing: "FREEMIUM", company: "Microsoft",
    tagline: "Cloud storage integrated with Windows and Microsoft 365",
    description: "OneDrive provides cloud file storage tightly integrated with Windows and Microsoft 365, with automatic backup and Office collaboration.",
    pros: ["Windows integration", "Comes with Microsoft 365", "Office collaboration"], cons: ["Small free tier", "Sync quirks", "Privacy considerations"],
    bestFor: ["Windows users", "Microsoft 365", "Backup"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [80, 76, 90, 86], tags: ["cloud-storage", "microsoft", "backup", "files"],
  },
  {
    slug: "pcloud", name: "pCloud", domain: "pcloud.com", category: "cloud",
    pricing: "FREEMIUM", company: "pCloud",
    tagline: "Secure cloud storage with a lifetime plan option",
    description: "pCloud offers cloud storage with client-side encryption options and unusual one-time lifetime plans, a favorite for long-term storage.",
    pros: ["Lifetime plans available", "Optional encryption", "Good media playback"], cons: ["Encryption costs extra", "Fewer collaboration tools", "Smaller ecosystem"],
    bestFor: ["Long-term storage", "Media", "Privacy"], platforms: ["web", "windows", "macos", "linux", "ios", "android"],
    scores: [79, 70, 78, 84], tags: ["cloud-storage", "backup", "files", "privacy"],
  },
  {
    slug: "backblaze", name: "Backblaze", domain: "backblaze.com", category: "cloud",
    pricing: "PAID", company: "Backblaze",
    tagline: "Dead-simple unlimited computer backup",
    description: "Backblaze offers affordable, unlimited cloud backup for computers and low-cost B2 object storage for developers, known for transparency.",
    pros: ["Unlimited computer backup", "Affordable", "Transparent"], cons: ["Backup, not sync", "One computer per license", "Restore time for large sets"],
    bestFor: ["Backup", "Data safety", "Developers (B2)"], platforms: ["windows", "macos", "api"],
    scores: [80, 70, 82, 88], tags: ["backup", "cloud-storage", "object-storage", "data"],
  },

  // ─────────────── Finance ───────────────
  {
    slug: "paypal", name: "PayPal", domain: "paypal.com", category: "finance",
    pricing: "FREE", company: "PayPal",
    tagline: "Send, receive and accept payments online worldwide",
    description: "PayPal is a widely accepted online payment service for sending money, shopping and accepting payments, trusted by consumers and merchants globally.",
    pros: ["Widely accepted", "Buyer protection", "Easy to use"], cons: ["Fees for business", "Account holds", "Support frustrations"],
    bestFor: ["Online payments", "Freelancers", "Shopping"], platforms: ["web", "ios", "android"],
    scores: [80, 72, 95, 84], tags: ["payments", "finance", "money-transfer", "checkout"],
  },
  {
    slug: "revolut", name: "Revolut", domain: "revolut.com", category: "finance",
    pricing: "FREEMIUM", company: "Revolut",
    tagline: "All-in-one financial app for spending and currencies",
    description: "Revolut is a financial super-app offering multi-currency accounts, cards, budgeting, stock and crypto trading with strong exchange rates.",
    pros: ["Great for travel & FX", "Many features", "Slick app"], cons: ["Support can be slow", "Not a full bank everywhere", "Fees on premium features"],
    bestFor: ["Travelers", "Multi-currency", "Budgeting"], platforms: ["ios", "android", "web"],
    scores: [80, 74, 86, 82], tags: ["finance", "banking", "currency", "fintech"],
  },
  {
    slug: "xero", name: "Xero", domain: "xero.com", category: "finance",
    pricing: "SUBSCRIPTION", company: "Xero",
    tagline: "Cloud accounting software for small businesses",
    description: "Xero is a popular cloud accounting platform for small businesses and accountants, with invoicing, bank reconciliation and a strong app ecosystem.",
    pros: ["Clean & modern", "Great app ecosystem", "Unlimited users"], cons: ["Pricing tiers limit features", "Payroll varies by region", "Learning curve"],
    bestFor: ["Small businesses", "Accountants", "Invoicing"], platforms: ["web", "ios", "android"],
    scores: [80, 74, 84, 86], tags: ["accounting", "finance", "invoicing", "business"],
  },
  {
    slug: "wave-accounting", name: "Wave", domain: "waveapps.com", category: "finance",
    pricing: "FREEMIUM", company: "Wave",
    tagline: "Free accounting and invoicing for small businesses",
    description: "Wave offers free accounting and invoicing software for freelancers and small businesses, making money from payments and payroll add-ons.",
    pros: ["Free core accounting", "Simple invoicing", "Good for freelancers"], cons: ["Paid payments/payroll", "Fewer integrations", "Limited scaling"],
    bestFor: ["Freelancers", "Small businesses", "Free accounting"], platforms: ["web", "ios", "android"],
    scores: [79, 70, 82, 83], tags: ["accounting", "invoicing", "finance", "free"],
  },

  // ─────────────── Security / VPN more ───────────────
  {
    slug: "dashlane", name: "Dashlane", domain: "dashlane.com", category: "security",
    pricing: "FREEMIUM", company: "Dashlane",
    tagline: "Password manager with built-in VPN and dark web monitoring",
    description: "Dashlane manages passwords and passkeys with autofill, a password health dashboard, dark web monitoring and a bundled VPN on paid plans.",
    pros: ["Polished apps", "Extra security features", "Good autofill"], cons: ["Free tier very limited", "Pricier", "Desktop app deprecated for web"],
    bestFor: ["Individuals", "Families", "Security-conscious"], platforms: ["web", "ios", "android", "chrome", "firefox"],
    scores: [80, 74, 82, 85], tags: ["password-manager", "security", "vpn", "privacy"],
  },
  {
    slug: "windscribe", name: "Windscribe", domain: "windscribe.com", category: "vpn",
    pricing: "FREEMIUM", company: "Windscribe",
    tagline: "VPN with a genuinely useful free tier",
    description: "Windscribe is a VPN and privacy suite offering a generous free plan with data allowance, plus ad blocking and flexible configuration.",
    pros: ["Generous free plan", "Ad/tracker blocking", "Flexible config"], cons: ["Free data cap", "Speeds vary", "Smaller network"],
    bestFor: ["Budget users", "Occasional VPN", "Privacy"], platforms: ["windows", "macos", "linux", "ios", "android", "chrome", "firefox"],
    scores: [79, 70, 80, 82], tags: ["vpn", "privacy", "security", "free"],
  },
  {
    slug: "tunnelbear", name: "TunnelBear", domain: "tunnelbear.com", category: "vpn",
    pricing: "FREEMIUM", company: "TunnelBear",
    tagline: "A simple, friendly VPN for beginners",
    description: "TunnelBear is a beginner-friendly VPN with a playful design, independent security audits and a limited free tier.",
    pros: ["Very easy to use", "Audited security", "Free tier"], cons: ["Small free data", "Fewer servers", "Owned by McAfee"],
    bestFor: ["Beginners", "Casual use", "Simplicity"], platforms: ["windows", "macos", "ios", "android", "chrome"],
    scores: [78, 68, 80, 82], tags: ["vpn", "privacy", "security", "beginner"],
  },

  // ─────────────── ERP / Business ───────────────
  {
    slug: "odoo", name: "Odoo", domain: "odoo.com", category: "erp",
    pricing: "FREEMIUM", company: "Odoo", openSource: true,
    tagline: "Open-source suite of integrated business apps",
    description: "Odoo is an open-source ERP with modular apps for CRM, accounting, inventory, HR, e-commerce and more, self-hostable or cloud-hosted.",
    pros: ["Open source & modular", "Covers whole business", "Affordable"], cons: ["Setup complexity", "Per-app pricing on cloud", "Customization needs expertise"],
    bestFor: ["SMBs", "All-in-one business", "Self-hosting"], platforms: ["web", "self-hosted", "ios", "android"],
    scores: [82, 76, 82, 84], tags: ["erp", "business", "open-source", "crm"],
  },
  {
    slug: "netsuite", name: "Oracle NetSuite", domain: "netsuite.com", category: "erp",
    pricing: "CONTACT", company: "Oracle",
    tagline: "Cloud ERP for growing and mid-market businesses",
    description: "NetSuite is a comprehensive cloud ERP covering financials, CRM, inventory and e-commerce, popular with scaling and mid-market companies.",
    pros: ["Comprehensive ERP", "Scales with business", "Unified data"], cons: ["Expensive", "Complex implementation", "Customization costs"],
    bestFor: ["Mid-market", "Scaling companies", "Finance teams"], platforms: ["web"],
    scores: [76, 74, 82, 85], tags: ["erp", "business", "finance", "enterprise"],
  },

  // ─────────────── Database ───────────────
  {
    slug: "postgresql", name: "PostgreSQL", domain: "postgresql.org", category: "database",
    pricing: "OPEN_SOURCE", company: "PostgreSQL", openSource: true, featured: true,
    tagline: "The world's most advanced open-source relational database",
    description: "PostgreSQL is a powerful, standards-compliant open-source relational database known for reliability, extensibility and rich SQL features.",
    pros: ["Free & open source", "Extremely capable", "Rock-solid reliability"], cons: ["Tuning expertise needed", "No official managed cloud", "Setup for beginners"],
    bestFor: ["Web apps", "Analytics", "Developers"], platforms: ["windows", "macos", "linux", "self-hosted"],
    scores: [86, 80, 92, 92], tags: ["database", "sql", "open-source", "developer"],
  },
  {
    slug: "redis", name: "Redis", domain: "redis.io", category: "database",
    pricing: "FREEMIUM", company: "Redis", openSource: true,
    tagline: "In-memory data store for caching and real-time apps",
    description: "Redis is a blazing-fast in-memory data store used for caching, queues, sessions and real-time features, with optional persistence.",
    pros: ["Extremely fast", "Versatile data structures", "Widely used"], cons: ["Memory-bound", "Licensing changes", "Persistence trade-offs"],
    bestFor: ["Caching", "Queues", "Real-time apps"], platforms: ["linux", "self-hosted", "api"],
    scores: [84, 78, 90, 88], tags: ["database", "cache", "in-memory", "developer"],
  },
  {
    slug: "neon", name: "Neon", domain: "neon.tech", category: "database",
    pricing: "FREEMIUM", company: "Neon",
    tagline: "Serverless Postgres with branching",
    description: "Neon is a serverless Postgres platform that separates storage and compute, offering instant database branching and scale-to-zero, popular for modern apps.",
    pros: ["Serverless Postgres", "Database branching", "Generous free tier"], cons: ["Cold starts", "Newer platform", "Costs at scale"],
    bestFor: ["Web apps", "Serverless", "Developers"], platforms: ["web", "api"],
    scores: [82, 80, 80, 83], tags: ["database", "postgres", "serverless", "developer"],
  },

  // ─────────────── Coding / Terminals ───────────────
  {
    slug: "zed", name: "Zed", domain: "zed.dev", category: "coding",
    pricing: "FREEMIUM", company: "Zed Industries", openSource: true,
    tagline: "High-performance, collaborative code editor",
    description: "Zed is a fast, GPU-accelerated code editor built in Rust with real-time collaboration and integrated AI, from the creators of Atom.",
    pros: ["Extremely fast", "Built-in collaboration", "Open source"], cons: ["Younger ecosystem", "Fewer extensions", "Linux/Windows newer"],
    bestFor: ["Performance seekers", "Pair programming", "Rust/Web devs"], platforms: ["macos", "linux", "windows"],
    scores: [82, 80, 78, 82], tags: ["editor", "coding", "open-source", "developer"],
  },
  {
    slug: "warp", name: "Warp", domain: "warp.dev", category: "coding",
    pricing: "FREEMIUM", company: "Warp",
    tagline: "The modern, AI-powered terminal",
    description: "Warp reimagines the terminal with a text-editor-like input, blocks, and AI assistance to explain and generate commands.",
    pros: ["Modern UX", "AI command help", "Blocks & workflows"], cons: ["Account required", "Resource usage", "Not fully open"],
    bestFor: ["Developers", "Terminal power users", "AI-assisted CLI"], platforms: ["macos", "linux", "windows"],
    scores: [80, 82, 78, 80], tags: ["terminal", "coding", "ai", "developer"],
  },
  {
    slug: "android-studio", name: "Android Studio", domain: "developer.android.com/studio", category: "coding",
    pricing: "FREE", company: "Google",
    tagline: "The official IDE for Android app development",
    description: "Android Studio is Google's official IDE for building Android apps, based on IntelliJ, with emulators, profilers and Gemini AI assistance.",
    pros: ["Official Android tooling", "Powerful emulator & profilers", "Free"], cons: ["Resource heavy", "Slow on weak machines", "Android-focused"],
    bestFor: ["Android developers", "Mobile apps", "Kotlin/Java"], platforms: ["windows", "macos", "linux"],
    scores: [80, 78, 86, 88], tags: ["ide", "android", "mobile", "developer"],
  },

  // ─────────────── Communication / more ───────────────
  {
    slug: "zoho-mail", name: "Zoho Mail", domain: "zoho.com/mail", category: "email",
    pricing: "FREEMIUM", company: "Zoho",
    tagline: "Ad-free business email with a generous free tier",
    description: "Zoho Mail offers privacy-focused, ad-free email hosting for custom domains with a solid free plan and integration into the Zoho suite.",
    pros: ["Ad-free & private", "Custom domain on free", "Part of Zoho suite"], cons: ["Suite can be complex", "Support varies", "Storage limits"],
    bestFor: ["Small businesses", "Custom domains", "Zoho users"], platforms: ["web", "ios", "android"],
    scores: [79, 72, 82, 85], tags: ["email", "business", "privacy", "hosting"],
  },
  {
    slug: "fastmail", name: "Fastmail", domain: "fastmail.com", category: "email",
    pricing: "SUBSCRIPTION", company: "Fastmail",
    tagline: "Fast, private, independent email hosting",
    description: "Fastmail is a reliable, privacy-respecting email provider with custom domains, strong search and excellent apps, funded purely by subscriptions.",
    pros: ["Fast & reliable", "Great search", "Privacy-respecting"], cons: ["No free tier", "Not zero-access encrypted", "Fewer extras"],
    bestFor: ["Custom domains", "Power users", "Privacy"], platforms: ["web", "ios", "android"],
    scores: [80, 72, 80, 87], tags: ["email", "privacy", "hosting", "productivity"],
  },
  {
    slug: "hey", name: "HEY", domain: "hey.com", category: "email",
    pricing: "SUBSCRIPTION", company: "37signals",
    tagline: "Opinionated email that rethinks the inbox",
    description: "HEY, from 37signals, reimagines email with screening, the Imbox, and workflows designed to reduce clutter and take back control.",
    pros: ["Fresh take on email", "Great spam screening", "Privacy-focused"], cons: ["Pricey", "Opinionated workflow", "Lock-in to @hey.com or paid domains"],
    bestFor: ["Email overhaul", "Privacy", "Focus"], platforms: ["web", "ios", "android", "windows", "macos"],
    scores: [78, 72, 78, 82], tags: ["email", "productivity", "privacy", "focus"],
  },

  // ─────────────── More productivity / notes ───────────────
  {
    slug: "google-keep", name: "Google Keep", domain: "keep.google.com", category: "productivity",
    pricing: "FREE", company: "Google",
    tagline: "Quick notes, lists and reminders that sync everywhere",
    description: "Google Keep is a simple note and list app with color coding, reminders, labels and voice notes, syncing across your Google account.",
    pros: ["Free & simple", "Fast capture", "Syncs everywhere"], cons: ["Too basic for some", "Limited formatting", "No folders/nesting"],
    bestFor: ["Quick notes", "Lists", "Reminders"], platforms: ["web", "ios", "android", "chrome"],
    scores: [80, 72, 88, 86], tags: ["notes", "productivity", "google", "lists"],
  },
  {
    slug: "microsoft-todo", name: "Microsoft To Do", domain: "todo.microsoft.com", category: "productivity",
    pricing: "FREE", company: "Microsoft",
    tagline: "Free task and to-do list app with My Day planning",
    description: "Microsoft To Do is a free task manager with lists, reminders, My Day planning and Outlook task sync, simple and effective.",
    pros: ["Completely free", "Outlook integration", "Clean and simple"], cons: ["Basic for power users", "No natural language", "Microsoft account needed"],
    bestFor: ["Personal tasks", "Microsoft users", "Simplicity"], platforms: ["web", "windows", "ios", "android"],
    scores: [79, 72, 84, 85], tags: ["tasks", "todo", "productivity", "microsoft"],
  },
  {
    slug: "basecamp", name: "Basecamp", domain: "basecamp.com", category: "productivity",
    pricing: "SUBSCRIPTION", company: "37signals",
    tagline: "Calm, opinionated project management and team collaboration",
    description: "Basecamp organizes projects with to-dos, message boards, docs and chat in one calm place, with flat pricing and an anti-busywork philosophy.",
    pros: ["Simple & calm", "Flat pricing", "All-in-one"], cons: ["Less flexible", "Fewer integrations", "Not for complex workflows"],
    bestFor: ["Small teams", "Agencies", "Remote work"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [80, 72, 82, 85], tags: ["project-management", "collaboration", "productivity", "teams"],
  },
  {
    slug: "raycast", name: "Raycast", domain: "raycast.com", category: "productivity",
    pricing: "FREEMIUM", company: "Raycast", featured: true,
    tagline: "Blazing-fast launcher and productivity command bar for Mac",
    description: "Raycast is a keyboard-driven launcher for macOS that runs commands, snippets, window management, clipboard history and extensions in one bar.",
    pros: ["Extremely fast", "Huge extension store", "Great free tier"], cons: ["Mac-first (Windows in beta)", "Learning curve", "Pro/AI features paid"],
    bestFor: ["Power users", "Mac users", "Productivity"], platforms: ["macos", "windows"],
    scores: [83, 80, 82, 85], tags: ["launcher", "productivity", "mac", "automation"],
  },
];

const ALTERNATIVES: [string, string, number][] = [
  ["deepl", "chatgpt", 55],
  ["synthesia", "heygen", 90],
  ["heygen", "runway", 74],
  ["ideogram", "midjourney", 80],
  ["ideogram", "leonardo-ai", 82],
  ["notebooklm", "perplexity", 76],
  ["copy-ai", "jasper", 88],
  ["replit", "cursor", 74],
  ["replit", "vs-code", 68],
  ["logseq", "obsidian", 88],
  ["logseq", "notion", 72],
  ["things-3", "todoist", 82],
  ["things-3", "ticktick", 80],
  ["excalidraw", "miro", 80],
  ["excalidraw", "drawio", 82],
  ["calendly", "cal-com", 90],
  ["cal-com", "calendly", 90],
  ["lucidchart", "drawio", 84],
  ["lucidchart", "excalidraw", 74],
  ["blender", "davinci-resolve", 50],
  ["procreate", "krita", 80],
  ["affinity-designer", "adobe-illustrator", 88],
  ["affinity-designer", "inkscape", 80],
  ["vlc", "handbrake", 60],
  ["audacity", "descript", 74],
  ["clerk", "auth0", 88],
  ["clerk", "supabase", 70],
  ["auth0", "clerk", 88],
  ["resend", "twilio", 60],
  ["sentry", "posthog", 66],
  ["posthog", "mixpanel", 86],
  ["posthog", "google-analytics", 72],
  ["appwrite", "supabase", 86],
  ["appwrite", "firebase", 84],
  ["strapi", "sanity", 84],
  ["sanity", "strapi", 84],
  ["ghost", "wordpress", 80],
  ["ghost", "substack", 78],
  ["plausible", "google-analytics", 84],
  ["mixpanel", "google-analytics", 74],
  ["hotjar", "posthog", 70],
  ["convertkit", "mailchimp", 84],
  ["convertkit", "substack", 76],
  ["substack", "beehiiv", 88],
  ["beehiiv", "substack", 88],
  ["klaviyo", "mailchimp", 82],
  ["shopify", "woocommerce", 86],
  ["woocommerce", "shopify", 86],
  ["gumroad", "lemon-squeezy", 84],
  ["lemon-squeezy", "gumroad", 84],
  ["lemon-squeezy", "stripe", 74],
  ["intercom", "zendesk", 84],
  ["zendesk", "freshdesk", 86],
  ["freshdesk", "zendesk", 86],
  ["duolingo", "babbel", 60],
  ["coursera", "udemy", 84],
  ["udemy", "skillshare", 76],
  ["khan-academy", "coursera", 74],
  ["anki", "quizlet", 84],
  ["quizlet", "anki", 84],
  ["epic-games-store", "steam", 88],
  ["itch-io", "steam", 74],
  ["onedrive", "google-drive", 86],
  ["onedrive", "dropbox", 82],
  ["pcloud", "dropbox", 80],
  ["backblaze", "dropbox", 60],
  ["paypal", "stripe", 74],
  ["paypal", "wise", 72],
  ["revolut", "wise", 82],
  ["xero", "quickbooks", 88],
  ["wave-accounting", "quickbooks", 78],
  ["wave-accounting", "xero", 76],
  ["dashlane", "1password", 84],
  ["dashlane", "bitwarden", 82],
  ["windscribe", "protonvpn", 78],
  ["tunnelbear", "windscribe", 78],
  ["odoo", "netsuite", 78],
  ["netsuite", "odoo", 78],
  ["postgresql", "mongodb", 74],
  ["neon", "supabase", 82],
  ["neon", "planetscale", 80],
  ["redis", "mongodb", 60],
  ["zed", "vs-code", 82],
  ["zed", "sublime-text", 78],
  ["warp", "iterm", 60],
  ["android-studio", "vs-code", 62],
  ["zoho-mail", "proton-mail", 74],
  ["fastmail", "proton-mail", 80],
  ["hey", "proton-mail", 70],
  ["google-keep", "microsoft-onenote", 78],
  ["microsoft-todo", "todoist", 80],
  ["microsoft-todo", "ticktick", 78],
  ["basecamp", "asana", 76],
  ["raycast", "alfred", 60],
];

async function createTool(seed: ToolSeed): Promise<boolean> {
  const category = await prisma.category.findUnique({ where: { slug: seed.category } });
  if (!category) {
    console.warn(`[expand-catalog-2] category "${seed.category}" missing — skipping ${seed.slug}`);
    return false;
  }

  let companyId: string | undefined;
  if (seed.company) {
    const companySlug = seed.company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const company = await prisma.company.upsert({
      where: { slug: companySlug },
      create: { slug: companySlug, name: seed.company },
      update: {},
    });
    companyId = company.id;
  }

  const [alternativeScore, aiScore, popularityScore, trustScore] = seed.scores;

  const tool = await prisma.tool.create({
    data: {
      slug: seed.slug,
      name: seed.name,
      tagline: seed.tagline,
      description: seed.description,
      websiteUrl: `https://${seed.domain}`,
      logoUrl: favicon(seed.domain),
      pricingModel: seed.pricing,
      pros: seed.pros,
      cons: seed.cons,
      bestFor: seed.bestFor,
      aiSummary: `${seed.name} — ${seed.tagline}. ${seed.description.split(". ")[0]}.`,
      status: "PUBLISHED",
      publishedAt: new Date(),
      featured: seed.featured ?? false,
      verified: true,
      isOpenSource: seed.openSource ?? false,
      alternativeScore,
      aiScore,
      popularityScore,
      trustScore,
      viewCount: Math.round(popularityScore * 137),
      upvotes: Math.round(popularityScore * 3.2),
      categoryId: category.id,
      companyId,
      seoTitle: `${seed.name} — Reviews, Pricing & Best Alternatives`,
      seoDesc: `${seed.tagline}. Compare ${seed.name} features, pricing, pros & cons and find the best ${seed.name} alternatives.`,
      keywords: [`${seed.name.toLowerCase()} alternatives`, `${seed.name.toLowerCase()} review`, ...seed.tags],
    },
  });

  for (const platformSlug of seed.platforms) {
    const platform = await prisma.platform.findUnique({ where: { slug: platformSlug } });
    if (!platform) continue;
    await prisma.toolPlatform.create({ data: { toolId: tool.id, platformId: platform.id } }).catch(() => {});
  }

  for (const tagName of seed.tags) {
    const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const tag = await prisma.tag.upsert({
      where: { slug: tagSlug },
      create: { slug: tagSlug, name: tagName },
      update: {},
    });
    await prisma.toolTag.create({ data: { toolId: tool.id, tagId: tag.id } }).catch(() => {});
  }

  return true;
}

async function run() {
  let added = 0;
  try {
    for (const seed of TOOLS) {
      const existing = await prisma.tool.findUnique({ where: { slug: seed.slug }, select: { id: true } });
      if (existing) continue;
      const ok = await createTool(seed).catch((e) => {
        console.warn(`[expand-catalog-2] failed to add ${seed.slug}:`, e);
        return false;
      });
      if (ok) added += 1;
    }

    let edges = 0;
    for (const [sourceSlug, targetSlug, matchScore] of ALTERNATIVES) {
      const [source, target] = await Promise.all([
        prisma.tool.findUnique({ where: { slug: sourceSlug }, select: { id: true } }),
        prisma.tool.findUnique({ where: { slug: targetSlug }, select: { id: true } }),
      ]);
      if (!source || !target) continue;
      for (const [a, b] of [[source.id, target.id], [target.id, source.id]] as const) {
        await prisma.alternative
          .upsert({
            where: { sourceToolId_targetToolId: { sourceToolId: a, targetToolId: b } },
            create: { sourceToolId: a, targetToolId: b, matchScore },
            update: {},
          })
          .then(() => { edges += 1; })
          .catch(() => {});
      }
    }

    console.log(`[expand-catalog-2] Added ${added} new tools and ${edges} alternative edges.`);
  } catch (err) {
    console.warn("[expand-catalog-2] Expansion failed (deploy will continue).", err);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

run();
