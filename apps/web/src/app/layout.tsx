import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@smartschools/ui/styles.css";
import { ThemeScript } from "@smartschools/ui/theme-script";
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
  title: "SmartSchools — A connected operating system for schools",
  description:
    "One thoughtful platform for school academics, AI-supported learning, teaching, operations and family engagement.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head><ThemeScript /></head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
