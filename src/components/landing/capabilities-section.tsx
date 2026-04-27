import {
  FileText,
  Code2,
  Music,
  Archive,
  Image as ImageIcon,
  Video,
  FileType2,
  CheckCircle2,
} from "lucide-react";

const UPLOAD_TYPES = [
  {
    icon: ImageIcon,
    label: "Gambar",
    formats: "JPG, PNG, GIF, WebP, SVG",
    color: "text-violet-400",
  },
  {
    icon: Video,
    label: "Video",
    formats: "MP4, WebM, MOV",
    color: "text-cyan-400",
  },
  {
    icon: Music,
    label: "Audio",
    formats: "MP3, WAV, OGG, M4A",
    color: "text-emerald-400",
  },
  {
    icon: FileText,
    label: "Dokumen",
    formats: "PDF, DOCX, TXT, MD",
    color: "text-amber-400",
  },
  {
    icon: Code2,
    label: "Kode",
    formats: "JS, TS, PY, HTML, CSS, JSON",
    color: "text-indigo-400",
  },
  {
    icon: Archive,
    label: "Arsip",
    formats: "ZIP, TAR, GZ",
    color: "text-rose-400",
  },
];

const CAPABILITIES = [
  "Analisis dokumen & PDF",
  "Review dan debug kode",
  "Terjemah multi bahasa",
  "Penulisan kreatif & teknis",
  "Riset & summarisasi",
  "Generate gambar dari teks",
  "Generate video dari teks",
  "Extend video yang ada",
  "Transcribe audio",
  "Analisis gambar & video",
  "Q&A dari file upload",
  "Multi-turn conversation",
];

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="relative py-24">
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-mono text-indigo-400 tracking-widest uppercase mb-3">
            Capabilities
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Send anything, get anything
          </h2>
          <p className="mt-3 text-zinc-400 max-w-xl mx-auto">
            Upload files in any format and let AI understand, analyze, and
            produce the output you need.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* File types */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-6">
            <h3 className="text-sm font-medium text-zinc-300 mb-5 flex items-center gap-2">
              <FileType2 className="h-4 w-4 text-indigo-400" />
              Supported file formats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {UPLOAD_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.label}
                    className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:border-white/12 hover:bg-white/4"
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${type.color}`} />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {type.label}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {type.formats}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Capabilities list */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-6">
            <h3 className="text-sm font-medium text-zinc-300 mb-5 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Supported capabilities
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {CAPABILITIES.map((cap) => (
                <div key={cap} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-sm text-zinc-400">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
