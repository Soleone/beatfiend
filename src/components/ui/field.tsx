import type { HTMLAttributes, LabelHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

function Field({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("ui-field", className)} {...props} />
}

function FieldLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ui-field__label", className)} {...props} />
}

export { Field, FieldLabel }
