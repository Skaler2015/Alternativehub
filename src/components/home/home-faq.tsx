import { FadeIn } from "@/components/motion/fade-in";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqJsonLd } from "@/lib/seo";

const FAQS = [
  {
    question: "What is AlternativeHub?",
    answer:
      "AlternativeHub is a discovery platform for finding the best alternatives to apps, websites, AI tools, desktop software, SaaS products, browser extensions, APIs and games. Every tool is community-rated and AI-analyzed so you can compare and switch with confidence.",
  },
  {
    question: "Is AlternativeHub free to use?",
    answer:
      "Yes. Browsing tools, reading reviews, comparing products and discovering alternatives is completely free. Creating an account (also free) lets you bookmark tools, vote and write reviews.",
  },
  {
    question: "How are alternatives ranked?",
    answer:
      "We combine several signals into transparent scores — an Alternative Score, AI Score, Popularity Score and Trust Score — using community ratings, votes, usage and AI analysis. You always see why a tool ranks where it does.",
  },
  {
    question: "How do I compare tools?",
    answer:
      "Open any tool and hit Compare, or use the comparison engine to put 2–4 tools side by side. You get a full breakdown of features, pricing, platforms, pros and cons — plus an AI verdict on which one wins for your use case.",
  },
  {
    question: "Can I add a tool that's missing?",
    answer:
      "Absolutely. Use the Submit a Tool page to add any app or software. After a quick review, our AI enriches the listing with a summary, pros and cons, tags and alternatives — then it goes live.",
  },
  {
    question: "Are the reviews genuine?",
    answer:
      "Reviews come from registered users and are moderated to keep them honest and useful. We surface real strengths and genuine drawbacks, not marketing copy.",
  },
];

export function HomeFaq() {
  return (
    <FadeIn>
      <JsonLd data={faqJsonLd(FAQS)} />
      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-5 text-center">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Frequently asked questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Everything you need to know about AlternativeHub</p>
        </div>
        <div className="rounded-2xl border bg-card px-5">
          <Accordion type="single" collapsible>
            {FAQS.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </FadeIn>
  );
}
