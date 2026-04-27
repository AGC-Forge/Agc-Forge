import { create } from "zustand";

export const useChatStore = create<ChatStore>((set) => ({
  isStreaming: false,
  streamingContent: "",
  streamingConversationId: null,
  isGenerating: false,
  generatingJobId: null,

  startStream: (conversationId) =>
    set({
      isStreaming: true,
      streamingContent: "",
      streamingConversationId: conversationId,
    }),

  appendStream: (chunk) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),

  endStream: () =>
    set({
      isStreaming: false,
      streamingContent: "",
      streamingConversationId: null,
    }),

  setGenerating: (jobId) =>
    set({
      isGenerating: jobId !== null,
      generatingJobId: jobId,
    }),

  reset: () =>
    set({
      isStreaming: false,
      streamingContent: "",
      streamingConversationId: null,
      isGenerating: false,
      generatingJobId: null,
    }),
}));
