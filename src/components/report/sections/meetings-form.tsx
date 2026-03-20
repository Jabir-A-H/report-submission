'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AdaptiveMatrix, MatrixField } from '../adaptive-matrix'
import { useReport } from '../report-context'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/utils/supabase/client'

const categories = [
  "কমিটি বৈঠক হয়েছে",
  "মুয়াল্লিমাদের নিয়ে বৈঠক",
  "Committee Orientation",
  "Muallima Orientation",
]

const fields = [
  { id: 'city_count', label: 'City Count' },
  { id: 'city_avg_attendance', label: 'City Avg' },
  { id: 'thana_count', label: 'Thana Count' },
  { id: 'thana_avg_attendance', label: 'Thana Avg' },
  { id: 'ward_count', label: 'Ward Count' },
  { id: 'ward_avg_attendance', label: 'Ward Avg' },
]

export function MeetingsForm() {
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
        const updatePromises = Object.entries(debouncedData).map(([category, values]) => {
          if (!values) return Promise.resolve()
          
          return supabase
            .from('report_meeting')
            .update(values)
            .eq('report_id', reportId)
            .eq('category', category)
        })

        await Promise.all(updatePromises)
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to sync meetings:', err)
      } finally {
        setIsSaving(false)
      }
    }

    syncData()
  }, [debouncedData, reportId, setIsSaving, setLastSaved, supabase])

  return (
    <div id="meetings" className="scroll-mt-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Meetings & Attendance</h2>
        <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full uppercase">Update Mode</span>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">{cat}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-4">
              {fields.map((field) => (
                <MatrixField key={field.id} label={field.label}>
                  <input 
                    type="number"
                    {...register(`${cat}.${field.id}`, { valueAsNumber: true })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-center text-sm"
                    defaultValue={0}
                  />
                </MatrixField>
              ))}
            </div>
            <MatrixField label="Comments / Notes">
              <input 
                {...register(`${cat}.comments`)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                placeholder="Add any specific meeting notes here..."
              />
            </MatrixField>
          </div>
        ))}
      </div>
    </div>
  )
}
