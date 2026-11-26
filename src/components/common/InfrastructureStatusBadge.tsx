export type CanonicalInfrastructureStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'

export function normalizeInfrastructureStatus(
  status: unknown,
): CanonicalInfrastructureStatus | null {
  const value = String(status ?? '').trim().toUpperCase()
  if (value === '1' || value === 'ACTIVE') return 'ACTIVE'
  if (value === '2' || value === 'MAINTENANCE') return 'MAINTENANCE'
  if (value === '3' || value === 'INACTIVE') return 'INACTIVE'
  return null
}

const statusStyles: Record<CanonicalInfrastructureStatus, string> = {
  ACTIVE: 'bg-[#d9f7e7] text-[#087443]',
  MAINTENANCE: 'bg-[#fff0d8] text-[#a65000]',
  INACTIVE: 'bg-[#eef0f3] text-[#596174]',
}

const statusLabels: Record<CanonicalInfrastructureStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  MAINTENANCE: 'Đang bảo trì',
  INACTIVE: 'Ngừng hoạt động',
}

export default function InfrastructureStatusBadge({ status }: { status: unknown }) {
  const normalizedStatus = normalizeInfrastructureStatus(status)
  const label = normalizedStatus ? statusLabels[normalizedStatus] : 'Không xác định'

  return (
    <span
      className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        normalizedStatus ? statusStyles[normalizedStatus] : 'bg-[#eef0f3] text-[#596174]'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
