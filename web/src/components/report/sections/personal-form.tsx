'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AdaptiveMatrix, MatrixField } from '../adaptive-matrix'
import { useReport } from '../report-context'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/utils/supabase/client'

const categories = [
  "Teaching",
  "Learning",
  "Olama Invited",
  "Became Shohojogi",
  "Became Sokrio Shohojogi",
  "Became Kormi",
  "Became Rukon",
]

export function PersonalForm() {
  const { reportId, setIsSaving, setLastSaved } = useReport()
  const supabase = createClient()
  
  const { register, watch } = useForm()
  const formData = watch()
  const debouncedData = useDebounce(formData, 1000)

  useEffect(() => {
    async function syncData() {
      if (!reportId || !debouncedData.personal) return

      setIsSaving(true)
      try {
        const updates = Object.entries(debouncedData.personal).map(([category, values]: [string, any]) => ({
          report_id: reportId,
          category,
          ...values
        }))

        const { error } = await supabase
          .from('report_personal')
          .upsert(updates, { onConflict: 'report_id,category' })

        if (error) throw error
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to sync personal data:', err)
      } finally {
        setIsSaving(false)
      }
    }

    syncData()
  }, [debouncedData, reportId, setIsSaving, setLastSaved])

  return (
    <div id="personal" className="scroll-mt-24">
      <AdaptiveMatrix title="Personal & Membership Tracking" desktopColumns={4}>
        {categories.map((cat) => (
          <MatrixField key={cat} label={cat}>
            <input 
              type="number"
              {...register(`personal.${cat}.teaching`, { valueAsNumber: true })} // Mapping 'teaching' as primary value for now
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-center"
              defaultValue={0}
            />
          </MatrixField>
        ))}
      </AdaptiveMatrix>
    </div>
  )
}
