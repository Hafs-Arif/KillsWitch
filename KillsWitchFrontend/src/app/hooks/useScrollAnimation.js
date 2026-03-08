"use client"

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

export const useScrollAnimation = (options = {}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
    ...options
  })
  
  return [ref, isInView]
}

export const useParallaxScroll = (speed = 0.5) => {
  const [offsetY, setOffsetY] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect()
        const scrolled = window.pageYOffset
        const rate = scrolled * -speed
        setOffsetY(rate)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return [ref, offsetY]
}

export const useStaggerAnimation = (delay = 0.1) => {
  const [ref, isInView] = useScrollAnimation()
  const [staggeredItems, setStaggeredItems] = useState([])

  const staggerItems = (items) => {
    return items.map((item, index) => ({
      ...item,
      animationDelay: index * delay,
      isVisible: isInView
    }))
  }

  return [ref, isInView, staggerItems]
}
