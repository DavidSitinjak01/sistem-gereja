"use client"

import dynamic from "next/dynamic"

const SonnerToaster = dynamic(
  () => import("sonner").then((mod) => mod.Toaster),
  { ssr: false }
)

const Toaster = ({ ...props }: React.ComponentProps<typeof SonnerToaster>) => {
  return (
    <SonnerToaster
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
