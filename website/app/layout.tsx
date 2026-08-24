import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: {
    default: "CutCare",
    template: "%s | CutCare",
  },
  description: site.description,
  applicationName: "CutCare",
  icons: {
    icon: "/favicon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "CutCare",
    description: site.description,
    url: site.domain,
    siteName: "CutCare",
    images: [
      {
        url: "/icon.png",
        width: 1024,
        height: 1024,
        alt: "CutCare app icon",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CutCare",
    description: site.description,
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="page-shell">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
