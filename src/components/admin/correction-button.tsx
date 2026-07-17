'use client'

import React, { useState, useMemo } from 'react'
import { Edit2, X, Check, AlertTriangle, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface CorrectionButtonProps {
  year: number
  month: number
  reportType?: string
  section: string
  field: string
  category?: string
  currentValue: number | string
  computedValue?: number | string
  isOverridden?: boolean
  customTrigger?: React.ReactNode
  isText?: boolean
}

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBn(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return "০";
  return num
    .toString()
    .split("")
    .map((c) => (/\d/.test(c) ? BENGALI_DIGITS[parseInt(c, 10)] : c))
    .join("");
}

export function CorrectionButton({
  year,
  month,
  reportType = 'মাসিক',
  section,
  field,
  category,
  currentValue,
  computedValue,
  isOverridden = false,
  customTrigger,
  isText = false,
}: CorrectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newValue, setNewValue] = useState(currentValue.toString())
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Step 1: Explicitly check if an override already exists for this exact combination
      let query = supabase
        .from('city_report_override')
        .select('id')
        .eq('year', year)
        .eq('month', month)
        .eq('report_type', reportType)
        .eq('section', section)
        .eq('field', field)

      if (category) {
        query = query.eq('category', category)
      } else {
        query = query.is('category', null)
      }

      const { data: existing, error: findError } = await query.maybeSingle()
      if (findError) throw findError

      let saveError = null
      if (existing) {
        const { error } = await supabase
          .from('city_report_override')
          .update({ value: newValue })
          .eq('id', existing.id)
        saveError = error
      } else {
        const { error } = await supabase
          .from('city_report_override')
          .upsert({
            year,
            month,
            section,
            field,
            category: category || null,
            value: newValue,
            report_type: reportType
          }, { onConflict: 'year,month,report_type,section,field,category' })
        saveError = error
      }

      if (saveError) throw saveError
      setIsOpen(false)
      window.location.reload()
    } catch (err) {
      console.error('Failed to save correction:', err)
      alert('সংশোধন সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ওভাররাইডটি মুছে মূল সমষ্টিগত মান ফিরে পেতে চান?')) {
      return
    }
    setIsDeleting(true)
    try {
      let query = supabase
        .from('city_report_override')
        .delete()
        .eq('year', year)
        .eq('month', month)
        .eq('report_type', reportType)
        .eq('section', section)
        .eq('field', field)

      if (category) {
        query = query.eq('category', category)
      } else {
        query = query.is('category', null)
      }

      const { error } = await query
      if (error) throw error
      setIsOpen(false)
      window.location.reload()
    } catch (err) {
      console.error('Failed to delete override:', err)
      alert('ওভাররাইড মুছতে সমস্যা হয়েছে।')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) {
    if (customTrigger) {
      return (
        <span 
          onClick={() => {
            setNewValue(currentValue.toString())
            setIsOpen(true)
          }}
          className="inline-flex items-center cursor-pointer group/cb"
        >
          {customTrigger}
        </span>
      )
    }
    return (
      <button 
        onClick={() => {
          setNewValue(currentValue.toString())
          setIsOpen(true)
        }}
        className="opacity-60 group-hover:opacity-100 ml-1 min-h-[32px] min-w-[32px] inline-flex items-center justify-center hover:bg-primary/10 rounded-lg text-primary transition-all active:scale-95"
        title="সংশোধন করুন (Override)"
      >
        <Edit2 size={13} />
      </button>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && newValue === currentValue.toString() && !isSaving && !isDeleting) {
          setIsOpen(false);
        }
      }}
    >
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
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">সংশোধিত মান / মন্তব্য</label>
            {isText || (typeof currentValue === "string" && isNaN(Number(currentValue)) && currentValue !== "") ? (
              <textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={4}
                placeholder="আপনার মন্তব্য বা বিস্তারিত এখানে লিখুন..."
                className="w-full text-base font-medium p-4 bg-muted border-2 border-transparent focus:border-primary focus:bg-card text-foreground rounded-2xl outline-none transition-all resize-y"
              />
            ) : (
              <input 
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full text-2xl font-black p-5 bg-muted border-2 border-transparent focus:border-primary focus:bg-card text-foreground rounded-2xl outline-none transition-all"
              />
            )}
            <p className="text-xs font-medium text-muted-foreground px-1 pt-1">
              মূল সমষ্টিগত মান: <span className="font-bold text-foreground">{toBn(computedValue ?? currentValue)}</span>
              {isOverridden && <span className="ml-2 text-amber-600 font-semibold">(বর্তমানে ওভাররাইড করা)</span>}
            </p>
          </div>
        </div>

        <div className="p-6 bg-muted/50 flex gap-3">
          {isOverridden && (
            <button
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="px-4 py-4 text-sm font-bold text-red-600 hover:bg-red-500/10 rounded-2xl transition-all flex items-center justify-center gap-1.5 shrink-0"
              title="ওভাররাইড মুছে মূল মান ফেরত আনুন"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">মুছুন</span>
            </button>
          )}
          <button 
            onClick={() => setIsOpen(false)}
            disabled={isSaving || isDeleting}
            className="grow px-6 py-4 text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
          >
            বাতিল
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            className="grow flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {isSaving ? <Check className="animate-pulse" size={18} /> : <Check size={18} />}
            নিশ্চিত করুন
          </button>
        </div>
      </div>
    </div>
  )
}
