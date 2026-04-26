"use client";
import { useState } from "react";

export function useLocalStorage<T>(key: string) {
  const [value, setValue] = useState<T | null>(
    localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key) || "{}") as T : null
  );
  return {
    value,
    setValue
  }
}
