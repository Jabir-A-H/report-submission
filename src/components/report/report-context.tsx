'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ReportContextType {
  reportId: number | null
  setReportId: (id: number) => void
  data: Record<string, any>
  isSaving: boolean
  lastSaved: Date | null
  updateField: (name: string, value: any, section: string, table?: string, category?: string) => Promise<void>
  loadReport: (id: number) => Promise<void>
}

const ReportContext = createContext<ReportContextType | undefined>(undefined)

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [reportId, setReportId] = useState<number | null>(null)
  const [data, setData] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const supabase = useMemo(() => createClient(), [])

  const loadReport = useCallback(async (id: number) => {
    setIsSaving(true)
    const { data: reportData, error } = await supabase
      .from('report')
      .select(`
        *,
        header:report_header(*),
        courses:report_course(*),
        organizational:report_organizational(*),
        personal:report_personal(*),
        meeting:report_meeting(*),
        extra:report_extra(*),
        comment:report_comment(*)
      `)
      .eq('id', id)
      .single()
    
    if (reportData && !error) {
      setData(reportData)
      setReportId(id)
    }
    setIsSaving(false)
  }, [supabase])

  const updateField = useCallback(async (name: string, value: any, section: string, table: string = 'report', category?: string) => {
    if (!reportId) return

    setIsSaving(true)
    // Optimistic update for the main data object
    setData(prev => {
      const nextData = { ...prev };
      
      if (table === 'report') {
        nextData[name] = value;
      } else if (table === 'report_header') {
        nextData.header = { ...(nextData.header || {}), [name]: value };
      } else if (table === 'report_comment') {
        nextData.comment = { ...(nextData.comment || {}), [name]: value };
      } else if (category) {
        // Find the right array to update
        let arrayKey = "";
        if (table === 'report_course') arrayKey = 'courses';
        else if (table === 'report_organizational') arrayKey = 'organizational';
        else if (table === 'report_personal') arrayKey = 'personal';
        else if (table === 'report_meeting') arrayKey = 'meeting';
        else if (table === 'report_extra') arrayKey = 'extra';

        if (arrayKey && Array.isArray(nextData[arrayKey])) {
           // We only optimistically update if the row already exists for now.
           // A more robust app would insert the row if it's missing.
           nextData[arrayKey] = nextData[arrayKey].map((row: any) => 
              row.category === category ? { ...row, [name]: value } : row
           );
        }
      }
      return nextData;
    });

    let query = supabase.from(table).update({ [name]: value }).eq('report_id', reportId)
    
    // For the main 'report' table, we use 'id'
    if (table === 'report') {
      query = supabase.from('report').update({ [name]: value }).eq('id', reportId)
    } else if (category) {
      query = query.eq('category', category)
    }

    const { error } = await query

    if (!error) {
      setLastSaved(new Date())
    } else {
      console.error(`Failed to save to ${table}:`, error)
    }
    setIsSaving(false)
  }, [reportId, supabase])

  const contextValue = useMemo(() => ({
    reportId, 
    setReportId, 
    data, 
    isSaving, 
    lastSaved, 
    updateField,
    loadReport 
  }), [reportId, data, isSaving, lastSaved, updateField, loadReport])

  return (
    <ReportContext.Provider value={contextValue}>
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
