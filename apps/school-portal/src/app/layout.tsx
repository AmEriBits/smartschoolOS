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
  title: "School Portal | SmartSchools",
  description: "Secure, school-branded workspaces for SmartSchools communities.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>
        {children}
      </body>
    </html>
  );
}
