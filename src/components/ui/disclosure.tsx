import type { DetailsHTMLAttributes, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

function Disclosure({ className, ...props }: DetailsHTMLAttributes<HTMLDetailsElement>) {
  return <details className={cn("ui-disclosure", className)} {...props} />
}

function DisclosureSummary({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <summary className={cn("ui-disclosure__summary", className)} {...props} />
}

export { Disclosure, DisclosureSummary }
