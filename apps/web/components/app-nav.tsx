"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Play, History } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/practice",  label: "Practice",  icon: Play },
  { href: "/interviews",label: "Interviews", icon: History },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 no-underline",
              active
                ? "bg-primary-bg text-primary font-medium border-l-2 border-primary pl-[10px]"
                : "text-text-muted hover:text-text-primary hover:bg-gray-50"
            )}
          >
            <Icon
              size={18}
              className={cn(active ? "text-primary" : "text-text-muted")}
            />
            {label}
          </Link>
        )
      })}
    </>
  )
}
