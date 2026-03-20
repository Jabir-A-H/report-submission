'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AdaptiveMatrix, MatrixField } from '../adaptive-matrix'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useReport } from '../report-context'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/utils/supabase/client'

const courses = [
  "বিশিষ্টদের",
  "সাধারণদের",
  "কর্মীদের",
  "ইউনিট সভানেত্রী",
  "অগ্রসরদের",
  "শিশু- তা'লিমুল কুরআন",
  "নিরক্ষর- তা'লিমুস সলাত",
]

const fieldLabels = [
  { id: 'number', label: 'Number' },
  { id: 'increase', label: 'Increase' },
  { id: 'decrease', label: 'Decrease' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'students', label: 'Students' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'status_board', label: 'Board' },
  { id: 'status_qayda', label: 'Qayda' },
  { id: 'status_ampara', label: 'Ampara' },
  { id: 'status_quran', label: 'Quran' },
  { id: 'completed', label: 'Completed' },
  { id: 'correctly_learned', label: 'Correct' },
]

export function CoursesForm() {
  const [expandedCourse, setExpandedCourse] = React.useState<string | null>(courses[0])
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
        // Send updates concurrently for each modified category
        const updatePromises = Object.entries(debouncedData).map(([category, values]) => {
          if (!values) return Promise.resolve()
          
          return supabase
            .from('report_course')
            .update(values)
            .eq('report_id', reportId)
            .eq('category', category)
        })

        await Promise.all(updatePromises)
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to sync courses:', err)
      } finally {
        setIsSaving(false)
      }
    }

    syncData()
  }, [debouncedData, reportId, setIsSaving, setLastSaved, supabase])

  return (
    <div id="courses" className="space-y-6 scroll-mt-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Courses Detail (তা'লিমুল কুরআন)</h2>
        <span className="text-xs font-semibold bg-cyan-100 text-cyan-700 px-2.5 py-1 rounded-full uppercase">Matrix View</span>
      </div>

      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            <button 
              onClick={() => setExpandedCourse(expandedCourse === course ? null : course)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 font-bold">
                  {course[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{course}</h3>
                  <p className="text-xs text-gray-400">Track class progress and attendance</p>
                </div>
              </div>
              {expandedCourse === course ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {expandedCourse === course && (
              <div className="p-6 border-t border-gray-50 bg-white">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {fieldLabels.map((field) => (
                    <MatrixField key={field.id} label={field.label}>
                      <input 
                        type="number"
                        {...register(`${course}.${field.id}`, { valueAsNumber: true })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-center font-mono text-sm"
                        defaultValue={0}
                      />
                    </MatrixField>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
