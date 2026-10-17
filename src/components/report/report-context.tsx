'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface FailedFieldInfo {
  name: string
  value: any
  section: string
  table: string
  category?: string
  error: string
}

interface ReportContextType {
  reportId: number | null
  setReportId: (id: number) => void
  data: Record<string, any>
  isSaving: boolean
  lastSaved: Date | null
  saveError: string | null
  loadError: string | null
  failedFields: Record<string, FailedFieldInfo>
  clearSaveError: () => void
  updateField: (name: string, value: any, section: string, table?: string, category?: string) => Promise<{ success: boolean; error?: any }>
  loadReport: (id: number) => Promise<{ success: boolean; error?: any }>
  retryFailedField: (key: string) => Promise<void>
  retryAllFailed: () => Promise<void>
}

const ReportContext = createContext<ReportContextType | undefined>(undefined)

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [reportId, setReportId] = useState<number | null>(null)
  const [data, setData] = useState<Record<string, any>>({})
  const [pendingSavesCount, setPendingSavesCount] = useState<number>(0)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [failedFields, setFailedFields] = useState<Record<string, FailedFieldInfo>>({})
  
  const supabase = useMemo(() => createClient(), [])

  const isSaving = pendingSavesCount > 0
  const saveError = useMemo(() => {
    const count = Object.keys(failedFields).length
    return count > 0 ? 'সংরক্ষণ ব্যর্থ হয়েছে' : null
  }, [failedFields])

  const clearSaveError = useCallback(() => setFailedFields({}), [])

  const loadReport = useCallback(async (id: number): Promise<{ success: boolean; error?: any }> => {
    setPendingSavesCount(c => c + 1)
    setLoadError(null)
    try {
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
        setLoadError(null)
        return { success: true }
      } else {
        console.error('Failed to load report:', error)
        const errMessage = error?.message || 'রিপোর্ট ডেটা লোড করতে সমস্যা হয়েছে'
        setLoadError(errMessage)
        return { success: false, error: error || new Error(errMessage) }
      }
    } finally {
      setPendingSavesCount(c => Math.max(0, c - 1))
    }
  }, [supabase])

  const updateField = useCallback(async (
    name: string,
    value: any,
    section: string,
    table: string = 'report',
    category?: string
  ): Promise<{ success: boolean; error?: any }> => {
    if (!reportId) return { success: false, error: new Error('No active reportId') }

    const fieldKey = `${table}:${category || ''}:${name}`
    setPendingSavesCount(c => c + 1)

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
        let arrayKey = "";
        if (table === 'report_course') arrayKey = 'courses';
        else if (table === 'report_organizational') arrayKey = 'organizational';
        else if (table === 'report_personal') arrayKey = 'personal';
        else if (table === 'report_meeting') arrayKey = 'meeting';
        else if (table === 'report_extra') arrayKey = 'extra';

        if (arrayKey && Array.isArray(nextData[arrayKey])) {
           nextData[arrayKey] = nextData[arrayKey].map((row: any) => 
              row.category === category ? { ...row, [name]: value } : row
           );
        }
      }
      return nextData;
    });

    try {
      let query = supabase.from(table).update({ [name]: value }).eq('report_id', reportId).select('id')
      
      if (table === 'report') {
        query = supabase.from('report').update({ [name]: value }).eq('id', reportId).select('id')
      } else if (category) {
        query = query.eq('category', category)
      }

      const { data: updated, error } = await query

      if (!error && updated && updated.length > 0) {
        setLastSaved(new Date())
        setFailedFields(prev => {
          if (!prev[fieldKey]) return prev
          const next = { ...prev }
          delete next[fieldKey]
          return next
        })
        return { success: true }
      } else {
        const errMsg = error ? `Failed to save to ${table}` : `0-row update on ${table} (name=${name}, category=${category})`
        console.error(errMsg, error)
        setFailedFields(prev => ({
          ...prev,
          [fieldKey]: {
            name,
            value,
            section,
            table,
            category,
            error: 'সংরক্ষণ ব্যর্থ হয়েছে'
          }
        }))
        return { success: false, error: error || new Error(errMsg) }
      }
    } catch (err: any) {
      console.error(`Unexpected save error on ${fieldKey}:`, err)
      setFailedFields(prev => ({
        ...prev,
        [fieldKey]: {
          name,
          value,
          section,
          table,
          category,
          error: 'সংরক্ষণ ব্যর্থ হয়েছে'
        }
      }))
      return { success: false, error: err }
    } finally {
      setPendingSavesCount(c => Math.max(0, c - 1))
    }
  }, [reportId, supabase])

  const retryFailedField = useCallback(async (key: string) => {
    const item = failedFields[key]
    if (!item) return
    await updateField(item.name, item.value, item.section, item.table, item.category)
  }, [failedFields, updateField])

  const retryAllFailed = useCallback(async () => {
    const items = Object.values(failedFields)
    for (const item of items) {
      await updateField(item.name, item.value, item.section, item.table, item.category)
    }
  }, [failedFields, updateField])

  const contextValue = useMemo(() => ({
    reportId, 
    setReportId, 
    data, 
    isSaving, 
    lastSaved,
    saveError,
    loadError,
    failedFields,
    clearSaveError,
    updateField,
    loadReport,
    retryFailedField,
    retryAllFailed
  }), [
    reportId,
    data,
    isSaving,
    lastSaved,
    saveError,
    loadError,
    failedFields,
    clearSaveError,
    updateField,
    loadReport,
    retryFailedField,
    retryAllFailed
  ])

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
