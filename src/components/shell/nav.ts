import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Database,
  GitBranch,
  ListChecks,
  MessageCircleQuestion,
  Route,
  Scale,
  Stamp,
  Users,
  Waypoints,
  Compass,
  Milestone,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: "People",
    items: [
      { href: "/people", label: "Teams & stakeholders", icon: Users },
      { href: "/roles", label: "Roles & RACI", icon: Scale },
    ],
  },
  {
    label: "Intent",
    items: [
      { href: "/outcomes", label: "Outcomes & needs", icon: Milestone },
      { href: "/requirements", label: "Solution requirements", icon: ListChecks },
    ],
  },
  {
    label: "Language",
    items: [
      { href: "/glossary", label: "Glossary", icon: BookOpen },
      { href: "/data", label: "Data register", icon: Database },
      { href: "/rules", label: "Business rules", icon: GitBranch },
    ],
  },
  {
    label: "Behavior",
    items: [
      { href: "/flows", label: "Flows", icon: Route },
      { href: "/stories", label: "Epics & stories", icon: Compass },
    ],
  },
  {
    label: "Control",
    items: [
      { href: "/questions", label: "Questions & decisions", icon: MessageCircleQuestion },
      { href: "/trace", label: "Trace", icon: Waypoints },
      { href: "/baseline", label: "Review & baseline", icon: Stamp },
    ],
  },
]
