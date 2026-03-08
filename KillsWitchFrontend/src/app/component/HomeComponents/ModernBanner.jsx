"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Wrench, Cpu, HeadphonesIcon, Truck, ChevronRight } from "lucide-react"
import { useScrollAnimation, useParallaxScroll } from "../../hooks/useScrollAnimation"

export default function DarkGradientBanner() {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const router = useRouter()
  
  // Scroll animation hooks
  const [sectionRef, isInView] = useScrollAnimation({ once: true, margin: "-150px" })
  const [parallaxRef, parallaxOffset] = useParallaxScroll(0.2)

  // Navigation handler
  const handleNavigateToProducts = () => {
    router.push('/products')
  }

  const features = [
    {
      icon: <Wrench strokeWidth={1.5} />,
      title: "Premium Tools",
      description: "Quality hardware designed to suit all projects.",
    },
    {
      icon: <Cpu strokeWidth={1.5} />,
      title: "Latest Technology",
      description: "New, high-tech hardware and accessories.",
    },
    {
      icon: <HeadphonesIcon strokeWidth={1.5} />,
      title: "Expert Support",
      description: "We have a technical team that is available to assist anytime.",
    },
    {
      icon: <Truck strokeWidth={1.5} />,
      title: "Fast Delivery",
      description: "Fast delivery to your door step.",
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

  const headerVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.8
      }
    }
  }

  const featureVariants = {
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
        stiffness: 80,
        damping: 12,
        duration: 0.6
      }
    }
  }

  return (
    <div 
      ref={sectionRef}
      className="relative text-white overflow-hidden" 
      style={{ backgroundColor: '#000000' }}
    >
      {/* Enhanced Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#c70007]/30 to-transparent"></div>
        <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-[#c70007]/30 to-transparent"></div>
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-[#c70007]/30 to-transparent"></div>
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c70007]/30 to-transparent"></div>
        <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c70007]/30 to-transparent"></div>
        
        {/* Parallax background elements */}
        <motion.div
          ref={parallaxRef}
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        >
          <div className="absolute top-1/4 right-1/6 w-32 h-32 xs:w-48 xs:h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-[#c70007]/6 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/6 w-24 h-24 xs:w-40 xs:h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 bg-[#c70007]/4 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </motion.div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-8 xs:py-12 sm:py-16">
        <motion.div
          className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16"
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 xs:mb-3 sm:mb-4">
            <span className="text-white">Power-Up Your</span>
            <span className="bg-gradient-to-r from-[#c70007] to-[#a50005] bg-clip-text text-transparent"> Hardware Experience</span>
          </h2>
          <div className="h-0.5 w-16 xs:w-20 sm:w-24 bg-gradient-to-r from-[#c70007] to-[#a50005] mx-auto"></div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative cursor-pointer"
              variants={featureVariants}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={handleNavigateToProducts}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="relative overflow-hidden border border-[#1c1816]/50 backdrop-blur-sm rounded-lg p-3 xs:p-4 sm:p-6 h-full group-hover:border-[#c70007]/50 transition-all duration-500"
                style={{ backgroundColor: '#1c1816', borderRadius: "0px 50px 0px 50px" }}
              >
                {/* Animated background on hover */}
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-[#c70007]/30 to-[#a50005]/30 z-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>

                <div className="relative z-10">
                  {/* Icon with animated border */}
                  <div className="mb-3 xs:mb-4 sm:mb-6 relative">
                    <motion.div
                      className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-[#1c1816] border border-[#c70007]/50"
                      animate={{
                        borderColor:
                          hoveredIndex === index
                            ? ["rgba(199,0,7,0.5)", "rgba(199,0,7,0.8)", "rgba(199,0,7,0.5)"]
                            : "rgba(199,0,7,0.5)",
                      }}
                      transition={{ duration: 2, repeat: hoveredIndex === index ? Number.POSITIVE_INFINITY : 0 }}
                    >
                      <motion.div
                        animate={{
                          rotate: hoveredIndex === index ? 360 : 0,
                        }}
                        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="text-[#c70007] w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6"
                      >
                        {feature.icon}
                      </motion.div>
                    </motion.div>
                  </div>

                  <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold mb-2 xs:mb-3 text-white group-hover:text-[#e5e7eb] transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-gray-300 text-xs xs:text-sm sm:text-base mb-3 xs:mb-4 sm:mb-5 group-hover:text-gray-200 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Explore button */}
                  <motion.div
                    className="flex items-center text-xs xs:text-sm text-[#c70007] group-hover:text-[#a50005] transition-colors duration-300 font-medium"
                    whileHover={{ x: 5 }}
                  >
                    <span>View Products</span>
                    <ChevronRight className="ml-1 h-3 w-3 xs:h-4 xs:w-4" />
                  </motion.div>
                </div>

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-8 h-8 xs:w-12 xs:h-12 sm:w-16 sm:h-16 overflow-hidden">
                  <div className="absolute transform rotate-45 bg-gradient-to-r from-[#c70007]/20 to-[#a50005]/20 w-8 h-8 xs:w-12 xs:h-12 sm:w-16 sm:h-16 -top-4 -right-4 xs:-top-6 xs:-right-6 sm:-top-8 sm:-right-8"></div>
                </div>

                {/* Bottom line that animates on hover */}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#c70007] to-[#a50005]"
                  initial={{ width: "0%" }}
                  animate={{ width: hoveredIndex === index ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}