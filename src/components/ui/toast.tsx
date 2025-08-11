import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

type ToastVariant = "default" | "destructive" | "success" | "warning" | "info"

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  show?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: ToastVariant
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, show = true, onOpenChange, variant = "default", ...props }, ref) => {
    if (!show) return null;
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
          {
            "border bg-background text-foreground": variant === "default",
            "border-destructive bg-destructive text-destructive-foreground": variant === "destructive",
            "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-50": variant === "success",
            "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-50": variant === "warning",
            "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-50": variant === "info"
          },
          className
        )}
        {...props}
      >
        {props.children}
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }
)
Toast.displayName = "Toast"

interface ToastActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const ToastAction = React.forwardRef<HTMLButtonElement, ToastActionProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
ToastAction.displayName = "ToastAction"

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
))
ToastClose.displayName = "ToastClose"

const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold [&+div]:text-xs", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

export type { ToastProps, ToastActionProps }

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
}
