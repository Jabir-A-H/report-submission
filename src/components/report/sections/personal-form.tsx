'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AdaptiveMatrix, MatrixField } from '../adaptive-matrix'
import { useReport } from '../report-context'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/utils/supabase/client'

const categories = [
  "রুকন",
  "কর্মী",
  "সক্রিয় সহযোগী",
]

const fields = [
  { id: 'teaching', label: 'Teaching' },
  { id: 'learning', label: 'Learning' },
  { id: 'olama_invited', label: 'Olama Invited' },
  { id: 'became_shohojogi', label: 'Became Shohojogi' },
  { id: 'became_sokrio_shohojogi', label: 'Became Sokrio Shohojogi' },
  { id: 'became_kormi', label: 'Became Kormi' },
  { id: 'became_rukon', label: 'Became Rukon' },
]

export function PersonalForm() {
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
            .from('report_personal')
            .update(values)
            .eq('report_id', reportId)
            .eq('category', category)
        })

        await Promise.all(updatePromises)
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to sync personal data:', err)
      } finally {
        setIsSaving(false)
      }
    }

    syncData()
  }, [debouncedData, reportId, setIsSaving, setLastSaved, supabase])

  return (
    <div id="personal" className="scroll-mt-24 space-y-6">
       <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Personal & Membership Tracking</h2>
        <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full uppercase">Update Mode</span>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">{cat}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {fields.map((field) => (
                <MatrixField key={field.id} label={field.label}>
                  <input 
                    type="number"
                    {...register(`${cat}.${field.id}`, { valueAsNumber: true })}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all text-center text-sm font-mono"
                    defaultValue={0}
                  />
                </MatrixField>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
