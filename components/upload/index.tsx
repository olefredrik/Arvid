"use client";

import { useRef, useState, useCallback } from "react";

type Props = {
  onFiles: (files: File[]) => void;
};

// Filoplastingskomponent med drag-and-drop for forsikringsdokumenter (PDF)
export default function Upload({ onFiles }: Props) {
  const [pending, setPending] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter((f) =>
      f.name.toLowerCase().endsWith(".pdf")
    );
    setPending((prev) => {
      // Unngå duplikater basert på navn og størrelse
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const unique = pdfs.filter((f) => !existing.has(`${f.name}-${f.size}`));
      return [...prev, ...unique];
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleRemove = (index: number) => {
    setPending((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (pending.length > 0) onFiles(pending);
  };

  return (
    <div className="space-y-4">
      {/* Slipp-sone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-amber-600 dark:border-amber-700 bg-amber-50 dark:bg-amber-950"
            : "border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-stone-800"
        }`}
      >
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          Slipp PDF-filer her, eller klikk for å velge
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Du kan laste opp flere filer samtidig
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Liste over valgte filer */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((file, i) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between px-4 py-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-gray-400 dark:text-gray-500 text-sm shrink-0">PDF</span>
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{file.name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 ml-3 shrink-0 transition-colors cursor-pointer"
                aria-label="Fjern fil"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            className="w-full bg-orange-600 dark:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors mt-2 cursor-pointer"
          >
            Analyser {pending.length === 1 ? "1 dokument" : `${pending.length} dokumenter`}
          </button>
        </div>
      )}
    </div>
  );
}
