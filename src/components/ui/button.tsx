import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-elegant",
  {
    variants: {
      variant: {
        default:
          "btn-primary-elegant",
        destructive:
          "btn-elegant bg-red-600 text-white hover:bg-red-700 shadow-soft hover:shadow-soft-lg",
        outline:
          "btn-secondary-elegant",
        secondary:
          "btn-elegant bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
        ghost:
          "btn-elegant bg-transparent text-slate-700 hover:bg-slate-100 shadow-none hover:shadow-soft",
        link: 
          "text-education-accent underline-offset-4 hover:underline font-medium text-clean transition-colors duration-300",
      },
      size: {
        default: "px-6 py-3 rounded-xl has-[>svg]:px-5",
        sm: "px-4 py-2 rounded-lg gap-1.5 text-sm has-[>svg]:px-3",
        lg: "px-8 py-4 rounded-xl text-base has-[>svg]:px-6",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }