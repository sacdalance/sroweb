import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
        "sro-approved":
          "border-transparent bg-sro-secondary text-white",
        "sro-pending":
          "border-transparent bg-sro-accent-50 text-sro-accent-700",
        "sro-rejected":
          "border-transparent bg-sro-primary text-white",
        "sro-info":
          "border-transparent bg-blue-50 text-blue-700",
        "sro-neutral":
          "border-transparent bg-gray-100 text-gray-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 