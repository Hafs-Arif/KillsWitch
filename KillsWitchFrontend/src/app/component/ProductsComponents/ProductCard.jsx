"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { ShoppingCart, Tag, Package, Star, Plus, Minus, X, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import Modal from "../GeneralComponents/Modal"
import { addToCart as addToCartUtil } from "../../utils/cartSync"

export default function ProductCard({ product }) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isZooming, setIsZooming] = useState(false)
  const imageRef = useRef(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [modalInfo, setModalInfo] = useState({
    type: "success",
    message: "",
  })

  const navigateToProductDetail = () => {
    if (product.slug) {
      router.push(`/${product.slug}`)
    } else {
      setModalInfo({
        type: "error",
        message: "No slug found for this product. Please check product data in admin panel.",
      });
      setShowConfirmationModal(true);
    }
  }

  const increaseQuantity = () => setQuantity((prev) => prev + 1)
  const decreaseQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const handleMouseMove = (e) => {
    if (!imageRef.current) return

    const { left, top, width, height } = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100

    setZoomPosition({ x, y })
  }

  const handleMouseEnter = () => setIsZooming(true)
  const handleMouseLeave = () => setIsZooming(false)

  const addToCart = async () => {
    try {
      await addToCartUtil(product, quantity);
      
      setModalInfo({
        type: "success",
        message: `${product.product_name || product.product_part_number} has been added to your cart.`,
      });
      
      // Show confirmation modal
      setShowConfirmationModal(true);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setModalInfo({
        type: "error",
        message: "Failed to add item to cart. Please try again.",
      });
      setShowConfirmationModal(true);
    }
  }

  return (
    <>
      <motion.div
        className="h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{
          y: -10,
          transition: { duration: 0.3 },
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden transition-all duration-500 hover:border-red-600/50 h-full flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_80px_rgba(199,0,7,0.2)] group" style={{backgroundColor: '#1c1816'}}>
          {/* Ultra-modern status badge */}
          {product.product_status && (
            <div className="absolute top-4 left-4 z-10">
              <div
                className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-xl border ${
                  product.product_status === "Approved" || product.product_status === "true" || product.product_status === true
                    ? "border-green-500/30 text-green-300" 
                    : "border-red-500/30 text-red-300"
                }`}
                style={{backgroundColor: 
                  product.product_status === "Approved" || product.product_status === "true" || product.product_status === true
                    ? 'rgba(34, 197, 94, 0.1)' 
                    : 'rgba(239, 68, 68, 0.1)'
                }}
              >
                {product.product_status === "true" || product.product_status === true ? "Approved" :
                 product.product_status === "false" || product.product_status === false ? "Not Approved" :
                 product.product_status}
              </div>
            </div>
          )}

          <div className="relative overflow-hidden cursor-pointer" onClick={navigateToProductDetail}>
            {/* Premium image background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-red-700/5" />
            
            <div
              ref={imageRef}
              className="relative w-full h-56 overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={product.product_image || "/placeholder.svg?height=300&width=300"}
                alt={product.product_part_number || "Product Image"}
                className={`w-full h-full object-contain p-6 transition-all duration-500 ${
                  isZooming ? "scale-150" : "group-hover:scale-105"
                }`}
                style={
                  isZooming
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : {}
                }
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = "/placeholder.svg?height=300&width=300"
                }}
              />
            </div>

            {/* Ultra-modern hover overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-6"
              initial={{ opacity: 0, y: 20 }}
              whileHover={{ opacity: 1, y: 0 }}
            >
              <div className="flex gap-3">
                <motion.button
                  className="px-4 py-2 backdrop-blur-2xl rounded-xl text-white border border-white/20 hover:border-red-500/50 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                  style={{backgroundColor: '#1c1816'}}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(199, 0, 7, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateToProductDetail()
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Details
                </motion.button>
                <motion.button
                  className="px-4 py-2 backdrop-blur-2xl rounded-xl text-white border border-white/20 hover:border-red-500/50 transition-all duration-300 text-sm font-medium"
                  style={{backgroundColor: '#1c1816'}}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(199, 0, 7, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowModal(true)
                  }}
                >
                  Quick View
                </motion.button>
              </div>
            </motion.div>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <h3 
                className="font-bold text-xl text-white line-clamp-2 cursor-pointer hover:text-red-400 transition-colors leading-tight"
                onClick={navigateToProductDetail}
              >
                {product.product_part_number || product.product_name}
              </h3>
              {product.product_price && (
                <div className="flex items-center text-2xl font-black ml-3">
                  {product.sale_price ? (
                    <div className="flex flex-col items-end">
                      <span className="text-red-400 line-through text-lg">
                        ${product.product_price}
                      </span>
                      <span className="text-green-400">
                        ${product.sale_price}
                      </span>
                    </div>
                  ) : (
                    <span className="text-red-400">
                      ${product.product_price}
                    </span>
                  )}
                </div>
              )}
            </div>

            {product.product_short_description && (
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.product_short_description}</p>
            )}

            <div className="mt-auto flex flex-wrap gap-2 mb-4">
              {product.product_condition && (
                <span className="inline-flex items-center px-3 py-1 border border-white/20 rounded-full text-xs text-gray-300 backdrop-blur-xl font-medium" style={{backgroundColor: '#1c1816'}}>
                  <Package className="w-3 h-3 mr-1" />
                  {product.product_condition}
                </span>
              )}
              {product.product_sub_condition && (
                <span className="inline-flex items-center px-3 py-1 border border-white/20 rounded-full text-xs text-gray-300 backdrop-blur-xl font-medium" style={{backgroundColor: '#1c1816'}}>
                  <Star className="w-3 h-3 mr-1" />
                  {product.product_sub_condition}
                </span>
              )}
              {product.category_category_name && (
                <span className="inline-flex items-center px-3 py-1 border border-white/20 rounded-full text-xs text-gray-300 backdrop-blur-xl font-medium" style={{backgroundColor: '#1c1816'}}>
                  <Tag className="w-3 h-3 mr-1" />
                  {product.category_category_name}
                </span>
              )}
            </div>

            <motion.button
              className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 relative overflow-hidden group shadow-[0_20px_40px_rgba(199,0,7,0.3)] border border-red-600/30"
              style={{backgroundColor: '#c70007'}}
              whileHover={{ 
                scale: 1.02,
                boxShadow: '0 25px 50px rgba(199, 0, 7, 0.4)'
              }}
              whileTap={{ scale: 0.98 }}
              onClick={addToCart}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">Add to Cart</span>
              <ShoppingCart className="w-5 h-5 relative z-10" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Product Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-auto border border-white/10 rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)]" style={{backgroundColor: '#1c1816'}}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              className="absolute top-6 right-6 p-3 rounded-2xl backdrop-blur-xl border border-white/10 hover:border-red-500/50 text-white transition-all duration-300 z-10" style={{backgroundColor: '#1c1816'}}
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10">
              {/* Product Image */}
              <div className="flex flex-col items-center justify-center">
                {/* Status badge - Moved above the image */}
                {product.product_status && (
                  <div
                    className={`self-start px-3 py-1 text-sm font-medium rounded-full mb-2 ${
                      product.product_status === "Approved" || product.product_status === "true" || product.product_status === true
                        ? "bg-green-600/20 text-green-300 border border-green-500/30"
                        : "bg-red-600/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {product.product_status === "true" || product.product_status === true ? "Approved" :
                     product.product_status === "false" || product.product_status === false ? "Not Approved" :
                     product.product_status}
                  </div>
                )}

                <motion.div
                  className="relative w-full h-80 overflow-hidden rounded-3xl border border-white/10"
                  style={{backgroundColor: '#1c1816'}}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    ref={imageRef}
                    className="relative w-full h-full overflow-hidden"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <img
                      src={product.product_image || "/placeholder.svg?height=400&width=400"}
                      alt={product.product_part_number || "Product Image"}
                      className={`w-full h-full object-contain p-4 transition-transform duration-300 ${
                        isZooming ? "scale-150" : ""
                      }`}
                      style={
                        isZooming
                          ? {
                              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            }
                          : {}
                      }
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/placeholder.svg?height=400&width=400"
                      }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Product Details */}
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {product.product_part_number || product.product_name}
                </h2>

                {product.product_price && (
                  <div className="text-2xl font-bold text-white mb-4">${product.product_price}</div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {product.product_condition && (
                    <span className="inline-flex items-center px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-md text-sm text-red-200">
                      <Package className="w-4 h-4 mr-2" />
                      {product.product_condition}
                    </span>
                  )}
                  {product.product_sub_condition && (
                    <span className="inline-flex items-center px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-md text-sm text-red-200">
                      <Star className="w-4 h-4 mr-2" />
                      {product.product_sub_condition}
                    </span>
                  )}
                  {product.category_category_name && (
                    <span className="inline-flex items-center px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-md text-sm text-red-200">
                      <Tag className="w-4 h-4 mr-2" />
                      {product.category_category_name}
                    </span>
                  )}
                </div>

                {/* Short Description */}
                {product.product_short_description && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
                    <p className="text-gray-300">{product.product_short_description}</p>
                  </div>
                )}

                {/* Long Description */}
                {product.product_long_description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{product.product_long_description}</p>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mt-auto">
                  <h3 className="text-lg font-semibold text-white mb-3">Quantity</h3>
                  <div className="flex items-center mb-6">
                    <motion.button
                      className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-l-lg text-white hover:bg-white/20 transition-colors"
                      onClick={decreaseQuantity}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <div className="w-16 h-10 flex items-center justify-center bg-white/5 text-white font-medium">
                      {quantity}
                    </div>
                    <motion.button
                      className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-r-lg text-white hover:bg-white/20 transition-colors"
                      onClick={increaseQuantity}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Add to Cart Button */}
                  <motion.button
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 relative overflow-hidden group shadow-[0_20px_40px_rgba(199,0,7,0.3)] border border-red-600/30"
                    style={{backgroundColor: '#c70007'}}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: '0 25px 50px rgba(199, 0, 7, 0.4)'
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      addToCart()
                      setShowModal(false)
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative z-10">Add to Cart</span>
                    <ShoppingCart className="w-5 h-5 relative z-10" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
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
