import * as React from "react"

const MOBILE_BREAKPOINT = 768

function detectMobile() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false

  const userAgent = navigator.userAgent || ""
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches
  const isSmallViewport = window.innerWidth < MOBILE_BREAKPOINT

  return isSmallViewport || isMobileDevice || (isCoarsePointer && window.innerWidth < 1024)
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => detectMobile())

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const coarsePointer = window.matchMedia("(pointer: coarse)")
    const onChange = () => {
      setIsMobile(detectMobile())
    }
    mql.addEventListener("change", onChange)
    coarsePointer.addEventListener("change", onChange)
    window.addEventListener("resize", onChange)
    setIsMobile(detectMobile())
    return () => {
      mql.removeEventListener("change", onChange)
      coarsePointer.removeEventListener("change", onChange)
      window.removeEventListener("resize", onChange)
    }
  }, [])

  return !!isMobile
}
