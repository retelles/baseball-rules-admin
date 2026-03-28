import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: ReactNode
}

export default function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-gray-900 tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
