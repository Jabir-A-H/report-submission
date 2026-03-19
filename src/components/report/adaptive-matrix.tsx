'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface AdaptiveMatrixProps {
  title: string
  children: React.ReactNode
  desktopColumns?: number
}

export function AdaptiveMatrix({ title, children, desktopColumns = 3 }: AdaptiveMatrixProps) {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500">Please fill in the details below. Progress is auto-saved.</p>
      </div>

      {/* Desktop Matrix: Grid Layout */}
      <div className={cn(
        "hidden md:grid gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100",
        desktopColumns === 2 && "grid-cols-2",
        desktopColumns === 3 && "grid-cols-3",
        desktopColumns === 4 && "grid-cols-4"
      )}>
        {children}
      </div>

      {/* Mobile Matrix: Card Stack Layout (Simulated via flex-col on mobile) */}
      <div className="md:hidden flex flex-col gap-4">
        {React.Children.map(children, (child) => (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MatrixField({ label, children, description }: { label: string, children: React.ReactNode, description?: string }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {description && <p className="text-xs text-gray-400 mb-1">{description}</p>}
      {children}
    </div>
  )
}
