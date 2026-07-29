/**
 * AlternativeHub production seed.
 * Real categories, platforms, 30+ real tools, alternatives graph,
 * a flagship comparison, blog posts and demo users.
 *
 * Usage: npm run db:seed  (idempotent — upserts by slug/email)
 */
import { PrismaClient, PricingModel } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const favicon = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

// ── Categories (slug, name, icon, color, description) ────────────────────
const CATEGORIES: [string, string, string, string, string][] = [
  ["apps", "Apps", "Smartphone", "#6366f1", "Mobile and desktop applications for every need"],
  ["websites", "Websites", "Globe", "#0ea5e9", "Web platforms and online services"],
  ["ai-tools", "AI Tools", "Bot", "#10b981", "AI assistants, generators and machine-learning tools"],
  ["desktop-software", "Desktop Software", "Monitor", "#8b5cf6", "Software for Windows, macOS and Linux"],
  ["games", "Games", "Gamepad2", "#f43f5e", "Games and gaming platforms"],
  ["browser-extensions", "Browser Extensions", "Puzzle", "#f59e0b", "Extensions for Chrome, Firefox and more"],
  ["saas", "SaaS", "CloudCog", "#14b8a6", "Software-as-a-service products for teams"],
  ["developer-tools", "Developer Tools", "Code2", "#3b82f6", "IDEs, APIs and tooling for developers"],
  ["productivity", "Productivity", "Zap", "#eab308", "Notes, tasks and workflow tools"],
  ["finance", "Finance", "Wallet", "#22c55e", "Banking, budgeting and investing tools"],
  ["education", "Education", "GraduationCap", "#06b6d4", "Learning platforms and study tools"],
  ["security", "Security", "Shield", "#ef4444", "Password managers, antivirus and privacy tools"],
  ["cloud", "Cloud", "Cloud", "#0284c7", "Cloud storage and computing platforms"],
  ["marketing", "Marketing", "Megaphone", "#ec4899", "SEO, email and growth marketing tools"],
  ["video-editing", "Video Editing", "Video", "#a855f7", "Video editors and motion graphics"],
  ["photo-editing", "Photo Editing", "Image", "#d946ef", "Photo editors and design tools"],
  ["pdf-tools", "PDF Tools", "FileText", "#dc2626", "PDF editors, converters and readers"],
  ["coding", "Coding", "Terminal", "#64748b", "Code editors and programming tools"],
  ["hosting", "Hosting", "Server", "#7c3aed", "Web hosting and deployment platforms"],
  ["vpn", "VPN", "Lock", "#059669", "Virtual private networks and privacy"],
  ["streaming", "Streaming", "Play", "#e11d48", "Music and video streaming services"],
  ["crm", "CRM", "Users", "#2563eb", "Customer relationship management"],
  ["erp", "ERP", "Factory", "#475569", "Enterprise resource planning"],
  ["database", "Database", "Database", "#0891b2", "Databases and data platforms"],
  ["email", "Email", "Mail", "#ea580c", "Email clients and providers"],
  ["automation", "Automation", "Workflow", "#9333ea", "Workflow automation and integrations"],
  ["no-code", "No Code", "Blocks", "#f97316", "Build apps and sites without code"],
  ["low-code", "Low Code", "SquareCode", "#84cc16", "Rapid development platforms"],
];

const PLATFORMS: [string, string][] = [
  ["web", "Web"], ["windows", "Windows"], ["macos", "macOS"], ["linux", "Linux"],
  ["ios", "iOS"], ["android", "Android"], ["chrome", "Chrome"], ["firefox", "Firefox"],
  ["cli", "CLI"], ["api", "API"], ["self-hosted", "Self-Hosted"],
];

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
  scores: [number, number, number, number]; // alternative, ai, popularity, trust
  tags: string[];
};

