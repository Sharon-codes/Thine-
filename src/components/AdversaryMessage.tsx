"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const KILL_WORDS = ["contradiction", "sunk-cost", "failure", "delusion", "trap", "mistake", "wrong", "risk"];
const STAGGER_DELAY = 0.45;
const PARAGRAPH_DURATION = 0.9;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const killPattern = new RegExp(
  `(${KILL_WORDS.map(escapeRegExp).join("|")})`,
  "gi"
);

const renderKillWords = (text: string) =>
  text.split(killPattern).map((segment, index) => {
    const isKillWord = KILL_WORDS.includes(segment.toLowerCase());
    if (!isKillWord) {
      return <span key={`${segment}-${index}`}>{segment}</span>;
    }
    return (
      <span
        key={`${segment}-${index}`}
        style={{
          background: "#2A0404",
          color: "#FF4444",
          padding: "0 3px",
          borderRadius: "1px",
        }}
      >
        {segment}
      </span>
    );
  });

type AdversaryMessageProps = {
  content: string;
  onComplete?: () => void;
};

export default function AdversaryMessage({ content, onComplete }: AdversaryMessageProps) {
  const paragraphs = content.split(/\n\s*\n/).filter(Boolean);
  const calledRef = useRef(false);

  useEffect(() => {
    calledRef.current = false;
    if (!onComplete || paragraphs.length === 0) return;
    const totalDurationMs =
      ((paragraphs.length - 1) * STAGGER_DELAY + PARAGRAPH_DURATION) * 1000 + 600;
    const timeoutId = window.setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onComplete();
      }
    }, totalDurationMs);
    return () => window.clearTimeout(timeoutId);
  }, [content, onComplete, paragraphs.length]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: "14px",
        lineHeight: "1.85",
        color: "#BBBBBB",
      }}
    >
      {/* Adversary label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "10px",
          letterSpacing: "0.35em",
          color: "#444",
          textTransform: "uppercase",
          borderBottom: "1px solid #111",
          paddingBottom: "12px",
          marginBottom: "8px",
        }}
      >
        THINE \ ADVERSARY — RESPONSE CHANNEL OPEN
      </motion.div>

      {paragraphs.map((paragraph, index) => (
        <motion.p
          key={`${index}-${paragraph.slice(0, 20)}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: PARAGRAPH_DURATION,
            ease: "easeOut",
            delay: index * STAGGER_DELAY,
          }}
          style={{ margin: 0 }}
        >
          {renderKillWords(paragraph)}
        </motion.p>
      ))}
    </div>
  );
}
