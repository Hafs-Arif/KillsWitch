"use client"

import { motion } from "framer-motion"
import { Edit, Eye, MoreVertical, Package, Star, Tag, Trash2, CheckCircle, XCircle } from "lucide-react"

export default function ProductCard({ product, onEdit, onDelete, onView, onToggleStatus }) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        y: -10,
        transition: { duration: 0.3 },
      }}
    >
      <div className="border border-gray-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 h-full flex flex-col" style={{backgroundColor: '#1c1816'}}>
        {/* Status badges */}
        <div className="flex justify-between items-start m-2">
          {product.product_condition && (
            <div
              className={`px-2 py-1 text-xs rounded-full w-fit ${
                product.product_condition === "NEW" ? "bg-green-500/30 text-green-300" : "text-gray-300"
              }`}
              style={product.product_condition !== "NEW" ? {backgroundColor: '#1c1816'} : {}}
            >
              {product.product_condition}
            </div>
          )}
          
          {/* Approval Status Badge */}
          <div
            className={`px-2 py-1 text-xs rounded-full w-fit flex items-center gap-1 ${
              product.product_status === "Approved" || product.product_status === "true" || product.product_status === true
                ? "bg-green-500/30 text-green-300 border border-green-500/50" 
                : "bg-red-500/30 text-red-300 border border-red-500/50"
            }`}
          >
            {product.product_status === "Approved" || product.product_status === "true" || product.product_status === true ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Approved
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Not Approved
              </>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden group">
          <div className="relative w-full h-48 overflow-hidden" style={{background: 'radial-gradient(circle at center, rgba(199, 0, 7, 0.1) 0%, rgba(199, 0, 7, 0.05) 50%, transparent 100%)'}}>
            <img
              src={product.product_image || "/placeholder.svg?height=300&width=300"}
              alt={product.product_part_number || "Product Image"}
              className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = "/placeholder.svg?height=300&width=300"
              }}
            />
          </div>

          {/* Hover overlay with admin actions */}
          <motion.div
            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <button
              className="px-4 py-2 backdrop-blur-sm rounded-lg text-white border border-gray-500/30 hover:opacity-80 transition-colors flex items-center gap-2" style={{backgroundColor: '#1c1816'}}
              onClick={() => onView(product)}
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <button
              className="px-4 py-2 backdrop-blur-sm rounded-lg text-white border border-gray-500/30 hover:opacity-80 transition-colors flex items-center gap-2" style={{backgroundColor: '#c70007'}}
              onClick={() => onEdit(product)}
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </button>
            <button
              className="px-4 py-2 backdrop-blur-sm rounded-lg text-white border border-gray-500/30 hover:opacity-80 transition-colors flex items-center gap-2" style={{backgroundColor: '#c70007'}}
              onClick={() => onDelete(product.product_product_id)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            
            {/* Toggle Approval Status Button */}
            <button
              className={`px-4 py-2 backdrop-blur-sm rounded-lg text-white border border-gray-500/30 hover:opacity-80 transition-colors flex items-center gap-2 ${
                product.product_status === "Approved" || product.product_status === "true" || product.product_status === true
                  ? "bg-red-600" 
                  : "bg-green-600"
              }`}
              onClick={() => {
                onToggleStatus && onToggleStatus(product);
              }}
            >
              {product.product_status === "Approved" || product.product_status === "true" || product.product_status === true ? (
                <>
                  <XCircle className="w-4 h-4" />
                  Disapprove
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </>
              )}
            </button>
          </motion.div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-white line-clamp-1">{product.product_part_number}</h3>
            <div className="flex items-center">
              {product.product_price && (
                <div className="flex items-center text-lg font-bold text-white mr-2">${product.product_price}</div>
              )}
              <div className="relative group">
                <button className="p-1 rounded-full hover:opacity-80 transition-colors" style={{backgroundColor: '#1c1816'}}>
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 hidden group-hover:block" style={{backgroundColor: '#1c1816'}}>
                  <div className="py-1">
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:opacity-80 hover:text-white"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:opacity-80 hover:text-white"
                      onClick={() => onView(product)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:opacity-80 hover:text-red-300"
                      onClick={() => onDelete(product.product_product_id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                    <button
                      className={`flex items-center w-full px-4 py-2 text-sm hover:opacity-80 ${
                        product.product_status === "Approved" || product.product_status === "true" || product.product_status === true
                          ? "text-red-400 hover:text-red-300" 
                          : "text-green-400 hover:text-green-300"
                      }`}
                      onClick={() => {
                        onToggleStatus && onToggleStatus(product);
                      }}
                    >
                      {product.product_status === "Approved" || product.product_status === "true" || product.product_status === true ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Disapprove
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {product.product_short_description && (
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.product_short_description}</p>
          )}

          {/* Display all product data except long description */}
          <div className="mt-2 mb-3 space-y-1">
            {product.brand_brand_name && (
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-300">Brand:</span> {product.brand_brand_name}
              </p>
            )}
            {product.category_category_name && (
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-300">Category:</span> {product.category_category_name}
              </p>
            )}
            {product.product_quantity && (
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-300">Quantity:</span> {product.product_quantity}
              </p>
            )}
            {product.product_status && (
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-300">Status:</span> {product.product_status}
              </p>
            )}
            {product.product_sub_condition && (
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-300">Sub Condition:</span> {product.product_sub_condition}
              </p>
            )}
            {product.product_product_id && (
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-300">ID:</span> {product.product_product_id}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            {product.product_condition && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs" style={{backgroundColor: '#1c1816'}}>
                <Package className="w-3 h-3 mr-1" />
                {product.product_condition}
              </span>
            )}
            {product.product_sub_condition && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs" style={{backgroundColor: '#1c1816'}}>
                <Star className="w-3 h-3 mr-1" />
                {product.product_sub_condition}
              </span>
            )}
            {product.category_category_name && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs" style={{backgroundColor: '#1c1816'}}>
                <Tag className="w-3 h-3 mr-1" />
                {product.category_category_name}
              </span>
            )}
          </div>

          <div className="flex justify-between mt-4">
            <motion.button
              className="flex-1 mr-2 py-2 rounded-lg text-white hover:opacity-80 transition-colors flex items-center justify-center gap-2" style={{backgroundColor: '#c70007'}}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEdit(product)}
            >
              <Edit className="w-4 h-4" />
              Edit
            </motion.button>
            <motion.button
              className="flex-1 ml-2 py-2 rounded-lg text-white hover:opacity-80 transition-colors flex items-center justify-center gap-2" style={{backgroundColor: '#c70007'}}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onDelete(product.product_product_id)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}