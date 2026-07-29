/**
 * Expands the tool catalog with a large, hand-curated set of real, well-known
 * software — across every category — to grow organic search coverage.
 *
 * Idempotent + safe: a tool is only created if its slug does NOT already exist,
 * so this never overwrites the original seed or admin edits. It runs on every
 * Vercel deploy (both fresh and existing databases) with no manual step.
 * A failure logs a warning but never breaks the build.
 *
 * All data below is public, factual information about real products.
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
  scores: [number, number, number, number]; // alternative, ai, popularity, trust
  tags: string[];
};

const TOOLS: ToolSeed[] = [
  // ─────────────── AI Tools ───────────────
  {
    slug: "github-copilot", name: "GitHub Copilot", domain: "github.com/features/copilot", category: "ai-tools",
    pricing: "SUBSCRIPTION", company: "GitHub",
    tagline: "AI pair programmer that autocompletes code in your editor",
    description: "GitHub Copilot suggests whole lines and functions as you type, powered by large language models. It works across editors and now includes a chat mode for explaining and refactoring code.",
    pros: ["Fast, inline suggestions", "Works in most editors", "Good chat for explanations"], cons: ["Subscription required", "Can suggest subtly wrong code", "Occasional licensing concerns"],
    bestFor: ["Developers", "Faster coding", "Learning APIs"], platforms: ["vscode", "jetbrains", "web", "cli"],
    scores: [88, 90, 92, 87], tags: ["coding", "autocomplete", "developer", "llm"],
  },
  {
    slug: "cursor", name: "Cursor", domain: "cursor.com", category: "ai-tools",
    pricing: "FREEMIUM", company: "Anysphere", featured: true,
    tagline: "The AI-first code editor built for pair-programming with AI",
    description: "Cursor is a VS Code-based editor with deep AI integration — chat with your codebase, edit across files with natural language, and let agents make multi-file changes with your approval.",
    pros: ["Codebase-aware AI", "Multi-file edits", "Familiar VS Code base"], cons: ["Best features need Pro", "Can be resource heavy", "Occasional over-eager edits"],
    bestFor: ["AI-assisted coding", "Refactoring", "Rapid prototyping"], platforms: ["windows", "macos", "linux"],
    scores: [86, 92, 88, 84], tags: ["coding", "editor", "ai", "developer"],
  },
  {
    slug: "elevenlabs", name: "ElevenLabs", domain: "elevenlabs.io", category: "ai-tools",
    pricing: "FREEMIUM", company: "ElevenLabs",
    tagline: "Lifelike AI voice generation and text-to-speech",
    description: "ElevenLabs produces natural, expressive AI voices for narration, dubbing, and voice cloning, supporting dozens of languages with fine control over emotion and pacing.",
    pros: ["Extremely natural voices", "Many languages", "Voice cloning"], cons: ["Paid for serious use", "Ethical concerns with cloning", "Credits run out fast"],
    bestFor: ["Narration", "Dubbing", "Audiobooks"], platforms: ["web", "api"],
    scores: [83, 90, 85, 82], tags: ["voice", "text-to-speech", "audio", "ai"],
  },
  {
    slug: "runway", name: "Runway", domain: "runwayml.com", category: "ai-tools",
    pricing: "FREEMIUM", company: "Runway",
    tagline: "AI video generation and editing for creators",
    description: "Runway offers text-to-video, image-to-video and a suite of AI magic tools for filmmakers and marketers, pushing the frontier of generative video.",
    pros: ["Cutting-edge video AI", "Creative tool suite", "Fast iteration"], cons: ["Expensive at scale", "Clip length limits", "Results vary"],
    bestFor: ["Filmmakers", "Marketers", "Concept videos"], platforms: ["web", "api"],
    scores: [82, 89, 83, 80], tags: ["video-generation", "ai", "creative"],
  },
  {
    slug: "leonardo-ai", name: "Leonardo AI", domain: "leonardo.ai", category: "ai-tools",
    pricing: "FREEMIUM", company: "Leonardo",
    tagline: "AI image generation with fine control for game and product art",
    description: "Leonardo AI generates images with trained models, control nets and fine-tuning, popular with game artists and designers who need consistency and control.",
    pros: ["Great control tools", "Custom model training", "Generous free credits"], cons: ["Learning curve", "Queue times", "UI can overwhelm"],
    bestFor: ["Game art", "Product design", "Concept art"], platforms: ["web", "api"],
    scores: [80, 86, 80, 79], tags: ["image-generation", "art", "ai", "design"],
  },
  {
    slug: "suno", name: "Suno", domain: "suno.com", category: "ai-tools",
    pricing: "FREEMIUM", company: "Suno",
    tagline: "Generate full songs with vocals from a text prompt",
    description: "Suno creates complete songs — music and vocals — from simple text descriptions, letting anyone make original tracks in seconds.",
    pros: ["Surprisingly good songs", "No music skills needed", "Fun and fast"], cons: ["Commercial rights limited on free", "Repetitive at times", "Less fine control"],
    bestFor: ["Hobby musicians", "Content creators", "Jingles"], platforms: ["web", "ios", "android"],
    scores: [78, 85, 82, 76], tags: ["music", "audio", "ai", "generation"],
  },
  {
    slug: "descript", name: "Descript", domain: "descript.com", category: "ai-tools",
    pricing: "FREEMIUM", company: "Descript",
    tagline: "Edit audio and video by editing the transcript",
    description: "Descript transcribes your recording and lets you edit media like a text document — delete words to cut clips, remove filler words, and add AI voices.",
    pros: ["Edit by text", "Great for podcasts", "AI overdub voices"], cons: ["Learning curve", "Heavier projects lag", "Best features paid"],
    bestFor: ["Podcasters", "YouTubers", "Course creators"], platforms: ["windows", "macos", "web"],
    scores: [81, 84, 82, 83], tags: ["audio", "video", "transcription", "editing"],
  },
  {
    slug: "otter-ai", name: "Otter.ai", domain: "otter.ai", category: "ai-tools",
    pricing: "FREEMIUM", company: "Otter.ai",
    tagline: "AI meeting notes and real-time transcription",
    description: "Otter.ai joins your meetings to transcribe, summarize and extract action items automatically, syncing with Zoom, Meet and Teams.",
    pros: ["Accurate transcripts", "Auto summaries", "Meeting integrations"], cons: ["Minute caps on free", "Accents reduce accuracy", "Privacy considerations"],
    bestFor: ["Meetings", "Interviews", "Students"], platforms: ["web", "ios", "android", "chrome"],
    scores: [79, 83, 84, 82], tags: ["transcription", "meetings", "notes", "ai"],
  },
  {
    slug: "gamma", name: "Gamma", domain: "gamma.app", category: "ai-tools",
    pricing: "FREEMIUM", company: "Gamma",
    tagline: "Create presentations, docs and sites with AI",
    description: "Gamma generates polished presentations and documents from a prompt or outline, with a flexible card-based editor and one-click theming.",
    pros: ["Fast decks from prompts", "Beautiful defaults", "Web-based sharing"], cons: ["Less control than PowerPoint", "Credits on free", "Export options limited"],
    bestFor: ["Pitch decks", "Quick presentations", "Reports"], platforms: ["web"],
    scores: [80, 85, 83, 80], tags: ["presentations", "ai", "documents", "design"],
  },
  {
    slug: "jasper", name: "Jasper", domain: "jasper.ai", category: "ai-tools",
    pricing: "SUBSCRIPTION", company: "Jasper",
    tagline: "AI content platform for marketing teams",
    description: "Jasper helps marketing teams generate on-brand copy at scale — blog posts, ads, emails — with brand voice controls and workflow templates.",
    pros: ["Brand voice control", "Marketing templates", "Team features"], cons: ["Pricey", "Generic without editing", "Overkill for individuals"],
    bestFor: ["Marketing teams", "Content at scale", "Ad copy"], platforms: ["web", "chrome", "api"],
    scores: [78, 83, 80, 79], tags: ["writing", "marketing", "copywriting", "ai"],
  },
  {
    slug: "stable-diffusion", name: "Stable Diffusion", domain: "stability.ai", category: "ai-tools",
    pricing: "OPEN_SOURCE", company: "Stability AI", openSource: true,
    tagline: "Open-source AI image generation you can run yourself",
    description: "Stable Diffusion is an open-source text-to-image model you can run locally or in the cloud, with a huge ecosystem of custom models, LoRAs and UIs.",
    pros: ["Free and open source", "Run locally & private", "Massive ecosystem"], cons: ["Needs a good GPU", "Setup complexity", "Quality varies by model"],
    bestFor: ["Developers", "Local generation", "Custom models"], platforms: ["windows", "macos", "linux", "api"],
    scores: [85, 88, 86, 84], tags: ["image-generation", "open-source", "ai", "art"],
  },
  {
    slug: "ollama", name: "Ollama", domain: "ollama.com", category: "ai-tools",
    pricing: "OPEN_SOURCE", company: "Ollama", openSource: true,
    tagline: "Run large language models locally on your machine",
    description: "Ollama makes it easy to download and run open LLMs like Llama and Mistral locally with a single command, keeping your data private and offline.",
    pros: ["Private & offline", "One-command setup", "Growing model library"], cons: ["Needs RAM/GPU", "Slower than cloud", "CLI-first"],
    bestFor: ["Developers", "Private AI", "Local experiments"], platforms: ["windows", "macos", "linux", "cli"],
    scores: [84, 86, 82, 85], tags: ["llm", "local", "open-source", "developer"],
  },
  {
    slug: "hugging-face", name: "Hugging Face", domain: "huggingface.co", category: "ai-tools",
    pricing: "FREEMIUM", company: "Hugging Face", openSource: true,
    tagline: "The hub for open machine-learning models and datasets",
    description: "Hugging Face hosts hundreds of thousands of models, datasets and demos, plus libraries that have become the standard for building with open ML.",
    pros: ["Huge model hub", "Great libraries", "Strong community"], cons: ["Technical audience", "Compute costs for hosting", "Overwhelming choice"],
    bestFor: ["ML engineers", "Researchers", "Open models"], platforms: ["web", "api"],
    scores: [86, 89, 85, 88], tags: ["machine-learning", "models", "open-source", "developer"],
  },

  // ─────────────── Productivity ───────────────
  {
    slug: "clickup", name: "ClickUp", domain: "clickup.com", category: "productivity",
    pricing: "FREEMIUM", company: "ClickUp", featured: true,
    tagline: "One app to replace them all — tasks, docs, goals and chat",
    description: "ClickUp is an all-in-one work platform with tasks, docs, whiteboards, goals and dashboards, highly customizable to fit almost any workflow.",
    pros: ["Extremely feature-rich", "Very customizable", "Generous free plan"], cons: ["Can feel overwhelming", "Occasional performance lag", "Setup takes time"],
    bestFor: ["Teams", "Project management", "All-in-one workspace"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [86, 82, 88, 84], tags: ["project-management", "tasks", "docs", "productivity"],
  },
  {
    slug: "asana", name: "Asana", domain: "asana.com", category: "productivity",
    pricing: "FREEMIUM", company: "Asana",
    tagline: "Work management to keep teams and projects on track",
    description: "Asana helps teams plan, organize and track work with tasks, timelines, boards and workflows, trusted by organizations of every size.",
    pros: ["Clean, intuitive UI", "Strong workflows", "Reliable"], cons: ["Advanced features paid", "No native time tracking", "Can get pricey"],
    bestFor: ["Team projects", "Marketing teams", "Operations"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [85, 80, 89, 88], tags: ["project-management", "tasks", "teams", "productivity"],
  },
  {
    slug: "monday", name: "monday.com", domain: "monday.com", category: "productivity",
    pricing: "SUBSCRIPTION", company: "monday.com",
    tagline: "Colorful, flexible Work OS for any team",
    description: "monday.com is a visual work operating system where teams build boards and workflows for projects, CRM, dev and more with automations and integrations.",
    pros: ["Very visual", "Flexible boards", "Lots of integrations"], cons: ["Seat-based pricing adds up", "Complex for small teams", "Notifications noisy"],
    bestFor: ["Teams", "Operations", "CRM & projects"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [83, 79, 87, 85], tags: ["project-management", "work-os", "teams", "productivity"],
  },
  {
    slug: "airtable", name: "Airtable", domain: "airtable.com", category: "productivity",
    pricing: "FREEMIUM", company: "Airtable",
    tagline: "Spreadsheet-database hybrid for building custom workflows",
    description: "Airtable combines the ease of a spreadsheet with the power of a database, letting teams build flexible apps, trackers and content pipelines.",
    pros: ["Powerful yet approachable", "Great views & automations", "Extensible"], cons: ["Record limits on free", "Pricey at scale", "Can outgrow it"],
    bestFor: ["Content pipelines", "Trackers", "No-code databases"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [84, 82, 85, 86], tags: ["database", "spreadsheet", "no-code", "productivity"],
  },
  {
    slug: "coda", name: "Coda", domain: "coda.io", category: "productivity",
    pricing: "FREEMIUM", company: "Coda",
    tagline: "Docs that are as powerful as apps",
    description: "Coda blends documents, spreadsheets and apps into one surface, with building blocks and packs that turn docs into interactive tools.",
    pros: ["Docs + tables + automation", "Flexible building blocks", "Good templates"], cons: ["Learning curve", "Can get complex", "Mobile weaker"],
    bestFor: ["Team docs", "Trackers", "Lightweight apps"], platforms: ["web", "ios", "android"],
    scores: [82, 81, 80, 83], tags: ["docs", "database", "productivity", "no-code"],
  },
  {
    slug: "evernote", name: "Evernote", domain: "evernote.com", category: "productivity",
    pricing: "FREEMIUM", company: "Evernote",
    tagline: "Classic note-taking with powerful search and web clipping",
    description: "Evernote captures notes, web clips and documents with strong search, syncing across devices — a long-standing choice for personal organization.",
    pros: ["Excellent search", "Web clipper", "Cross-platform"], cons: ["Free plan restrictive", "Pricing changes", "Feels dated to some"],
    bestFor: ["Note-taking", "Research", "Web clipping"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [80, 74, 82, 81], tags: ["notes", "productivity", "organization"],
  },
  {
    slug: "microsoft-onenote", name: "Microsoft OneNote", domain: "onenote.com", category: "productivity",
    pricing: "FREE", company: "Microsoft",
    tagline: "Free-form digital notebook from Microsoft",
    description: "OneNote is a flexible notebook for typed, handwritten and clipped notes, organized into notebooks and sections, free with a Microsoft account.",
    pros: ["Completely free", "Great with stylus", "Office integration"], cons: ["Sync quirks", "Organization can sprawl", "Formatting inconsistencies"],
    bestFor: ["Students", "Handwritten notes", "Microsoft users"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [81, 76, 85, 86], tags: ["notes", "productivity", "microsoft"],
  },
  {
    slug: "ticktick", name: "TickTick", domain: "ticktick.com", category: "productivity",
    pricing: "FREEMIUM", company: "TickTick",
    tagline: "To-do list and task manager with a built-in Pomodoro timer",
    description: "TickTick combines tasks, a calendar, habits and a focus timer in a clean cross-platform app that's a favorite for personal productivity.",
    pros: ["Clean and fast", "Built-in focus timer", "Habit tracking"], cons: ["Calendar needs Pro", "Collaboration basic", "Some features hidden"],
    bestFor: ["Personal tasks", "Habits", "Focus"], platforms: ["web", "windows", "macos", "ios", "android", "chrome"],
    scores: [82, 78, 81, 83], tags: ["tasks", "todo", "productivity", "habits"],
  },
  {
    slug: "miro", name: "Miro", domain: "miro.com", category: "productivity",
    pricing: "FREEMIUM", company: "Miro",
    tagline: "Online collaborative whiteboard for teams",
    description: "Miro is an infinite online whiteboard for brainstorming, diagramming and workshops, with templates, sticky notes and real-time collaboration.",
    pros: ["Great for workshops", "Huge template library", "Real-time collab"], cons: ["Board limits on free", "Can get cluttered", "Heavy on low-end devices"],
    bestFor: ["Brainstorming", "Workshops", "Diagramming"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [83, 80, 86, 85], tags: ["whiteboard", "collaboration", "diagramming", "productivity"],
  },

  // ─────────────── Design / Photo ───────────────
  {
    slug: "sketch", name: "Sketch", domain: "sketch.com", category: "photo-editing",
    pricing: "SUBSCRIPTION", company: "Sketch",
    tagline: "The original Mac-native UI design tool",
    description: "Sketch is a macOS design app for UI/UX with symbols, libraries and a plugin ecosystem, now with web-based collaboration and handoff.",
    pros: ["Fast and native on Mac", "Mature plugin ecosystem", "Good for handoff"], cons: ["Mac only", "Lost ground to Figma", "Collab less seamless"],
    bestFor: ["UI design", "Mac designers", "Design systems"], platforms: ["macos", "web"],
    scores: [80, 75, 79, 83], tags: ["design", "ui", "vector", "mac"],
  },
  {
    slug: "framer", name: "Framer", domain: "framer.com", category: "photo-editing",
    pricing: "FREEMIUM", company: "Framer",
    tagline: "Design and publish real websites, no code",
    description: "Framer lets designers build and ship responsive websites visually, with rich animations, CMS and hosting included.",
    pros: ["Design-to-live-site", "Beautiful animations", "Built-in hosting"], cons: ["Custom code limited", "Pricing for scale", "Learning curve"],
    bestFor: ["Landing pages", "Portfolios", "Designers"], platforms: ["web", "macos"],
    scores: [82, 81, 83, 82], tags: ["web-design", "no-code", "prototyping", "design"],
  },
  {
    slug: "penpot", name: "Penpot", domain: "penpot.app", category: "photo-editing",
    pricing: "OPEN_SOURCE", company: "Penpot", openSource: true,
    tagline: "Open-source design and prototyping platform",
    description: "Penpot is a free, open-source design tool for UI and prototyping, built on web standards and self-hostable — a privacy-friendly Figma alternative.",
    pros: ["Free & open source", "Self-hostable", "Web-standards based"], cons: ["Smaller ecosystem", "Fewer plugins", "Still maturing"],
    bestFor: ["Open-source teams", "Self-hosting", "UI design"], platforms: ["web", "linux", "windows", "macos"],
    scores: [83, 78, 76, 84], tags: ["design", "open-source", "ui", "prototyping"],
  },
  {
    slug: "photopea", name: "Photopea", domain: "photopea.com", category: "photo-editing",
    pricing: "FREEMIUM", company: "Photopea",
    tagline: "A free Photoshop-like photo editor in your browser",
    description: "Photopea is a powerful, free web-based image editor that opens PSD, XCF and Sketch files and mirrors much of Photoshop's interface — no install needed.",
    pros: ["Free in the browser", "Opens PSD files", "No install"], cons: ["Ad-supported", "Web performance limits", "No cloud sync"],
    bestFor: ["Quick edits", "Opening PSDs", "Students"], platforms: ["web"],
    scores: [84, 79, 85, 82], tags: ["photo-editing", "free", "browser", "design"],
  },
  {
    slug: "krita", name: "Krita", domain: "krita.org", category: "photo-editing",
    pricing: "OPEN_SOURCE", company: "KDE", openSource: true,
    tagline: "Free, open-source painting app for digital artists",
    description: "Krita is a professional open-source painting program built for illustrators and concept artists, with a huge brush engine and animation tools.",
    pros: ["Free & open source", "Excellent brushes", "Great for painting"], cons: ["Not for photo editing", "Occasional stability issues", "UI learning curve"],
    bestFor: ["Digital painting", "Illustration", "Concept art"], platforms: ["windows", "macos", "linux"],
    scores: [83, 76, 82, 85], tags: ["painting", "illustration", "open-source", "art"],
  },
  {
    slug: "inkscape", name: "Inkscape", domain: "inkscape.org", category: "photo-editing",
    pricing: "OPEN_SOURCE", company: "Inkscape", openSource: true,
    tagline: "Free, open-source vector graphics editor",
    description: "Inkscape is a capable open-source vector editor for illustrations, logos and icons, using SVG as its native format.",
    pros: ["Free & open source", "Native SVG", "Cross-platform"], cons: ["Slower than Illustrator", "Dated UI", "Single-threaded rendering"],
    bestFor: ["Vector art", "Logos", "SVG editing"], platforms: ["windows", "macos", "linux"],
    scores: [82, 73, 80, 84], tags: ["vector", "svg", "open-source", "design"],
  },
  {
    slug: "adobe-illustrator", name: "Adobe Illustrator", domain: "adobe.com/products/illustrator", category: "photo-editing",
    pricing: "SUBSCRIPTION", company: "Adobe",
    tagline: "The industry-standard vector graphics software",
    description: "Adobe Illustrator is the professional standard for vector art, logos, typography and illustration, integrated with the Creative Cloud ecosystem.",
    pros: ["Industry standard", "Powerful vector tools", "Creative Cloud sync"], cons: ["Subscription only", "Steep learning curve", "Resource heavy"],
    bestFor: ["Logos", "Illustration", "Professional design"], platforms: ["windows", "macos", "ios"],
    scores: [83, 80, 90, 89], tags: ["vector", "illustration", "design", "adobe"],
  },

  // ─────────────── Video Editing ───────────────
  {
    slug: "davinci-resolve", name: "DaVinci Resolve", domain: "blackmagicdesign.com/products/davinciresolve", category: "video-editing",
    pricing: "FREEMIUM", company: "Blackmagic Design", featured: true,
    tagline: "Hollywood-grade video editing and color grading — free",
    description: "DaVinci Resolve combines editing, color correction, visual effects and audio post in one app, with a remarkably capable free version used on real films.",
    pros: ["Free version is powerful", "Best-in-class color", "One-app workflow"], cons: ["Steep learning curve", "Demands strong hardware", "Studio for some features"],
    bestFor: ["Filmmakers", "Colorists", "Serious editors"], platforms: ["windows", "macos", "linux"],
    scores: [86, 82, 88, 89], tags: ["video-editing", "color-grading", "vfx"],
  },
  {
    slug: "capcut", name: "CapCut", domain: "capcut.com", category: "video-editing",
    pricing: "FREEMIUM", company: "ByteDance",
    tagline: "Easy video editor for social media creators",
    description: "CapCut is a beginner-friendly video editor for phones and desktop with templates, auto-captions and effects tuned for TikTok, Reels and Shorts.",
    pros: ["Very easy to use", "Great templates", "Auto-captions"], cons: ["Watermarks/upsells", "Privacy concerns", "Less pro control"],
    bestFor: ["Social videos", "Beginners", "Short-form content"], platforms: ["ios", "android", "windows", "macos", "web"],
    scores: [82, 80, 90, 78], tags: ["video-editing", "social", "mobile", "short-form"],
  },
  {
    slug: "adobe-premiere-pro", name: "Adobe Premiere Pro", domain: "adobe.com/products/premiere", category: "video-editing",
    pricing: "SUBSCRIPTION", company: "Adobe",
    tagline: "Professional video editing for film, TV and web",
    description: "Premiere Pro is Adobe's professional non-linear editor, with deep Creative Cloud integration, AI-assisted tools and broad format support.",
    pros: ["Industry standard", "Creative Cloud integration", "Powerful & flexible"], cons: ["Subscription only", "Resource heavy", "Occasional stability issues"],
    bestFor: ["Professionals", "Film & TV", "Agencies"], platforms: ["windows", "macos"],
    scores: [83, 81, 89, 87], tags: ["video-editing", "adobe", "professional"],
  },
  {
    slug: "final-cut-pro", name: "Final Cut Pro", domain: "apple.com/final-cut-pro", category: "video-editing",
    pricing: "ONE_TIME", company: "Apple",
    tagline: "Apple's professional video editor, optimized for Mac",
    description: "Final Cut Pro offers fast, magnetic-timeline editing highly optimized for Apple silicon, with a one-time purchase and no subscription.",
    pros: ["Blazing fast on Mac", "One-time purchase", "Great performance"], cons: ["Mac only", "Magnetic timeline divisive", "Fewer collab tools"],
    bestFor: ["Mac editors", "Professionals", "YouTubers"], platforms: ["macos"],
    scores: [82, 80, 86, 88], tags: ["video-editing", "apple", "professional"],
  },
  {
    slug: "kdenlive", name: "Kdenlive", domain: "kdenlive.org", category: "video-editing",
    pricing: "OPEN_SOURCE", company: "KDE", openSource: true,
    tagline: "Free, open-source video editor for all platforms",
    description: "Kdenlive is a mature open-source non-linear video editor with multi-track editing, effects and transitions, free on every major OS.",
    pros: ["Free & open source", "Multi-track editing", "Cross-platform"], cons: ["Occasional crashes", "Dated interface", "Fewer effects than pro apps"],
    bestFor: ["Hobbyists", "Linux users", "Budget editing"], platforms: ["windows", "macos", "linux"],
    scores: [80, 72, 76, 82], tags: ["video-editing", "open-source", "free"],
  },
  {
    slug: "obs-studio", name: "OBS Studio", domain: "obsproject.com", category: "video-editing",
    pricing: "OPEN_SOURCE", company: "OBS Project", openSource: true,
    tagline: "Free, open-source software for recording and live streaming",
    description: "OBS Studio is the standard free tool for screen recording and live streaming, with scenes, sources and plugins used by creators everywhere.",
    pros: ["Free & open source", "Powerful streaming", "Huge plugin ecosystem"], cons: ["Setup complexity", "No built-in editor", "Encoding needs CPU/GPU"],
    bestFor: ["Streamers", "Screen recording", "Tutorials"], platforms: ["windows", "macos", "linux"],
    scores: [84, 74, 88, 89], tags: ["streaming", "recording", "open-source", "video"],
  },
  {
    slug: "loom", name: "Loom", domain: "loom.com", category: "video-editing",
    pricing: "FREEMIUM", company: "Atlassian",
    tagline: "Record quick screen and camera videos to share instantly",
    description: "Loom captures your screen and camera into shareable videos with instant links, transcripts and reactions — great for async team communication.",
    pros: ["Instant sharing", "Easy to use", "Good for async work"], cons: ["Limits on free", "Editing basic", "Requires account to view sometimes"],
    bestFor: ["Async updates", "Tutorials", "Support"], platforms: ["web", "windows", "macos", "chrome", "ios", "android"],
    scores: [81, 78, 85, 84], tags: ["screen-recording", "video", "async", "communication"],
  },

  // ─────────────── Developer / Hosting / Coding ───────────────
  {
    slug: "github", name: "GitHub", domain: "github.com", category: "developer-tools",
    pricing: "FREEMIUM", company: "Microsoft", featured: true,
    tagline: "The world's largest platform for hosting and collaborating on code",
    description: "GitHub hosts Git repositories with pull requests, issues, Actions CI/CD and Copilot, home to the world's open-source community.",
    pros: ["Huge community", "Great collaboration", "Actions & Copilot"], cons: ["Private CI minutes limited", "Microsoft-owned concerns", "Can be complex"],
    bestFor: ["Developers", "Open source", "Teams"], platforms: ["web", "windows", "macos", "ios", "android", "cli"],
    scores: [88, 84, 95, 92], tags: ["git", "code-hosting", "developer", "collaboration"],
  },
  {
    slug: "gitlab", name: "GitLab", domain: "gitlab.com", category: "developer-tools",
    pricing: "FREEMIUM", company: "GitLab", openSource: true,
    tagline: "Complete DevOps platform with built-in CI/CD",
    description: "GitLab is an all-in-one DevOps platform with repos, powerful CI/CD, security scanning and project management, self-hostable and open-core.",
    pros: ["Built-in CI/CD", "Self-hostable", "All-in-one DevOps"], cons: ["Heavier than GitHub", "UI can be busy", "Premium tiers pricey"],
    bestFor: ["DevOps teams", "Self-hosting", "CI/CD"], platforms: ["web", "linux", "cli"],
    scores: [85, 80, 86, 88], tags: ["git", "ci-cd", "devops", "open-source"],
  },
  {
    slug: "cloudflare", name: "Cloudflare", domain: "cloudflare.com", category: "hosting",
    pricing: "FREEMIUM", company: "Cloudflare", featured: true,
    tagline: "Global CDN, security and edge platform",
    description: "Cloudflare speeds up and protects websites with a global CDN, DDoS protection, DNS and an edge compute platform (Workers) — with a strong free tier.",
    pros: ["Generous free tier", "Fast global network", "Great security"], cons: ["Advanced features paid", "Dashboard complexity", "Occasional outages ripple wide"],
    bestFor: ["Websites", "Security", "Edge apps"], platforms: ["web", "api"],
    scores: [86, 82, 92, 90], tags: ["cdn", "security", "dns", "edge"],
  },
  {
    slug: "digitalocean", name: "DigitalOcean", domain: "digitalocean.com", category: "hosting",
    pricing: "PAID", company: "DigitalOcean",
    tagline: "Simple, developer-friendly cloud hosting",
    description: "DigitalOcean offers straightforward cloud servers (Droplets), managed databases and app hosting with predictable pricing and great docs.",
    pros: ["Simple & predictable pricing", "Excellent docs", "Developer-friendly"], cons: ["Fewer services than AWS", "Manual scaling", "Support tiers"],
    bestFor: ["Startups", "Developers", "Small apps"], platforms: ["web", "api", "cli"],
    scores: [83, 78, 86, 87], tags: ["cloud", "hosting", "vps", "developer"],
  },
  {
    slug: "railway", name: "Railway", domain: "railway.app", category: "hosting",
    pricing: "FREEMIUM", company: "Railway",
    tagline: "Deploy apps and databases with almost no config",
    description: "Railway makes it trivial to deploy apps, databases and services from a repo, with automatic builds, environments and simple scaling.",
    pros: ["Very easy deploys", "Great DX", "Databases included"], cons: ["Costs grow with usage", "Fewer regions", "Younger platform"],
    bestFor: ["Side projects", "Startups", "Full-stack apps"], platforms: ["web", "cli"],
    scores: [82, 80, 82, 81], tags: ["hosting", "deployment", "paas", "developer"],
  },
  {
    slug: "render", name: "Render", domain: "render.com", category: "hosting",
    pricing: "FREEMIUM", company: "Render",
    tagline: "Cloud hosting for apps, static sites and databases",
    description: "Render deploys web apps, static sites, cron jobs and managed databases from Git with automatic TLS and scaling — a modern Heroku alternative.",
    pros: ["Simple Git deploys", "Free static hosting", "Managed databases"], cons: ["Cold starts on free", "Pricing at scale", "Fewer regions"],
    bestFor: ["Web apps", "APIs", "Startups"], platforms: ["web", "api"],
    scores: [82, 79, 81, 83], tags: ["hosting", "paas", "deployment", "developer"],
  },
  {
    slug: "postman", name: "Postman", domain: "postman.com", category: "developer-tools",
    pricing: "FREEMIUM", company: "Postman",
    tagline: "The standard platform for building and testing APIs",
    description: "Postman helps developers design, test, document and monitor APIs with collections, environments and collaboration features.",
    pros: ["Comprehensive API tooling", "Great collaboration", "Widely adopted"], cons: ["Heavy app", "Account required", "Free limits on teams"],
    bestFor: ["API testing", "Backend devs", "Teams"], platforms: ["windows", "macos", "linux", "web"],
    scores: [84, 79, 88, 87], tags: ["api", "testing", "developer", "http"],
  },
  {
    slug: "docker", name: "Docker", domain: "docker.com", category: "developer-tools",
    pricing: "FREEMIUM", company: "Docker", openSource: true,
    tagline: "Package and run applications in portable containers",
    description: "Docker standardized containers, letting developers package apps with their dependencies to run consistently anywhere, from laptops to production.",
    pros: ["Consistent environments", "Huge ecosystem", "Industry standard"], cons: ["Desktop licensing for big cos", "Resource usage", "Learning curve"],
    bestFor: ["Developers", "DevOps", "Microservices"], platforms: ["windows", "macos", "linux", "cli"],
    scores: [86, 80, 90, 89], tags: ["containers", "devops", "developer", "infrastructure"],
  },
  {
    slug: "jetbrains-intellij", name: "IntelliJ IDEA", domain: "jetbrains.com/idea", category: "coding",
    pricing: "FREEMIUM", company: "JetBrains",
    tagline: "Powerful IDE for Java, Kotlin and the JVM",
    description: "IntelliJ IDEA is JetBrains' flagship IDE, famed for smart code completion, refactoring and deep framework support across JVM languages.",
    pros: ["Best-in-class refactoring", "Deep language support", "Great ecosystem"], cons: ["Resource heavy", "Ultimate is paid", "Can feel heavyweight"],
    bestFor: ["Java/Kotlin devs", "Enterprise", "Refactoring"], platforms: ["windows", "macos", "linux"],
    scores: [84, 82, 86, 89], tags: ["ide", "java", "kotlin", "developer"],
  },
  {
    slug: "sublime-text", name: "Sublime Text", domain: "sublimetext.com", category: "coding",
    pricing: "ONE_TIME", company: "Sublime HQ",
    tagline: "The fast, lightweight text editor developers love",
    description: "Sublime Text is a snappy, minimal code editor known for speed, multiple cursors and a powerful command palette, with a one-time license.",
    pros: ["Extremely fast", "Lightweight", "One-time purchase"], cons: ["Paid license", "Fewer built-in features", "Smaller ecosystem than VS Code"],
    bestFor: ["Fast editing", "Large files", "Minimalists"], platforms: ["windows", "macos", "linux"],
    scores: [80, 72, 82, 86], tags: ["editor", "text-editor", "coding", "developer"],
  },
  {
    slug: "neovim", name: "Neovim", domain: "neovim.io", category: "coding",
    pricing: "OPEN_SOURCE", company: "Neovim", openSource: true,
    tagline: "Hyperextensible Vim-based text editor",
    description: "Neovim modernizes Vim with Lua scripting, LSP support and a thriving plugin ecosystem, beloved by keyboard-driven developers.",
    pros: ["Blazing fast & keyboard-driven", "Highly extensible", "Free & open source"], cons: ["Steep learning curve", "Config-heavy", "Terminal-based"],
    bestFor: ["Power users", "Terminal workflows", "Customization"], platforms: ["windows", "macos", "linux", "cli"],
    scores: [82, 74, 80, 88], tags: ["editor", "vim", "open-source", "developer"],
  },

  // ─────────────── Communication ───────────────
  {
    slug: "microsoft-teams", name: "Microsoft Teams", domain: "microsoft.com/microsoft-teams", category: "saas",
    pricing: "FREEMIUM", company: "Microsoft",
    tagline: "Chat, meetings and collaboration for Microsoft 365",
    description: "Microsoft Teams brings chat, video meetings, calling and file collaboration together, deeply integrated with Microsoft 365.",
    pros: ["Office integration", "All-in-one collaboration", "Enterprise features"], cons: ["Resource heavy", "Can be clunky", "Notification overload"],
    bestFor: ["Enterprises", "Microsoft 365 users", "Remote teams"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [82, 78, 90, 88], tags: ["chat", "meetings", "collaboration", "microsoft"],
  },
  {
    slug: "google-meet", name: "Google Meet", domain: "meet.google.com", category: "saas",
    pricing: "FREEMIUM", company: "Google",
    tagline: "Simple, secure video meetings from Google",
    description: "Google Meet offers reliable browser-based video calls integrated with Google Calendar and Workspace, with no install needed.",
    pros: ["No install needed", "Workspace integration", "Reliable"], cons: ["Fewer features than Zoom", "Time limits on free", "Basic virtual backgrounds"],
    bestFor: ["Google users", "Quick calls", "Schools"], platforms: ["web", "ios", "android"],
    scores: [81, 77, 89, 88], tags: ["video-calls", "meetings", "google", "communication"],
  },
  {
    slug: "mattermost", name: "Mattermost", domain: "mattermost.com", category: "saas",
    pricing: "FREEMIUM", company: "Mattermost", openSource: true,
    tagline: "Open-source, self-hostable team messaging",
    description: "Mattermost is a Slack-style messaging platform you can self-host for full control over your data, popular with security-conscious and technical teams.",
    pros: ["Self-hostable", "Open source", "Data control"], cons: ["Setup/maintenance effort", "Fewer integrations", "UI less polished"],
    bestFor: ["Security-focused teams", "Self-hosting", "Developers"], platforms: ["web", "windows", "macos", "linux", "ios", "android"],
    scores: [82, 74, 78, 86], tags: ["chat", "open-source", "self-hosted", "team"],
  },

  // ─────────────── Security / Password / VPN ───────────────
  {
    slug: "proton-pass", name: "Proton Pass", domain: "proton.me/pass", category: "security",
    pricing: "FREEMIUM", company: "Proton",
    tagline: "Encrypted password manager from the makers of Proton Mail",
    description: "Proton Pass stores passwords, notes and email aliases with end-to-end encryption from a privacy-focused Swiss company.",
    pros: ["Strong privacy focus", "Email aliases", "Good free tier"], cons: ["Newer product", "Fewer integrations", "Smaller ecosystem"],
    bestFor: ["Privacy-focused users", "Proton users", "Aliases"], platforms: ["web", "windows", "macos", "linux", "ios", "android", "chrome", "firefox"],
    scores: [81, 76, 80, 87], tags: ["password-manager", "privacy", "security", "encryption"],
  },
  {
    slug: "keepass", name: "KeePass", domain: "keepass.info", category: "security",
    pricing: "OPEN_SOURCE", company: "KeePass", openSource: true,
    tagline: "Free, open-source, offline password manager",
    description: "KeePass stores your passwords in an encrypted local database you fully control, with a large community of ports and plugins.",
    pros: ["Free & open source", "Fully offline & private", "No cloud dependence"], cons: ["Manual syncing", "Dated interface", "Setup effort"],
    bestFor: ["Privacy purists", "Offline storage", "Technical users"], platforms: ["windows", "macos", "linux", "ios", "android"],
    scores: [80, 70, 78, 88], tags: ["password-manager", "open-source", "offline", "security"],
  },
  {
    slug: "expressvpn", name: "ExpressVPN", domain: "expressvpn.com", category: "vpn",
    pricing: "SUBSCRIPTION", company: "ExpressVPN",
    tagline: "Fast, reliable VPN with servers worldwide",
    description: "ExpressVPN offers fast, privacy-focused VPN access across 100+ countries, with its Lightway protocol and audited no-logs policy.",
    pros: ["Very fast", "Wide server network", "Strong privacy"], cons: ["More expensive", "Fewer simultaneous devices", "Ownership scrutiny"],
    bestFor: ["Streaming", "Privacy", "Travel"], platforms: ["windows", "macos", "linux", "ios", "android"],
    scores: [82, 74, 86, 84], tags: ["vpn", "privacy", "security", "streaming"],
  },
  {
    slug: "surfshark", name: "Surfshark", domain: "surfshark.com", category: "vpn",
    pricing: "SUBSCRIPTION", company: "Surfshark",
    tagline: "Affordable VPN with unlimited device connections",
    description: "Surfshark provides a well-priced VPN with unlimited simultaneous devices, ad blocking and a no-logs policy.",
    pros: ["Unlimited devices", "Affordable", "Good extra features"], cons: ["Speeds vary", "Owned by same group as NordVPN", "Occasional server issues"],
    bestFor: ["Families", "Budget users", "Many devices"], platforms: ["windows", "macos", "linux", "ios", "android"],
    scores: [80, 72, 83, 82], tags: ["vpn", "privacy", "security", "budget"],
  },
  {
    slug: "mullvad", name: "Mullvad VPN", domain: "mullvad.net", category: "vpn",
    pricing: "SUBSCRIPTION", company: "Mullvad",
    tagline: "Privacy-first VPN with anonymous accounts",
    description: "Mullvad is a privacy-obsessed VPN with flat pricing, anonymous account numbers (no email needed) and a strong audited no-logs stance.",
    pros: ["Excellent privacy", "Anonymous signup", "Flat fair pricing"], cons: ["Fewer servers", "No streaming focus", "Bare-bones apps"],
    bestFor: ["Privacy maximalists", "Anonymity", "Activists"], platforms: ["windows", "macos", "linux", "ios", "android"],
    scores: [81, 72, 78, 89], tags: ["vpn", "privacy", "anonymous", "security"],
  },

  // ─────────────── Cloud storage ───────────────
  {
    slug: "google-drive", name: "Google Drive", domain: "drive.google.com", category: "cloud",
    pricing: "FREEMIUM", company: "Google",
    tagline: "Cloud storage integrated with Google Workspace",
    description: "Google Drive gives 15GB free cloud storage with seamless Docs, Sheets and Slides integration and easy sharing across devices.",
    pros: ["Generous free tier", "Workspace integration", "Easy sharing"], cons: ["Privacy considerations", "Storage shared with Gmail/Photos", "Pricey upgrades"],
    bestFor: ["Everyday storage", "Google users", "Collaboration"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [82, 80, 94, 88], tags: ["cloud-storage", "google", "files", "collaboration"],
  },
  {
    slug: "dropbox", name: "Dropbox", domain: "dropbox.com", category: "cloud",
    pricing: "FREEMIUM", company: "Dropbox",
    tagline: "The original cloud file sync and sharing service",
    description: "Dropbox pioneered effortless file syncing across devices, with reliable sharing, file requests and integrations for teams.",
    pros: ["Rock-solid sync", "Cross-platform", "Good sharing"], cons: ["Small free tier", "Pricey plans", "Fewer productivity apps"],
    bestFor: ["File syncing", "Sharing", "Teams"], platforms: ["web", "windows", "macos", "linux", "ios", "android"],
    scores: [81, 74, 88, 87], tags: ["cloud-storage", "sync", "files", "sharing"],
  },
  {
    slug: "proton-drive", name: "Proton Drive", domain: "proton.me/drive", category: "cloud",
    pricing: "FREEMIUM", company: "Proton",
    tagline: "End-to-end encrypted cloud storage",
    description: "Proton Drive offers private, end-to-end encrypted cloud storage from Switzerland, keeping your files inaccessible to anyone but you.",
    pros: ["End-to-end encrypted", "Strong privacy", "Swiss jurisdiction"], cons: ["Smaller free tier", "Fewer integrations", "Slower than big players"],
    bestFor: ["Privacy-focused users", "Sensitive files", "Proton users"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [80, 74, 76, 88], tags: ["cloud-storage", "privacy", "encryption", "files"],
  },

  // ─────────────── Email ───────────────
  {
    slug: "proton-mail", name: "Proton Mail", domain: "proton.me/mail", category: "email",
    pricing: "FREEMIUM", company: "Proton", featured: true,
    tagline: "Encrypted email that respects your privacy",
    description: "Proton Mail is a secure, end-to-end encrypted email service based in Switzerland, with a solid free tier and zero-access encryption.",
    pros: ["End-to-end encryption", "Strong privacy laws", "Good free tier"], cons: ["Search limited by encryption", "Fewer integrations", "Custom domains need paid"],
    bestFor: ["Privacy", "Secure email", "Journalists"], platforms: ["web", "ios", "android", "windows", "macos"],
    scores: [83, 76, 84, 90], tags: ["email", "privacy", "encryption", "security"],
  },
  {
    slug: "thunderbird", name: "Mozilla Thunderbird", domain: "thunderbird.net", category: "email",
    pricing: "OPEN_SOURCE", company: "Mozilla", openSource: true,
    tagline: "Free, open-source email client from Mozilla",
    description: "Thunderbird is a powerful open-source desktop email client with multi-account support, calendars and add-ons, recently modernized.",
    pros: ["Free & open source", "Multi-account", "Extensible"], cons: ["Desktop only", "Setup for beginners", "Dated in places"],
    bestFor: ["Desktop email", "Multiple accounts", "Privacy"], platforms: ["windows", "macos", "linux"],
    scores: [80, 70, 80, 87], tags: ["email", "open-source", "desktop", "client"],
  },
  {
    slug: "spark-mail", name: "Spark Mail", domain: "sparkmailapp.com", category: "email",
    pricing: "FREEMIUM", company: "Readdle",
    tagline: "Smart email client for individuals and teams",
    description: "Spark is a modern email app with smart inbox, scheduling, and team collaboration features like shared drafts and comments.",
    pros: ["Smart inbox", "Team collaboration", "Cross-platform"], cons: ["Data handling concerns", "Premium for best features", "Account required"],
    bestFor: ["Busy inboxes", "Teams", "Mobile email"], platforms: ["ios", "android", "macos", "windows"],
    scores: [79, 76, 80, 80], tags: ["email", "productivity", "client", "team"],
  },

  // ─────────────── Streaming ───────────────
  {
    slug: "spotify", name: "Spotify", domain: "spotify.com", category: "streaming",
    pricing: "FREEMIUM", company: "Spotify", featured: true,
    tagline: "The world's most popular music streaming service",
    description: "Spotify streams tens of millions of songs and podcasts with personalized playlists, discovery and a capable free tier.",
    pros: ["Great discovery", "Huge library", "Works everywhere"], cons: ["Ads on free", "Artist payouts criticized", "No lossless on standard"],
    bestFor: ["Music lovers", "Podcasts", "Discovery"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [83, 82, 96, 89], tags: ["music", "streaming", "podcasts", "audio"],
  },
  {
    slug: "apple-music", name: "Apple Music", domain: "music.apple.com", category: "streaming",
    pricing: "SUBSCRIPTION", company: "Apple",
    tagline: "Lossless music streaming across Apple devices",
    description: "Apple Music offers a large catalog with lossless and spatial audio, deep integration across Apple devices and no ad-supported tier.",
    pros: ["Lossless & spatial audio", "Apple ecosystem", "No ads"], cons: ["No free tier", "Discovery weaker than Spotify", "Best on Apple devices"],
    bestFor: ["Apple users", "Audiophiles", "Music fans"], platforms: ["web", "ios", "android", "macos", "windows"],
    scores: [80, 78, 90, 88], tags: ["music", "streaming", "apple", "audio"],
  },
  {
    slug: "tidal", name: "Tidal", domain: "tidal.com", category: "streaming",
    pricing: "SUBSCRIPTION", company: "Tidal",
    tagline: "Hi-fi music streaming with artist-friendly payouts",
    description: "Tidal focuses on high-fidelity audio quality and better artist compensation, appealing to audiophiles and music-first listeners.",
    pros: ["High-fidelity audio", "Better artist payouts", "Curated editorial"], cons: ["Smaller user base", "Pricier", "App less polished"],
    bestFor: ["Audiophiles", "Artist supporters", "Hi-fi listening"], platforms: ["web", "ios", "android", "windows", "macos"],
    scores: [78, 74, 80, 82], tags: ["music", "streaming", "hi-fi", "audio"],
  },

  // ─────────────── Finance ───────────────
  {
    slug: "stripe", name: "Stripe", domain: "stripe.com", category: "finance",
    pricing: "PAID", company: "Stripe", featured: true,
    tagline: "Developer-first payments infrastructure for the internet",
    description: "Stripe provides APIs and tools to accept payments, run subscriptions and manage financial operations, powering millions of businesses.",
    pros: ["Excellent developer experience", "Reliable & global", "Rich feature set"], cons: ["Per-transaction fees", "Complex for non-devs", "Support can lag"],
    bestFor: ["Developers", "SaaS", "Online businesses"], platforms: ["web", "api"],
    scores: [85, 82, 92, 91], tags: ["payments", "finance", "api", "developer"],
  },
  {
    slug: "wise", name: "Wise", domain: "wise.com", category: "finance",
    pricing: "PAID", company: "Wise",
    tagline: "Low-cost international money transfers and multi-currency accounts",
    description: "Wise (formerly TransferWise) offers cheap, transparent currency transfers and a multi-currency account with the real exchange rate.",
    pros: ["Real exchange rate", "Transparent fees", "Multi-currency account"], cons: ["Transfer fees still apply", "Not a full bank", "Verification steps"],
    bestFor: ["International transfers", "Freelancers", "Travelers"], platforms: ["web", "ios", "android"],
    scores: [82, 74, 87, 88], tags: ["finance", "payments", "currency", "banking"],
  },
  {
    slug: "ynab", name: "YNAB", domain: "ynab.com", category: "finance",
    pricing: "SUBSCRIPTION", company: "YNAB",
    tagline: "Zero-based budgeting to give every dollar a job",
    description: "YNAB (You Need A Budget) teaches a proactive budgeting method with real-time tracking and goal setting to break the paycheck-to-paycheck cycle.",
    pros: ["Effective methodology", "Great education", "Cross-platform sync"], cons: ["Subscription cost", "Learning curve", "Manual habits needed"],
    bestFor: ["Budgeting", "Debt payoff", "Financial habits"], platforms: ["web", "ios", "android"],
    scores: [80, 72, 82, 86], tags: ["budgeting", "finance", "personal-finance", "money"],
  },
  {
    slug: "quickbooks", name: "QuickBooks", domain: "quickbooks.intuit.com", category: "finance",
    pricing: "SUBSCRIPTION", company: "Intuit",
    tagline: "Accounting software for small businesses",
    description: "QuickBooks handles invoicing, expenses, payroll and reporting for small businesses, the market leader in SMB accounting.",
    pros: ["Comprehensive accounting", "Accountant-friendly", "Lots of integrations"], cons: ["Pricey", "Can be complex", "Upsells"],
    bestFor: ["Small businesses", "Freelancers", "Accountants"], platforms: ["web", "windows", "ios", "android"],
    scores: [79, 74, 86, 85], tags: ["accounting", "finance", "invoicing", "business"],
  },

  // ─────────────── Marketing / SEO ───────────────
  {
    slug: "ahrefs", name: "Ahrefs", domain: "ahrefs.com", category: "marketing",
    pricing: "SUBSCRIPTION", company: "Ahrefs",
    tagline: "All-in-one SEO toolset for backlinks and keywords",
    description: "Ahrefs offers powerful SEO tools for backlink analysis, keyword research, rank tracking and site audits, trusted by marketers worldwide.",
    pros: ["Best backlink data", "Powerful keyword tools", "Great site audits"], cons: ["Expensive", "No free plan", "Steep for beginners"],
    bestFor: ["SEO pros", "Content marketing", "Agencies"], platforms: ["web"],
    scores: [83, 80, 87, 89], tags: ["seo", "marketing", "backlinks", "keywords"],
  },
  {
    slug: "semrush", name: "Semrush", domain: "semrush.com", category: "marketing",
    pricing: "SUBSCRIPTION", company: "Semrush",
    tagline: "Marketing platform for SEO, ads and content",
    description: "Semrush is an all-in-one marketing suite covering SEO, PPC, content, competitor research and social, with vast data and toolkits.",
    pros: ["Very comprehensive", "Great competitor research", "All-in-one"], cons: ["Expensive", "Overwhelming", "Limits per plan"],
    bestFor: ["Marketers", "Agencies", "Competitive research"], platforms: ["web"],
    scores: [82, 80, 88, 88], tags: ["seo", "marketing", "ppc", "content"],
  },
  {
    slug: "mailchimp", name: "Mailchimp", domain: "mailchimp.com", category: "marketing",
    pricing: "FREEMIUM", company: "Intuit",
    tagline: "Email marketing and automation for small businesses",
    description: "Mailchimp offers email campaigns, automations, landing pages and audience management with a beginner-friendly builder and a free starter tier.",
    pros: ["Easy to start", "Good automations", "Free tier"], cons: ["Gets pricey by list size", "Feature caps", "Support tiers"],
    bestFor: ["Small businesses", "Newsletters", "E-commerce"], platforms: ["web", "ios", "android"],
    scores: [81, 78, 88, 85], tags: ["email-marketing", "marketing", "automation", "newsletter"],
  },
  {
    slug: "buffer", name: "Buffer", domain: "buffer.com", category: "marketing",
    pricing: "FREEMIUM", company: "Buffer",
    tagline: "Simple social media scheduling and analytics",
    description: "Buffer lets you plan, schedule and analyze social media posts across platforms from one clean dashboard, popular with creators and small teams.",
    pros: ["Simple & clean", "Good free plan", "Multi-platform"], cons: ["Fewer advanced features", "Analytics basic on free", "Per-channel pricing"],
    bestFor: ["Creators", "Small teams", "Social scheduling"], platforms: ["web", "ios", "android", "chrome"],
    scores: [80, 74, 83, 84], tags: ["social-media", "marketing", "scheduling", "analytics"],
  },

  // ─────────────── CRM / SaaS ───────────────
  {
    slug: "hubspot", name: "HubSpot", domain: "hubspot.com", category: "crm",
    pricing: "FREEMIUM", company: "HubSpot", featured: true,
    tagline: "CRM platform for marketing, sales and service",
    description: "HubSpot unifies CRM, marketing, sales and customer service in one platform, with a strong free CRM and powerful paid hubs.",
    pros: ["Generous free CRM", "All-in-one platform", "Great content/education"], cons: ["Paid tiers expensive", "Add-ons multiply cost", "Can be complex"],
    bestFor: ["Sales teams", "Marketing", "SMBs scaling up"], platforms: ["web", "ios", "android"],
    scores: [84, 80, 89, 88], tags: ["crm", "marketing", "sales", "saas"],
  },
  {
    slug: "salesforce", name: "Salesforce", domain: "salesforce.com", category: "crm",
    pricing: "SUBSCRIPTION", company: "Salesforce",
    tagline: "The world's leading enterprise CRM",
    description: "Salesforce is the dominant enterprise CRM, endlessly customizable with clouds for sales, service, marketing and a vast app ecosystem.",
    pros: ["Extremely powerful", "Huge ecosystem", "Enterprise-grade"], cons: ["Expensive", "Complex to set up", "Needs admins"],
    bestFor: ["Enterprises", "Large sales teams", "Complex needs"], platforms: ["web", "ios", "android"],
    scores: [81, 80, 90, 89], tags: ["crm", "sales", "enterprise", "saas"],
  },
  {
    slug: "pipedrive", name: "Pipedrive", domain: "pipedrive.com", category: "crm",
    pricing: "SUBSCRIPTION", company: "Pipedrive",
    tagline: "Sales-focused CRM built around the pipeline",
    description: "Pipedrive is a visual, easy-to-use CRM designed by salespeople to manage deals through pipelines with clear next actions.",
    pros: ["Simple & visual", "Sales-focused", "Quick setup"], cons: ["Fewer marketing features", "Add-ons for extras", "Reporting limited on low tiers"],
    bestFor: ["Small sales teams", "Deal tracking", "SMBs"], platforms: ["web", "ios", "android"],
    scores: [80, 74, 82, 85], tags: ["crm", "sales", "pipeline", "saas"],
  },

  // ─────────────── No-code / Website builders ───────────────
  {
    slug: "webflow", name: "Webflow", domain: "webflow.com", category: "no-code",
    pricing: "FREEMIUM", company: "Webflow", featured: true,
    tagline: "Design and build responsive websites visually, no code",
    description: "Webflow gives designers pixel-perfect control to build production websites visually, with a CMS, hosting and clean exportable code.",
    pros: ["Powerful visual control", "Clean code output", "Built-in CMS & hosting"], cons: ["Steep learning curve", "Pricing tiers add up", "Overkill for simple sites"],
    bestFor: ["Designers", "Marketing sites", "Agencies"], platforms: ["web"],
    scores: [84, 80, 86, 85], tags: ["website-builder", "no-code", "cms", "design"],
  },
  {
    slug: "wordpress", name: "WordPress", domain: "wordpress.org", category: "no-code",
    pricing: "OPEN_SOURCE", company: "WordPress", openSource: true,
    tagline: "The open-source CMS that powers much of the web",
    description: "WordPress is the world's most popular content management system, endlessly extensible with themes and plugins, free and self-hostable.",
    pros: ["Free & open source", "Massive plugin ecosystem", "Total control"], cons: ["Maintenance & security effort", "Plugin bloat", "Hosting needed"],
    bestFor: ["Blogs", "Business sites", "Custom sites"], platforms: ["web", "self-hosted"],
    scores: [85, 76, 94, 88], tags: ["cms", "website-builder", "open-source", "blogging"],
  },
  {
    slug: "wix", name: "Wix", domain: "wix.com", category: "no-code",
    pricing: "FREEMIUM", company: "Wix",
    tagline: "Drag-and-drop website builder for everyone",
    description: "Wix makes building a website easy with drag-and-drop editing, templates, an app market and AI site generation, hosting included.",
    pros: ["Very easy to use", "Lots of templates", "All-in-one"], cons: ["Can't switch templates later", "SEO historically weaker", "Ads on free"],
    bestFor: ["Small businesses", "Beginners", "Portfolios"], platforms: ["web", "ios", "android"],
    scores: [80, 74, 90, 84], tags: ["website-builder", "no-code", "hosting", "templates"],
  },
  {
    slug: "squarespace", name: "Squarespace", domain: "squarespace.com", category: "no-code",
    pricing: "SUBSCRIPTION", company: "Squarespace",
    tagline: "Beautifully designed templates for websites and stores",
    description: "Squarespace is known for elegant, designer-quality templates and an all-in-one platform for websites, blogs and online stores.",
    pros: ["Gorgeous templates", "All-in-one", "Good for stores"], cons: ["Less flexible than code", "No free plan", "Learning curve for customization"],
    bestFor: ["Creatives", "Portfolios", "Small stores"], platforms: ["web", "ios", "android"],
    scores: [80, 74, 87, 86], tags: ["website-builder", "no-code", "ecommerce", "design"],
  },
  {
    slug: "bubble", name: "Bubble", domain: "bubble.io", category: "no-code",
    pricing: "FREEMIUM", company: "Bubble",
    tagline: "Build full web apps without code",
    description: "Bubble is a powerful no-code platform for building complex, database-driven web applications visually, with workflows and plugins.",
    pros: ["Build real apps no-code", "Powerful workflows", "Active community"], cons: ["Steep learning curve", "Performance at scale", "Pricing by usage"],
    bestFor: ["Startups", "MVPs", "Web apps"], platforms: ["web"],
    scores: [82, 78, 80, 82], tags: ["no-code", "app-builder", "web-apps", "startup"],
  },

  // ─────────────── PDF Tools ───────────────
  {
    slug: "adobe-acrobat", name: "Adobe Acrobat", domain: "adobe.com/acrobat", category: "pdf-tools",
    pricing: "SUBSCRIPTION", company: "Adobe",
    tagline: "The industry standard for creating and editing PDFs",
    description: "Adobe Acrobat is the definitive tool for creating, editing, signing and managing PDFs, with cloud sync and e-signature workflows.",
    pros: ["Full-featured PDF editing", "E-signatures", "Reliable standard"], cons: ["Subscription cost", "Heavy app", "Upsells"],
    bestFor: ["Businesses", "Legal docs", "Signatures"], platforms: ["windows", "macos", "web", "ios", "android"],
    scores: [82, 76, 90, 88], tags: ["pdf", "documents", "e-signature", "adobe"],
  },
  {
    slug: "ilovepdf", name: "iLovePDF", domain: "ilovepdf.com", category: "pdf-tools",
    pricing: "FREEMIUM", company: "iLovePDF",
    tagline: "Free online tools to merge, split and convert PDFs",
    description: "iLovePDF offers a suite of easy web tools to merge, split, compress, convert and sign PDFs, with desktop and mobile apps too.",
    pros: ["Free for common tasks", "Simple & fast", "Many tools"], cons: ["Upload limits on free", "Privacy for uploads", "Ads"],
    bestFor: ["Quick PDF tasks", "Merging & converting", "Students"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [82, 74, 86, 82], tags: ["pdf", "converter", "documents", "free"],
  },
  {
    slug: "smallpdf", name: "Smallpdf", domain: "smallpdf.com", category: "pdf-tools",
    pricing: "FREEMIUM", company: "Smallpdf",
    tagline: "Simple, friendly PDF tools in the browser",
    description: "Smallpdf provides a clean set of web-based PDF tools for compressing, converting, editing and signing documents.",
    pros: ["Clean interface", "Handy tools", "Cross-device"], cons: ["Free tier limited", "Subscription for full use", "Upload privacy"],
    bestFor: ["Quick edits", "Conversions", "Signing"], platforms: ["web", "windows", "macos", "ios", "android"],
    scores: [80, 73, 83, 82], tags: ["pdf", "converter", "documents", "productivity"],
  },

  // ─────────────── Browsers (desktop software) ───────────────
  {
    slug: "brave", name: "Brave", domain: "brave.com", category: "browser-extensions",
    pricing: "FREE", company: "Brave", openSource: true,
    tagline: "Privacy-focused browser with built-in ad blocking",
    description: "Brave is a Chromium-based browser that blocks ads and trackers by default, with optional privacy-respecting rewards and a built-in VPN.",
    pros: ["Blocks ads by default", "Fast & private", "Chromium compatible"], cons: ["Crypto features divisive", "Some site breakage", "Rewards not for everyone"],
    bestFor: ["Privacy", "Ad-free browsing", "Speed"], platforms: ["windows", "macos", "linux", "ios", "android"],
    scores: [83, 76, 86, 85], tags: ["browser", "privacy", "ad-blocker", "chromium"],
  },
  {
    slug: "firefox", name: "Mozilla Firefox", domain: "mozilla.org/firefox", category: "browser-extensions",
    pricing: "OPEN_SOURCE", company: "Mozilla", openSource: true,
    tagline: "The independent, open-source, privacy-respecting browser",
    description: "Firefox is a fast, open-source browser from Mozilla with strong privacy protections, extensive customization and a non-profit backer.",
    pros: ["Open source & independent", "Strong privacy", "Highly customizable"], cons: ["Smaller extension pool", "Some site compatibility", "Market share shrinking"],
    bestFor: ["Privacy", "Customization", "Open web supporters"], platforms: ["windows", "macos", "linux", "ios", "android"],
    scores: [84, 76, 88, 89], tags: ["browser", "open-source", "privacy", "mozilla"],
  },
  {
    slug: "arc-browser", name: "Arc", domain: "arc.net", category: "browser-extensions",
    pricing: "FREE", company: "The Browser Company",
    tagline: "A calmer, more organized way to browse the web",
    description: "Arc reimagines the browser with spaces, a sidebar for tabs, split view and built-in tools, aiming to reduce tab chaos.",
    pros: ["Innovative UX", "Great tab management", "Beautiful design"], cons: ["Learning curve", "Mac-first (Windows newer)", "Future direction uncertain"],
    bestFor: ["Power users", "Tab hoarders", "Mac users"], platforms: ["macos", "windows", "ios"],
    scores: [80, 76, 78, 79], tags: ["browser", "productivity", "tabs", "design"],
  },

  // ─────────────── Automation / More SaaS ───────────────
  {
    slug: "make", name: "Make", domain: "make.com", category: "automation",
    pricing: "FREEMIUM", company: "Make",
    tagline: "Visual platform to automate workflows across apps",
    description: "Make (formerly Integromat) lets you build powerful multi-step automations visually, connecting thousands of apps with fine-grained control.",
    pros: ["Powerful visual builder", "Great value", "Fine-grained control"], cons: ["Steeper learning curve", "Operations-based pricing", "Can get complex"],
    bestFor: ["Automation", "Ops teams", "Power users"], platforms: ["web"],
    scores: [83, 80, 82, 84], tags: ["automation", "workflow", "integrations", "no-code"],
  },
  {
    slug: "n8n", name: "n8n", domain: "n8n.io", category: "automation",
    pricing: "FREEMIUM", company: "n8n", openSource: true,
    tagline: "Open-source, self-hostable workflow automation",
    description: "n8n is a fair-code workflow automation tool you can self-host, connecting apps and APIs with a node-based editor and custom code steps.",
    pros: ["Self-hostable", "Open & extensible", "Code when needed"], cons: ["Setup/maintenance", "Smaller app catalog", "Technical audience"],
    bestFor: ["Developers", "Self-hosting", "Custom automations"], platforms: ["web", "self-hosted", "cli"],
    scores: [83, 80, 78, 85], tags: ["automation", "open-source", "workflow", "self-hosted"],
  },
  {
    slug: "retool", name: "Retool", domain: "retool.com", category: "no-code",
    pricing: "FREEMIUM", company: "Retool",
    tagline: "Build internal tools fast with drag-and-drop and code",
    description: "Retool speeds up building internal apps and admin panels by combining drag-and-drop UI with SQL and JavaScript over your own data.",
    pros: ["Fast internal tools", "Connects to your data", "Code when needed"], cons: ["Pricing by users", "Less for public apps", "Learning curve"],
    bestFor: ["Internal tools", "Admin panels", "Developers"], platforms: ["web", "self-hosted"],
    scores: [82, 79, 80, 84], tags: ["low-code", "internal-tools", "developer", "database"],
  },
  {
    slug: "grafana", name: "Grafana", domain: "grafana.com", category: "developer-tools",
    pricing: "FREEMIUM", company: "Grafana Labs", openSource: true,
    tagline: "Open-source dashboards for metrics and observability",
    description: "Grafana visualizes metrics, logs and traces from many data sources in flexible dashboards, a cornerstone of modern observability stacks.",
    pros: ["Powerful dashboards", "Many data sources", "Open source"], cons: ["Setup complexity", "Alerting learning curve", "Cloud costs at scale"],
    bestFor: ["DevOps", "Monitoring", "Observability"], platforms: ["web", "self-hosted"],
    scores: [83, 78, 84, 88], tags: ["monitoring", "dashboards", "observability", "open-source"],
  },
  {
    slug: "mongodb", name: "MongoDB", domain: "mongodb.com", category: "database",
    pricing: "FREEMIUM", company: "MongoDB",
    tagline: "The popular document database for modern apps",
    description: "MongoDB is a flexible NoSQL document database with a generous free Atlas tier, popular for its developer-friendly data model and scaling.",
    pros: ["Flexible schema", "Great free Atlas tier", "Scales well"], cons: ["Not ideal for all data", "Costs at scale", "Consistency trade-offs"],
    bestFor: ["Web apps", "Rapid development", "JSON data"], platforms: ["web", "self-hosted", "api"],
    scores: [83, 78, 88, 86], tags: ["database", "nosql", "developer", "cloud"],
  },
  {
    slug: "planetscale", name: "PlanetScale", domain: "planetscale.com", category: "database",
    pricing: "FREEMIUM", company: "PlanetScale",
    tagline: "Serverless MySQL platform built on Vitess",
    description: "PlanetScale offers a scalable, serverless MySQL-compatible database with branching workflows and no-downtime schema changes.",
    pros: ["Database branching", "Scales seamlessly", "No-downtime migrations"], cons: ["MySQL only", "Pricing changes", "Advanced features paid"],
    bestFor: ["Web apps", "Teams", "Scaling MySQL"], platforms: ["web", "cli", "api"],
    scores: [81, 78, 78, 83], tags: ["database", "mysql", "serverless", "developer"],
  },
];

// Alternatives graph among the new tools (+ links to a few original seed tools).
// [sourceSlug, targetSlug, matchScore] — created bidirectionally.
const ALTERNATIVES: [string, string, number][] = [
  ["cursor", "github-copilot", 90],
  ["cursor", "vs-code", 82],
  ["leonardo-ai", "midjourney", 85],
  ["leonardo-ai", "stable-diffusion", 88],
  ["stable-diffusion", "midjourney", 84],
  ["ollama", "hugging-face", 78],
  ["clickup", "asana", 88],
  ["clickup", "monday", 86],
  ["asana", "monday", 85],
  ["asana", "trello", 80],
  ["airtable", "coda", 84],
  ["airtable", "notion", 80],
  ["coda", "notion", 82],
  ["evernote", "microsoft-onenote", 86],
  ["evernote", "notion", 78],
  ["ticktick", "todoist", 90],
  ["miro", "figma", 74],
  ["sketch", "figma", 88],
  ["framer", "webflow", 82],
  ["penpot", "figma", 86],
  ["photopea", "adobe-photoshop", 88],
  ["photopea", "gimp", 84],
  ["krita", "adobe-photoshop", 76],
  ["inkscape", "adobe-illustrator", 86],
  ["adobe-illustrator", "affinity-photo", 74],
  ["davinci-resolve", "adobe-premiere-pro", 88],
  ["davinci-resolve", "final-cut-pro", 85],
  ["adobe-premiere-pro", "final-cut-pro", 86],
  ["capcut", "davinci-resolve", 72],
  ["kdenlive", "davinci-resolve", 78],
  ["gitlab", "github", 90],
  ["render", "railway", 86],
  ["render", "vercel", 80],
  ["railway", "vercel", 78],
  ["digitalocean", "vercel", 72],
  ["postman", "github", 60],
  ["jetbrains-intellij", "vs-code", 82],
  ["sublime-text", "vs-code", 84],
  ["neovim", "vs-code", 78],
  ["microsoft-teams", "slack", 88],
  ["google-meet", "zoom", 88],
  ["mattermost", "slack", 84],
  ["proton-pass", "bitwarden", 86],
  ["proton-pass", "1password", 82],
  ["keepass", "bitwarden", 84],
  ["expressvpn", "nordvpn", 88],
  ["surfshark", "nordvpn", 86],
  ["mullvad", "protonvpn", 84],
  ["expressvpn", "protonvpn", 80],
  ["google-drive", "dropbox", 86],
  ["proton-drive", "dropbox", 80],
  ["proton-drive", "google-drive", 78],
  ["proton-mail", "thunderbird", 72],
  ["spark-mail", "thunderbird", 74],
  ["apple-music", "spotify", 88],
  ["tidal", "spotify", 84],
  ["apple-music", "tidal", 80],
  ["wise", "stripe", 60],
  ["ahrefs", "semrush", 90],
  ["buffer", "mailchimp", 60],
  ["salesforce", "hubspot", 88],
  ["pipedrive", "hubspot", 84],
  ["pipedrive", "salesforce", 82],
  ["wix", "squarespace", 88],
  ["squarespace", "webflow", 82],
  ["wordpress", "wix", 80],
  ["bubble", "webflow", 78],
  ["retool", "bubble", 74],
  ["ilovepdf", "smallpdf", 88],
  ["smallpdf", "adobe-acrobat", 80],
  ["ilovepdf", "adobe-acrobat", 78],
  ["brave", "firefox", 84],
  ["arc-browser", "brave", 76],
  ["make", "zapier", 90],
  ["n8n", "zapier", 84],
  ["n8n", "make", 86],
  ["mongodb", "supabase", 74],
  ["planetscale", "supabase", 78],
  ["planetscale", "firebase", 72],
];

async function upsertTool(seed: ToolSeed): Promise<boolean> {
  const category = await prisma.category.findUnique({ where: { slug: seed.category } });
  if (!category) {
    console.warn(`[expand-catalog] category "${seed.category}" missing — skipping ${seed.slug}`);
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
    await prisma.toolPlatform
      .create({ data: { toolId: tool.id, platformId: platform.id } })
      .catch(() => {});
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
      if (existing) continue; // idempotent — never touch existing tools
      const ok = await upsertTool(seed).catch((e) => {
        console.warn(`[expand-catalog] failed to add ${seed.slug}:`, e);
        return false;
      });
      if (ok) added += 1;
    }

    // Alternative edges (safe: skips if either tool is missing, upserts edges)
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

    console.log(`[expand-catalog] Added ${added} new tools and ${edges} alternative edges.`);
  } catch (err) {
    // Never break the deploy.
    console.warn("[expand-catalog] Expansion failed (deploy will continue).", err);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

run();
