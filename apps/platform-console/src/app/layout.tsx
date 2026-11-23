import type { Metadata } from "next";
import "@smartschools/ui/styles.css";
import { ThemeScript } from "@smartschools/ui/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Platform Console | SmartSchools",
  description: "SmartSchools tenant provisioning and platform operations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>
        {children}
      </body>
    </html>
  );
}
