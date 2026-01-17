import * as React from "react"
import { cn } from "../lib/utils"
import { Loader2 } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Loader2 className="animate-spin text-muted-foreground w-full h-full min-w-4 min-h-4" />
    </div>
  )
}

export { Spinner }
