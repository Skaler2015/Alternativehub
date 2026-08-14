import type { PricingModel } from "@prisma/client";

/**
 * Deterministic, per-tool FAQs generated from the tool's own attributes.
 *
 * These run for EVERY tool (no AI needed), so every listing gets an FAQ section
 * + FAQPage structured data. They deliberately mirror the real question-style
 * searches people make ("is X free", "is X open source", "X alternatives",
 * "how much does X cost", "what platforms does X support") to capture that
 * long-tail search traffic.
 */

const PRICING_PHRASE: Record<PricingModel, string> = {
  FREE: "free to use",
  FREEMIUM: "free to start, with paid plans for advanced features",
  PAID: "a paid product",
  SUBSCRIPTION: "available on a subscription",
  ONE_TIME: "available as a one-time purchase",
  OPEN_SOURCE: "free and open source",
  CONTACT: "custom-priced — you contact sales for a quote",
};

export type AutoFaq = { question: string; answer: string };

export function buildAutoFaqs(input: {
  name: string;
  pricingModel: PricingModel;
  isOpenSource: boolean;
  platforms: string[];
  categoryName?: string | null;
  alternatives: string[];
  tagline?: string | null;
  bestFor?: string[];
}): AutoFaq[] {
  const { name, pricingModel, isOpenSource, platforms, categoryName, alternatives, tagline, bestFor } = input;
  const cat = categoryName ? categoryName.toLowerCase() : "software";
  const faqs: AutoFaq[] = [];

  // What is it? (captures "what is X" — a very common informational query)
  faqs.push({
    question: `What is ${name}?`,
    answer: tagline
      ? `${name} is a ${cat} tool — ${tagline.replace(/\.$/, "")}. You can compare it with the best alternatives, pricing and real reviews on AlternativeHub.`
      : `${name} is a ${cat} tool. Compare its features, pricing and the best alternatives on AlternativeHub.`,
  });

  // What is it used for? (informational intent)
  faqs.push({
    question: `What is ${name} used for?`,
    answer:
      bestFor && bestFor.length > 0
        ? `${name} is mainly used by ${bestFor.slice(0, 3).join(", ")}. It's a ${cat} tool${tagline ? ` that helps you ${tagline.charAt(0).toLowerCase() + tagline.slice(1).replace(/\.$/, "")}` : ""}.`
        : `${name} is a ${cat} tool${tagline ? ` that helps you ${tagline.charAt(0).toLowerCase() + tagline.slice(1).replace(/\.$/, "")}` : ""}. See its key features and use cases on AlternativeHub.`,
  });

  // Is it free?
  const isFree = pricingModel === "FREE" || pricingModel === "OPEN_SOURCE";
  faqs.push({
    question: `Is ${name} free?`,
    answer: isFree
      ? `Yes — ${name} is ${PRICING_PHRASE[pricingModel]}.`
      : pricingModel === "FREEMIUM"
        ? `${name} has a free plan, and paid plans unlock more features. See the pricing on its website for current details.`
        : `${name} is ${PRICING_PHRASE[pricingModel]}. Many similar tools offer a free tier — see the ${name} alternatives on AlternativeHub.`,
  });

  // Is it open source?
  faqs.push({
    question: `Is ${name} open source?`,
    answer: isOpenSource
      ? `Yes — ${name} is open source, so you can inspect, self-host or contribute to its code.`
      : `No, ${name} is not open source. If that matters to you, browse the open-source ${name} alternatives on AlternativeHub.`,
  });

  // How much does it cost?
  faqs.push({
    question: `How much does ${name} cost?`,
    answer: `${name} is ${PRICING_PHRASE[pricingModel]}. Check its official website for the latest plans and any free trial.`,
  });

  // Platforms
  if (platforms.length > 0) {
    faqs.push({
      question: `What platforms does ${name} support?`,
      answer: `${name} is available on ${platforms.join(", ")}.`,
    });
  }

  // Alternatives (the biggest search intent)
  faqs.push({
    question: `What are the best ${name} alternatives?`,
    answer:
      alternatives.length > 0
        ? `Popular ${name} alternatives include ${alternatives.slice(0, 5).join(", ")}. Compare them side by side — features, pricing and reviews — on AlternativeHub.`
        : `Explore the best ${name} alternatives in ${cat} on AlternativeHub, ranked by real users and AI.`,
  });

  // Free trial
  if (!isFree) {
    faqs.push({
      question: `Does ${name} have a free trial?`,
      answer:
        pricingModel === "FREEMIUM"
          ? `${name} offers a free plan you can use without paying, plus paid tiers. Check its website for any additional trial of the premium features.`
          : `Many paid ${cat} tools like ${name} offer a free trial — check its official website for the latest offer, or compare free ${name} alternatives on AlternativeHub.`,
    });
  }

  // Self-hosting (only meaningful for open-source tools)
  if (isOpenSource) {
    faqs.push({
      question: `Can I self-host ${name}?`,
      answer: `Yes — because ${name} is open source, you can self-host it on your own server for full control over your data. See its documentation for setup instructions.`,
    });
  }

  // Comparison with the top alternative (captures "X vs Y" intent)
  if (alternatives.length > 0) {
    const top = alternatives[0];
    faqs.push({
      question: `Is ${name} better than ${top}?`,
      answer: `${name} and ${top} are both strong choices in ${cat}. The best pick depends on your needs, budget and platforms. Compare ${name} vs ${top} side by side — features, pricing, pros and cons — on AlternativeHub.`,
    });
  }

  // Good for a specific audience (captures "X for <persona>" intent)
  if (bestFor && bestFor.length > 0) {
    faqs.push({
      question: `Is ${name} good for ${bestFor[0].toLowerCase()}?`,
      answer: `Yes — ${name} is well suited for ${bestFor[0].toLowerCase()}${bestFor[1] ? ` and ${bestFor[1].toLowerCase()}` : ""}. Read real reviews and see how it compares to alternatives on AlternativeHub.`,
    });
  }

  // Trust
  faqs.push({
    question: `Is ${name} safe and legit?`,
    answer: `${name} is a legitimate ${cat} tool listed on AlternativeHub. As with any service, review its privacy policy and terms before you sign up.`,
  });

  return faqs;
}
