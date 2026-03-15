"use client";

import { useEffect, useRef } from "react";

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Avbryt",
  onConfirm,
  onCancel,
  isDestructive = false,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Lukk med Escape og fokuser avbryt-knappen ved åpning
  useEffect(() => {
    cancelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Bakgrunnsoverlay */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialogboks */}
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 max-w-sm w-full p-6">
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold text-stone-900 dark:text-stone-50 mb-2"
        >
          {title}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              isDestructive
                ? "bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800"
                : "bg-orange-600 dark:bg-orange-700 text-white hover:bg-orange-700 dark:hover:bg-orange-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
