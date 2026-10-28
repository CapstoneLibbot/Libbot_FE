import { BatteryCharging, Bot, Radio, Sparkles } from 'lucide-react'

function OperationBanner() {
  return (
    <div className="operation-banner shrink-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/18"><Bot className="h-4 w-4" /></span>
        <p className="truncate text-sm"><span className="font-semibold">LiBot is operating</span><span className="hidden text-white/75 sm:inline"> · Robot #12 is guiding a visitor to Reading desk area A</span></p>
      </div>
      <div className="hidden items-center gap-4 text-xs font-medium md:flex">
        <span className="inline-flex items-center gap-1.5 text-white/85"><Radio className="h-3.5 w-3.5 animate-pulse" />Live telemetry</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-2.5 py-1"><BatteryCharging className="h-3.5 w-3.5" />78%</span>
        <Sparkles className="h-4 w-4 text-[#a5f3fc]" />
      </div>
    </div>
  )
}

export default OperationBanner
