import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

function Stack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-stack", className)} {...props} />
}

export { Stack }
