import type { ButtonHTMLAttributes, DetailsHTMLAttributes, HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from 'react'

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'warning'
type ButtonSize = 'default' | 'sm' | 'pill'

function joinClassNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={joinClassNames('ui-button', `ui-button--${variant}`, `ui-button--${size}`, className)} {...props} />
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={joinClassNames('ui-card', className)} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={joinClassNames('ui-card__header', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={joinClassNames('ui-card__title', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={joinClassNames('ui-card__description', className)} {...props} />
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={joinClassNames('ui-input', className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={joinClassNames('ui-select', className)} {...props} />
}

export function ButtonGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={joinClassNames('ui-button-group', className)} {...props} />
}

export function Tabs({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <nav className={joinClassNames('ui-tabs', className)} {...props} />
}

export function Badge({ className, tone = 'muted', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: 'muted' | 'success' | 'warning' | 'danger' }) {
  return <span className={joinClassNames('ui-badge', `ui-badge--${tone}`, className)} {...props} />
}

export function Field({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={joinClassNames('ui-field', className)} {...props} />
}

export function FieldLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={joinClassNames('ui-field__label', className)} {...props} />
}

export function Slider({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="range" className={joinClassNames('ui-slider', className)} {...props} />
}

export function Disclosure({ className, ...props }: DetailsHTMLAttributes<HTMLDetailsElement>) {
  return <details className={joinClassNames('ui-disclosure', className)} {...props} />
}

export function DisclosureSummary({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <summary className={joinClassNames('ui-disclosure__summary', className)} {...props} />
}

export function Stack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={joinClassNames('ui-stack', className)} {...props} />
}
