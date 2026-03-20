'use client'

import * as React from 'react'
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  useMatches,
  KBarResults,
} from 'kbar'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  PlusCircle, 
  Search,
  FileText,
  User,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function CommandBar({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const actions = [
    {
      id: "home",
      name: "Dashboard",
      shortcut: ["h"],
      keywords: "back home main index dashboard",
      perform: () => router.push("/"),
      icon: <Home className="w-5 h-5 mr-3" />,
    },
    {
      id: "new-report",
      name: "Start New Report",
      shortcut: ["n"],
      keywords: "create add new report submission",
      perform: () => router.push("/report/new"),
      icon: <PlusCircle className="w-5 h-5 mr-3" />,
    },
    {
      id: "all-reports",
      name: "View All Reports",
      shortcut: ["r"],
      keywords: "view list all reports history",
      perform: () => router.push("/"),
      icon: <FileText className="w-5 h-5 mr-3" />,
    },
    {
      id: "profile",
      name: "My Profile",
      shortcut: ["p"],
      keywords: "user account settings profile",
      perform: () => router.push("/profile"),
      icon: <User className="w-5 h-5 mr-3" />,
    },
    {
      id: "logout",
      name: "Logout",
      shortcut: ["l"],
      keywords: "sign out exit quit",
      perform: () => router.push("/login"),
      icon: <LogOut className="w-5 h-5 mr-3 text-red-500" />,
    },
  ]

  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner className="bg-black/60 backdrop-blur-sm p-4 z-[9999]">
          <KBarAnimator className="w-full max-w-[600px] bg-card rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="flex items-center px-5 py-4 border-b border-border bg-card">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <KBarSearch className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base" />
              <kbd className="px-2 py-1 text-[10px] font-bold text-muted-foreground bg-muted rounded border border-border shadow-sm">ESC</kbd>
            </div>
            <div className="max-h-[400px] overflow-y-auto pb-3">
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  )
}

function RenderResults() {
  const { results } = useMatches()

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold opacity-50">
            {item}
          </div>
        ) : (
          <div
            className={cn(
              "px-4 py-3 flex items-center cursor-pointer transition-colors m-2 rounded-lg",
              active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            )}
          >
            <div className="flex items-center flex-1">
              {item.icon}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.name}</span>
                {item.subtitle && (
                  <span className="text-xs opacity-70">{item.subtitle}</span>
                )}
              </div>
            </div>
            {item.shortcut?.length ? (
              <div className="flex gap-1">
                {item.shortcut.map((sc) => (
                  <kbd
                    key={sc}
                    className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded border",
                      active ? "bg-white/20 border-white/20" : "bg-muted border-border"
                    )}
                  >
                    {sc.toUpperCase()}
                  </kbd>
                ))}
              </div>
            ) : null}
          </div>
        )
      }
    />
  )
}
