'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AdaptiveMatrix, MatrixField } from '../adaptive-matrix'
import { useReport } from '../report-context'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/utils/supabase/client'

const categories = [
  "দাওয়াত দান",
  "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন",
  "সহযোগী হয়েছে",
  "সম্মতি দিয়েছেন",
  "সক্রিয় সহযোগী",
  "কর্মী",
  "রুকন",
  "দাওয়াতী ইউনিট",
  "ইউনিট",
  "সূধী",
  "এককালীন",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)",
  "বই বিলি",
  "বই বিক্রি",
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
        const updatePromises = Object.entries(debouncedData).map(([category, values]) => {
          if (!values) return Promise.resolve()
          
          return supabase
            .from('report_organizational')
            .update(values)
            .eq('report_id', reportId)
            .eq('category', category)
        })

        await Promise.all(updatePromises)
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to sync organizational data:', err)
      } finally {
        setIsSaving(false)
      }
    }

    syncData()
  }, [debouncedData, reportId, setIsSaving, setLastSaved, supabase])

  return (
    <div id="organizational" className="scroll-mt-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Organizational Details</h2>
        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full uppercase">Update-only Mode</span>
      </div>

      <AdaptiveMatrix title="Category Tracking" desktopColumns={4}>
        {categories.map((cat) => (
          <React.Fragment key={cat}>
            <div className="lg:col-span-1 flex items-center">
              <span className="text-sm font-bold text-gray-700">{cat}</span>
            </div>
            <MatrixField label="Total">
              <input 
                type="number"
                {...register(`${cat}.number`, { valueAsNumber: true })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center"
                defaultValue={0}
              />
            </MatrixField>
            <MatrixField label="Increase">
              <input 
                type="number"
                {...register(`${cat}.increase`, { valueAsNumber: true })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center"
                defaultValue={0}
              />
            </MatrixField>
            <MatrixField label="Amount/Comment">
              <input 
                {...register(`${cat}.amount`)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                placeholder="..."
              />
            </MatrixField>
          </React.Fragment>
        ))}
      </AdaptiveMatrix>
    </div>
  )
}