const TOOLS: ToolSeed[] = [
  {
    slug: "chatgpt", name: "ChatGPT", domain: "chatgpt.com", category: "ai-tools",
    pricing: "FREEMIUM", company: "OpenAI", featured: true,
    tagline: "The AI assistant that started the generative AI revolution",
    description:
      "ChatGPT is OpenAI's conversational AI assistant. It answers questions, writes and edits text, generates code, analyzes images and files, and supports voice conversations. The free tier gives access to a capable default model, while paid plans unlock the most advanced models, higher limits, and features like advanced data analysis and custom GPTs.",
    pros: ["Excellent general-purpose answers", "Huge ecosystem of custom GPTs", "Voice mode feels natural", "Generous free tier"],
    cons: ["Usage caps on the best models", "Can hallucinate confidently", "Privacy concerns for sensitive data"],
    bestFor: ["Everyday questions", "Content drafting", "Learning new topics"],
    platforms: ["web", "ios", "android", "macos", "windows", "api"],
    scores: [92, 94, 98, 90], tags: ["chatbot", "llm", "writing", "assistant"],
  },
  {
    slug: "claude", name: "Claude", domain: "claude.ai", category: "ai-tools",
    pricing: "FREEMIUM", company: "Anthropic", featured: true,
    tagline: "Thoughtful AI assistant that excels at deep work and coding",
    description:
      "Claude is Anthropic's AI assistant, known for nuanced reasoning, long-context understanding, strong coding ability, and careful, honest answers. It handles huge documents, supports projects and artifacts for iterative work, and powers Claude Code for agentic software development.",
    pros: ["Best-in-class coding help", "Handles very long documents", "Nuanced, honest writing style", "Artifacts for live previews"],
    cons: ["Free tier has daily limits", "No image generation", "Fewer third-party plugins"],
    bestFor: ["Software development", "Long-document analysis", "Professional writing"],
    platforms: ["web", "ios", "android", "macos", "windows", "api", "cli"],
    scores: [93, 96, 90, 93], tags: ["chatbot", "llm", "coding", "assistant"],
  },
  {
    slug: "gemini", name: "Gemini", domain: "gemini.google.com", category: "ai-tools",
    pricing: "FREEMIUM", company: "Google", featured: true,
    tagline: "Google's multimodal AI woven into Search, Gmail and Android",
    description:
      "Gemini is Google's AI assistant, deeply integrated with Google Workspace, Search, and Android. It's natively multimodal — strong with images, video, and audio — and offers enormous context windows on paid tiers. A solid pick if you live inside the Google ecosystem.",
    pros: ["Deep Google Workspace integration", "Strong multimodal understanding", "Very large context windows", "Fast free tier"],
    cons: ["Answers can be conservative", "Best features need Google One AI", "Workspace features vary by region"],
    bestFor: ["Google Workspace users", "Research with sources", "Android users"],
    platforms: ["web", "ios", "android", "api"],
    scores: [88, 91, 92, 88], tags: ["chatbot", "llm", "google", "multimodal"],
  },
  {
    slug: "perplexity", name: "Perplexity", domain: "perplexity.ai", category: "ai-tools",
    pricing: "FREEMIUM", company: "Perplexity AI",
    tagline: "AI answer engine with live citations for every claim",
    description:
      "Perplexity is an AI-powered answer engine that searches the web in real time and cites its sources. Ask anything and get a synthesized answer with links to verify. Pro unlocks more powerful models, file uploads, and deep research reports.",
    pros: ["Every answer is cited", "Real-time web results", "Great for research", "Clean, focused UI"],
    cons: ["Less capable at creative writing", "Pro needed for best models", "Occasional citation mismatches"],
    bestFor: ["Research", "Fact-checking", "Current events"],
    platforms: ["web", "ios", "android", "macos", "api"],
    scores: [86, 89, 85, 87], tags: ["search", "research", "citations", "llm"],
  },
  {
    slug: "midjourney", name: "Midjourney", domain: "midjourney.com", category: "ai-tools",
    pricing: "SUBSCRIPTION",
    tagline: "The gold standard for AI image generation",
    description:
      "Midjourney generates stunning, artistic images from text prompts. Renowned for its distinctive aesthetic quality, it's the go-to for concept art, marketing visuals and creative exploration, accessible via its website and Discord.",
    pros: ["Unmatched aesthetic quality", "Active creative community", "Fast iteration workflow"],
    cons: ["No free tier", "Learning curve for prompting", "Limited fine-grained control"],
    bestFor: ["Concept artists", "Marketers", "Creative exploration"],
    platforms: ["web"],
    scores: [90, 92, 88, 86], tags: ["image-generation", "art", "design"],
  },
  {
    slug: "grammarly", name: "Grammarly", domain: "grammarly.com", category: "ai-tools",
    pricing: "FREEMIUM",
    tagline: "AI writing partner that fixes and improves everything you type",
    description:
      "Grammarly checks grammar, spelling, tone and clarity everywhere you write — browser, desktop apps, email and docs. Its AI can rewrite sentences, adjust tone, and generate drafts, making it a staple for professional communication.",
    pros: ["Works across nearly every app", "Excellent grammar detection", "Tone suggestions"],
    cons: ["Premium is pricey", "Occasional false positives", "Cloud processing of text"],
    bestFor: ["Professionals", "Students", "Non-native speakers"],
    platforms: ["web", "windows", "macos", "chrome", "firefox", "ios", "android"],
    scores: [84, 85, 89, 88], tags: ["writing", "grammar", "proofreading"],
  },
  {
    slug: "notion", name: "Notion", domain: "notion.so", category: "productivity",
    pricing: "FREEMIUM", featured: true,
    tagline: "All-in-one workspace for notes, docs, wikis and projects",
    description:
      "Notion combines notes, documents, wikis, databases and project management in one flexible workspace. Its block-based editor and relational databases let teams build anything from simple notes to full company operating systems. Notion AI adds writing help and Q&A over your workspace.",
    pros: ["Extremely flexible building blocks", "Great templates ecosystem", "Solid free plan", "Powerful databases"],
    cons: ["Can feel slow with big workspaces", "Offline support is limited", "Steep learning curve for databases"],
    bestFor: ["Teams", "Personal knowledge management", "Startups"],
    platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [91, 90, 95, 91], tags: ["notes", "wiki", "project-management", "docs"],
  },
  {
    slug: "obsidian", name: "Obsidian", domain: "obsidian.md", category: "productivity",
    pricing: "FREEMIUM", featured: true,
    tagline: "Private, local-first notes with a powerful linking graph",
    description:
      "Obsidian is a knowledge base that works on local Markdown files. Link notes together into a personal graph, extend it with a thousand community plugins, and keep full ownership of your data. Sync and Publish are optional paid add-ons.",
    pros: ["Local-first — you own your files", "Massive plugin ecosystem", "Backlinks and graph view", "Free for personal use"],
    cons: ["Sync costs extra", "Collaboration is limited", "Plugin overload can overwhelm"],
    bestFor: ["Researchers", "Writers", "Privacy-conscious note-takers"],
    platforms: ["windows", "macos", "linux", "ios", "android"],
    scores: [89, 88, 84, 92], tags: ["notes", "markdown", "pkm", "local-first"],
  },
  {
    slug: "todoist", name: "Todoist", domain: "todoist.com", category: "productivity",
    pricing: "FREEMIUM",
    tagline: "The to-do list that keeps millions of people organized",
    description:
      "Todoist is a clean, fast task manager with natural-language input, projects, labels, filters and karma gamification. It syncs everywhere and integrates with calendars, email and automation tools.",
    pros: ["Natural language dates", "Cross-platform sync", "Simple but powerful"],
    cons: ["Reminders need premium", "No built-in calendar view on free", "Limited offline features"],
    bestFor: ["Personal productivity", "GTD practitioners", "Small teams"],
    platforms: ["web", "windows", "macos", "linux", "ios", "android", "chrome"],
    scores: [85, 84, 86, 90], tags: ["tasks", "todo", "gtd"],
  },
  {
    slug: "trello", name: "Trello", domain: "trello.com", category: "productivity",
    pricing: "FREEMIUM", company: "Atlassian",
    tagline: "Visual kanban boards that make project tracking simple",
    description:
      "Trello organizes projects into boards, lists and cards. Drag-and-drop simplicity, Power-Up integrations and Butler automation make it a friendly entry point to project management for any team.",
    pros: ["Dead simple to learn", "Flexible kanban workflow", "Good free tier"],
    cons: ["Struggles with complex projects", "Limited reporting", "Power-Ups gate key features"],
    bestFor: ["Small teams", "Personal projects", "Visual thinkers"],
    platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [80, 78, 88, 89], tags: ["kanban", "project-management", "collaboration"],
  },
  {
    slug: "figma", name: "Figma", domain: "figma.com", category: "photo-editing",
    pricing: "FREEMIUM", featured: true,
    tagline: "Collaborative interface design in the browser",
    description:
      "Figma is the industry-standard tool for UI/UX design. Real-time multiplayer editing, components, auto-layout, prototyping, and dev mode make it the hub where product teams design and ship together — all in the browser.",
    pros: ["Real-time collaboration", "Runs in the browser", "Industry-standard for UI", "Strong free tier"],
    cons: ["Requires internet for full use", "Pricing grew after Adobe era", "Heavy files can lag"],
    bestFor: ["UI/UX designers", "Product teams", "Design systems"],
    platforms: ["web", "windows", "macos"],
    scores: [93, 92, 94, 92], tags: ["design", "ui", "prototyping", "collaboration"],
  },
  {
    slug: "canva", name: "Canva", domain: "canva.com", category: "photo-editing",
    pricing: "FREEMIUM", featured: true,
    tagline: "Design anything in minutes with drag-and-drop simplicity",
    description:
      "Canva makes graphic design accessible to everyone. Thousands of templates for social posts, presentations, videos and print, plus AI-powered Magic Studio tools, brand kits, and team collaboration.",
    pros: ["Huge template library", "Very easy to learn", "AI design tools included", "Good free plan"],
    cons: ["Less precise than pro tools", "Some assets locked behind Pro", "Brand consistency takes discipline"],
    bestFor: ["Social media managers", "Small businesses", "Non-designers"],
    platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [88, 87, 96, 90], tags: ["design", "templates", "social-media"],
  },
  {
    slug: "adobe-photoshop", name: "Adobe Photoshop", domain: "adobe.com", category: "photo-editing",
    pricing: "SUBSCRIPTION", company: "Adobe",
    tagline: "The professional standard for image editing",
    description:
      "Photoshop remains the most powerful raster image editor: advanced retouching, compositing, generative AI fill, and an ecosystem of plugins refined over three decades. Part of Adobe Creative Cloud.",
    pros: ["Unmatched feature depth", "Generative AI tools", "Industry standard"],
    cons: ["Subscription only", "Steep learning curve", "Heavy on resources"],
    bestFor: ["Professional photographers", "Retouchers", "Digital artists"],
    platforms: ["windows", "macos", "ios"],
    scores: [90, 90, 93, 89], tags: ["photo-editing", "design", "adobe"],
  },
  {
    slug: "gimp", name: "GIMP", domain: "gimp.org", category: "photo-editing",
    pricing: "OPEN_SOURCE", openSource: true,
    tagline: "The free and open-source image editor",
    description:
      "GIMP is a free, open-source image editor with layers, masks, filters and scripting. It covers most Photoshop use cases at zero cost and runs on every desktop platform.",
    pros: ["Completely free", "Cross-platform", "Extensible with scripts"],
    cons: ["Dated interface", "No non-destructive editing", "CMYK support is weak"],
    bestFor: ["Budget-conscious editors", "Linux users", "Hobbyists"],
    platforms: ["windows", "macos", "linux"],
    scores: [78, 74, 80, 91], tags: ["photo-editing", "open-source", "free"],
  },
  {
    slug: "affinity-photo", name: "Affinity Photo", domain: "affinity.serif.com", category: "photo-editing",
    pricing: "ONE_TIME", company: "Serif",
    tagline: "Pro photo editing for a one-time price",
    description:
      "Affinity Photo delivers professional-grade photo editing — RAW development, layers, live filters, HDR — for a single one-time purchase. The best-known escape from subscription fatigue.",
    pros: ["One-time purchase", "Professional feature set", "Fast performance"],
    cons: ["Smaller plugin ecosystem", "No cloud sync", "Fewer tutorials than Photoshop"],
    bestFor: ["Photographers", "Subscription avoiders", "iPad editors"],
    platforms: ["windows", "macos", "ios"],
    scores: [85, 84, 78, 90], tags: ["photo-editing", "one-time-purchase"],
  },
  {
    slug: "whatsapp", name: "WhatsApp", domain: "whatsapp.com", category: "apps",
    pricing: "FREE", company: "Meta",
    tagline: "The world's most popular messaging app",
    description:
      "WhatsApp offers end-to-end encrypted messaging, voice and video calls, groups, channels and business tools to more than two billion users worldwide.",
    pros: ["Everyone is on it", "End-to-end encryption", "Free calls worldwide"],
    cons: ["Owned by Meta", "Metadata collection", "Backup encryption is opt-in"],
    bestFor: ["Staying in touch", "International calls", "Group chats"],
    platforms: ["ios", "android", "web", "windows", "macos"],
    scores: [82, 80, 99, 82], tags: ["messaging", "chat", "calls"],
  },
  {
    slug: "telegram", name: "Telegram", domain: "telegram.org", category: "apps",
    pricing: "FREEMIUM",
    tagline: "Fast, feature-rich messaging with huge groups and channels",
    description:
      "Telegram is a cloud-based messenger known for speed, 200k-member groups, channels, bots, and generous file sharing. Secret chats offer end-to-end encryption; regular chats sync instantly across devices.",
    pros: ["Feature-packed and fast", "Bots and channels", "Multi-device sync", "2GB+ file sharing"],
    cons: ["E2E encryption not default", "Public groups attract spam", "Premium pushes upsells"],
    bestFor: ["Communities", "Power users", "File sharing"],
    platforms: ["ios", "android", "web", "windows", "macos", "linux"],
    scores: [86, 84, 93, 80], tags: ["messaging", "chat", "communities"],
  },
  {
    slug: "signal", name: "Signal", domain: "signal.org", category: "apps",
    pricing: "FREE", openSource: true,
    tagline: "Private messaging, funded by a nonprofit — no ads, no trackers",
    description:
      "Signal is the gold standard for private messaging. Everything is end-to-end encrypted by default, the protocol is open source and independently audited, and the nonprofit behind it collects almost no metadata.",
    pros: ["Best-in-class privacy", "Open source & audited", "No ads or tracking"],
    cons: ["Smaller user base", "Fewer social features", "Phone number required"],
    bestFor: ["Privacy advocates", "Journalists", "Security-minded users"],
    platforms: ["ios", "android", "windows", "macos", "linux"],
    scores: [88, 86, 78, 97], tags: ["messaging", "privacy", "encryption", "open-source"],
  },
  {
    slug: "slack", name: "Slack", domain: "slack.com", category: "saas",
    pricing: "FREEMIUM", company: "Salesforce",
    tagline: "Where work conversations happen",
    description:
      "Slack organizes team communication into channels, with threads, huddles, workflow automation and thousands of integrations. The default chat layer for modern companies.",
    pros: ["Massive integration ecosystem", "Organized channels & threads", "Powerful search"],
    cons: ["Free plan hides history", "Can become a distraction", "Per-seat pricing adds up"],
    bestFor: ["Companies", "Remote teams", "Developer teams"],
    platforms: ["web", "windows", "macos", "linux", "ios", "android"],
    scores: [87, 86, 92, 90], tags: ["team-chat", "collaboration", "communication"],
  },
  {
    slug: "discord", name: "Discord", domain: "discord.com", category: "apps",
    pricing: "FREEMIUM",
    tagline: "Voice, video and text for communities and friends",
    description:
      "Discord started with gamers and became the home of online communities. Persistent voice channels, stage events, roles and bots make it ideal for any group that hangs out online.",
    pros: ["Excellent voice chat", "Free with generous limits", "Rich community tools"],
    cons: ["Not built for work compliance", "Moderation can be demanding", "Nitro upsells"],
    bestFor: ["Gaming groups", "Online communities", "Creator audiences"],
    platforms: ["web", "windows", "macos", "linux", "ios", "android"],
    scores: [85, 83, 94, 85], tags: ["voice-chat", "communities", "gaming"],
  },
  {
    slug: "zoom", name: "Zoom", domain: "zoom.us", category: "saas",
    pricing: "FREEMIUM",
    tagline: "Reliable video meetings that just work",
    description:
      "Zoom delivers dependable video conferencing with screen sharing, breakout rooms, webinars, and AI meeting summaries. The 40-minute free tier remains the easiest way to get everyone on a call.",
    pros: ["Rock-solid call quality", "Easy for guests to join", "Rich meeting features"],
    cons: ["40-min limit on free group calls", "Fatigue-inducing defaults", "Past security stumbles"],
    bestFor: ["Remote meetings", "Webinars", "Client calls"],
    platforms: ["web", "windows", "macos", "linux", "ios", "android"],
    scores: [84, 82, 91, 84], tags: ["video-calls", "meetings", "webinars"],
  },
  {
    slug: "1password", name: "1Password", domain: "1password.com", category: "security",
    pricing: "SUBSCRIPTION",
    tagline: "The password manager families and teams love",
    description:
      "1Password stores passwords, passkeys, cards and documents behind one master password and secret key. Watchtower alerts, travel mode and polished apps set the usability bar for password managers.",
    pros: ["Beautiful, polished apps", "Watchtower breach alerts", "Great family sharing"],
    cons: ["No free tier", "Subscription only", "Closed source"],
    bestFor: ["Families", "Teams", "Apple users"],
    platforms: ["windows", "macos", "linux", "ios", "android", "chrome", "firefox", "cli"],
    scores: [88, 87, 86, 93], tags: ["passwords", "security", "passkeys"],
  },
  {
    slug: "bitwarden", name: "Bitwarden", domain: "bitwarden.com", category: "security",
    pricing: "FREEMIUM", openSource: true,
    tagline: "Open-source password management for everyone",
    description:
      "Bitwarden is a fully open-source password manager with an unmatched free tier: unlimited passwords, unlimited devices, and even self-hosting. Premium adds TOTP, reports and emergency access for a few dollars a year.",
    pros: ["Truly unlimited free tier", "Open source & audited", "Self-hosting option", "Cheap premium"],
    cons: ["UI less polished than rivals", "Autofill occasionally misses", "Attachments need premium"],
    bestFor: ["Budget users", "Open-source fans", "Self-hosters"],
    platforms: ["windows", "macos", "linux", "ios", "android", "chrome", "firefox", "web", "cli", "self-hosted"],
    scores: [90, 88, 84, 96], tags: ["passwords", "security", "open-source", "self-hosted"],
  },
  {
    slug: "nordvpn", name: "NordVPN", domain: "nordvpn.com", category: "vpn",
    pricing: "SUBSCRIPTION",
    tagline: "Fast, audited VPN with servers in 100+ countries",
    description:
      "NordVPN combines WireGuard-based NordLynx speeds with independently audited no-logs policies, threat protection, and specialty servers. One of the most complete consumer VPNs.",
    pros: ["Excellent speeds", "Audited no-logs policy", "Large server network"],
    cons: ["Renewal prices jump", "No free tier", "Apps push upsells"],
    bestFor: ["Streaming", "Travel", "Everyday privacy"],
    platforms: ["windows", "macos", "linux", "ios", "android", "chrome", "firefox"],
    scores: [86, 84, 90, 86], tags: ["vpn", "privacy", "streaming"],
  },
  {
    slug: "protonvpn", name: "Proton VPN", domain: "protonvpn.com", category: "vpn",
    pricing: "FREEMIUM", company: "Proton", openSource: true,
    tagline: "The only free VPN with no logs, no ads and no data cap",
    description:
      "From the team behind Proton Mail, Proton VPN offers a genuinely trustworthy free tier — unlimited data, no ads — plus Swiss privacy law, open-source audited apps, and Secure Core routing on paid plans.",
    pros: ["Honest unlimited free tier", "Open source & audited", "Swiss privacy jurisdiction"],
    cons: ["Free tier has few locations", "Speeds vary on free servers", "Fewer streaming unblocks than rivals"],
    bestFor: ["Privacy-first users", "Free VPN seekers", "Journalists"],
    platforms: ["windows", "macos", "linux", "ios", "android"],
    scores: [87, 85, 82, 95], tags: ["vpn", "privacy", "open-source", "free"],
  },
  {
    slug: "vs-code", name: "Visual Studio Code", domain: "code.visualstudio.com", category: "coding",
    pricing: "FREE", company: "Microsoft", featured: true, openSource: true,
    tagline: "The code editor most developers call home",
    description:
      "VS Code is a free, extensible code editor with IntelliSense, debugging, Git integration, remote development and an extension for everything. With AI assistants built in, it remains the default choice for millions of developers.",
    pros: ["Free and cross-platform", "Massive extension marketplace", "Built-in Git & debugging", "AI pair-programming support"],
    cons: ["Electron memory footprint", "Config sprawl over time", "Telemetry by default"],
    bestFor: ["Web developers", "Beginners", "Polyglot programmers"],
    platforms: ["windows", "macos", "linux", "web"],
    scores: [94, 92, 97, 93], tags: ["editor", "ide", "coding", "open-source"],
  },
  {
    slug: "vercel", name: "Vercel", domain: "vercel.com", category: "hosting",
    pricing: "FREEMIUM",
    tagline: "Deploy frontend apps with zero configuration",
    description:
      "Vercel is the platform built by the creators of Next.js: git-push deployments, global edge network, preview URLs for every branch, serverless and edge functions, and first-class Next.js support.",
    pros: ["Instant preview deployments", "Best-in-class Next.js support", "Generous hobby tier"],
    cons: ["Costs scale quickly", "Vendor lock-in concerns", "Serverless limits on hobby"],
    bestFor: ["Frontend teams", "Next.js apps", "Side projects"],
    platforms: ["web", "cli"],
    scores: [90, 89, 89, 90], tags: ["hosting", "deployment", "serverless", "nextjs"],
  },
  {
    slug: "netlify", name: "Netlify", domain: "netlify.com", category: "hosting",
    pricing: "FREEMIUM",
    tagline: "The original git-based web deployment platform",
    description:
      "Netlify pioneered modern static hosting: continuous deployment from git, instant rollbacks, edge functions, forms and identity. A flexible choice for static sites and Jamstack apps of any framework.",
    pros: ["Framework-agnostic", "Forms & identity built in", "Simple, reliable workflow"],
    cons: ["Build minutes can run out", "Less Next.js-optimized than Vercel", "Add-ons increase cost"],
    bestFor: ["Static sites", "Jamstack apps", "Agencies"],
    platforms: ["web", "cli"],
    scores: [86, 84, 84, 89], tags: ["hosting", "deployment", "jamstack"],
  },
  {
    slug: "supabase", name: "Supabase", domain: "supabase.com", category: "database",
    pricing: "FREEMIUM", featured: true, openSource: true,
    tagline: "The open-source Firebase alternative built on Postgres",
    description:
      "Supabase gives you a full backend in minutes: hosted Postgres, instant APIs, authentication, storage, edge functions, realtime subscriptions and vector embeddings — all open source and self-hostable.",
    pros: ["Real Postgres, real SQL", "Open source & self-hostable", "Generous free tier", "Great DX"],
    cons: ["Fewer regions than big clouds", "Complex pricing at scale", "Some products still maturing"],
    bestFor: ["Indie hackers", "Startups", "Postgres lovers"],
    platforms: ["web", "cli", "api", "self-hosted"],
    scores: [91, 90, 87, 92], tags: ["database", "backend", "postgres", "open-source"],
  },
  {
    slug: "firebase", name: "Firebase", domain: "firebase.google.com", category: "database",
    pricing: "FREEMIUM", company: "Google",
    tagline: "Google's app development platform with realtime superpowers",
    description:
      "Firebase provides realtime databases, authentication, hosting, cloud functions, analytics and crash reporting — a mature, battle-tested backend platform tightly integrated with Google Cloud.",
    pros: ["Mature and battle-tested", "Excellent mobile SDKs", "Realtime out of the box"],
    cons: ["NoSQL modeling constraints", "Costs can spike unexpectedly", "Vendor lock-in"],
    bestFor: ["Mobile apps", "Realtime features", "Google Cloud users"],
    platforms: ["web", "ios", "android", "cli", "api"],
    scores: [87, 86, 90, 89], tags: ["database", "backend", "realtime", "google"],
  },
  {
    slug: "spotify", name: "Spotify", domain: "spotify.com", category: "streaming",
    pricing: "FREEMIUM",
    tagline: "Music and podcasts for every moment",
    description:
      "Spotify streams over 100 million tracks and millions of podcasts with best-in-class discovery: Discover Weekly, Blend, AI DJ and seamless playback across every device you own.",
    pros: ["Best music discovery", "Free ad-supported tier", "Works on everything"],
    cons: ["Artist payout criticism", "Lossless arrived late", "Podcast exclusives shifting"],
    bestFor: ["Music lovers", "Podcast listeners", "Playlist curators"],
    platforms: ["web", "windows", "macos", "linux", "ios", "android"],
    scores: [88, 85, 97, 88], tags: ["music", "streaming", "podcasts"],
  },
  {
    slug: "linear", name: "Linear", domain: "linear.app", category: "developer-tools",
    pricing: "FREEMIUM", featured: true,
    tagline: "Issue tracking so fast it feels native",
    description:
      "Linear is the project tool of choice for modern software teams: keyboard-first, beautifully designed, with cycles, roadmaps, triage and Git integrations that keep engineering work flowing.",
    pros: ["Blazing fast UI", "Opinionated, clean workflows", "Excellent keyboard support"],
    cons: ["Less flexible than Jira", "Reporting still growing", "Best for software teams only"],
    bestFor: ["Product engineering teams", "Startups", "Design-minded teams"],
    platforms: ["web", "windows", "macos"],
    scores: [90, 89, 85, 91], tags: ["issue-tracking", "project-management", "engineering"],
  },
  {
    slug: "zapier", name: "Zapier", domain: "zapier.com", category: "automation",
    pricing: "FREEMIUM",
    tagline: "Connect your apps and automate workflows without code",
    description:
      "Zapier links 7,000+ apps with trigger-action automations ('Zaps'), multi-step workflows, filters, and now AI steps — the easiest way to automate busywork between the tools you already use.",
    pros: ["Largest app catalog", "No code required", "AI-powered steps"],
    cons: ["Gets expensive at volume", "Complex logic is clunky", "Task limits on free plan"],
    bestFor: ["Ops teams", "Marketers", "Solo founders"],
    platforms: ["web"],
    scores: [87, 85, 88, 89], tags: ["automation", "integrations", "no-code"],
  },
  {
    slug: "n8n", name: "n8n", domain: "n8n.io", category: "automation",
    pricing: "FREEMIUM", openSource: true,
    tagline: "Source-available workflow automation you can self-host",
    description:
      "n8n is a node-based workflow automation platform with 400+ integrations, code steps when you need them, AI agent nodes, and the freedom to self-host with no per-task pricing.",
    pros: ["Self-hostable, no task limits", "Powerful branching logic", "AI agent workflows", "Fair-code license"],
    cons: ["Steeper learning curve", "Cloud plan costs add up", "Smaller integration catalog than Zapier"],
    bestFor: ["Developers", "Data-sensitive teams", "Automation power users"],
    platforms: ["web", "self-hosted", "cli"],
    scores: [88, 86, 80, 91], tags: ["automation", "self-hosted", "open-source", "workflows"],
  },
];

