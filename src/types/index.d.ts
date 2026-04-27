import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      role_level: number;
    };
  }

  interface User {
    id: string;
    role?: string;
    role_level?: number;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    role_level: number;
  }
}

declare global {
  type Nullable<T> = T | null;

  type SettingRow = Pick<SettingConfig, "key" | "value"> & {
    updated_at?: Date;
  };

  interface SettingConfig {
    site_name: string;
    site_description: string;
    site_keywords: string;
    site_icon: string;
    site_logo: string;
    site_favicon: string;
    site_theme: string;
    is_maintenance: boolean;
    enable_register: boolean;
    enable_github_provider: boolean;
    enable_google_provider: boolean;
  }

  type AIProvider =
    | "anthropic"
    | "openai"
    | "google"
    | "xai"
    | "deepseek"
    | "bytedance"
    | "kling"
    | "qwen"
    | "wanai"
    | "pixverse";

  type AISkill = "text" | "image" | "video" | "audio" | "mutimodal";

  interface AIModel {
    id: string;
    label: string;
    skill: AISkill;
    description?: string;
    context_length?: number;
    supports_streaming?: boolean;
    supports_vision?: boolean;
  }

  interface AIModelProvider {
    provider: AIProvider;
    label: string;
    icon?: string;
    models: AIModel[];
  }

  /** Rasio aspek untuk generate image atau video */
  type AspectRatio =
    | "1:1"     // square
    | "16:9"    // landscape widescreen
    | "9:16"    // portrait vertical (short)
    | "4:3"     // landscape standard
    | "3:4"     // portrait standard
    | "2:3"     // portrait photo
    | "3:2"     // landscape photo
    | "21:9";   // ultrawide cinematic

  /** Kualitas / resolusi output image */
  type ImageQuality = "512" | "1K" | "2K" | "4K";

  /** Resolusi output video */
  type VideoResolution = "480p" | "720p" | "1080p" | "4K";

  /** Durasi video dalam detik */
  type VideoDuration = 5 | 10 | 15 | 30;

  /** Frame per second video */
  type VideoFPS = 24 | 30 | 60;

  /** Config lengkap untuk generate image */
  interface ImageGenConfig {
    prompt: string;
    model_id: string;
    provider: AIProvider;
    aspect_ratio?: AspectRatio;
    quality?: ImageQuality;
  }

  /** Config lengkap untuk generate video */
  interface VideoGenConfig {
    prompt: string;
    model_id: string;
    provider: AIProvider;
    aspect_ratio?: AspectRatio;
    resolution?: VideoResolution;
    duration?: VideoDuration;
    fps?: VideoFPS;
    /** Untuk fitur Extend Video: URL video sumber */
    extend_from_url?: string;
    /** Untuk fitur Extend Video: ID media yang di-extend */
    extend_from_media_id?: string;
    /** Mulai extend dari detik ke-berapa */
    extend_start_sec?: number;
  }

  /** Option list untuk UI picker */
  interface AspectRatioOption {
    value: AspectRatio;
    label: string;
    icon?: string;       // e.g. "□" | "▭" | "▯"
  }

  // ── Project ───────────────────────────────────────────────────────────────
  interface Project {
    id: string;
    userId: string;
    name: string;
    description?: string | null;
    emoji?: string | null;
    color?: string | null;
    system_prompt?: string | null;
    is_pinned: boolean;
    is_archived: boolean;
    created_at: Date;
    updated_at: Date;
    _count?: {
      conversations: number;
    };
  }

  // ── Conversation ──────────────────────────────────────────────────────────
  type ConversationSkill = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "MULTIMODAL";

  interface Conversation {
    id: string;
    userId: string;
    project_id?: string | null;
    project?: Pick<Project, "id" | "name" | "emoji" | "color"> | null;
    title: string;
    provider: AIProvider;
    model_id: string;
    skill: ConversationSkill;
    is_starred: boolean;
    is_pinned: boolean;
    is_archived: boolean;
    total_tokens?: number | null;
    last_message_at?: Date | null;
    created_at: Date;
    updated_at: Date;
    messages?: ChatMessage[];
    gen_jobs?: GenJob[];
    _count?: {
      messages: number;
    };
  }

  /** Actions yang tersedia di sidebar per conversation (context menu) */
  type ConversationSidebarAction =
    | "rename"
    | "star"
    | "unstar"
    | "pin"
    | "unpin"
    | "archive"
    | "unarchive"
    | "move_to_project"
    | "remove_from_project"
    | "delete";

  // ── Message ───────────────────────────────────────────────────────────────
  type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";

  type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "CODE" | "ARCHIVE";

  interface MediaItem {
    id: string;
    message_id: string;
    bucket: string;
    object_key: string;
    url: string;
    type: MediaType;
    filename: string;
    original_filename: string;
    size?: number | null;
    mime_type?: string | null;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    // generate metadata
    gen_prompt?: string | null;
    gen_model_id?: string | null;
    gen_aspect_ratio?: string | null;
    gen_quality?: string | null;
    gen_duration?: number | null;
    gen_fps?: number | null;
    gen_resolution?: string | null;
    is_generated: boolean;
    created_at: Date;
  }

  interface ChatMessage {
    id: string;
    conversation_id: string;
    role: MessageRole;
    content: string;
    model_id?: string | null;
    tokens_used?: number | null;
    is_error: boolean;
    created_at: Date;
    media?: MediaItem[];
    gen_jobs?: GenJob[];
  }

  // ── Gen Job ───────────────────────────────────────────────────────────────
  type GenJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

  interface GenJob {
    id: string;
    conversation_id: string;
    message_id?: string | null;
    job_type: "IMAGE" | "VIDEO";
    status: GenJobStatus;
    provider: AIProvider;
    model_id: string;
    prompt: string;
    // image config
    aspect_ratio?: string | null;
    quality?: string | null;
    // video config
    duration?: number | null;
    fps?: number | null;
    resolution?: string | null;
    // extend video
    extend_from_media_id?: string | null;
    extend_from_url?: string | null;
    extend_start_sec?: number | null;
    // result
    result_url?: string | null;
    result_media_id?: string | null;
    error_message?: string | null;
    progress: number;
    started_at?: Date | null;
    completed_at?: Date | null;
    created_at: Date;
    updated_at: Date;
  }

  // ── MinIO / Upload ────────────────────────────────────────────────────────
  interface UploadedFile {
    bucket: string;
    object_key: string;
    url: string;
    filename: string;
    original_filename: string;
    size: number;
    mime_type: string;
    type: MediaType;
    width?: number;
    height?: number;
    duration?: number;
  }

  /** Tipe file yang diizinkan untuk upload */
  type AllowedMimeType =
    // Image
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp"
    | "image/svg+xml"
    // Video
    | "video/mp4"
    | "video/webm"
    | "video/quicktime"
    // Audio
    | "audio/mpeg"
    | "audio/wav"
    | "audio/ogg"
    // Document
    | "application/pdf"
    | "application/msword"
    | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    | "text/plain"
    | "text/markdown"
    // Code
    | "text/html"
    | "text/css"
    | "text/javascript"
    | "application/json"
    | "application/yaml"
    | "text/x-python"
    | "text/x-typescript";

  // ── Puter.js Integration ──────────────────────────────────────────────────
  interface PuterChatMessage {
    role: "user" | "assistant" | "system" | "tool";
    content:
    | string
    | Array<{
      type: "text" | "file" | "image_url";
      text?: string;
      puter_path?: string;
      image_url?: { url: string };
      thoughtSignature?: string;
    }>;
    cache_control?: { type: "ephemeral" };
    tool_calls?: PuterToolCall[];
    tool_call_id?: string;
  }

  interface PuterToolCall {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }

  interface PuterChatOptions {
    model?: string;
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
    tools?: PuterTool[];
    image_config?: {
      aspect_ratio?: string;
      image_size?: string;
    };
  }

  interface PuterTool {
    type: "function" | "web_search";
    function?: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
      strict?: boolean;
    };
  }

  // ── API / Server Action ───────────────────────────────────────────────────
  interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }

  interface ActionResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    fieldErrors?: Record<string, string[]>;
  }
}

export { };
