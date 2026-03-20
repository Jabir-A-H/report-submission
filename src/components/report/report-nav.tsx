'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'header', title: 'Header', icon: Clock },
  { id: 'courses', title: 'Courses', icon: Circle },
  { id: 'organizational', title: 'Organizational', icon: Circle },
  { id: 'personal', title: 'Personal', icon: Circle },
  { id: 'meetings', title: 'Meetings', icon: Circle },
  { id: 'extras', title: 'Extras', icon: Circle },
  { id: 'comments', title: 'Comments', icon: Circle },
]

export function ReportNav({ currentSection }: { currentSection: string }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="flex flex-col gap-1.5 p-3 glass-panel rounded-2xl shadow-xl h-fit sticky top-24 w-60 overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-3">
        <h3 className="font-bold text-primary/70 text-[10px] uppercase tracking-[0.2em]">Navigation</h3>
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      </div>
      
      <div className="relative space-y-1">
        {sections.map((section) => {
          const isActive = currentSection === section.id
          
          return (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className={cn(
                "relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group w-full text-left outline-none",
                isActive ? "text-primary-foreground" : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="lava-lamp"
                  className="absolute inset-0 bg-primary shadow-lg shadow-primary/25 z-0"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  style={{ borderRadius: '0.75rem' }}
                />
              )}
              
              <section.icon className={cn(
                "w-4 h-4 z-10 relative",
                isActive ? "text-white" : "text-foreground/40 group-hover:text-foreground/70"
              )} />
              
              <span className="relative z-10">{section.title}</span>
              
              {isActive && (
                <motion.div 
                  layoutId="active-dot"
                  className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full z-10"
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
