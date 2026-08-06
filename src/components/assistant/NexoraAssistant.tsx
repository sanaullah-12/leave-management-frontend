/**
 * Nexora Assistant - mount point.
 *
 * The single component the app renders. It wires the launcher state to the two
 * surfaces and stays out of the way everywhere the assistant does not belong.
 *
 * Mounted once inside `Layout`, so it exists on every authenticated screen and
 * never on the public marketing or auth pages.
 *
 * ## Why the panel is lazy
 *
 * The launcher is a button; the panel drags in the whole knowledge base, the
 * matcher and the answer engine. Splitting them means a user who never asks
 * for help never downloads the help - matching how routes and Payroll are
 * code-split elsewhere in the app. Once opened, the panel stays mounted so its
 * transcript survives closing and reopening, and so `AnimatePresence` still
 * gets to play the exit animation.
 */
import React, { Suspense, useEffect, useState } from "react";
import AssistantBubble from "./AssistantBubble";
import { useAssistantLauncher } from "./useAssistantLauncher";

const AssistantPanel = React.lazy(() => import("./AssistantPanel"));

const NexoraAssistant: React.FC = () => {
  const { open, openPanel, closePanel, greetingVisible, greeting, dismissGreeting, hidden } =
    useAssistantLauncher();

  const [panelRequested, setPanelRequested] = useState(false);

  useEffect(() => {
    if (open) setPanelRequested(true);
  }, [open]);

  if (hidden) return null;

  return (
    <>
      <AssistantBubble
        open={open}
        greetingVisible={greetingVisible}
        greeting={greeting}
        onOpen={openPanel}
        onDismissGreeting={dismissGreeting}
      />
      {panelRequested && (
        // No fallback: the chunk lands in a few hundred milliseconds and an
        // empty flash reads better than a skeleton for something this small.
        <Suspense fallback={null}>
          <AssistantPanel open={open} closePanel={closePanel} />
        </Suspense>
      )}
    </>
  );
};

export default NexoraAssistant;
