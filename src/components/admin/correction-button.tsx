'use client'

import React, { useState } from 'react'
import { Edit2, X, Check, AlertTriangle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface CorrectionButtonProps {
  year: number
  month: number
  section: string
  field: string
  category?: string
  currentValue: number
}

export function CorrectionButton({ year, month, section, field, category, currentValue }: CorrectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newValue, setNewValue] = useState(currentValue.toString())
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('city_report_override')
        .upsert({
          year,
          month,
          section,
          field,
          category,
          value: newValue,
          report_type: 'monthly' // Defaulting for now
        }, { onConflict: 'year,month,section,field,category' })

      if (error) throw error
      setIsOpen(false)
      window.location.reload() // Quick way to refresh views for now
    } catch (err) {
      console.error('Failed to save correction:', err)
      alert('Failed to save correction')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-cyan-50 rounded text-cyan-500 transition-all"
        title="Apply Correction"
      >
        <Edit2 size={12} />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-50 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-gray-900 leading-tight">Apply Correction</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              {field} • {category || 'General'}
            </p>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              This will override the aggregated total from all zones for this month. 
              The original zone reports will remain unchanged.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Corrected Total Value</label>
            <input 
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full text-2xl font-black p-5 bg-gray-50 border-2 border-transparent focus:border-cyan-500 focus:bg-white rounded-2xl outline-none transition-all"
            />
            <p className="text-[10px] text-gray-400 px-1 italic">Original Calculated Sum: {currentValue}</p>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 flex gap-3">
          <button 
            onClick={() => setIsOpen(false)}
            className="flex-grow px-6 py-4 text-sm font-bold text-gray-500 hover:text-gray-700 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-grow flex items-center justify-center gap-2 px-6 py-4 bg-cyan-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-cyan-100 hover:bg-cyan-700 disabled:opacity-50 transition-all"
          >
            {isSaving ? <Check className="animate-pulse" /> : <Check size={18} />}
            Confirm Correction
          </button>
        </div>
      </div>
    </div>
  )
}
