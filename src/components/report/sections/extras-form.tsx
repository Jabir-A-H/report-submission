'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AdaptiveMatrix, MatrixField } from '../adaptive-matrix'
import { useReport } from '../report-context'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/utils/supabase/client'

const extras = [
  "Dawah Materials Distributed",
  "Social Work Hours",
  "Relief Activities",
  "New Unit Proposals",
]

export function ExtrasForm() {
  const { reportId, setIsSaving, setLastSaved } = useReport()
  const supabase = createClient()
  
  const { register, watch } = useForm()
  const formData = watch()
  const debouncedData = useDebounce(formData, 1000)

  useEffect(() => {
    async function syncData() {
      if (!reportId || !debouncedData.extras) return

      setIsSaving(true)
      try {
        const updates = Object.entries(debouncedData.extras).map(([category, value]: [string, any]) => ({
          report_id: reportId,
          category,
          number: value
        }))

        const { error } = await supabase
          .from('report_extra')
          .upsert(updates, { onConflict: 'report_id,category' })

        if (error) throw error
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to sync extras:', err)
      } finally {
        setIsSaving(false)
      }
    }

    syncData()
  }, [debouncedData, reportId, setIsSaving, setLastSaved])

  return (
    <div id="extras" className="scroll-mt-24">
      <AdaptiveMatrix title="Extras & Additional Activities" desktopColumns={4}>
        {extras.map((item) => (
          <MatrixField key={item} label={item}>
            <input 
              type="number"
              {...register(`extras.${item}`, { valueAsNumber: true })}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-center"
              defaultValue={0}
            />
          </MatrixField>
        ))}
      </AdaptiveMatrix>
    </div>
  )
}
