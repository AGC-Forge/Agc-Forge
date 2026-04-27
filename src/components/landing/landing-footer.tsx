import Link from "next/link";
import { BrainCircuit } from "lucide-react";

const FOOTER_LINKS = [
  {
    group: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Provider AI", href: "#providers" },
      { label: "Demo", href: "#demo" },
    ],
  },
  {
    group: "Account",
    links: [
      { label: "Register", href: "/register" },
      { label: "Login", href: "/login" },
    ],
  },
  {
    group: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/6">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30">
                <BrainCircuit className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-semibold text-white">
                Forge AI
              </span>
            </Link>
            <p className="mt-3 text-sm text-zinc-500 max-w-xs leading-relaxed">
              Platform AI all-in-one for chat, generate images, and video with
              the best AI model available.
            </p>
          </div>

          {/* Links */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase mb-4">
                {group.group}
              </p>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-8">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Forge AI. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-zinc-600">
            <span>Powered by</span>
            <span className="text-indigo-400 font-medium">Puter.js</span>
            <span>·</span>
            <span className="text-indigo-400 font-medium">
              10+ AI Providers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
