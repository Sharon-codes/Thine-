"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";

type LandingInputProps = {
  isDisabled: boolean;
  onSubmit: (value: string) => void;
};

export default function LandingInput({ isDisabled, onSubmit }: LandingInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Auto-focus on mount
    setTimeout(() => textareaRef.current?.focus(), 600);
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    const next = Math.min(textareaRef.current.scrollHeight, 240);
    textareaRef.current.style.height = `${next}px`;
  }, [value]);

  const handleSubmit = () => {
    if (isDisabled) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      className="mx-auto flex w-full max-w-2xl flex-col gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="flex flex-col gap-2"
      >
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "11px",
            letterSpacing: "0.3em",
            color: "#444444",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}
        >
          DEADLOCK — TERMINAL v2.1 — by Thine
        </p>
        <p
          style={{
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            fontSize: "15px",
            letterSpacing: "0.04em",
            color: "#888888",
            lineHeight: "1.6",
            fontStyle: "italic",
          }}
        >
          Thine captures what you say.{" "}
          <span style={{ color: "#c0c0c0", fontStyle: "normal" }}>
            Thine \ Adversary tells you what you are hiding.
          </span>
        </p>
      </motion.div>

      {/* Input block */}
      <motion.form
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.8 }}
        style={{ display: "flex", flexDirection: "column", gap: "0" }}
      >
        <div
          style={{
            position: "relative",
            border: focused ? "1px solid #555555" : "1px solid #222222",
            background: "#000",
            transition: "border-color 0.3s ease",
          }}
        >
          {/* Glow on focus */}
          {focused && (
            <div
              style={{
                position: "absolute",
                inset: "-1px",
                background: "transparent",
                boxShadow: "0 0 20px rgba(237,237,237,0.04)",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Prompt symbol */}
          <span
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "14px",
              color: focused ? "#888" : "#444",
              userSelect: "none",
              transition: "color 0.3s",
              zIndex: 1,
            }}
          >
            &gt;
          </span>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isDisabled}
            placeholder="Enter a strategic decision you are making this week..."
            rows={1}
            style={{
              display: "block",
              width: "100%",
              resize: "none",
              background: "transparent",
              border: "none",
              outline: "none",
              padding: "14px 16px 14px 36px",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "14px",
              lineHeight: "1.7",
              color: "#EDEDED",
              caretColor: "#EDEDED",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0 0 0",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "11px",
              color: "#333",
              letterSpacing: "0.1em",
            }}
          >
            SHIFT+ENTER for new line
          </span>
          <button
            type="submit"
            disabled={isDisabled || !value.trim()}
            style={{
              background: "transparent",
              border: "1px solid",
              borderColor: value.trim() && !isDisabled ? "#555" : "#222",
              color: value.trim() && !isDisabled ? "#EDEDED" : "#333",
              cursor: value.trim() && !isDisabled ? "pointer" : "not-allowed",
              padding: "8px 20px",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "11px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              transition: "all 0.2s ease",
            }}
          >
            [ EXECUTE ]
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
