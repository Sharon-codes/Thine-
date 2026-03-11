"use client";

import { useEffect, useRef, useState } from "react";

type CommandConsoleProps = {
  isProcessing: boolean;
  onSubmit: (value: string) => void;
};

export default function CommandConsole({
  isProcessing,
  onSubmit,
}: CommandConsoleProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 220);
    textareaRef.current.style.height = `${nextHeight}px`;
  }, [value]);

  const handleSubmit = () => {
    if (isProcessing) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="h-full border-t border-neutral-900 px-6 py-4">
      <form
        className="flex h-full flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          disabled={isProcessing}
          placeholder="State your decision or premise..."
          rows={1}
          className="w-full resize-none rounded-none border border-neutral-800 bg-black p-3 font-sans text-[16px] leading-relaxed text-[#EDEDED] outline-none transition-colors placeholder:text-neutral-600 disabled:opacity-60"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isProcessing}
            className={`h-11 rounded-none border border-neutral-800 px-5 font-sans text-[14px] tracking-[0.2em] transition-colors ${
              isProcessing
                ? "cursor-not-allowed bg-neutral-950 text-neutral-600"
                : "bg-black text-[#EDEDED] hover:bg-neutral-900"
            }`}
          >
            [ SUBMIT ]
          </button>
        </div>
      </form>
    </div>
  );
}
