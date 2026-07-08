import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

function Switch({
  className,
  checked,
  onCheckedChange,
  label,
  tooltip,
  shortcut,
  onKeyDown,
  ...props
}: SwitchPrimitive.Root.Props & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  tooltip?: string
  shortcut?: string
}) {
  const tooltipText = [tooltip, shortcut ? `Shortcut: ${shortcut}` : null].filter(Boolean).join("\n")
  const handleKeyDown = (event: Parameters<NonNullable<SwitchPrimitive.Root.Props["onKeyDown"]>>[0]) => {
    if (event.code === "Space") event.preventDefault()
    onKeyDown?.(event)
  }
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      data-slot="switch"
      className={cn("ui-switch", checked && "ui-switch--checked", className)}
      data-tooltip={tooltipText || undefined}
      aria-keyshortcuts={shortcut}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <span className="ui-switch__label">{label}</span>
      <span className="ui-switch__track"><SwitchPrimitive.Thumb className="ui-switch__thumb" /></span>
      <span className="ui-switch__state">{checked ? "On" : "Off"}</span>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
