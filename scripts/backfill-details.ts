/**
 * Backfills Phase-2 "information hub" details (company info, security,
 * use-cases, industries, integrations) for well-known flagship tools.
 *
 * Idempotent + safe: each tool is only updated while its `launchYear` is still
 * null, so it runs once per tool and never overwrites admin edits afterwards.
 * Wired into the Vercel build so both fresh and existing production databases
 * get the details automatically — no manual step.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Detail = {
  launchYear?: number;
  apiAvailable?: boolean;
  hasFreeTrial?: boolean;
  gdpr?: boolean;
  soc2?: boolean;
  docsUrl?: string;
  changelogUrl?: string;
  useCases?: string[];
  industries?: string[];
  integrations?: string[];
  company?: { founder?: string; employees?: string; funding?: string };
};

const DETAILS: Record<string, Detail> = {
  chatgpt: {
    launchYear: 2022, apiAvailable: true, hasFreeTrial: true, gdpr: true, soc2: true,
    docsUrl: "https://platform.openai.com/docs",
    useCases: ["Content writing", "Coding help", "Research & learning", "Brainstorming"],
    industries: ["Education", "Marketing", "Software", "Customer support"],
    integrations: ["API", "Zapier", "Slack", "Microsoft 365"],
    company: { founder: "Sam Altman, Greg Brockman & team", employees: "1,000+", funding: "$11B+ (Microsoft-backed)" },
  },
  claude: {
    launchYear: 2023, apiAvailable: true, hasFreeTrial: true, gdpr: true, soc2: true,
    docsUrl: "https://docs.anthropic.com",
    useCases: ["Software development", "Long-document analysis", "Professional writing", "Data analysis"],
    industries: ["Software", "Legal", "Finance", "Research"],
    integrations: ["API", "Claude Code", "Slack", "Zapier"],
    company: { founder: "Dario & Daniela Amodei", employees: "700+", funding: "$7B+ (Amazon, Google-backed)" },
  },
  gemini: {
    launchYear: 2023, apiAvailable: true, hasFreeTrial: true, gdpr: true, soc2: true,
    docsUrl: "https://ai.google.dev/docs",
    useCases: ["Research with sources", "Workspace productivity", "Multimodal analysis", "Coding"],
    industries: ["Education", "Enterprise", "Software", "Media"],
    integrations: ["Google Workspace", "Android", "API", "Vertex AI"],
    company: { founder: "Google DeepMind", employees: "Part of Google", funding: "Alphabet-owned" },
  },
  perplexity: {
    launchYear: 2022, apiAvailable: true, hasFreeTrial: true, gdpr: true,
    docsUrl: "https://docs.perplexity.ai",
    useCases: ["Research", "Fact-checking", "Current events", "Citations"],
    industries: ["Research", "Journalism", "Education"],
    integrations: ["API (Sonar)", "Chrome extension"],
    company: { founder: "Aravind Srinivas & team", employees: "100+", funding: "$500M+" },
  },
  notion: {
    launchYear: 2016, apiAvailable: true, hasFreeTrial: true, gdpr: true, soc2: true,
    docsUrl: "https://developers.notion.com",
    useCases: ["Team wikis", "Project management", "Personal notes", "Databases"],
    industries: ["Startups", "Software", "Education", "Media"],
    integrations: ["Slack", "Google Drive", "Zapier", "API"],
    company: { founder: "Ivan Zhao & Simon Last", employees: "500+", funding: "$340M+" },
  },
  figma: {
    launchYear: 2016, apiAvailable: true, hasFreeTrial: true, gdpr: true, soc2: true,
    docsUrl: "https://www.figma.com/developers",
    useCases: ["UI/UX design", "Prototyping", "Design systems", "Team collaboration"],
    industries: ["Software", "Design agencies", "Product teams"],
    integrations: ["Slack", "Jira", "Zeplin", "API"],
    company: { founder: "Dylan Field & Evan Wallace", employees: "1,000+", funding: "Acquired by Adobe" },
  },
  canva: {
    launchYear: 2013, apiAvailable: true, hasFreeTrial: true, gdpr: true, soc2: true,
    docsUrl: "https://www.canva.dev/docs",
    useCases: ["Social media graphics", "Presentations", "Marketing materials", "Video"],
    industries: ["Marketing", "Small business", "Education", "Non-profit"],
    integrations: ["Instagram", "Google Drive", "Dropbox", "API"],
    company: { founder: "Melanie Perkins, Cliff Obrecht & Cameron Adams", employees: "4,000+", funding: "$570M+" },
  },
  "vs-code": {
    launchYear: 2015, apiAvailable: true, hasFreeTrial: true,
    docsUrl: "https://code.visualstudio.com/docs",
    changelogUrl: "https://code.visualstudio.com/updates",
    useCases: ["Web development", "Debugging", "Remote development", "Polyglot programming"],
    industries: ["Software", "Education", "DevOps"],
    integrations: ["GitHub", "Docker", "Extensions marketplace", "AI assistants"],
    company: { founder: "Microsoft", employees: "Part of Microsoft", funding: "Microsoft-owned" },
  },
  supabase: {
    launchYear: 2020, apiAvailable: true, hasFreeTrial: true, gdpr: true, soc2: true,
    docsUrl: "https://supabase.com/docs",
    useCases: ["Backend for apps", "Auth & storage", "Realtime features", "Vector search"],
    industries: ["Startups", "Software", "Indie developers"],
    integrations: ["PostgreSQL", "Vercel", "GitHub", "API"],
    company: { founder: "Paul Copplestone & Ant Wilson", employees: "100+", funding: "$400M+" },
  },
  slack: {
    launchYear: 2013, apiAvailable: true, hasFreeTrial: true, gdpr: true, soc2: true,
    docsUrl: "https://api.slack.com",
    useCases: ["Team communication", "Workflow automation", "File sharing", "Integrations hub"],
    industries: ["Enterprise", "Software", "Remote teams"],
    integrations: ["Google Drive", "Zoom", "Jira", "2,000+ apps"],
    company: { founder: "Stewart Butterfield & team", employees: "Part of Salesforce", funding: "Acquired by Salesforce" },
  },
  spotify: {
    launchYear: 2008, apiAvailable: true, hasFreeTrial: true, gdpr: true, soc2: true,
    docsUrl: "https://developer.spotify.com/documentation",
    useCases: ["Music streaming", "Podcasts", "Playlist curation", "Discovery"],
    industries: ["Media", "Entertainment"],
    integrations: ["API", "Sonos", "Google", "PlayStation"],
    company: { founder: "Daniel Ek & Martin Lorentzon", employees: "9,000+", funding: "Public (NYSE: SPOT)" },
  },
  linear: {
    launchYear: 2019, apiAvailable: true, hasFreeTrial: true, gdpr: true, soc2: true,
    docsUrl: "https://developers.linear.app",
    useCases: ["Issue tracking", "Sprint planning", "Roadmaps", "Engineering workflow"],
    industries: ["Software", "Startups", "Product teams"],
    integrations: ["GitHub", "Slack", "Figma", "API"],
    company: { founder: "Karri Saarinen, Tuomas Artman & Jori Lallo", employees: "100+", funding: "$50M+" },
  },
};

async function run() {
  let applied = 0;
  for (const [slug, d] of Object.entries(DETAILS)) {
    try {
      const tool = await prisma.tool.findUnique({ where: { slug }, select: { id: true, launchYear: true, companyId: true } });
      if (!tool || tool.launchYear !== null) continue; // already backfilled or missing

      await prisma.tool.update({
        where: { id: tool.id },
        data: {
          launchYear: d.launchYear,
          apiAvailable: d.apiAvailable ?? false,
          hasFreeTrial: d.hasFreeTrial ?? false,
          gdpr: d.gdpr ?? false,
          soc2: d.soc2 ?? false,
          docsUrl: d.docsUrl,
          changelogUrl: d.changelogUrl,
          useCases: d.useCases ?? [],
          industries: d.industries ?? [],
          integrations: d.integrations ?? [],
        },
      });

      if (d.company && tool.companyId) {
        await prisma.company.update({
          where: { id: tool.companyId },
          data: {
            founder: d.company.founder,
            employees: d.company.employees,
            funding: d.company.funding,
            foundedYear: d.launchYear,
          },
        }).catch(() => {});
      }
      applied += 1;
    } catch {
      // skip individual failures — never break the build
    }
  }
  console.log(`[backfill-details] applied details to ${applied} tool(s).`);
}

run()
  .catch((e) => console.warn("[backfill-details] failed (build continues).", e))
  .finally(() => prisma.$disconnect());
