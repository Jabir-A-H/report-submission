'use client'

import React, { useState } from 'react'
import { Edit2, X, Check, AlertTriangle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface CorrectionButtonProps {
  year: number
  month: number
  reportType?: string
  section: string
  field: string
  category?: string
  currentValue: number
}

export function CorrectionButton({ year, month, reportType = 'monthly', section, field, category, currentValue }: CorrectionButtonProps) {
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
          report_type: reportType
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
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
        <div className="p-6 border-b border-border flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-foreground leading-tight">সংশোধন করুন</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {field} • {category || 'সাধারণ'}
            </p>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
              এটি এই মাসের সমষ্টিগত মান পরিবর্তন করবে। মূল জোন রিপোর্টগুলো অপরিবর্তিত থাকবে।
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">সংশোধিত মান</label>
            <input 
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full text-2xl font-black p-5 bg-muted border-2 border-transparent focus:border-primary focus:bg-card text-foreground rounded-2xl outline-none transition-all"
            />
            <p className="text-[10px] text-muted-foreground px-1 italic">মূল গণনাকৃত মান: {currentValue}</p>
          </div>
        </div>

        <div className="p-6 bg-muted/50 flex gap-3">
          <button 
            onClick={() => setIsOpen(false)}
            className="grow px-6 py-4 text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
          >
            বাতিল
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="grow flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {isSaving ? <Check className="animate-pulse" /> : <Check size={18} />}
            নিশ্চিত করুন
          </button>
        </div>
      </div>
    </div>
  )
}
