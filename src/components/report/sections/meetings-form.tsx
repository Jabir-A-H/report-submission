'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AdaptiveMatrix, MatrixField } from '../adaptive-matrix'
import { useReport } from '../report-context'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/utils/supabase/client'

const categories = [
  "City Level",
  "Thana Level",
  "Ward Level",
  "Unit Level",
]

export function MeetingsForm() {
  const { reportId, setIsSaving, setLastSaved } = useReport()
  const supabase = createClient()
  
  const { register, watch } = useForm()
  const formData = watch()
  const debouncedData = useDebounce(formData, 1000)

  useEffect(() => {
    async function syncData() {
      if (!reportId || !debouncedData.meetings) return

      setIsSaving(true)
      try {
        // Map UI labels to DB columns
        const updates = Object.entries(debouncedData.meetings).map(([category, values]: [string, any]) => ({
          report_id: reportId,
          category,
          thana_count: values.count,
          thana_avg_attendance: values.avg
        }))

        const { error } = await supabase
          .from('report_meeting')
          .upsert(updates, { onConflict: 'report_id,category' })

        if (error) throw error
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to sync meetings:', err)
      } finally {
        setIsSaving(false)
      }
    }

    syncData()
  }, [debouncedData, reportId, setIsSaving, setLastSaved])

  return (
    <div id="meetings" className="scroll-mt-24">
      <AdaptiveMatrix title="Meetings & Attendance" desktopColumns={2}>
        {categories.map((cat) => (
          <React.Fragment key={cat}>
            <MatrixField label={`${cat} - Count`}>
              <input 
                type="number"
                {...register(`meetings.${cat}.count`, { valueAsNumber: true })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                defaultValue={0}
              />
            </MatrixField>
            <MatrixField label={`${cat} - Avg Attendance`}>
              <input 
                type="number"
                {...register(`meetings.${cat}.avg`, { valueAsNumber: true })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                defaultValue={0}
              />
            </MatrixField>
          </React.Fragment>
        ))}
      </AdaptiveMatrix>
    </div>
  )
}
