import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  ClipboardCheck,
  Database,
  FileDown,
  FolderKanban,
  GitBranch,
  History,
  Home,
  LayoutTemplate,
  ListChecks,
  MessageCircleQuestion,
  Route,
  Scale,
  Settings,
  Stamp,
  Users,
  Waypoints,
  Compass,
  Milestone,
  Workflow,
  Boxes,
  PanelTop,
  FlaskConical,
  FileSearch,
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

export const primaryNav: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/requirements", label: "Requirements", icon: ListChecks },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/reviews", label: "Reviews and approvals", icon: ClipboardCheck },
  { href: "/questions", label: "Decisions and questions", icon: MessageCircleQuestion },
  { href: "/settings", label: "Settings", icon: Settings },
]

export const projectNav: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/overview", label: "Overview", icon: Milestone },
      { href: "/discovery", label: "Discovery", icon: FileSearch },
      { href: "/requirements", label: "Requirements", icon: ListChecks },
    ],
  },
  {
    label: "Structure",
    items: [
      { href: "/processes", label: "Processes", icon: Workflow },
      { href: "/use-cases", label: "Use cases", icon: Route },
      { href: "/rules", label: "Business rules", icon: GitBranch },
      { href: "/data-model", label: "Data model", icon: Boxes },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/ui", label: "UI notes", icon: PanelTop },
      { href: "/acceptance", label: "Acceptance and tests", icon: FlaskConical },
      { href: "/trace", label: "Traceability", icon: Waypoints },
      { href: "/documents", label: "Documents and exports", icon: FileDown },
      { href: "/activity", label: "Activity history", icon: History },
    ],
  },
]

export const recordNav: NavGroup = {
  label: "Also in this record",
  items: [
    { href: "/people", label: "Teams and stakeholders", icon: Users },
    { href: "/roles", label: "Roles and RACI", icon: Scale },
    { href: "/outcomes", label: "Outcomes and needs", icon: Milestone },
    { href: "/glossary", label: "Glossary", icon: BookOpen },
    { href: "/data", label: "Data register", icon: Database },
    { href: "/flows", label: "Flows", icon: Route },
    { href: "/stories", label: "Epics and stories", icon: Compass },
    { href: "/baseline", label: "Baseline", icon: Stamp },
  ],
}
