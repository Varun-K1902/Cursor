"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useState, type ReactNode } from "react"
import { Menu, MoreHorizontal, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useBasis } from "@/lib/store"
import { CommandMenu, useCommandHotkey } from "@/components/shell/command-menu"
import { navGroups, type NavItem } from "@/components/shell/nav"

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="grid gap-5" aria-label="Baseline">
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "rounded-lg px-2.5 py-2 text-sm transition-colors",
          pathname === "/" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/70"
        )}
      >
        Initiative
      </Link>
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-2.5 text-[0.68rem] font-semibold tracking-[0.16em] text-sidebar-foreground/50 uppercase">
            {group.label}
          </p>
          <div className="mt-1.5 grid gap-0.5">
            {group.items.map((item) => (
              <NavRow key={item.href} item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

function NavRow({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/85 hover:bg-sidebar-accent/70"
      )}
    >
      <Icon className="size-4 opacity-80" />
      {item.label}
    </Link>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { state, dispatch } = useBasis()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const openMenu = useCallback(() => setMenuOpen(true), [])
  useCommandHotkey(openMenu)
  const approved = state.baselines.find((baseline) => baseline.status === "approved")

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
          <div className="px-4 pt-5 pb-3">
            <Link href="/" className="block">
              <span className="font-heading text-3xl leading-none text-sidebar-primary">Basis</span>
              <span className="mt-1 block text-xs text-sidebar-foreground/70">The record, not the document</span>
            </Link>
            <p className="mt-4 text-sm font-medium">{state.initiative.shortName}</p>
            <p className="text-xs leading-snug text-sidebar-foreground/60">{state.initiative.name}</p>
          </div>
          <Separator className="bg-sidebar-border" />
          <ScrollArea className="flex-1 px-2 py-4">
            <NavLinks />
          </ScrollArea>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border/80 bg-background/85 px-3 py-2.5 backdrop-blur-md md:px-8">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open navigation">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
                <SheetHeader className="px-4 pt-5">
                  <SheetTitle className="font-heading text-3xl text-sidebar-primary">Basis</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-6rem)] px-3 pb-6">
                  <NavLinks onNavigate={() => setNavOpen(false)} />
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-muted-foreground md:hidden">{state.initiative.shortName}</p>
            </div>
            {approved ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/baseline#${approved.id}`}
                    className="hidden items-center gap-2 rounded-full bg-amber-reward/80 px-3 py-1 text-xs font-semibold text-amber-ink sm:inline-flex"
                  >
                    <span className="size-1.5 rounded-full bg-amber-ink" />
                    {approved.name}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Approved baseline. A change mints the next one.</TooltipContent>
              </Tooltip>
            ) : null}
            <Button variant="outline" onClick={() => setMenuOpen(true)}>
              <Search />
              <span className="hidden sm:inline">Jump</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => dispatch({ type: "reset" })}>
                  Reset sample initiative
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main key={pathname} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
            {children}
          </main>
        </div>
      </div>
      <CommandMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </div>
  )
}
