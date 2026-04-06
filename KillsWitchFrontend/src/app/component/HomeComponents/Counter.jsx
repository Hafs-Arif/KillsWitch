"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { FiCheckCircle, FiUsers, FiStar, FiAward } from "react-icons/fi"
import { useScrollAnimation, useParallaxScroll } from "../../hooks/useScrollAnimation"

const Counter = ({ target, duration }) => {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
        }
      },
      { threshold: 0.3 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [hasAnimated])

  useEffect(() => {
    if (!hasAnimated) return
    let start = 0
    const increment = target / (duration / 7)
    const step = () => {
      start += increment
      if (start < target) {
        setCount(Math.floor(start))
        requestAnimationFrame(step)
      } else {
        setCount(target)
      }
    }
    requestAnimationFrame(step)
  }, [hasAnimated, target, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

const StatsComponent = () => {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [sectionRef, isInView] = useScrollAnimation({ once: true, margin: "-200px" })
  const [parallaxRef, parallaxOffset] = useParallaxScroll(0.3)

  const stats = [
    {
      id: 1,
      title: "Products Delivered",
      value: 10,
      duration: 1500,
      icon: <FiCheckCircle className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#c70007]" />,
    },
    {
      id: 2,
      title: "Satisfied Clients",
      value: 7,
      duration: 1800,
      icon: <FiUsers className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#c70007]" />,
    },
    {
      id: 3,
      title: "Orders Shipped",
      value: 3,
      duration: 1200,
      icon: <FiStar className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#c70007]" />,
    },
    {
      id: 4,
      title: "Repeated Buyers",
      value: 2.5,
      duration: 1000,
      icon: <FiAward className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#c70007]" />,
    },
  ]

  // Advanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.8,
      rotateX: -15
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.8
      }
    }
  }

  const titleVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 12,
        duration: 0.6
      }
    }
  }

  return (
    <div 
      ref={sectionRef}
      className="py-8 xs:py-12 sm:py-16 md:py-20 px-2 xs:px-4 sm:px-6 lg:px-8 relative overflow-hidden" 
      style={{ backgroundColor: '#000000' }}
    >
      {/* Animated background elements */}
      <motion.div
        ref={parallaxRef}
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      >
        <div className="absolute top-1/4 left-1/4 w-32 h-32 xs:w-48 xs:h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-[#c70007]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 xs:w-40 xs:h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 bg-[#c70007]/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </motion.div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16"
          variants={titleVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 xs:mb-3 sm:mb-4">
            <span className="text-white">Our Achievements</span>
            <span className="text-[#c70007]">  In Numbers</span>
          </h2>
          <div className="h-0.5 w-16 xs:w-20 sm:w-24 bg-gradient-to-r from-[#c70007] to-[#a50005] mx-auto"></div>
          <p className="mt-3 xs:mt-4 sm:mt-6 text-gray-300 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto px-2">
          The following figures demonstrate the confidence and the success we gained among our customers.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              className="relative overflow-hidden rounded-2xl"
              variants={itemVariants}
              onMouseEnter={() => setHoveredCard(stat.id)}
              onMouseLeave={() => setHoveredCard(null)}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
            >
              <div className="absolute inset-0" style={{ backgroundColor: '#1c1816' }}></div>
              <div className="absolute inset-0 border border-[#c70007]/20"></div>

              {/* Animated background elements */}
              <motion.div
                className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-[#c70007] opacity-5"
                animate={{
                  scale: hoveredCard === stat.id ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: hoveredCard === stat.id ? Number.POSITIVE_INFINITY : 0,
                  ease: "easeInOut",
                }}
              ></motion.div>

              <motion.div
                className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[#c70007] opacity-5"
                animate={{
                  scale: hoveredCard === stat.id ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 3,
                  repeat: hoveredCard === stat.id ? Number.POSITIVE_INFINITY : 0,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
              ></motion.div>

              <motion.div
                className="relative p-3 xs:p-4 sm:p-6 md:p-8 h-full flex flex-col items-center justify-center text-center z-10"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-2 xs:mb-3 sm:mb-4"
                  animate={{
                    rotate: hoveredCard === stat.id ? [0, 10, -10, 0] : 0,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: hoveredCard === stat.id ? 1 : 0,
                  }}
                >
                  {stat.icon}
                </motion.div>

                <motion.h3
                  className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 xs:mb-2 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <Counter target={stat.value} duration={stat.duration} />
                  <span className="ml-1 text-[#c70007]">K+</span>
                </motion.h3>

                <motion.div
                  className="h-0.5 xs:h-1 w-8 xs:w-10 sm:w-12 bg-[#c70007] opacity-50 my-2 xs:my-3 sm:my-4 rounded-full"
                  animate={{
                    width: hoveredCard === stat.id ? 60 : 48,
                  }}
                  transition={{ duration: 0.3 }}
                ></motion.div>

                <p className="text-gray-200 text-xs xs:text-sm sm:text-base md:text-lg font-medium">{stat.title}</p>
              </motion.div>

              {/* Animated border on hover */}
              <motion.div
                className="absolute inset-0 border-2 rounded-2xl pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: hoveredCard === stat.id ? 1 : 0,
                  borderColor: ["rgba(199,0,7,0.3)", "rgba(199,0,7,0.8)", "rgba(199,0,7,0.3)"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: hoveredCard === stat.id ? Number.POSITIVE_INFINITY : 0,
                  ease: "linear",
                }}
              ></motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default StatsComponent