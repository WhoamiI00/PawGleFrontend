"use client";

/**
 * Shared image picker supporting four input modes:
 *   - tap to choose a file (mobile + desktop)
 *   - native camera capture on phones (rear camera by default)
 *   - drag-and-drop (desktop)
 *   - paste from clipboard (Cmd/Ctrl+V) anywhere on the page
 *
 * Calls `onChange(File[])` whenever the selected set changes. Caller owns
 * the actual upload. Renders previews + per-file remove buttons.
 *
 * Props:
 *   multiple  - allow more than one file (default false)
 *   maxFiles  - cap when multiple (default 5)
 *   accept    - file MIME pattern (default "image/*")
 *   label     - text shown in the empty state
 *   onChange  - (files: File[]) => void
 */

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_LABEL = "Drop a photo, paste, or tap to choose";

export default function ImageDropzone({
  multiple = false,
  maxFiles = 5,
  accept = "image/*",
  label = DEFAULT_LABEL,
  onChange,
  className = "",
}) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Push the latest set up to the parent whenever it changes.
  useEffect(() => {
    onChange?.(files);
  }, [files, onChange]);

  // Manage object-URL preview lifecycles - revoke when files change or unmount.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = useCallback(
    (incoming) => {
      const imgs = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
      if (!imgs.length) return;

      setFiles((prev) => {
        const next = multiple ? [...prev, ...imgs] : [imgs[0]];
        return next.slice(0, multiple ? maxFiles : 1);
      });
    },
    [multiple, maxFiles],
  );

  const removeAt = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ----- Drag and drop -----
  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  // ----- Clipboard paste -----
  // Listen on the window so a paste anywhere on the page works (matches
  // how every familiar app does it).
  useEffect(() => {
    const handler = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const filesFromClipboard = [];
      for (const item of items) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) filesFromClipboard.push(f);
        }
      }
      if (filesFromClipboard.length) addFiles(filesFromClipboard);
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [addFiles]);

  return (
    <div
      className={`w-full ${className}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          dragOver
            ? "border-[var(--primaryColor)] bg-[var(--primary1)]/10"
            : "border-[var(--c3)] hover:border-[var(--primaryColor)] bg-[var(--background2)]"
        }`}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <p className="text-[var(--textColor)] text-sm md:text-base mb-3">
          {label}
        </p>

        <div className="flex justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--primaryColor)] text-[var(--textColor3)] font-medium hover:bg-[var(--primary1)]"
          >
            Choose file{multiple ? "s" : ""}
          </button>
          {/* Hide on desktop (capture attribute is harmless but the button is redundant). */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cameraInputRef.current?.click();
            }}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--background)] text-[var(--textColor)] font-medium border border-[var(--c3)] hover:bg-[var(--c3)] md:hidden"
          >
            📷 Take photo
          </button>
        </div>

        <p className="text-xs text-[var(--textColor2)] mt-3">
          You can also paste an image (Ctrl/Cmd+V)
        </p>

        {/* Standard chooser */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            // Reset value so picking the same file twice still fires.
            e.target.value = "";
          }}
        />
        {/* Camera chooser - on mobile this opens the rear camera directly. */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {previews.length > 0 && (
        <div
          className={`mt-4 grid gap-3 ${
            multiple ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {previews.map((url, idx) => (
            <div
              key={url}
              className="relative rounded-lg overflow-hidden bg-[var(--background2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`preview ${idx + 1}`}
                className="w-full h-40 object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/60 text-white text-sm hover:bg-black/80"
                aria-label={`Remove image ${idx + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
