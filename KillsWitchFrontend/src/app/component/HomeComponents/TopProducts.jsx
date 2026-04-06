"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  FiServer,
  FiWifi,
  FiCpu,
  FiArrowRight,
  FiStar,
  FiTrendingUp,
  FiShield,
  FiZap
} from "react-icons/fi"
import { useScrollAnimation, useParallaxScroll } from "../../hooks/useScrollAnimation"

export default function TopProducts() {
  const router = useRouter()
  const [hoveredCard, setHoveredCard] = useState(null)
  const [activeTab, setActiveTab] = useState("all")
  
  // Scroll animation hooks
  const [sectionRef, isInView] = useScrollAnimation({ once: true, margin: "-150px" })
  const [parallaxRef, parallaxOffset] = useParallaxScroll(0.2)

  const products = [
    {
      id: 1,
      title: "ATX & ITX Cases",
      description: "ATX cases offer airflow and upgrades, while ITX delivers compact performance for gamers and creators.",
      image: "/products/00.png",
      category: "Cases",
      tag: "Most Popular",
      rating: 4.9,
      features: ["Tempered Glass", "RGB Lighting", "Cable Management"],
      price: "Starting at $149",
      icon: <FiServer className="w-6 h-6 text-white" />
    },
    {
      id: 2,
      title: "Keyboard",
      description: "Enjoy fast response, smooth typing, and long-lasting comfort for your work and play.",
      image: "/products/11.png",
      category: "Keyboard",
      tag: "Best Seller",
      rating: 4.8,
      features: ["Mechanical Switches", "RGB Backlighting", "Anti-Ghosting"],
      price: "Starting at $89",
      icon: <FiWifi className="w-6 h-6 text-white" />
    },
    {
      id: 3,
      title: "ARGB Fans",
      description: "ARGB fans deliver cooling and quiet performance, adding customizable vibrant glow to your gaming rig.",
      image: "/products/2.png",
      category: "Fans",
      tag: "Editor's Choice",
      rating: 4.7,
      features: ["ARGB Lighting", "PWM Control", "Fluid Bearings"],
      price: "Starting at $29",
      icon: <FiCpu className="w-6 h-6 text-white" />
    }
  ]

  const categories = [
    { id: "all", name: "All Products", count: products.length },
    { id: "Cases", name: "Cases", count: 1 },
    { id: "Cooling", name: "Cooling", count: 1 },
    { id: "Fans", name: "Fans", count: 1 }
  ]

  const filteredProducts = activeTab === "all"
    ? products
    : products.filter(product => product.category === activeTab)

  const handleExplore = (productId) => {
    router.push(`/products`)
  }

  // Advanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
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

  const productVariants = {
    hidden: { 
      opacity: 0, 
      y: 80,
      scale: 0.8,
      rotateX: -20
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
    <section 
      ref={sectionRef}
      className="relative py-8 xs:py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden" 
      style={{ backgroundColor: '#000000' }}
    >
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/50 to-[#000000]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(199,0,7,0.05),transparent_60%)]" />
        
        {/* Parallax background elements */}
        <motion.div
          ref={parallaxRef}
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        >
          <div className="absolute top-1/4 left-1/6 w-32 h-32 xs:w-48 xs:h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-[#c70007]/6 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/6 w-24 h-24 xs:w-40 xs:h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 bg-[#c70007]/4 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </motion.div>
      </div>

      <div className="relative max-w-6xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 w-full">
        {/* Header Section */}
        <motion.div
          className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16"
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <div className="inline-flex items-center space-x-1 xs:space-x-2 bg-[#c70007]/10 border border-[#c70007]/20 rounded-full px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 mb-3 xs:mb-4 sm:mb-6">
            <FiTrendingUp className="w-3 h-3 xs:w-4 xs:h-4 text-[#c70007]" />
            <span className="text-[#c70007] text-xs xs:text-sm font-semibold">Top Performing</span>
          </div>
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 xs:mb-3 sm:mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            Product
            </span>
            <span className="text-[#c70007]">
              {" "}Highlights
            </span>
          </h2>
          <div className="h-0.5 w-16 xs:w-20 sm:w-24 bg-gradient-to-r from-[#c70007] to-[#a50005] mx-auto"></div>
          <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-2">
          Our products are crafted to give you stability, speed, and trust.
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          className="flex justify-center mb-6 xs:mb-8 sm:mb-10 md:mb-12"
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-[#1c1816]/50 border border-[#1c1816]/50 rounded-full p-1 xs:p-1.5 backdrop-blur-sm">
            <div className="flex flex-wrap justify-center gap-1 xs:gap-2 sm:gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`relative px-2 xs:px-3 sm:px-4 md:px-6 py-1.5 xs:py-2 rounded-full font-medium text-xs xs:text-sm sm:text-base transition-all duration-300 ${
                    activeTab === category.id
                      ? 'bg-gradient-to-r from-[#c70007] to-[#a50005] text-white shadow-md shadow-[#c70007]/20'
                      : 'text-gray-300 hover:text-white hover:bg-[#1c1816]/80'
                  }`}
                >
                  <span className="relative z-10">{category.name}</span>
                  <span className="ml-1 xs:ml-1.5 text-xs opacity-75">({category.count})</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div 
          className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 md:gap-8 w-full"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <AnimatePresence mode="wait">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                className="group relative w-full h-full"
                variants={productVariants}
                onHoverStart={() => setHoveredCard(product.id)}
                onHoverEnd={() => setHoveredCard(null)}
                whileHover={{ 
                  scale: 1.03,
                  rotateY: 3,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="relative w-full h-full border border-[#1c1816]/50 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl group-hover:shadow-[#c70007]/20 transition-all duration-500 backdrop-blur-sm flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
                  {/* Product Tag */}
                  <div className="absolute top-2 xs:top-3 sm:top-4 left-2 xs:left-3 sm:left-4 z-20">
                    <div className="bg-gradient-to-r from-[#c70007] to-[#a50005] text-white text-xs font-semibold px-2 xs:px-3 py-0.5 xs:py-1 rounded-full shadow-sm">
                      {product.tag}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="absolute top-2 xs:top-3 sm:top-4 right-2 xs:right-3 sm:right-4 z-20">
                    <div className="flex items-center space-x-1 bg-[#1c1816]/60 backdrop-blur-sm rounded-full px-1.5 xs:px-2.5 py-0.5 xs:py-1">
                      <FiStar className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-yellow-400 fill-current" />
                      <span className="text-white text-xs font-medium">{product.rating}</span>
                    </div>
                  </div>

                  {/* Image Container - Optimized for transparent images */}
                  <div className="relative w-full h-32 xs:h-40 sm:h-48 md:h-56 lg:h-60 overflow-hidden flex-shrink-0">
                    {/* Subtle background pattern for transparent images */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-gray-800/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(199,0,7,0.05),transparent_60%)]" />
                    
                    {/* Image with enhanced shadow effects */}
                    <div className="relative w-full h-full">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-contain object-center transition-all duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        priority={index === 0}
                        style={{
                          filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.6)) drop-shadow(0 8px 25px rgba(0,0,0,0.3)) drop-shadow(0 4px 15px rgba(199,0,7,0.2))',
                          transform: 'scale(1.1)',
                        }}
                      />
                      
                      {/* Additional shadow layer for depth */}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'radial-gradient(ellipse at center bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 30%, transparent 60%)',
                          transform: 'translateY(15px) scaleX(0.9)',
                        }}
                      />
                    </div>
                    
                    {/* Enhanced Hover Overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-[#c70007]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    
                    {/* Subtle glow effect */}
                    <div className="absolute inset-2 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_20px_rgba(199,0,7,0.1)]" />
                  </div>

                  {/* Content */}
                  <div className="relative p-3 xs:p-4 sm:p-6 md:p-8 space-y-2 xs:space-y-3 sm:space-y-4 flex-1 flex flex-col">
                    {/* Icon and Title */}
                    <div className="flex items-start space-x-2 xs:space-x-3">
                      <div className="bg-gradient-to-br from-[#c70007] to-[#a50005] p-1.5 xs:p-2 sm:p-2.5 rounded-lg text-white shadow-sm flex-shrink-0">
                        <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6">
                          {product.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-white group-hover:text-[#c70007] transition-colors duration-300 line-clamp-2">
                          {product.title}
                        </h3>
                        <p className="text-[#c70007] font-medium text-xs xs:text-sm">
                          {product.price}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-xs xs:text-sm sm:text-base leading-relaxed line-clamp-3">
                      {product.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-1 xs:space-y-2 flex-1">
                      <div className="flex items-center space-x-1 xs:space-x-1.5">
                        <FiShield className="w-3 h-3 xs:w-4 xs:h-4 text-[#c70007]" />
                        <span className="text-gray-200 text-xs xs:text-sm font-medium">Key Features:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 xs:gap-2">
                        {product.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-[#1c1816]/50 text-gray-200 px-1.5 xs:px-2.5 py-0.5 xs:py-1 rounded-full border border-[#1c1816]/50"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-auto pt-2 xs:pt-3 sm:pt-4">
                      <motion.button
                        onClick={() => handleExplore(product.id)}
                        className="w-full bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white font-semibold py-2 xs:py-2.5 sm:py-3 px-3 xs:px-4 sm:px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg group/btn text-xs xs:text-sm sm:text-base"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>Explore Solutions</span>
                        <FiArrowRight className="w-3 h-3 xs:w-4 xs:h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                      </motion.button>
                    </div>
                  </div>
                  {/* Animated Border Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none border border-transparent group-hover:border-[#c70007]/30"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: hoveredCard === product.id ? 0.5 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-8 xs:mt-10 sm:mt-12 md:mt-16"
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ delay: 0.8 }}
        >
          <div className="inline-flex flex-col xs:flex-row items-center space-y-3 xs:space-y-0 xs:space-x-4">
            <button
              onClick={() => router.push('/products')}
              className="bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white font-semibold py-2.5 xs:py-3 sm:py-3.5 px-4 xs:px-6 sm:px-8 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg text-sm xs:text-base"
            >
              <span>View All Products</span>
              <FiArrowRight className="w-4 h-4 xs:w-5 xs:h-5" />
            </button>
            <div className="text-gray-300 text-xs xs:text-sm">
              <FiZap className="w-3 h-3 xs:w-4 xs:h-4 inline mr-1 xs:mr-1.5 text-[#c70007]" />
              Over 500+ Premium Solutions Available
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}