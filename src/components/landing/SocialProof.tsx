import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SectionHeading,
  GradientText,
  Reveal,
  Magnetic,
  EASE,
} from "./primitives";
import ContactModal from "./ContactModal";


/* =========================================================
   PRICING
   ========================================================= */

const plans = [
  {
    name: "Starter",
    price: "0",
    period: "free forever",
    d: "For small teams getting started.",
    features: ["Up to 10 employees", "Leave & attendance", "Team calendar", "Email support"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Growth",
    price: "6",
    period: "per employee / mo",
    d: "For scaling companies that need it all.",
    features: [
      "Unlimited employees",
      "Document Studio",
      "Employee Voice",
      "Real-time analytics",
      "Role management",
      "Priority support",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "let's talk",
    d: "For organizations with advanced needs.",
    features: ["SSO & SAML", "Custom roles & workflows", "Dedicated success manager", "SLA & audit exports", "On-prem options"],
    cta: "Contact sales",
    featured: false,
  },
];

export const PricingSection: React.FC = () => {
  const [annual, setAnnual] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          title={
            <>
              Simple pricing that <GradientText>scales with you</GradientText>
            </>
          }
          description="Straightforward plans that scale with your team. Reach out and we'll help you pick the right one."
        />

        <Reveal className="mt-8 flex items-center justify-center gap-3">
          <span className={"text-secondary font-medium " + (!annual ? "text-gray-900 dark:text-white" : "text-gray-400")}>Monthly</span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className="relative h-7 w-12 rounded-full bg-blue-600 transition-colors"
            aria-label="Toggle billing period"
          >
            <motion.span
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
              animate={{ left: annual ? 26 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={"text-secondary font-medium " + (annual ? "text-gray-900 dark:text-white" : "text-gray-400")}>
            Annual <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-caption font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">-20%</span>
          </span>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <div
                className={
                  "relative flex h-full flex-col rounded-2xl border p-7 " +
                  (p.featured
                    ? "border-blue-300 bg-white shadow-[0_30px_80px_-30px_rgba(37,99,235,0.5)] dark:border-blue-500/40 dark:bg-white/[0.04]"
                    : "border-gray-200/70 bg-white/60 dark:border-white/10 dark:bg-white/[0.02]")
                }
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-3 py-1 text-caption font-semibold text-white shadow">
                    Most popular
                  </span>
                )}
                <div className="text-card-title font-semibold text-gray-900 dark:text-white">{p.name}</div>
                <p className="mt-1 text-secondary text-gray-500 dark:text-gray-400">{p.d}</p>
                <div className="mt-5 flex items-end gap-1.5">
                  {p.price === "Custom" ? (
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${annual && p.price !== "0" ? Math.round(Number(p.price) * 0.8) : p.price}
                      </span>
                      <span className="mb-1 text-secondary text-gray-400">/{p.period}</span>
                    </>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-secondary text-gray-600 dark:text-gray-300">
                      <span className={"grid h-5 w-5 shrink-0 place-items-center rounded-full " + (p.featured ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300")}>
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M20 6L9 17l-5-5" /></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Magnetic strength={0.25} className="mt-7">
                  <button
                    onClick={() => setContactOpen(true)}
                    className={
                      "block w-full rounded-xl py-3 text-center text-nav font-semibold transition-shadow " +
                      (p.featured
                        ? "bg-gray-900 text-white hover:shadow-lg dark:bg-white dark:text-gray-900"
                        : "border border-gray-200 text-gray-800 hover:border-gray-300 dark:border-white/10 dark:text-white")
                    }
                  >
                    {p.cta}
                  </button>
                </Magnetic>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
};

/* =========================================================
   FAQ
   ========================================================= */

const faqs = [
  { q: "How long does setup take?", a: "Most teams are up and running in under 15 minutes. Import your employees, set your leave policies, and invite the team, no IT project required." },
  { q: "Can I migrate from another HR tool?", a: "Yes. Nexora imports employee data, balances and history from spreadsheets or most popular HR platforms so you keep your records intact." },
  { q: "Is my data secure?", a: "Absolutely. Data is encrypted in transit and at rest, access is role-based, and every action is audit-logged. We're built to enterprise security standards." },
  { q: "Does it work in real time?", a: "Yes, Nexora is powered by Socket.IO. Notifications, approvals, counters and charts update instantly across every device without a refresh." },
  { q: "What happens when I outgrow the free plan?", a: "Upgrade to Growth any time for unlimited employees and every premium feature. Your data and setup carry over seamlessly." },
  { q: "Do you offer support?", a: "Every plan includes support, and Growth & Enterprise get priority response. Enterprise customers also get a dedicated success manager." },
];

const FaqItem: React.FC<{ q: string; a: string; i: number }> = ({ q, a, i }) => {
  const [open, setOpen] = useState(i === 0);
  return (
    <Reveal delay={i * 0.05}>
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white/60 dark:border-white/10 dark:bg-white/[0.02]">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 p-5 text-left"
        >
          <span className="text-body font-semibold text-gray-900 dark:text-white">{q}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-300"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ ease: EASE, duration: 0.35 }}
            >
              <p className="px-5 pb-5 text-body leading-relaxed text-gray-500 dark:text-gray-400">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
};

export const FaqSection: React.FC = () => (
  <section id="faq" className="py-24 sm:py-32">
    <div className="mx-auto max-w-3xl px-5">
      <SectionHeading
        title="Questions, answered"
        description="Everything you need to know before getting started."
      />
      <div className="mt-14 space-y-3.5">
        {faqs.map((f, i) => (
          <FaqItem key={f.q} q={f.q} a={f.a} i={i} />
        ))}
      </div>
    </div>
  </section>
);
