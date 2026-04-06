"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { FiArrowRight, FiClock, FiPackage, FiShoppingCart, FiEye } from "react-icons/fi"
import { fetchAllProducts } from "../../api/api"
import Modal from "../GeneralComponents/Modal"
import { useInView } from "framer-motion"
import { useRef } from "react"

export default function FeaturedProducts() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [hoveredCard, setHoveredCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [modalInfo, setModalInfo] = useState({
    type: "success",
    message: ""
  })

  // Scroll animation refs
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-150px" })

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const allProducts = await fetchAllProducts()
        if (!Array.isArray(allProducts)) {
          console.error("Invalid products data received:", allProducts)
          setProducts([])
          return
        }
        
        // If created_at exists, sort by it; otherwise just take first 4
        let picked = []
        const withCreated = allProducts.filter(p => p && p.created_at)
        if (withCreated.length > 0) {
          picked = withCreated
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 4)
        } else {
          picked = allProducts.filter(Boolean).slice(0, 4)
        }

        const recentProducts = picked.map(product => ({
          ...product,
          product_image: product?.product_image || '/placeholder.svg',
          product_part_number: product?.product_part_number || product?.part_number || 'Product',
          product_price: product?.product_price || product?.price || 0,
          product_short_description: product?.product_short_description || product?.short_description || 'No description available',
          product_product_id: product?.product_product_id || product?.product_id || product?.id || Math.random().toString(36).substr(2, 9)
        }))
          
        setProducts(recentProducts)
      } catch (error) {
        console.error("Error loading featured products:", error)
        setProducts([]) // Ensure products is always an array
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const navigateToProducts = () => {
    router.push('/products')
  }

  const navigateToProductDetail = (product) => {
    if (!product) {
      console.error("Cannot navigate to product detail page without product");
      return;
    }
    // Use slug if available, otherwise use product ID
    const identifier = product.slug || product.product_product_id;
    router.push(`/${identifier}`);
  }

  const addToCart = (product) => {
    if (!product) {
      console.error("Cannot add null/undefined product to cart")
      setModalInfo({
        type: "error",
        message: "Failed to add product to cart: Product information is missing.",
      })
      setShowConfirmationModal(true)
      return
    }

    try {
      const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
      
      if (!product.product_product_id) {
        console.error("Product is missing required ID:", product)
        throw new Error("Product is missing required ID")
      }
      
      // find existing product
      const existingIndex = existingCart.findIndex(
        (item) => item?.product_product_id === product.product_product_id
      )

      if (existingIndex >= 0) {
        existingCart[existingIndex].quantity = (existingCart[existingIndex].quantity || 0) + 1
        setModalInfo({
          type: "success",
          message: `${product.product_name || product.product_part_number || 'This product'} quantity updated in your cart.`,
        })
        setShowConfirmationModal(true)
      } else {
        const cartItem = {
          ...product,
          quantity: 1,
          addedAt: new Date().toISOString(),
        }
        existingCart.push(cartItem)
        setModalInfo({
          type: "success",
          message: `${product.product_name || product.product_part_number || 'Product'} has been added to your cart.`,
        })
        setShowConfirmationModal(true)
      }
      localStorage.setItem("cart", JSON.stringify(existingCart))

    } catch (error) {
      console.error("Error adding to cart:", error)
      setModalInfo({
        type: "error",
        message: "Failed to add product to cart. Please try again.",
      })
    } finally {
      setShowConfirmationModal(true)
    }
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
    <>
      <section 
        ref={sectionRef}
        className="relative py-8 xs:py-12 sm:py-16 md:py-20 overflow-hidden" 
        style={{ backgroundColor: '#000000' }}
      >
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/5 via-transparent to-[#000000]/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(199,0,7,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(199,0,7,0.05),transparent_50%)]" />
          
          {/* Background elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/6 w-32 h-32 xs:w-48 xs:h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 bg-[#c70007]/8 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/6 w-24 h-24 xs:w-40 xs:h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-[#c70007]/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16"
            variants={headerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <div className="inline-flex items-center space-x-1 xs:space-x-2 bg-[#c70007]/10 border border-[#c70007]/20 rounded-full px-2 xs:px-3 sm:px-4 py-1 xs:py-2 mb-3 xs:mb-4 sm:mb-6">
              <FiClock className="w-3 h-3 xs:w-4 xs:h-4 text-[#c70007]" />
              <span className="text-[#c70007] text-xs xs:text-sm font-medium">Latest Arrivals</span>
            </div>
            
            <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 xs:mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                Featured
              </span>
              {" "}
              <span className="bg-gradient-to-r from-[#c70007] to-[#a50005] bg-clip-text text-transparent">
                Products
              </span>
            </h2>
            <div className="flex justify-center mt-4 xs:mt-6 sm:mt-8">
              <div className="h-0.5 xs:h-1 w-16 xs:w-20 sm:w-24 bg-gradient-to-r from-[#c70007] to-[#a50005] rounded-full" />
            </div>
            
            <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-2">
              Explore our latest additions and most innovative solutions
            </p>
          </motion.div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c70007]"></div>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 md:gap-8"
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <AnimatePresence mode="wait">
                {products.filter(Boolean).map((product, index) => (
                  <motion.div
                    key={product.product_product_id}
                    className="group relative"
                    variants={productVariants}
                    onHoverStart={() => setHoveredCard(product.product_product_id)}
                    onHoverEnd={() => setHoveredCard(null)}
                    whileHover={{ 
                      scale: 1.03,
                      rotateY: 3,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <div className="h-full relative border border-[#1c1816]/50 rounded-2xl overflow-hidden backdrop-blur-sm group-hover:border-[#c70007]/50 transition-all duration-500 cursor-pointer" style={{ backgroundColor: '#1c1816' }} onClick={() => navigateToProductDetail(product)}>
                      {/* Image Container */}
                      <div className="relative h-32 xs:h-40 sm:h-48 overflow-hidden">
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ 
                            backgroundImage: `url(${product.product_image || '/placeholder.svg'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1816]/80 via-[#1c1816]/20 to-transparent" />
                        
                        {/* Hover Overlay */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-[#c70007]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        />

                        {/* New Tag */}
                        <div className="absolute top-2 xs:top-3 sm:top-4 left-2 xs:left-3 sm:left-4 z-20">
                          <div className="bg-gradient-to-r from-[#c70007] to-[#a50005] text-white text-xs font-semibold px-2 xs:px-3 py-0.5 xs:py-1 rounded-full">
                            New Arrival
                          </div>
                        </div>

                        {/* View Details Button */}
                        <div className="absolute top-2 xs:top-3 sm:top-4 right-2 xs:right-3 sm:right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            className="bg-[#c70007]/80 backdrop-blur-sm text-white text-xs font-semibold px-2 xs:px-3 py-0.5 xs:py-1 rounded-full flex items-center gap-1 hover:bg-[#c70007] transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToProductDetail(product)
                            }}
                          >
                            <FiEye className="w-3 h-3" />
                            <span className="hidden xs:inline">View</span>
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="relative p-3 xs:p-4 sm:p-6 space-y-2 xs:space-y-3 sm:space-y-4">
                        {/* Product Info */}
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 
                              className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white group-hover:text-[#c70007] transition-colors duration-300 line-clamp-2 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigateToProductDetail(product)
                              }}
                            >
                              {product.product_part_number}
                            </h3>
                            <div>
                              {product.sale_price ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-xs text-gray-400 line-through">
                                    ${parseFloat(product.product_price).toFixed(2)}
                                  </span>
                                  <span className="text-xs xs:text-sm sm:text-base text-green-400 font-semibold">
                                    ${parseFloat(product.sale_price).toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-xs xs:text-sm sm:text-base text-[#c70007] font-semibold">
                                  ${parseFloat(product.product_price).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-400 text-xs xs:text-sm mt-1 xs:mt-2 line-clamp-2">
                            {product.product_short_description || "Experience the next generation of technology"}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col xs:flex-row gap-2 xs:gap-2">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToProductDetail(product)
                            }}
                            className="flex items-center justify-center gap-2 bg-[#c70007]/20 hover:bg-[#c70007] text-[#c70007] hover:text-white px-3 py-2 rounded-lg transition-all duration-300 text-xs xs:text-sm font-medium"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiEye className="w-3 h-3 xs:w-4 xs:h-4" />
                            <span>View Details</span>
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation()
                              addToCart(product)
                            }}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white px-3 py-2 rounded-lg transition-all duration-300 text-xs xs:text-sm font-medium"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiShoppingCart className="w-3 h-3 xs:w-4 xs:h-4" />
                            <span>Add to Cart</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Animated Border Effect */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: hoveredCard === product.product_product_id ? [0, 0.5, 0] : 0,
                          boxShadow: hoveredCard === product.product_product_id 
                            ? ['0 0 0 1px rgba(199,0,7,0.3)', '0 0 0 2px rgba(199,0,7,0.5)', '0 0 0 1px rgba(199,0,7,0.3)']
                            : '0 0 0 0px rgba(199,0,7,0)'
                        }}
                        transition={{ duration: 2, repeat: hoveredCard === product.product_product_id ? Infinity : 0 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Bottom CTA */}
          <motion.div
            className="text-center mt-8 xs:mt-10 sm:mt-12 md:mt-16"
            variants={headerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ delay: 0.8 }}
          >
            <div className="flex flex-col xs:flex-row items-center justify-center gap-3 xs:gap-4">
              <button 
                onClick={navigateToProducts}
                className="bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white font-semibold py-2 xs:py-3 sm:py-4 px-4 xs:px-6 sm:px-8 rounded-lg transition-all duration-300 flex items-center space-x-2 text-sm xs:text-base"
              >
                <span>Explore All Products</span>
                <FiArrowRight className="w-4 h-4 xs:w-5 xs:h-5" />
              </button>
              
              <div className="text-gray-400 text-xs xs:text-sm">
                <FiPackage className="w-3 h-3 xs:w-4 xs:h-4 inline mr-1 text-[#c70007]" />
                Fresh Arrivals Weekly
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        type={modalInfo.type}
        message={modalInfo.message}
      />
    </>
  )
}