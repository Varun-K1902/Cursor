import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Figtree, Geist_Mono, Newsreader } from "next/font/google"

import { AppShell } from "@/components/shell/app-shell"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BasisProvider } from "@/lib/store"

import "./globals.css"

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700"],
})

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Basis — the requirements record",
  description:
    "Basis is a structured business-analysis workspace. Requirements, rules, data, flows, and baselines live as objects. Documents are views.",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${newsreader.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider>
          <BasisProvider>
            <AppShell>{children}</AppShell>
          </BasisProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
