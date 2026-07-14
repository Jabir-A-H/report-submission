'use client'

import { ThemeToggle } from './theme-toggle'
import { LanguageToggle } from './language-toggle'
import { Globe, Palette } from 'lucide-react'
import { useLanguage } from '@/components/providers/language-provider'

export function AppearanceFooterToggle() {
  const { language } = useLanguage()

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
      {/* Inline Language Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs font-bold hidden sm:inline">
            {language === 'bn' ? 'ভাষা:' : 'Language:'}
          </span>
        </div>
        <LanguageToggle />
      </div>

      <div className="h-4 w-px bg-border/60 hidden sm:block" />

      {/* Inline Theme Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Palette className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs font-bold hidden sm:inline">
            {language === 'bn' ? 'থিম:' : 'Theme:'}
          </span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  )
}
