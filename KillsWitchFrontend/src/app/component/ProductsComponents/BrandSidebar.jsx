"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronRight, Search, Tag, Package, Box, RefreshCw, X, Filter } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { fetchBrands } from "../../api/api"

export default function BrandSidebar({
  onBrandSelect,
  onCategorySelect,
  onSubcategorySelect,
  onProductSelect,
  onClose,
}) {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedBrands, setExpandedBrands] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})
  const [expandedSubcategories, setExpandedSubcategories] = useState({})
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [previouslyViewedBrands, setPreviouslyViewedBrands] = useState([])

  const sidebarRef = useRef(null)

  // Define professional color classes for different hierarchy levels
  const colorClasses = {
    brand: {
      active: "bg-red-700 text-white font-bold",
      hover: "hover:bg-red-600",
    },
    category: {
      active: "bg-red-700 text-white font-bold",
      hover: "hover:bg-red-600",
    },
    subcategory: {
      active: "bg-red-700 text-white font-bold",
      hover: "hover:bg-red-600",
    },
    product: {
      active: "bg-red-700 text-white font-bold",
      hover: "hover:bg-red-600",
    },
  }

  // Handle wheel events to prevent body scrolling when sidebar is scrolled
  useEffect(() => {
    const handleWheel = (e) => {
      if (!sidebarRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = sidebarRef.current
      const isAtTop = scrollTop === 0
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

      if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom) || e.target === sidebarRef.current) {
        e.stopPropagation()
      } else {
        e.preventDefault()
      }
    }

    const sidebar = sidebarRef.current
    if (sidebar) {
      sidebar.addEventListener("wheel", handleWheel, { passive: false })
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener("wheel", handleWheel)
      }
    }
  }, [])

  // Load previously viewed brands from localStorage
  useEffect(() => {
    const storedBrands = localStorage.getItem("killswitch_viewed_brands")
    if (storedBrands) {
      setPreviouslyViewedBrands(JSON.parse(storedBrands))
    }
  }, [])

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const data = await fetchBrands()
        setBrands(data)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch brands:", error)
        setError(error.message)
        setLoading(false)
      }
    }

    loadBrands()
  }, [])

  const handleRefreshBrands = async () => {
    setLoading(true)
    localStorage.removeItem("killswitch_brands")
    localStorage.removeItem("killswitch_brands_timestamp")

    try {
      const data = await fetchBrands()
      setBrands(data)
      setLoading(false)
    } catch (error) {
      console.error("Error refreshing brands:", error)
      setError(error.message)
      setLoading(false)
    }
  }

  const handleBrandClick = (brand) => {
    // Toggle expansion
    setExpandedBrands((prev) => ({
      ...prev,
      [brand.brand_id]: !prev[brand.brand_id],
    }))

    // Set selected brand for visual indication
    setSelectedBrand(brand)

    // Add to previously viewed brands if not already there
    if (!previouslyViewedBrands.includes(brand.brand_name)) {
      const updatedBrands = [...previouslyViewedBrands, brand.brand_name]
      setPreviouslyViewedBrands(updatedBrands)
      localStorage.setItem("killswitch_viewed_brands", JSON.stringify(updatedBrands))
    }

    // Apply filter immediately
    if (onBrandSelect) {
      onBrandSelect(brand.brand_name)
      if (typeof window !== "undefined" && window.innerWidth < 1024 && onClose) {
        setTimeout(() => onClose(), 200)
      }
    }
  }

  const handleCategoryClick = (brand, category) => {
    // Toggle expansion
    setExpandedCategories((prev) => ({
      ...prev,
      [category.category_id]: !prev[category.category_id],
    }))

    // Set selected category for visual indication
    setSelectedBrand(brand)
    setSelectedCategory(category)

    // Apply filter immediately
    if (onCategorySelect) {
      onCategorySelect(brand.brand_name, category.category_name)
      if (typeof window !== "undefined" && window.innerWidth < 1024 && onClose) {
        setTimeout(() => onClose(), 200)
      }
    }
  }

  const handleSubcategoryClick = (brand, category, subcategory) => {
    // Toggle expansion
    setExpandedSubcategories((prev) => ({
      ...prev,
      [subcategory.subcategory_id]: !prev[subcategory.subcategory_id],
    }))

    // Set all selections for visual indication
    setSelectedBrand(brand)
    setSelectedCategory(category)
    setSelectedSubcategory(subcategory)

    // Apply filter immediately
    if (onSubcategorySelect) {
      onSubcategorySelect(
        brand.brand_name,
        category.category_name,
        subcategory.subcategory_name,
      )
      if (typeof window !== "undefined" && window.innerWidth < 1024 && onClose) {
        setTimeout(() => onClose(), 200)
      }
    }
  }

  const handleProductClick = (brand, category, subcategory, product) => {
    // Set all selections
    setSelectedBrand(brand)
    setSelectedCategory(category)
    setSelectedSubcategory(subcategory)
    setSelectedProduct(product)

    // Call the callback
    if (onProductSelect) {
      onProductSelect(brand.brand_name, product.product_name)
    }
  }

  // Filter brands based on search term
  const filteredBrands = searchTerm
    ? brands.filter((brand) => brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase()))
    : brands

  return (
    <div className="text-white flex flex-col h-full relative" style={{backgroundColor: '#1c1816'}}>
      {/* Close button for mobile */}
      {onClose && (
        <motion.button
          className="absolute top-4 right-4 p-2 rounded-full text-white z-10 lg:hidden backdrop-blur-xl border border-white/10"
          style={{backgroundColor: '#1c1816'}}
          whileHover={{ scale: 1.1, borderColor: "rgba(199, 0, 7, 0.5)" }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </motion.button>
      )}

      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Brands & Categories</h2>
          <motion.button
            whileHover={{ scale: 1.1, borderColor: "rgba(199, 0, 7, 0.5)" }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefreshBrands}
            className="p-2 text-gray-400 hover:text-white rounded-xl border border-white/10 backdrop-blur-xl transition-colors duration-200"
            style={{backgroundColor: '#1c1816'}}
            title="Refresh Brands"
          >
            <RefreshCw className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Search Box */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 rounded-xl border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 backdrop-blur-xl transition-all duration-300" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}}
          />
        </div>
      </div>

      {/* Scrollable content area */}
      <div ref={sidebarRef} className="flex-1 overflow-y-auto px-4 pb-4" onTouchMove={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600 mb-4"></div>
            <p className="text-gray-400">Loading brands...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 rounded-lg border border-red-500/20 mt-4">
            <p className="font-medium mb-2">Error loading brands:</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={handleRefreshBrands}
              className="mt-3 px-4 py-2 rounded-xl text-sm transition-colors border border-red-500/30 hover:border-red-500/50" style={{backgroundColor: '#c70007'}}
            >
              Try Again
            </button>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-gray-400 p-4 text-center mt-8">
            <p className="mb-2">No brands found matching your search.</p>
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="text-red-400 hover:text-red-300 text-sm">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {filteredBrands.map((brand, brandIndex) => (
              <motion.div
                key={brand.brand_id}
                className="border-b border-white/10 pb-4 last:border-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: brandIndex * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ x: 5 }}
                    onClick={() => handleBrandClick(brand)}
                    className={`flex items-center text-left text-white hover:text-red-400 transition-colors duration-200 ${
                      selectedBrand?.brand_id === brand.brand_id ? "text-red-400 font-medium" : ""
                    }`}
                  >
                    <Tag className="h-4 w-4 mr-2 text-red-400" />
                    <span className="font-medium">{brand.brand_name}</span>
                    {expandedBrands[brand.brand_id] ? (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-2 h-4 w-4" />
                    )}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {expandedBrands[brand.brand_id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 ml-6 space-y-2"
                    >
                      {brand.categories && brand.categories.length > 0 ? (
                        brand.categories.map((category, index) => (
                          <motion.div
                            key={category.category_id}
                            className="mb-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="flex items-center justify-between">
                              <motion.button
                                whileHover={{ x: 5 }}
                                onClick={() => handleCategoryClick(brand, category)}
                                className={`flex items-center text-left text-gray-300 py-2 px-3 rounded-xl hover:text-white transition-colors duration-200 ${
                                  selectedCategory?.category_id === category.category_id ? "text-white" : ""
                                }`}
                                style={{
                                  backgroundColor: selectedCategory?.category_id === category.category_id ? '#1c1816' : 'transparent'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#1c1816'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = selectedCategory?.category_id === category.category_id ? '#1c1816' : 'transparent'}
                              >
                                <div className="flex items-center">
                                  <Box className="h-4 w-4 mr-2 text-red-400" />
                                  <span>{category.category_name}</span>
                                </div>
                                {expandedCategories[category.category_id] ? (
                                  <ChevronDown className="ml-2 h-4 w-4" />
                                ) : (
                                  <ChevronRight className="ml-2 h-4 w-4" />
                                )}
                              </motion.button>
                            </div>

                            <AnimatePresence>
                              {expandedCategories[category.category_id] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="ml-4 mt-2 space-y-2"
                                >
                                  {category.subcategories && category.subcategories.length > 0 ? (
                                    category.subcategories.map((subcategory, subIndex) => (
                                      <motion.div
                                        key={subcategory.subcategory_id}
                                        className="mb-2"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        transition={{ duration: 0.3, delay: subIndex * 0.05 }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <motion.button
                                            whileHover={{ x: 5 }}
                                            onClick={() => handleSubcategoryClick(brand, category, subcategory)}
                                            className={`flex items-center text-left text-gray-300 py-2 px-3 rounded-xl hover:text-white transition-colors duration-200 ${
                                              selectedSubcategory?.subcategory_id === subcategory.subcategory_id
                                                ? "text-white"
                                                : ""
                                            }`}
                                            style={{
                                              backgroundColor: selectedSubcategory?.subcategory_id === subcategory.subcategory_id ? '#1c1816' : 'transparent'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#1c1816'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = selectedSubcategory?.subcategory_id === subcategory.subcategory_id ? '#1c1816' : 'transparent'}
                                          >
                                            <div className="flex items-center">
                                              <Package className="h-4 w-4 mr-2 text-red-400" />
                                              <span>{subcategory.subcategory_name}</span>
                                            </div>
                                            {expandedSubcategories[subcategory.subcategory_id] ? (
                                              <ChevronDown className="ml-2 h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="ml-2 h-4 w-4" />
                                            )}
                                          </motion.button>
                                        </div>

                                        <AnimatePresence>
                                          {expandedSubcategories[subcategory.subcategory_id] && (
                                            <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: "auto" }}
                                              exit={{ opacity: 0, height: 0 }}
                                              transition={{ duration: 0.3 }}
                                              className="ml-4 mt-2 space-y-2"
                                            >
                                              {subcategory.products && subcategory.products.length > 0 ? (
                                                subcategory.products.map((product, prodIndex) => (
                                                  <motion.button
                                                    key={product.product_id}
                                                    whileHover={{ x: 5, backgroundColor: "rgba(139, 92, 246, 0.1)" }}
                                                    onClick={() => {
                                                      handleProductClick(brand, category, subcategory, product)
                                                      if (window.innerWidth < 1024 && onClose) {
                                                        setTimeout(() => onClose(), 300)
                                                      }
                                                    }}
                                                    className={`flex items-center w-full text-left text-gray-400 py-1 px-3 rounded-xl hover:text-white transition-colors duration-200 ${
                                                      selectedProduct?.product_id === product.product_id
                                                        ? "text-white"
                                                        : ""
                                                    }`}
                                                    style={{
                                                      backgroundColor: selectedProduct?.product_id === product.product_id ? '#1c1816' : 'transparent'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#1c1816'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = selectedProduct?.product_id === product.product_id ? '#1c1816' : 'transparent'}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.2, delay: prodIndex * 0.03 }}
                                                  >
                                                    <Package className="h-3 w-3 mr-2 text-red-400" />
                                                    <span className="text-sm truncate">{product.product_name}</span>
                                                  </motion.button>
                                                ))
                                              ) : (
                                                <div className="text-gray-500 text-sm py-1 px-3">
                                                  No products available
                                                </div>
                                              )}
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </motion.div>
                                    ))
                                  ) : (
                                    <div className="text-gray-500 text-sm py-1 px-3">No subcategories available</div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-gray-400 py-2">No categories available</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Previously viewed brands section */}
        {searchTerm && previouslyViewedBrands.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Previously Viewed</h3>
            <div className="space-y-2">
              {previouslyViewedBrands.map((brandName, index) => {
                const brand = brands.find((b) => b.brand_name === brandName)
                if (!brand) return null

                return (
                  <div key={`prev-${brand.brand_id}`} className="flex items-center justify-between">
                    <motion.button
                      whileHover={{ x: 5 }}
                      onClick={() => handleBrandClick(brand)}
                      className="flex items-center w-full text-left text-gray-300 py-2 px-3 rounded-xl hover:text-white transition-colors duration-200"
                      style={{backgroundColor: 'transparent'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#1c1816'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Tag className="h-4 w-4 mr-2 text-red-400" />
                      <span>{brand.brand_name}</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        onBrandSelect(brand.brand_name)
                        if (window.innerWidth < 1024 && onClose) {
                          setTimeout(() => onClose(), 300)
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-white rounded-xl border border-white/10 backdrop-blur-xl transition-colors duration-200 ml-2" style={{backgroundColor: '#1c1816'}}
                      title="Filter by this brand"
                    >
                      <Filter className="h-4 w-4" />
                    </motion.button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
