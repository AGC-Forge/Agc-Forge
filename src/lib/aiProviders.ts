
export const AI_MODEL_PROVIDERS: AIModelProvider[] = [
  {
    provider: 'anthropic',
    label: 'Anthropic',
    models: [
      {
        id: 'anthropic/claude-3-haiku',
        label: 'Claude Haiku 3',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-3-5-sonnet',
        label: 'Claude Sonnet 3-5',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-3-7-sonnet',
        label: 'Claude Sonnet 3-7',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-3.7-sonnet-thinking',
        label: 'Claude Sonnet 3-7 Thinking',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-sonnet-4',
        label: 'Claude Sonnet 4',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-opus-4-1',
        label: 'Claude Opus 4-1',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-sonnet-4-5',
        label: 'Claude Sonnet 4-5',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-haiku-4-5',
        label: 'Claude Haiku 4-5',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-opus-4-5',
        label: 'Claude Opus 4-5',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-sonnet-4-6',
        label: 'Claude Sonnet 4-6',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-opus-4.6-fast',
        label: 'Claude Opus 4.6 Fast',
        skill: 'text'
      },
      {
        id: 'anthropic/claude-sonnet-4-7',
        label: 'Claude Sonnet 4-7',
        skill: 'text'
      }
    ]
  },
  {
    provider: 'openai',
    label: 'OpenAI',
    models: [
      {
        id: 'openai/gpt-3.5-turbo',
        label: 'GPT-3.5 Turbo',
        skill: 'text'
      },
      {
        id: 'openai/gpt-3.5-turbo-instruct',
        label: 'GPT-3.5 Turbo Instruct',
        skill: 'text'
      },
      {
        id: 'openai/gpt-4',
        label: 'GPT-4',
        skill: 'text'
      },
      {
        id: 'openai/gpt-4o',
        label: 'GPT-4o',
        skill: 'text'
      },
      {
        id: 'openai/gpt-4o-mini',
        label: 'GPT-4o Mini',
        skill: 'text'
      },
      {
        id: 'openai/chatgpt-4o-latest',
        label: 'Chat GPT-4o Latest',
        skill: 'text'
      },
      {
        id: 'openai/gpt-4o-audio-preview',
        label: 'GPT-4o Audio Preview',
        skill: 'text'
      },
      {
        id: 'openai/gpt-4o-extended',
        label: 'GPT-4o Extended',
        skill: 'text'
      },
      {
        id: 'openai/gpt-4o-search-preview',
        label: 'GPT-4o Search Preview',
        skill: 'text'
      },
      {
        id: 'openai/gpt-4o-mini-search-preview',
        label: 'GPT-4o Mini Search Preview',
        skill: 'text'
      },
      {
        id: 'openai/gpt-4o-audio-mini',
        label: 'GPT-4o Audio Mini',
        skill: 'text'
      },
      {
        id: 'openai/gpt-audio',
        label: 'GPT Audio',
        skill: 'text'
      },
      {
        id: 'openai/sora-2',
        label: 'Sora-2',
        skill: 'video'
      },
      {
        id: 'openai/sora-2-pro',
        label: 'Sora-2 Pro',
        skill: 'video'
      },
      {
        id: 'openai/gpt-4.1-nano',
        label: 'GPT-4.1 Nano',
        skill: 'text'
      },
      {
        id: 'openai/gpt-4.1-mini',
        label: 'GPT-4.1 Mini',
        skill: 'text'
      },
      {
        id: 'openai/gpt-4.1',
        label: 'GPT-4.1',
        skill: 'text'
      },
      {
        id: 'openai/o4-mini',
        label: 'O4 Mini',
        skill: 'text'
      },
      {
        id: 'openai/gpt-image-1',
        label: 'GPT Image 1',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5-pro',
        label: 'GPT-5 Pro',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5-codex',
        label: 'GPT-5 Codex',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5-nano',
        label: 'GPT-5 Nano',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5-mini',
        label: 'GPT-5 Mini',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5-chat',
        label: 'GPT-5 Chat',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5',
        label: 'GPT-5',
        skill: 'text'
      },
      {
        id: 'openai/gpt-image-1-mini',
        label: 'GPT Image 1 Mini',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.1-codex-max',
        label: 'GPT-5.1 Codex Max',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.1-codex-mini',
        label: 'GPT-5.1 Codex Mini',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.1-codex',
        label: 'GPT-5.1 Codex',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.1-chat',
        label: 'GPT-5.1 Chat',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.1',
        label: 'GPT-5.1',
        skill: 'text'
      },
      {
        id: 'openai/gpt-image-1.5',
        label: 'GPT Image 1.5',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.2-pro',
        label: 'GPT-5.2 Pro',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.2-codex',
        label: 'GPT-5.2 Codex',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.2-chat',
        label: 'GPT-5.2 Chat',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.2',
        label: 'GPT-5.2',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.3-codex',
        label: 'GPT-5.3 Codex',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.3-chat',
        label: 'GPT-5.3 Chat',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.4-pro',
        label: 'GPT-5.4 Pro',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.4',
        label: 'GPT-5.4',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.4-nano',
        label: 'GPT-5.4 Nano',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.4-mini',
        label: 'GPT-5.4 Mini',
        skill: 'text'
      },
      {
        id: 'openai/gpt-image-2',
        label: 'GPT Image 2',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.5-pro',
        label: 'GPT-5.5 Pro',
        skill: 'text'
      },
      {
        id: 'openai/gpt-5.5',
        label: 'GPT-5.5',
        skill: 'text'
      }
    ]
  },
  {
    provider: 'google',
    label: 'Google',
    models: [
      {
        id: 'google/gemini-2.0-flash-lite',
        label: 'Gemini 2.0 Flash Lite',
        skill: 'text'
      },
      {
        id: 'google/gemini-2.0-flash',
        label: 'Gemini 2.0 Flash',
        skill: 'text'
      },
      {
        id: 'google/veo-2.0',
        label: 'Veo 2.0',
        skill: 'video'
      },
      {
        id: 'google/gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        skill: 'text'
      },
      {
        id: 'google/gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        skill: 'text'
      },
      {
        id: 'google/gemini-2.5-flash-lite',
        label: 'Gemini 2.5 Flash Lite',
        skill: 'text'
      },
      {
        id: 'google/gemini-2.5-flash-image',
        label: 'Gemini 2.5 Flash Image',
        skill: 'text'
      },
      {
        id: 'google/veo-3.0-fast-audio',
        label: 'Veo 3.0 Fast Audio',
        skill: 'audio'
      },
      {
        id: 'google/veo-3.0-fast',
        label: 'Veo 3.0 Fast',
        skill: 'video'
      },
      {
        id: 'google/veo-3.0-audio',
        label: 'Veo 3.0 Audio',
        skill: 'audio'
      },
      {
        id: "google/veo-3.0",
        label: 'Veo 3.0',
        skill: 'video'
      },
      {
        id: 'google/imagen-4.0-preview',
        label: 'Imagen 4.0 Preview',
        skill: 'image'
      },
      {
        id: 'google/imagen-4.0',
        label: 'Imagen 4.0',
        skill: 'image'
      },
      {
        id: 'google/imagen-4.0-ultra',
        label: 'Imagen 4.0 Ultra',
        skill: 'image'
      },
      {
        id: 'google/imagen-4.0-fast',
        label: 'Imagen 4.0 Fast',
        skill: 'image'
      },
      {
        id: 'google/veo-3.1-fast',
        label: 'Veo 3.1 Fast',
        skill: 'video'
      },
      {
        id: "google/veo-3.1",
        label: 'Veo 3.1',
        skill: 'video'
      },
      {
        id: 'google/gemini-3-pro-preview',
        label: 'Gemini 3 Pro Preview',
        skill: 'mutimodal'
      },
      {
        id: 'google/gemini-3-pro',
        label: 'Gemini 3 Pro',
        skill: 'mutimodal'
      },
      {
        id: 'google/gemini-3-pro-image-preview',
        label: 'Gemini 3 Pro Image Preview',
        skill: 'image'
      },
      {
        id: 'google/gemini-3-flash-preview',
        label: 'Gemini 3 Flash Preview',
        skill: 'text'
      },
      {
        id: 'google/gemini-3.1-pro-preview',
        label: 'Gemini 3.1 Pro Preview',
        skill: 'mutimodal'
      },
      {
        id: 'google/gemini-3.1-flash-image-preview',
        label: 'Gemini 3.1 Flash Image Preview',
        skill: 'image'
      },
      {
        id: 'google/gemini-3.1-flash-lite-preview',
        label: 'Gemini 3.1 Flash Lite Preview',
        skill: 'text'
      },
      {
        id: 'google/veo-3.1-lite',
        label: 'Veo 3.1 Lite',
        skill: 'video'
      }
    ]
  },
  {
    provider: 'xai',
    label: 'XAI',
    models: [
      {
        id: 'xai/grok-2',
        label: 'Grok-2',
        skill: 'text'
      },
      {
        id: 'xai/grok-2-vision',
        label: 'Grok-2 Vision',
        skill: 'text'
      },
      {
        id: 'xai/grok-2-image',
        label: 'Grok-2 Image',
        skill: 'image'
      },
      {
        id: 'xai/grok-3-mini-fast',
        label: 'Grok-3 Mini Fast',
        skill: 'text'
      },
      {
        id: 'xai/grok-3-mini',
        label: 'Grok-3 Mini',
        skill: 'text'
      },
      {
        id: 'xai/grok-3-fast',
        label: 'Grok-3 Fast',
        skill: 'text'
      },
      {
        id: 'x-ai/grok-3',
        label: 'Grok-3',
        skill: 'text'
      },
      {
        id: 'x-ai/grok-4',
        label: 'Grok-4',
        skill: 'text'
      },
      {
        id: 'x-ai/grok-code-fast-1',
        label: 'Grok Code Fast 1',
        skill: 'text'
      },
      {
        id: 'x-ai/grok-4-fast-non-reasoning',
        label: 'Grok-4 Fast Non Reasoning',
        skill: 'text'
      },
      {
        id: 'x-ai/grok-4-fast',
        label: 'Grok-4 Fast',
        skill: 'text'
      },
      {
        id: 'x-ai/grok-4-1-fast-non-reasoning',
        label: 'Grok-4-1 Fast Non Reasoning',
        skill: 'text'
      },
      {
        id: 'x-ai/grok-4-1-fast',
        label: 'Grok-4-1 Fast',
        skill: 'text'
      },
      {
        id: 'x-ai/grok-4.20-multi-agent',
        label: 'Grok-4.20 Multi-Agent',
        skill: 'text'
      },
      {
        id: 'x-ai/grok-4.20',
        label: 'Grok-4.20',
        skill: 'text'
      }
    ]
  },
  {
    provider: 'deepseek',
    label: 'Deepseek',
    models: [
      {
        id: 'deepseek/deepseek-chat',
        label: 'Deepseek Chat',
        skill: 'text'
      },
      {
        id: 'deepseek/deepseek-r1',
        label: 'Deepseek R1',
        skill: 'text'
      },
      {
        id: 'deepseek/deepseek-chat-v3-0324',
        label: 'Deepseek Chat V3.0324',
        skill: 'text'
      },
      {
        id: 'deepseek/deepseek-chat-v3.1',
        label: 'Deepseek Chat V3.1',
        skill: 'text'
      },
      {
        id: 'deepseek/deepseek-v3.2',
        label: 'Deepseek V3.2',
        skill: 'text'
      },
      {
        id: 'deepseek/deepseek-v4-pro',
        label: 'Deepseek V4 Pro',
        skill: 'text'
      },
      {
        id: 'deepseek/deepseek-v4-flash',
        label: 'Deepseek V4 Flash',
        skill: 'text'
      }
    ]
  },
  {
    provider: 'bytedance',
    label: 'Bytedance',
    models: [
      {
        id: 'bytedance/seedance-1.0-lite',
        label: 'Bytedance Seedance 1.0 Lite',
        skill: 'video'
      },
      {
        id: 'bytedance/seedance-1.0-pro',
        label: 'Bytedance Seedance 1.0 Pro',
        skill: 'video'
      },
    ]
  },
  {
    provider: 'kling',
    label: 'Kling',
    models: [
      {
        id: 'kwaivgi/kling-1.6-pro',
        label: 'Kling 1.6 Pro',
        skill: 'video'
      },
      {
        id: 'kwaivgi/kling-1.6-standard',
        label: 'Kling 1.6 Standard',
        skill: 'video'
      },
      {
        id: 'kwaivgi/kling-2.0-master',
        label: 'Kling 2.0 Master',
        skill: 'video'
      },
      {
        id: 'kwaivgi/kling-2.1-pro',
        label: 'Kling 2.1 Pro',
        skill: 'video'
      },
      {
        id: 'kwaivgi/kling-2.1-standard',
        label: 'Kling 2.1 Standard',
        skill: 'video'
      },
      {
        id: 'kwaivgi/kling-2.1-master',
        label: 'Kling 2.1 Master',
        skill: 'video'
      }
    ]
  },
  {
    provider: 'qwen',
    label: 'Qwen',
    models: [
      {
        id: 'qwen/qwen3.6-plus',
        label: 'Qwen 3.6 Plus',
        skill: 'text'
      },
      {
        id: 'qwen/qwen3.6-plus-preview',
        label: 'Qwen 3.6 Plus Preview Free',
        skill: 'text'
      },
      {
        id: 'qwen/qwen-image-2.0',
        label: 'Qwen 2.0 Image',
        skill: 'image'
      },
      {
        id: 'qwen/qwen-image-2.0-pro',
        label: 'Qwen 2.0 Pro Image',
        skill: 'image'
      },
      {
        id: 'qwen/qwen3.5-flash-02-23',
        label: 'Qwen 3.5 Flash',
        skill: 'text'
      },
      {
        id: 'qwen/qwen3-max-thinking',
        label: 'Qwen 3 Max Thinking',
        skill: 'text'
      },
      {
        id: 'qwen/qwen3-coder-next',
        label: 'Qwen 3 Coder Next',
        skill: 'text'
      },
      {
        id: 'qwen/qwen-image',
        label: 'Qwen Image',
        skill: 'image'
      },
      {
        id: 'qwen/qwen3-coder-flash',
        label: 'Qwen 3 Coder Flash',
        skill: 'text'
      },
      {
        id: 'qwen/qwen3-coder-plus',
        label: 'Qwen 3 Coder Plus',
        skill: 'text'
      },
      {
        id: 'qwen/qwen3-max',
        label: 'Qwen 3 Max',
        skill: 'text'
      },
      {
        id: 'qwen/qwen-max',
        label: 'Qwen 3 Max',
        skill: 'text'
      },
      {
        id: 'qwen/qwen3-plus',
        label: 'Qwen 3 Plus',
        skill: 'text'
      },
      {
        id: 'qwen/qwen-turbo',
        label: 'Qwen Turbo',
        skill: 'text'
      }
    ]
  },
  {
    provider: "wanai",
    label: "Wanai",
    models: [
      {
        id: "wan-ai/wan2.2-t2v-a14b",
        label: "Wan AI: Wan 2.2 Text-to-Video 14B",
        skill: "video"
      },
      {
        id: "wan-ai/wan2.2-i2v-a14b",
        label: "Wan AI: Wan 2.2 Image-to-Video 14B",
        skill: "video"
      },
      {
        id: "wan-ai/wan2.6-image",
        label: "Wanai 2.6 Image",
        skill: "image"
      },
      {
        id: "wan-ai/wan2.7-t2v",
        label: "Wanai 2.7 Text To Video",
        skill: "video"
      }
    ]
  },
  {
    provider: "pixverse",
    label: "Pixverse",
    models: [
      {
        id: "pixverse/pixverse-v5",
        label: "Pixverse V5",
        skill: "mutimodal"
      }
    ]
  }
]
