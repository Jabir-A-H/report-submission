'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ReportContextType {
  reportId: number | null
  setReportId: (id: number) => void
  isSaving: boolean
  setIsSaving: (saving: boolean) => void
  lastSaved: Date | null
  setLastSaved: (date: Date) => void
}

const ReportContext = createContext<ReportContextType | undefined>(undefined)

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [reportId, setReportId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  return (
    <ReportContext.Provider value={{ reportId, setReportId, isSaving, setIsSaving, lastSaved, setLastSaved }}>
      {children}
    </ReportContext.Provider>
  )
}

export function useReport() {
  const context = useContext(ReportContext)
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider')
  }
  return context
}
