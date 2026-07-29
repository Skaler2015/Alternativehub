import { FadeIn } from "@/components/motion/fade-in";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqJsonLd } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

export async function HomeFaq() {
  const { t } = await getT();
  const FAQS = [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
    { question: t("faq.q6"), answer: t("faq.a6") },
  ];

  return (
    <FadeIn>
      <JsonLd data={faqJsonLd(FAQS)} />
      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-5 text-center">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{t("faq.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("faq.sub")}</p>
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