// Alternatives graph: [source, target, matchScore] — bidirectional edges created
const ALTERNATIVES: [string, string, number][] = [
  ["chatgpt", "claude", 95], ["chatgpt", "gemini", 92], ["chatgpt", "perplexity", 85],
  ["claude", "gemini", 88], ["claude", "perplexity", 82], ["gemini", "perplexity", 84],
  ["adobe-photoshop", "gimp", 88], ["adobe-photoshop", "affinity-photo", 92],
  ["adobe-photoshop", "canva", 75], ["gimp", "affinity-photo", 85],
  ["canva", "figma", 72],
  ["notion", "obsidian", 86], ["todoist", "trello", 78], ["notion", "trello", 74],
  ["whatsapp", "telegram", 93], ["whatsapp", "signal", 90], ["telegram", "signal", 88],
  ["slack", "discord", 84], ["zoom", "slack", 66],
  ["1password", "bitwarden", 94], ["nordvpn", "protonvpn", 91],
  ["vercel", "netlify", 93], ["supabase", "firebase", 94],
  ["zapier", "n8n", 92],
];

// Features for the AI comparison
const AI_FEATURES: [string, string][] = [
  ["api-access", "API Access"],
  ["voice-mode", "Voice Mode"],
  ["image-generation", "Image Generation"],
  ["coding-assistant", "Coding Assistant"],
  ["memory", "Memory"],
  ["web-search", "Web Search"],
];

