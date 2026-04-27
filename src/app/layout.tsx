import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { PuterAuthProvider } from "@/components/puter/puter-auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Forge AI",
    template: "%s | Forge AI",
  },
  description:
    "Forge AI Platform with various latest models — text, image, video.",
  keywords: [
    "AI",
    "Chat",
    "Image Generation",
    "Video Generation",
    "Claude",
    "GPT",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {/*
              PuterAuthProvider:
              - Jika NEXT_PUBLIC_PUTER_AUTO_TOKEN=false → transparan, tidak ada logika
              - Jika NEXT_PUBLIC_PUTER_AUTO_TOKEN=true → load puter.js, sync token, auto-validate
            */}
            <PuterAuthProvider>
              {children}
              <Toaster position="bottom-right" richColors />
            </PuterAuthProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
