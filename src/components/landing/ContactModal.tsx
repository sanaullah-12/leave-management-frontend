import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AppLogo from "../AppLogo";
import { EASE } from "./primitives";

/* ============================================================
   Nexora is an invite-only, enterprise HRMS — there's no
   self-serve signup. Every "Start free" style CTA on the
   landing page opens this instead: a short, well-designed
   pitch for a guided demo, with direct WhatsApp lines to reach
   the team.
   ============================================================ */

const WHATSAPP_NUMBERS = [
  { label: "0319 6628612", href: "https://wa.me/923196628612" },
  { label: "0307 5617612", href: "https://wa.me/923075617612" },
];

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi! I'd like to book a demo of Nexora and learn about getting full access for my team."
);

export const ContactModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const reduce = useReducedMotion();

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="relative isolate w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-[#0e1320]"
          >
            {/* animated backdrop */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(600px circle at 15% -10%, rgba(62,91,246,0.16) 0%, transparent 60%), radial-gradient(600px circle at 100% 110%, rgba(47,201,141,0.14) 0%, transparent 60%)",
              }}
            />
            {!reduce && (
              <motion.div
                aria-hidden
                className="absolute -inset-24 -z-10 opacity-60"
                style={{ background: "conic-gradient(from 0deg, transparent, rgba(110,134,255,0.14), transparent 40%)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
              />
            )}

            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>

            <div className="px-7 pb-8 pt-9 text-center sm:px-9">
              <motion.div
                initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 260, damping: 18 }}
                className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 shadow-lg shadow-blue-500/30"
              >
                {!reduce && (
                  <motion.span
                    className="absolute inset-0 rounded-2xl ring-2 ring-blue-400/40"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <AppLogo size={32} />
              </motion.div>

              <motion.h2
                id="contact-modal-title"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4, ease: EASE }}
                className="mt-5 text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-gray-900 dark:text-white"
              >
                Built for enterprise teams, not self-checkout
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4, ease: EASE }}
                className="mx-auto mt-3 max-w-sm text-[0.95rem] leading-relaxed text-gray-500 dark:text-gray-400"
              >
                Nexora is a role-based, enterprise HRMS rolled out through a guided setup, so
                there's no self-serve signup here. Contact us for a live demo and to get full
                access to the complete HRMS suite for your organization.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.45, ease: EASE }}
                className="mt-7 space-y-2.5"
              >
                {WHATSAPP_NUMBERS.map((n) => (
                  <a
                    key={n.href}
                    href={`${n.href}?text=${WHATSAPP_MESSAGE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] py-3.5 text-[0.95rem] font-semibold text-white shadow-lg shadow-[#25D366]/25 transition-transform hover:scale-[1.02] active:scale-[0.99]"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5.1-1.3A10 10 0 1012 2zm5.6 14.3c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-5-4.3-5.1-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5s.8 2 .9 2.1c.1.2.1.4 0 .6-.1.2-.1.3-.3.5l-.4.5c-.2.2-.3.4-.1.7.1.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1s.7-.8.9-1.1c.2-.3.4-.2.6-.1s1.6.8 1.9 1c.3.1.5.2.5.3.1.2.1.7-.1 1.4z" /></svg>
                    Chat on WhatsApp
                    <span className="text-white/80">· {n.label}</span>
                  </a>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.36, duration: 0.4 }}
                className="mt-5 text-caption text-gray-400"
              >
                We typically reply within a few minutes during business hours.
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ContactModal;
