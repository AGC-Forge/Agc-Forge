"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrainCircuit, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToggleTheme from "@/components/toggle-theme";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Fitur", href: "#features" },
  { label: "Model AI", href: "#providers" },
  { label: "Demo", href: "#demo" },
  { label: "Capabilities", href: "#capabilities" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#050508]/80 backdrop-blur-xl border-b border-white/6 shadow-xl shadow-black/20"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30 transition-all group-hover:shadow-indigo-500/50 group-hover:scale-105">
            <BrainCircuit className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Forge AI</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="px-3.5 py-1.5 text-sm text-zinc-400 hover:text-white rounded-md hover:bg-white/5 transition-all"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-300 hover:text-white hover:bg-white/5"
            >
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40 transition-all"
            >
              Register
            </Button>
          </Link>
          <ToggleTheme />
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          <ToggleTheme />
          <button
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 border-t border-white/6",
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="bg-[#050508]/95 backdrop-blur-xl px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3 border-t border-white/5 mt-3">
            <Link href="/login" className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-white/10 bg-white/5 text-zinc-300"
              >
                Login
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button
                size="sm"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