const AI_TOOL_FEATURES: Record<string, [string, string | null][]> = {
  chatgpt: [
    ["api-access", "OpenAI API"], ["voice-mode", "Advanced voice"], ["image-generation", "GPT image gen"],
    ["coding-assistant", "Strong"], ["memory", "Cross-chat memory"], ["web-search", "Built-in"],
  ],
  claude: [
    ["api-access", "Anthropic API"], ["voice-mode", "Mobile voice"], ["coding-assistant", "Best-in-class"],
    ["memory", "Projects & memory"], ["web-search", "Built-in"],
  ],
  gemini: [
    ["api-access", "Gemini API"], ["voice-mode", "Gemini Live"], ["image-generation", "Imagen"],
    ["coding-assistant", "Good"], ["memory", "Saved info"], ["web-search", "Google Search"],
  ],
  perplexity: [
    ["api-access", "Sonar API"], ["voice-mode", "Voice search"], ["coding-assistant", "Basic"],
    ["web-search", "Core feature"],
  ],
};

async function main() {
  console.log("Seeding AlternativeHub...");

  // ── Users ──
  const adminHash = await hash("admin12345", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@alternativehub.in" },
    create: {
      email: "admin@alternativehub.in",
      name: "AlternativeHub Team",
      role: "ADMIN",
      passwordHash: adminHash,
      emailVerified: new Date(),
    },
    update: { role: "ADMIN" },
  });

  const demoUsers = [];
  for (const [email, name] of [
    ["maya@example.com", "Maya Chen"],
    ["arjun@example.com", "Arjun Patel"],
    ["sofia@example.com", "Sofia García"],
  ] as const) {
    demoUsers.push(
      await prisma.user.upsert({
        where: { email },
        create: { email, name, passwordHash: adminHash, emailVerified: new Date() },
        update: {},
      }),
    );
  }

  // ── Categories ──
  for (const [i, [slug, name, icon, color, description]] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug },
      create: { slug, name, icon, color, description, sortOrder: i },
      update: { icon, color, description, sortOrder: i },
    });
  }
  console.log(`✓ ${CATEGORIES.length} categories`);

  // ── Platforms ──
  for (const [slug, name] of PLATFORMS) {
    await prisma.platform.upsert({ where: { slug }, create: { slug, name }, update: {} });
  }

  // ── Features ──
  for (const [slug, name] of AI_FEATURES) {
    await prisma.feature.upsert({ where: { slug }, create: { slug, name }, update: {} });
  }

  // ── Tools ──
  for (const seed of TOOLS) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: seed.category } });

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
    const tool = await prisma.tool.upsert({
      where: { slug: seed.slug },
      create: {
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
      update: {
        tagline: seed.tagline,
        description: seed.description,
        pros: seed.pros,
        cons: seed.cons,
        bestFor: seed.bestFor,
      },
    });

    // Platforms
    for (const platformSlug of seed.platforms) {
      const platform = await prisma.platform.findUnique({ where: { slug: platformSlug } });
      if (!platform) continue;
      await prisma.toolPlatform.upsert({
        where: { toolId_platformId: { toolId: tool.id, platformId: platform.id } },
        create: { toolId: tool.id, platformId: platform.id },
        update: {},
      });
    }

    // Tags
    for (const tagName of seed.tags) {
      const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        create: { slug: tagSlug, name: tagName },
        update: {},
      });
      await prisma.toolTag.upsert({
        where: { toolId_tagId: { toolId: tool.id, tagId: tag.id } },
        create: { toolId: tool.id, tagId: tag.id },
        update: {},
      });
    }

    // AI tool features
    const featureRows = AI_TOOL_FEATURES[seed.slug];
    if (featureRows) {
      for (const [featureSlug, detail] of featureRows) {
        const feature = await prisma.feature.findUnique({ where: { slug: featureSlug } });
        if (!feature) continue;
        await prisma.toolFeature.upsert({
          where: { toolId_featureId: { toolId: tool.id, featureId: feature.id } },
          create: { toolId: tool.id, featureId: feature.id, detail },
          update: { detail },
        });
      }
    }
  }
  console.log(`✓ ${TOOLS.length} tools`);

  // ── Pricing plans for the AI flagship tools ──
  const PLANS: Record<string, [string, number, string, string[], boolean][]> = {
    chatgpt: [
      ["Free", 0, "month", ["Default model access", "Limited file uploads", "Standard voice"], false],
      ["Plus", 20, "month", ["Most advanced models", "Higher limits", "Advanced voice", "Custom GPTs"], true],
      ["Pro", 200, "month", ["Unlimited advanced usage", "Priority access", "Research previews"], false],
    ],
    claude: [
      ["Free", 0, "month", ["Daily message allowance", "Latest model access", "Projects"], false],
      ["Pro", 20, "month", ["5x more usage", "Claude Code access", "Extended thinking"], true],
      ["Max", 100, "month", ["20x more usage", "Priority at peak times", "Early features"], false],
    ],
    gemini: [
      ["Free", 0, "month", ["Fast model access", "Workspace basics"], false],
      ["Google AI Pro", 20, "month", ["Most capable models", "1M-token context", "2TB storage"], true],
    ],
    perplexity: [
      ["Free", 0, "month", ["Unlimited quick searches", "Limited Pro searches"], false],
      ["Pro", 20, "month", ["300+ Pro searches/day", "Model choice", "File analysis"], true],
    ],
  };
  for (const [slug, plans] of Object.entries(PLANS)) {
    const tool = await prisma.tool.findUnique({ where: { slug } });
    if (!tool) continue;
    await prisma.pricingPlan.deleteMany({ where: { toolId: tool.id } });
    for (const [i, [name, price, period, features, highlight]] of plans.entries()) {
      await prisma.pricingPlan.create({
        data: { toolId: tool.id, name, price, period, features, highlight, sortOrder: i },
      });
    }
  }

  // ── Alternatives graph (bidirectional) ──
  for (const [sourceSlug, targetSlug, matchScore] of ALTERNATIVES) {
    const source = await prisma.tool.findUnique({ where: { slug: sourceSlug } });
    const target = await prisma.tool.findUnique({ where: { slug: targetSlug } });
    if (!source || !target) continue;
    for (const [a, b] of [
      [source.id, target.id],
      [target.id, source.id],
    ]) {
      await prisma.alternative.upsert({
        where: { sourceToolId_targetToolId: { sourceToolId: a, targetToolId: b } },
        create: { sourceToolId: a, targetToolId: b, matchScore },
        update: { matchScore },
      });
    }
  }
  console.log(`✓ ${ALTERNATIVES.length * 2} alternative edges`);

  // ── Reviews ──
  const REVIEWS: [string, number, number, string, string][] = [
    ["claude", 0, 5, "My daily driver for coding", "Switched from other assistants six months ago. The code it writes needs far fewer corrections, and long-context work on big repos is genuinely useful."],
    ["claude", 1, 5, "Excellent for writing", "The tone control is remarkable. It actually pushes back when I'm wrong, which I appreciate."],
    ["chatgpt", 0, 4, "Still the most versatile", "Voice mode and custom GPTs keep me on it. Occasionally confidently wrong, so verify important answers."],
    ["chatgpt", 2, 5, "Can't imagine work without it", "From emails to brainstorming, it's open all day."],
    ["notion", 1, 5, "Our whole company runs on it", "Docs, wiki, projects, CRM — one tool replaced four. Databases take time to learn but pay off."],
    ["obsidian", 2, 5, "My second brain", "Local files mean I'll still have my notes in 20 years. The graph view is more than a gimmick."],
    ["bitwarden", 0, 5, "Best free password manager, period", "Unlimited devices on the free plan. Moved the whole family over from a paid rival."],
    ["figma", 1, 4, "Industry standard for a reason", "Multiplayer editing changed how our team designs. Heavy files can chug on older laptops."],
    ["supabase", 2, 5, "Firebase, but with real SQL", "Auth + Postgres + storage in an afternoon. The free tier is perfect for side projects."],
    ["signal", 1, 5, "Privacy without friction", "Finally convinced my family to switch. It just works, and nobody is mining our chats."],
  ];
  for (const [toolSlug, userIdx, rating, title, body] of REVIEWS) {
    const tool = await prisma.tool.findUnique({ where: { slug: toolSlug } });
    if (!tool) continue;
    const user = demoUsers[userIdx];
    await prisma.review.upsert({
      where: { toolId_userId: { toolId: tool.id, userId: user.id } },
      create: { toolId: tool.id, userId: user.id, rating, title, body, helpful: Math.floor(rating * 3) },
      update: { rating, title, body },
    });
  }
  // Recompute rating aggregates
  for (const slug of new Set(REVIEWS.map((r) => r[0]))) {
    const tool = await prisma.tool.findUnique({ where: { slug } });
    if (!tool) continue;
    const agg = await prisma.review.aggregate({
      where: { toolId: tool.id, approved: true },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.tool.update({
      where: { id: tool.id },
      data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
    });
  }
  // Give the rest a plausible baseline rating
  await prisma.tool.updateMany({
    where: { reviewCount: 0, status: "PUBLISHED" },
    data: { rating: 4.4, reviewCount: 0 },
  });
  console.log(`✓ ${REVIEWS.length} reviews`);

  // ── FAQs for flagship tools ──
  const FAQS: Record<string, [string, string][]> = {
    claude: [
      ["Is Claude free to use?", "Yes — Claude has a free tier with a daily message allowance. Pro ($20/month) unlocks roughly 5x more usage, Claude Code and extended thinking."],
      ["What is Claude best at?", "Claude is particularly strong at coding, long-document analysis and nuanced writing. Many developers consider it the best AI pair programmer available."],
      ["Does Claude have an API?", "Yes. The Anthropic API offers Claude models with generous context windows, tool use, and enterprise features."],
    ],
    chatgpt: [
      ["Is ChatGPT free?", "Yes — the free tier gives access to a capable default model with usage limits. Plus ($20/month) unlocks the most advanced models and features."],
      ["Can ChatGPT generate images?", "Yes, ChatGPT includes image generation on both free (limited) and paid tiers."],
      ["What are the best ChatGPT alternatives?", "The strongest alternatives are Claude (better for coding and long documents), Gemini (better Google integration) and Perplexity (better for cited research)."],
    ],
    notion: [
      ["Is Notion good for personal use?", "Yes — the free personal plan is generous, with unlimited pages and blocks for individuals."],
      ["What is the best Notion alternative?", "Obsidian is the top alternative for private, local-first notes; Trello or Linear fit better for pure project tracking."],
    ],
  };
  for (const [slug, faqs] of Object.entries(FAQS)) {
    const tool = await prisma.tool.findUnique({ where: { slug } });
    if (!tool) continue;
    await prisma.faq.deleteMany({ where: { toolId: tool.id } });
    for (const [i, [question, answer]] of faqs.entries()) {
      await prisma.faq.create({ data: { toolId: tool.id, question, answer, sortOrder: i } });
    }
  }

  // ── Flagship comparison ──
  const cmpSlugs = ["chatgpt", "claude", "gemini", "perplexity"];
  const cmpTools = await prisma.tool.findMany({ where: { slug: { in: cmpSlugs } } });
  if (cmpTools.length === 4) {
    const claude = cmpTools.find((t) => t.slug === "claude")!;
    const comparison = await prisma.comparison.upsert({
      where: { slug: "chatgpt-vs-claude-vs-gemini-vs-perplexity" },
      create: {
        slug: "chatgpt-vs-claude-vs-gemini-vs-perplexity",
        title: "ChatGPT vs Claude vs Gemini vs Perplexity: The Definitive AI Assistant Comparison",
        summary:
          "All four assistants are excellent, but they win in different lanes. ChatGPT is the best all-rounder with the richest feature set and ecosystem. Claude wins for coding, long documents and professional writing. Gemini is the obvious choice if you live in Google Workspace. Perplexity is unbeatable for research where every claim needs a citation. For most technical users, Claude edges ahead; for everyone else, start with ChatGPT's free tier.",
        winnerId: claude.id,
        featured: true,
        viewCount: 12840,
      },
      update: {},
    });
    for (const [i, slug] of cmpSlugs.entries()) {
      const tool = cmpTools.find((t) => t.slug === slug)!;
      await prisma.comparisonItem.upsert({
        where: { comparisonId_toolId: { comparisonId: comparison.id, toolId: tool.id } },
        create: { comparisonId: comparison.id, toolId: tool.id, sortOrder: i },
        update: { sortOrder: i },
      });
    }
    console.log("✓ flagship comparison");
  }

  // More stored comparisons for popular pairs
  for (const pair of [
    ["notion", "obsidian"],
    ["1password", "bitwarden"],
    ["vercel", "netlify"],
    ["supabase", "firebase"],
  ]) {
    const pairTools = await prisma.tool.findMany({ where: { slug: { in: pair } } });
    if (pairTools.length !== 2) continue;
    const [a, b] = pair.map((s) => pairTools.find((t) => t.slug === s)!);
    const slug = `${pair[0]}-vs-${pair[1]}`;
    const cmp = await prisma.comparison.upsert({
      where: { slug },
      create: {
        slug,
        title: `${a.name} vs ${b.name}: Which Should You Choose?`,
        summary: `${a.name} and ${b.name} solve the same problem with different philosophies. ${a.name}: ${a.tagline}. ${b.name}: ${b.tagline}. Check the table below to see which trade-offs fit you.`,
        viewCount: 3200,
      },
      update: {},
    });
    for (const [i, t] of [a, b].entries()) {
      await prisma.comparisonItem.upsert({
        where: { comparisonId_toolId: { comparisonId: cmp.id, toolId: t.id } },
        create: { comparisonId: cmp.id, toolId: t.id, sortOrder: i },
        update: {},
      });
    }
  }

  // ── Blog posts ──
  const POSTS: {
    slug: string; title: string; excerpt: string; category:
    "TOP_LISTS" | "COMPARISONS" | "BUYING_GUIDES"; content: string;
  }[] = [
    {
      slug: "best-chatgpt-alternatives",
      title: "The 7 Best ChatGPT Alternatives Worth Trying",
      excerpt:
        "ChatGPT is great — but depending on what you need, Claude, Gemini or Perplexity might serve you better. Here's how to pick.",
      category: "TOP_LISTS",
      content: `ChatGPT kicked off the AI assistant era, but the field has never been more competitive. Here are the alternatives that genuinely beat it in specific lanes.

## 1. Claude — best for coding and deep work
Anthropic's [Claude](/tools/claude) consistently tops developer preference surveys. Its long-context handling makes it the best choice for analyzing large documents and codebases, and its writing style is noticeably more natural.

## 2. Gemini — best for Google users
If your life runs on Gmail, Docs and Drive, [Gemini](/tools/gemini) integrates where you already work, and its multimodal abilities are excellent.

## 3. Perplexity — best for research
[Perplexity](/tools/perplexity) cites every claim with a link. For research, fact-checking and current events, it's the tool to beat.

## How to choose
- **Coding or long documents** → Claude
- **Google Workspace integration** → Gemini
- **Cited research** → Perplexity
- **All-round versatility and ecosystem** → ChatGPT

All four have free tiers — try two side by side on your real work for a week. See our full [comparison](/compare/chatgpt-vs-claude-vs-gemini-vs-perplexity) for the feature-by-feature table.`,
    },
    {
      slug: "notion-vs-obsidian-which-note-app",
      title: "Notion vs Obsidian: Which Note App Fits Your Brain?",
      excerpt:
        "Cloud collaboration or local-first privacy? Databases or backlinks? The real differences between the two biggest note apps.",
      category: "COMPARISONS",
      content: `Choosing between [Notion](/tools/notion) and [Obsidian](/tools/obsidian) is really choosing between two philosophies.

## Notion: the connected workspace
Notion shines when notes need to become *systems* — databases, kanban boards, shared wikis. Teams can collaborate in real time, and templates get you started fast.

## Obsidian: the private second brain
Obsidian stores plain Markdown files on your device. It's fast, works offline, and with backlinks and the graph view it rewards long-term knowledge building. A thousand community plugins add anything you miss.

## The verdict
- Pick **Notion** for team wikis, project tracking and structured databases.
- Pick **Obsidian** for personal knowledge, privacy and data ownership.

Many people happily use both: Obsidian for thinking, Notion for coordinating.`,
    },
    {
      slug: "free-open-source-alternatives-guide",
      title: "The Ultimate Guide to Free & Open-Source Alternatives",
      excerpt:
        "Stop paying for software you can replace: the best open-source alternatives to Photoshop, 1Password, Zapier, Firebase and more.",
      category: "BUYING_GUIDES",
      content: `Subscription fatigue is real. For almost every paid tool, a credible open-source alternative exists — here are the ones actually worth switching to.

## Design & photos
[GIMP](/tools/gimp) covers most Photoshop workflows for free. It won't win beauty contests, but the capability is there.

## Passwords
[Bitwarden](/tools/bitwarden) offers unlimited passwords on unlimited devices, free, with open-source code anyone can audit. The premium tier costs less than a coffee.

## Automation
[n8n](/tools/n8n) gives you Zapier-style workflows you can self-host with no per-task pricing.

## Backend
[Supabase](/tools/supabase) is the open-source Firebase alternative built on real Postgres — self-host it or use the generous cloud free tier.

## Messaging
[Signal](/tools/signal) proves private messaging can be free, open and easy enough for your family group chat.

**The pattern:** open-source tools trade a little polish for freedom, privacy and zero lock-in. For most people, that trade is worth it.`,
    },
  ];
  for (const post of POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: {
        ...post,
        authorId: admin.id,
        published: true,
        publishedAt: new Date(),
        seoTitle: post.title,
        seoDesc: post.excerpt,
        keywords: [],
        viewCount: 1500,
      },
      update: { content: post.content, excerpt: post.excerpt },
    });
  }
  console.log(`✓ ${POSTS.length} blog posts`);

  console.log("\nSeed complete 🎉");
  console.log("Admin login: admin@alternativehub.in / admin12345 (change in production!)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
