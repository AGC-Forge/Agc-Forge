"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

// ── Allowed types ─────────────────────────────────────────────────────────────
const MAX_FILES = 5;
const MAX_SIZE_MB = 50;

interface FilePreview {
  file: File;
  id: string;
  previewUrl: string | null; // untuk gambar
  type: "image" | "video" | "audio" | "document" | "code";
}

function detectFileType(file: File): FilePreview["type"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  const codeExts = [".js", ".ts", ".tsx", ".jsx", ".py", ".html", ".css", ".json", ".yaml", ".sh", ".sql"];
  if (codeExts.some((ext) => file.name.toLowerCase().endsWith(ext))) return "code";
  return "document";
}

function generatePreview(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMedia() {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Add files ──────────────────────────────────────────────────────────────
  const addFiles = useCallback(async (incoming: File[]) => {
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      toast.warning(`Maksimal ${MAX_FILES} file.`);
      return;
    }

    const toAdd = incoming.slice(0, remaining);
    const tooLarge = toAdd.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);

    if (tooLarge.length > 0) {
      toast.error(`File is too large (max ${MAX_SIZE_MB}MB): ${tooLarge.map((f) => f.name).join(", ")}`);
    }

    const valid = toAdd.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024);
    if (valid.length === 0) return;

    const previews = await Promise.all(
      valid.map(async (file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        previewUrl: await generatePreview(file),
        type: detectFileType(file),
      }))
    );

    setFiles((prev) => [...prev, ...previews]);
  }, [files.length]);

  // ── Remove file ────────────────────────────────────────────────────────────
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  // ── Input change handler ───────────────────────────────────────────────────
  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files ?? []));
    },
    [addFiles]
  );

  // ── Drag & drop handlers ───────────────────────────────────────────────────
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      addFiles(dropped);
    },
    [addFiles]
  );

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    files,
    rawFiles: files.map((f) => f.file),
    isDragging,
    hasFiles: files.length > 0,
    canAddMore: files.length < MAX_FILES,
    addFiles,
    removeFile,
    clearFiles,
    onInputChange,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    openFilePicker,
    inputRef,
  };
}
