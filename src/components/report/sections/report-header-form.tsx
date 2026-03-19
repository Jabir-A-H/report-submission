'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AdaptiveMatrix, MatrixField } from '../adaptive-matrix'
import { useReport } from '../report-context'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/utils/supabase/client'

const headerSchema = z.object({
  responsible_name: z.string().min(2, "Name is too short"),
  thana: z.string().min(1, "Thana is required"),
  ward: z.number().int().min(1),
  total_muallima: z.number().int().min(0),
  muallima_increase: z.number().int().min(0),
  muallima_decrease: z.number().int().min(0),
  certified_muallima: z.number().int().min(0),
  total_unit: z.number().int().min(0),
})

type HeaderData = z.infer<typeof headerSchema>

export function ReportHeaderForm() {
  const { reportId, setReportId, setIsSaving, setLastSaved } = useReport()
  const supabase = createClient()
  
  const { register, watch, formState: { errors } } = useForm<HeaderData>({
    resolver: zodResolver(headerSchema),
    defaultValues: {
      responsible_name: '',
      thana: '',
      ward: 1,
      total_muallima: 0,
      muallima_increase: 0,
      muallima_decrease: 0,
      certified_muallima: 0,
      total_unit: 0,
    }
  })

  const formData = watch()
  const debouncedData = useDebounce(formData, 800)

  useEffect(() => {
    async function syncData() {
      if (!debouncedData.responsible_name || !debouncedData.thana) return

      setIsSaving(true)
      try {
        let currentReportId = reportId

        // 1. Create report if it doesn't exist
        if (!currentReportId) {
          const { data: newReport, error: reportError } = await supabase
            .from('reports')
            .insert({ status: 'draft' })
            .select()
            .single()
          
          if (reportError) throw reportError
          currentReportId = newReport.id
          setReportId(newReport.id)
        }

        // 2. Upsert header data
        const { error } = await supabase
          .from('report_header')
          .upsert({
            report_id: currentReportId,
            ...debouncedData
          })

        if (error) throw error
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to auto-save:', err)
      } finally {
        setIsSaving(false)
      }
    }

    syncData()
  }, [debouncedData, reportId, setReportId, setIsSaving, setLastSaved])

  return (
    <AdaptiveMatrix title="Report Header" desktopColumns={3}>
      <MatrixField label="Responsible Name">
        <input 
          {...register('responsible_name')} 
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          placeholder="Enter name"
        />
        {errors.responsible_name && <span className="text-xs text-red-500">{errors.responsible_name.message}</span>}
      </MatrixField>

      <MatrixField label="Thana">
        <input 
          {...register('thana')} 
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
        />
      </MatrixField>

      <MatrixField label="Ward">
        <input 
          type="number"
          {...register('ward', { valueAsNumber: true })} 
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
        />
      </MatrixField>

      <MatrixField label="Total Muallima">
        <input 
          type="number"
          {...register('total_muallima', { valueAsNumber: true })} 
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
        />
      </MatrixField>

      <MatrixField label="Muallima Increase">
        <input 
          type="number"
          {...register('muallima_increase', { valueAsNumber: true })} 
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
        />
      </MatrixField>

      <MatrixField label="Muallima Decrease">
        <input 
          type="number"
          {...register('muallima_decrease', { valueAsNumber: true })} 
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
        />
      </MatrixField>

      <MatrixField label="Certified Muallima">
        <input 
          type="number"
          {...register('certified_muallima', { valueAsNumber: true })} 
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
        />
      </MatrixField>

      <MatrixField label="Total Unit">
        <input 
          type="number"
          {...register('total_unit', { valueAsNumber: true })} 
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
        />
      </MatrixField>
    </AdaptiveMatrix>
  )
}
