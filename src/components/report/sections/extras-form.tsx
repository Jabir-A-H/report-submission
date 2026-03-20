'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AdaptiveMatrix, MatrixField } from '../adaptive-matrix'
import { useReport } from '../report-context'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/utils/supabase/client'

const extras = [
  "মক্তব সংখ্যা",
  "মক্তব বৃদ্ধি",
  "মহানগরী পরিচালিত",
  "স্থানীয়ভাবে পরিচালিত",
  "মহানগরীর সফর",
  "থানা কমিটির সফর",
  "থানা প্রতিনিধির সফর",
  "ওয়ার্ড প্রতিনিধির সফর",
]

export function ExtrasForm() {
  const { reportId, setIsSaving, setLastSaved } = useReport()
  const supabase = createClient()
  
  const { register, watch } = useForm()
  const formData = watch()
  const debouncedData = useDebounce(formData, 1000)

  useEffect(() => {
    async function syncData() {
      if (!reportId || Object.keys(debouncedData).length === 0) return

      setIsSaving(true)
      try {
        const updatePromises = Object.entries(debouncedData).map(([category, value]) => {
          if (value === undefined) return Promise.resolve()
          
          return supabase
            .from('report_extra')
            .update({ number: value })
            .eq('report_id', reportId)
            .eq('category', category)
        })

        await Promise.all(updatePromises)
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to sync extras:', err)
      } finally {
        setIsSaving(false)
      }
    }

    syncData()
  }, [debouncedData, reportId, setIsSaving, setLastSaved, supabase])

  return (
    <div id="extras" className="scroll-mt-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Extras & Additional Activities</h2>
        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full uppercase">Update Mode</span>
      </div>

      <AdaptiveMatrix title="Moktob & Visits" desktopColumns={4}>
        {extras.map((item) => (
          <MatrixField key={item} label={item}>
            <input 
              type="number"
              {...register(`${item}`, { valueAsNumber: true })}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all text-center font-mono text-sm"
              defaultValue={0}
            />
          </MatrixField>
        ))}
      </AdaptiveMatrix>
    </div>
  )
}
