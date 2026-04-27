/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface JobStatusState {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "timeout";
  progress: number;
  result_url?: string;
  error_message?: string;
  updated_at?: string;
}

interface UseJobStatusOptions {
  onCompleted?: (result_url: string) => void;
  onFailed?: (error: string) => void;
  autoRefresh?: boolean; // refresh router saat selesai
}

/**
 * Hook untuk subscribe ke progress gen job via SSE
 * Usage:
 *   const { status, progress } = useJobStatus("job-id-123", { onCompleted: (url) => ... })
 */
export function useJobStatus(
  jobId: string | null,
  options: UseJobStatusOptions = {}
) {
  const router = useRouter();
  const [state, setState] = useState<JobStatusState | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { onCompleted, onFailed, autoRefresh = true } = options;

  const connect = useCallback(function connectFn() {
    if (!jobId) return;

    // Cleanup sebelumnya
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/ai/status/${jobId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (event.data === "[DONE]") {
        es.close();
        return;
      }

      try {
        const data: JobStatusState = JSON.parse(event.data);
        setState(data);

        if (data.status === "COMPLETED") {
          es.close();
          if (data.result_url && onCompleted) {
            onCompleted(data.result_url);
          }
          if (autoRefresh) {
            router.refresh();
          }
          toast.success("Generate selesai!", { duration: 4000 });
        } else if (data.status === "FAILED") {
          es.close();
          if (onFailed) {
            onFailed(data.error_message ?? "Generate gagal");
          }
          toast.error(data.error_message ?? "Generate gagal");
        }
      } catch { }
    };

    es.onerror = () => {
      es.close();
      // Retry setelah 3 detik jika belum terminal
      if (
        state?.status !== "COMPLETED" &&
        state?.status !== "FAILED" &&
        state?.status !== "CANCELLED" &&
        state?.status !== "timeout"
      ) {
        setTimeout(connectFn, 3000);
      }
    };
  }, [jobId, onCompleted, onFailed, autoRefresh, router, state?.status]);

  useEffect(() => {
    if (!jobId) return;
    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [jobId, connect]);

  return {
    status: state?.status ?? null,
    progress: state?.progress ?? 0,
    result_url: state?.result_url,
    error_message: state?.error_message,
    isCompleted: state?.status === "COMPLETED",
    isFailed: state?.status === "FAILED",
    isPending: state?.status === "PENDING" || state?.status === "PROCESSING",
  };
}

/**
 * Multi-job tracker — track beberapa job sekaligus
 */
export function useMultiJobStatus(jobIds: string[]) {
  const [jobs, setJobs] = useState<Record<string, JobStatusState>>({});

  useEffect(() => {
    if (jobIds.length === 0) return;

    const sources: EventSource[] = [];

    for (const jobId of jobIds) {
      const es = new EventSource(`/api/ai/status/${jobId}`);
      sources.push(es);

      es.onmessage = (event) => {
        if (event.data === "[DONE]") {
          es.close();
          return;
        }
        try {
          const data: JobStatusState = JSON.parse(event.data);
          setJobs((prev) => ({ ...prev, [jobId]: data }));
          if (data.status === "COMPLETED" || data.status === "FAILED") {
            es.close();
          }
        } catch { }
      };

      es.onerror = () => es.close();
    }

    return () => sources.forEach((es) => es.close());
  }, [jobIds.join(",")]);

  return jobs;
}
