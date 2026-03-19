'use client'

import { usePathname, useRouter } from 'next/navigation'
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
    <nav className="flex flex-col gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
      <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2 px-2">Sections</h3>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => scrollTo(section.id)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group w-full text-left",
            currentSection === section.id 
              ? "bg-cyan-50 text-cyan-700 shadow-sm border border-cyan-100" 
              : "text-gray-500 hover:bg-gray-50"
          )}
        >
          <section.icon className={cn(
            "w-4 h-4",
            currentSection === section.id ? "text-cyan-600" : "text-gray-400 group-hover:text-gray-600"
          )} />
          {section.title}
        </button>
      ))}
    </nav>
  )
}
