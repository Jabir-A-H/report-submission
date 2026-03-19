'use client'

import { ReportNav } from '@/components/report/report-nav'
import { ReportHeaderForm } from '@/components/report/sections/report-header-form'
import { CoursesForm } from '@/components/report/sections/courses-form'
import { OrganizationalForm } from '@/components/report/sections/organizational-form'
import { PersonalForm } from '@/components/report/sections/personal-form'
import { MeetingsForm } from '@/components/report/sections/meetings-form'
import { ExtrasForm } from '@/components/report/sections/extras-form'
import { ReportProvider, useReport } from '@/components/report/report-context'
import { Loader2, CloudCheck } from 'lucide-react'

function SavingIndicator() {
  const { isSaving, lastSaved } = useReport()
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
      {isSaving ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />
          Saving...
        </>
      ) : lastSaved ? (
        <>
          <CloudCheck className="w-3 h-3 text-green-500" />
          Saved at {lastSaved.toLocaleTimeString()}
        </>
      ) : null}
    </div>
  )
}

export default function NewReportPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <ReportProvider>
        <header className="bg-white border-b border-gray-100 py-4 px-8 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-cyan-900 leading-tight">
              New Submission <span className="text-gray-400 font-normal ml-2">March 2026</span>
            </h1>
            <SavingIndicator />
            <div className="flex gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
              <button className="px-6 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold shadow-md hover:bg-cyan-700 transition-all">Submit Final Report</button>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 flex-shrink-0">
              <ReportNav currentSection="header" />
            </aside>
            
            <div className="flex-grow">
              <div className="space-y-12 pb-20">
                <ReportHeaderForm />
                <CoursesForm />
                <OrganizationalForm />
                <PersonalForm />
                <MeetingsForm />
                <ExtrasForm />
              </div>
            </div>
          </div>
        </main>
      </ReportProvider>
    </div>
  )
}
