"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useBasis } from "@/lib/store"

export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { catalog } = useBasis()
  const groups = [...new Set(catalog.map((item) => item.group))]

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Jump to an object"
      description="Search the baseline"
    >
      <CommandInput placeholder="Jump to a requirement, rule, person…" />
      <CommandList>
        <CommandEmpty>Nothing in the baseline matches.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group} heading={group}>
            {catalog
              .filter((item) => item.group === group)
              .map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.code ?? ""} ${item.title} ${item.kindLabel}`}
                  onSelect={() => {
                    onOpenChange(false)
                    router.push(item.href)
                  }}
                >
                  <span className="w-14 shrink-0 font-mono text-[0.7rem] text-muted-foreground">
                    {item.code ?? item.kindLabel.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="truncate">{item.title}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export function useCommandHotkey(onOpen: () => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        onOpen()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onOpen])
}

