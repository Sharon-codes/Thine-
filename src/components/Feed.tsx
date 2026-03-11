"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AdversaryMessage as Message } from "@/types/adversary";
import AdversaryMessage from "./AdversaryMessage";

const TERMINAL_LINES = [
  "[Initiating context matrix extraction...]",
  "[Cross-referencing stated Q1 directives...]",
  "[Detecting semantic drift and logical fallacies...]",
  "[Synthesizing adversarial response...]",
];

type FeedProps = {
  messages: Message[];
  showTerminal: boolean;
};

export default function Feed({ messages, showTerminal }: FeedProps) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (!showTerminal) return;
    setLineIndex(0);
    const intervalId = window.setInterval(() => {
      setLineIndex((current) => (current + 1) % TERMINAL_LINES.length);
    }, 800);
    return () => window.clearInterval(intervalId);
  }, [showTerminal]);

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {messages.map((message) =>
          message.role === "user" ? (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-sans text-[16px] leading-relaxed text-[#EDEDED] whitespace-pre-wrap"
            >
              {message.content}
            </motion.div>
          ) : (
            <AdversaryMessage key={message.id} content={message.content} />
          )
        )}

        <AnimatePresence>
          {showTerminal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="font-mono text-[13px] leading-relaxed text-[#666666]"
            >
              {TERMINAL_LINES[lineIndex]}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
