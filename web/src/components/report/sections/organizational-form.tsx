'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AdaptiveMatrix, MatrixField } from '../adaptive-matrix'
import { useReport } from '../report-context'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/utils/supabase/client'

const categories = [
  "Unit Info",
  "Talimul Quran",
  "Associate Members",
  "Full Members (Rukon)",
  "Regular Workers",
]

export function OrganizationalForm() {
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
        const updates = Object.entries(debouncedData).map(([category, values]: [string, any]) => ({
          report_id: reportId,
          category,
          ...values
        }))

        const { error } = await supabase
          .from('report_organizational')
          .upsert(updates, { onConflict: 'report_id,category' })

        if (error) throw error
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to sync organizational data:', err)
      } finally {
        setIsSaving(false)
      }
    }

    syncData()
  }, [debouncedData, reportId, setIsSaving, setLastSaved])

  return (
    <div id="organizational" className="scroll-mt-24">
      <AdaptiveMatrix title="Organizational Details" desktopColumns={3}>
        {categories.map((cat) => (
          <React.Fragment key={cat}>
            <MatrixField label={`${cat} - Total`}>
              <input 
                type="number"
                {...register(`${cat}.number`, { valueAsNumber: true })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                defaultValue={0}
              />
            </MatrixField>
            <MatrixField label={`${cat} - Increase`}>
              <input 
                type="number"
                {...register(`${cat}.increase`, { valueAsNumber: true })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                defaultValue={0}
              />
            </MatrixField>
            <div className="hidden md:block"></div> {/* Spacer for 3-col grid */}
          </React.Fragment>
        ))}
      </AdaptiveMatrix>
    </div>
  )
}
