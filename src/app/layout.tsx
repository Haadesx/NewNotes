import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AudioNotes - Transform Audio into Structured Notes",
  description: "AI-powered audio transcription with speaker diarization, timestamp citations, and anti-hallucination guarantees. Free to try.",
  keywords: ["audio transcription", "meeting notes", "lecture notes", "AI notes", "speaker diarization"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
