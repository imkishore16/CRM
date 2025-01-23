import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers, ThemeProvider } from "@/components/provider";

import "./globals.css";
import { Toaster } from "sonner";
import { appBar } from "@/constants/appBar";
const inter = Inter({ subsets: ["latin"] });

type ToasterProps = React.ComponentProps<typeof Toaster>;

const toastOptions: ToasterProps = {
  theme: "dark",
  richColors: true,
  closeButton: true,
  pauseWhenPageIsHidden: true,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXTAUTH_URL || ""
  ),
  keywords:
    "music stream, fan interaction, live streaming, high-quality audio, curate music, VibeBox",
  title: `${appBar.appTitle} | Customer Sales and Outreach Bot`,
  description:
    "Customer Sales and Outreach Bot. High-quality content, real-time engagement.",
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: `${process.env.NEXTAUTH_URL}/opengraph-image.png`,
    images: "/opengraph-image.png",
    siteName: "Infra",
  },
  icons: [
    {
      url: `${process.env.NEXTAUTH_URL}/favicon.ico`,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#1b1934b2]`}>
        <Toaster {...toastOptions} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
