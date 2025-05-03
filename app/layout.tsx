import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers, ThemeProvider } from "@/components/provider"
import "./globals.css"
import { Toaster } from "sonner"
import { appBar } from "@/constants/appBar"
import { Appbar } from "@/components/Appbar"
import { ThemeToggle } from "@/components/ThemeToggle"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

type ToasterProps = React.ComponentProps<typeof Toaster>

const toastOptions: ToasterProps = {
  theme: "light", 
  richColors: true,
  closeButton: true,
  pauseWhenPageIsHidden: true,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || ""),
  keywords: "customer sales, outreach bot, sales automation, customer engagement, AI sales",
  title: `${appBar.appTitle} | Customer Sales and Outreach Bot`,
  description:
    "Empower your sales team with our AI-powered Customer Sales and Outreach Bot. Connect with customers like never before.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${process.env.NEXTAUTH_URL}/opengraph-image.png`,
    images: "/opengraph-image.png",
    siteName: appBar.appTitle,
  },
  icons: [
    {
      url: "/favicon.ico",
      sizes: "any",
    },
  ],
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground content-container`}>
        <Toaster {...toastOptions} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="min-h-screen flex flex-col">
              <Appbar />
              <main className="flex-1 content-container no-scrollbar">
                {children}
              </main>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}