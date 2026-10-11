import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Untitled button: control size L, radius full, padding S/L, gap XS, ui medium S text.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-(--space-xs) rounded-full font-sans font-(--weight-ui-medium) type-s whitespace-nowrap shadow-(--shadow-none) transition-[background-color,color,box-shadow,translate] duration-(--motion-duration) ease-(--motion-easing) outline-none select-none hover:shadow-(--shadow-s) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:translate-y-(--motion-press-distance) disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline:
          "bg-transparent text-foreground shadow-[inset_0_0_0_var(--border-s)_var(--neutral-4)] hover:bg-accent aria-expanded:bg-accent",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "bg-transparent text-foreground hover:bg-accent aria-expanded:bg-accent",
        destructive: "bg-destructive text-primary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "py-(--space-s) px-(--space-l)",
        xs: "py-(--space-xxs) px-(--space-s) type-xs",
        sm: "py-(--space-xs) px-(--space-m)",
        lg: "py-(--space-m) px-(--space-xl) type-m",
        icon: "p-(--space-s)",
        "icon-xs": "p-(--space-xxs) [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "p-(--space-xs)",
        "icon-lg": "p-(--space-m) [&_svg:not([class*='size-'])]:size-6",
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
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
