"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { X, Edit, Trash2, Package, Star, Tag } from "lucide-react"

export default function ProductModal({ product, onClose, onEdit, onDelete }) {
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isZooming, setIsZooming] = useState(false)
  const imageRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!imageRef.current) return

    const { left, top, width, height } = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100

    setZoomPosition({ x, y })
  }

  const handleMouseEnter = () => setIsZooming(true)
  const handleMouseLeave = () => setIsZooming(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-auto border border-gray-500/30 rounded-2xl shadow-2xl" style={{backgroundColor: '#1c1816'}}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:opacity-80 text-white transition-colors z-10" style={{backgroundColor: '#1c1816'}}
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Product Image */}
          <div className="flex flex-col items-center justify-center">
            {/* Status badge - Moved above the image */}
            {product.product_condition && (
              <div
                className={`self-start px-3 py-1 text-sm font-medium rounded-full mb-2 ${
                  product.product_condition === "NEW" ? "bg-green-500/30 text-green-300" : "bg-white/10 text-gray-300"
                }`}
              >
                {product.product_condition}
              </div>
            )}

            <motion.div
              className="relative w-full h-80 overflow-hidden rounded-xl border border-gray-500/30" 
              style={{background: 'radial-gradient(circle at center, rgba(199, 0, 7, 0.15) 0%, rgba(199, 0, 7, 0.08) 50%, transparent 100%)'}}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div
                ref={imageRef}
                className="relative w-full h-full overflow-hidden"
                onMouseMove={handleMouseMove}
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
            <h2 className="text-2xl font-bold text-white mb-2">{product.product_part_number}</h2>

            {product.product_price && (
              <div className="text-2xl font-bold text-white mb-4">${product.product_price}</div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.product_condition && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm" style={{backgroundColor: '#1c1816'}}>
                  <Package className="w-4 h-4 mr-2" />
                  {product.product_condition}
                </span>
              )}
              {product.product_sub_condition && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm" style={{backgroundColor: '#1c1816'}}>
                  <Star className="w-4 h-4 mr-2" />
                  {product.product_sub_condition}
                </span>
              )}
              {product.category_category_name && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm" style={{backgroundColor: '#1c1816'}}>
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

            {/* Display all product data except long description */}
            <div className="mb-6 grid grid-cols-2 gap-2">
              {product.brand_brand_name && (
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Brand:</span> {product.brand_brand_name}
                </p>
              )}
              {product.category_category_name && (
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Category:</span> {product.category_category_name}
                </p>
              )}
              {product.product_quantity && (
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Quantity:</span> {product.product_quantity}
                </p>
              )}
              {product.product_status && (
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Status:</span> {product.product_status}
                </p>
              )}
              {product.product_sub_condition && (
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Sub Condition:</span> {product.product_sub_condition}
                </p>
              )}
              {product.product_product_id && (
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Product ID:</span> {product.product_product_id}
                </p>
              )}
            </div>

            {/* Admin Actions */}
            <div className="mt-auto flex gap-4">
              <motion.button
                className="flex-1 py-3 rounded-lg text-white hover:opacity-80 transition-colors flex items-center justify-center gap-2" style={{backgroundColor: '#c70007'}}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onClose()
                  onEdit(product)
                }}
              >
                <Edit className="w-5 h-5" />
                Edit Product
              </motion.button>
              <motion.button
                className="flex-1 py-3 rounded-lg text-white hover:opacity-80 transition-colors flex items-center justify-center gap-2" style={{backgroundColor: '#c70007'}}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onClose()
                  onDelete(product.product_product_id)
                }}
              >
                <Trash2 className="w-5 h-5" />
                Delete Product
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
