"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Menu,
  Search,
  Tag,
  Package,
  X,
  Hash,
  ChevronDown,
  Star,
  ShoppingCart,
  Plus,
  Minus,
} from "lucide-react"
import { useParams } from "next/navigation"
import { topProducts } from "../../api/api"
import Navbar from "../../component/HomeComponents/Navbar"
import Footer from "../../component/HomeComponents/Footer"

export default function ProductCategoryPage() {
  const params = useParams()
  const category = params.category

  const [brandsData, setBrandsData] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedBrands, setExpandedBrands] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})
  const [expandedSubcategories, setExpandedSubcategories] = useState({})
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [previouslyViewedBrands, setPreviouslyViewedBrands] = useState([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [productsPerPage] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [isVisible, setIsVisible] = useState({})

  // Search state
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isZooming, setIsZooming] = useState(false)
  const imageRef = useRef(null)

  const sidebarRef = useRef(null)
  const searchInputRef = useRef(null)
  const searchResultsRef = useRef(null)

  // Define professional color classes for different hierarchy levels
  const colorClasses = {
    brand: { active: "bg-red-700 text-white font-bold", hover: "hover:bg-red-600" },
    category: { active: "bg-red-700 text-white font-bold", hover: "hover:bg-red-600" },
    subcategory: { active: "bg-red-700 text-white font-bold", hover: "hover:bg-red-600" },
    product: { active: "bg-red-700 text-white font-bold", hover: "hover:bg-red-600" },
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
    if (typeof window !== "undefined") {
      const storedBrands = localStorage.getItem("killswitch_viewed_brands")
      if (storedBrands) {
        setPreviouslyViewedBrands(JSON.parse(storedBrands))
      }
    }
  }, [])

  // Fetch products for the selected category
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true)
      try {
        const data = await topProducts(category)
        setBrandsData(data)

        // Extract all products from the nested structure
        const allProducts = extractAllProducts(data)
        setFilteredProducts(allProducts)
        setTotalPages(Math.ceil(allProducts.length / productsPerPage))
      } catch (err) {
        console.error("Error loading products:", err)
        setError("Failed to load products. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (category) {
      fetchCategoryProducts()
    }
  }, [category, productsPerPage])

  // Extract all products from the nested data structure
  const extractAllProducts = (data) => {
    const products = []

    data.forEach((brand) => {
      brand.categories?.forEach((category) => {
        category.subcategories?.forEach((subcategory) => {
          subcategory.products?.forEach((product) => {
            products.push({
              ...product,
              brand_id: brand.brand_id,
              brand_name: brand.brand_name,
              category_id: category.category_id,
              category_name: category.category_name,
              subcategory_id: subcategory.subcategory_id,
              subcategory_name: subcategory.subcategory_name,
            })
          })
        })
      })
    })

    return products
  }

  // Apply filters when selection changes
  useEffect(() => {
    if (brandsData.length === 0) return

    const filtered = []

    brandsData.forEach((brand) => {
      // Skip if brand filter is applied and doesn't match
      if (selectedBrand && brand.brand_name !== selectedBrand) return

      brand.categories?.forEach((category) => {
        // Skip if category filter is applied and doesn't match
        if (selectedCategory && category.category_name !== selectedCategory) return

        category.subcategories?.forEach((subcategory) => {
          // Skip if subcategory filter is applied and doesn't match
          if (selectedSubcategory && subcategory.subcategory_name !== selectedSubcategory) return

          subcategory.products?.forEach((product) => {
            filtered.push({
              ...product,
              brand_id: brand.brand_id,
              brand_name: brand.brand_name,
              category_id: category.category_id,
              category_name: category.category_name,
              subcategory_id: subcategory.subcategory_id,
              subcategory_name: subcategory.subcategory_name,
            })
          })
        })
      })
    })

    setFilteredProducts(filtered)
    setTotalPages(Math.ceil(filtered.length / productsPerPage))
    setCurrentPage(1) // Reset to first page when filters change

    // Close sidebar on mobile after applying filter
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [selectedBrand, selectedCategory, selectedSubcategory, brandsData, productsPerPage])

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("section")
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top
        const sectionId = section.id
        if (sectionTop < window.innerHeight * 0.75) {
          setIsVisible((prev) => ({ ...prev, [sectionId]: true }))
        }
      })
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check on initial load
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && sidebarOpen) {
        setSidebarOpen(false)
      }

      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target) &&
        !searchInputRef.current?.contains(event.target)
      ) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [sidebarOpen])

  // Handle window resize to close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [sidebarOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [sidebarOpen])

  // Update displayed products when page changes
  const displayedProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)

  // Search products
  const handleSearch = (query) => {
    setSearchTerm(query)

    if (!query || query.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)

    try {
      const normalizedQuery = query.toLowerCase().trim()
      const results = []

      // Search through the nested structure
      brandsData.forEach((brand) => {
        // Check if brand name matches
        if (brand.brand_name.toLowerCase().includes(normalizedQuery)) {
          results.push({
            type: "brand",
            value: brand.brand_name,
            id: brand.brand_id,
          })
        }

        brand.categories?.forEach((category) => {
          category.subcategories?.forEach((subcategory) => {
            subcategory.products?.forEach((product) => {
              // Check if product name matches
              if (product.product_name.toLowerCase().includes(normalizedQuery)) {
                results.push({
                  type: "product",
                  value: product.product_name,
                  brand: brand.brand_name,
                  category: category.category_name,
                  subcategory: subcategory.subcategory_name,
                  id: product.product_id,
                })
              }
            })
          })
        })
      })

      // Limit to 10 results
      setSearchResults(results.slice(0, 10))
      setShowSearchResults(results.length > 0)
    } catch (error) {
      console.error("Error searching products:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search suggestion click
  const handleSearchResultClick = (result) => {
    if (result.type === "brand") {
      setSelectedBrand(result.value)
      setSelectedCategory(null)
      setSelectedSubcategory(null)

      // Add to previously viewed brands
      if (!previouslyViewedBrands.includes(result.value)) {
        const updatedBrands = [...previouslyViewedBrands, result.value]
        setPreviouslyViewedBrands(updatedBrands)
        localStorage.setItem("killswitch_viewed_brands", JSON.stringify(updatedBrands))
      }
    } else if (result.type === "product") {
      setSelectedBrand(result.brand)
      setSelectedCategory(result.category)
      setSelectedSubcategory(result.subcategory)
    }

    setSearchTerm(result.value)
    setShowSearchResults(false)
  }

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    // Implementation would depend on your search requirements
    setShowSearchResults(false)
  }

  const handleBrandClick = (brand) => {
    // Toggle expansion
    setExpandedBrands((prev) => ({
      ...prev,
      [brand.brand_id]: !prev[brand.brand_id],
    }))

    // Set selected brand for filtering
    setSelectedBrand(brand.brand_name)
    setSelectedCategory(null)
    setSelectedSubcategory(null)

    // Add to previously viewed brands if not already there
    if (!previouslyViewedBrands.includes(brand.brand_name)) {
      const updatedBrands = [...previouslyViewedBrands, brand.brand_name]
      setPreviouslyViewedBrands(updatedBrands)
      localStorage.setItem("niftyorbit_viewed_brands", JSON.stringify(updatedBrands))
    }
  }

  const handleCategoryClick = (brand, category) => {
    // Toggle expansion
    setExpandedCategories((prev) => ({
      ...prev,
      [category.category_id]: !prev[category.category_id],
    }))

    // Set filters
    setSelectedBrand(brand.brand_name)
    setSelectedCategory(category.category_name)
    setSelectedSubcategory(null)
  }

  const handleSubcategoryClick = (brand, category, subcategory) => {
    // Set filters
    setSelectedBrand(brand.brand_name)
    setSelectedCategory(category.category_name)
    setSelectedSubcategory(subcategory.subcategory_name)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const refreshProducts = async () => {
    setLoading(true)
    try {
      const data = await topProducts(category)
      setBrandsData(data)

      // Reset filters
      setSelectedBrand(null)
      setSelectedCategory(null)
      setSelectedSubcategory(null)

      // Extract all products
      const allProducts = extractAllProducts(data)
      setFilteredProducts(allProducts)
      setTotalPages(Math.ceil(allProducts.length / productsPerPage))
      setCurrentPage(1)
    } catch (err) {
      console.error("Error refreshing products:", err)
      setError("Failed to refresh products. Please try again.")
    } finally {
      setLoading(false)
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

  const openProductModal = (product) => {
    setSelectedProduct(product)
    setShowModal(true)
    setQuantity(1)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const sidebarVariants = {
    closed: {
      x: "-100%",
      boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)",
    },
    open: {
      x: 0,
      boxShadow: "10px 0px 50px rgba(0, 0, 0, 0.5)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  }

  // Generate filter description
  const getFilterDescription = () => {
    if (selectedSubcategory) {
      return `${selectedSubcategory} in ${selectedCategory} category, ${selectedBrand} brand`
    } else if (selectedCategory) {
      return `${selectedCategory} category in ${selectedBrand} brand`
    } else if (selectedBrand) {
      return `${selectedBrand} brand`
    } else {
      return `${category.charAt(0).toUpperCase() + category.slice(1)} Products`
    }
  }

  // Get category title
  const getCategoryTitle = () => {
    if (category === "server") return "Premium Servers"
    if (category === "router") return "Enterprise Routers"
    if (category === "switch") return "High-Performance Switches"
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  // Helpers for hierarchical view
  const getBrandByName = (brandName) => brandsData.find((b) => b.brand_name === brandName)
  const getCategoriesForBrand = (brandName) => {
    const b = getBrandByName(brandName)
    return b?.categories || []
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Navbar />

        <div className="flex-1 relative">
          {/* Animated background elements */}
          <div className="fixed inset-0 z-[-1] overflow-hidden">
            {/* Grid lines */}
            <div className="absolute top-0 left-1/4 w-px h-full bg-red-600/20"></div>
            <div className="absolute top-0 left-2/4 w-px h-full bg-red-600/20"></div>
            <div className="absolute top-0 left-3/4 w-px h-full bg-red-600/20"></div>
            <div className="absolute top-1/3 left-0 w-full h-px bg-red-600/20"></div>
            <div className="absolute top-2/3 left-0 w-full h-px bg-red-600/20"></div>

            {/* Animated orbs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-red-600/20 blur-3xl"
              animate={{
                x: [0, 30, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-red-700/20 blur-3xl"
              animate={{
                x: [0, -40, 0],
                y: [0, 40, 0],
              }}
              transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>

          {/* Sidebar toggle button - hidden when sidebar is open */}
          {!sidebarOpen && (
            <motion.button
              className="fixed top-24 left-4 z-50 p-3 bg-gray-900/80 rounded-full shadow-lg border border-red-600/30 text-white lg:hidden"
              whileHover={{ scale: 1.1, backgroundColor: "#4B5563" }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </motion.button>
          )}

          {/* Mobile sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                ref={sidebarRef}
                className="fixed top-0 left-0 z-40 h-full w-80 lg:hidden"
                variants={sidebarVariants}
                initial="closed"
                animate="open"
                exit="closed"
              >
                <div className="bg-black/90 text-white flex flex-col h-full relative">
                  {/* Close button for mobile */}
                  <button
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-white z-10"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Brands & Categories</h2>
                    </div>

                    {/* Search Box */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isSearching ? (
                          <div className="animate-spin h-4 w-4 border-2 border-red-500 rounded-full border-t-transparent" />
                        ) : (
                          <Search className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <form onSubmit={handleSearchSubmit}>
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search brands or products..."
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          onFocus={() => searchTerm.trim().length >= 2 && setShowSearchResults(true)}
                          className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-900/60 border border-red-600/20 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
                        />
                      </form>
                    </div>

                    {/* Search Results */}
                    <AnimatePresence>
                      {showSearchResults && searchTerm.trim().length >= 2 && (
                        <motion.div
                          ref={searchResultsRef}
                          className="mt-2 bg-gray-900/90 border border-red-600/20 rounded-lg shadow-lg overflow-hidden"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="max-h-60 overflow-y-auto py-2">
                            {searchResults.length > 0 ? (
                              <>
                                {/* Brand suggestions */}
                                {searchResults.filter((s) => s.type === "brand").length > 0 && (
                                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Brands
                                  </div>
                                )}
                                {searchResults
                                  .filter((s) => s.type === "brand")
                                  .map((suggestion, index) => (
                                    <motion.button
                                      key={`brand-${suggestion.id}-${index}`}
                                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                      onClick={() => handleSearchResultClick(suggestion)}
                                      whileHover={{ x: 5 }}
                                    >
                                      <Tag className="h-4 w-4 mr-3 text-red-400" />
                                      <span>{suggestion.value}</span>
                                    </motion.button>
                                  ))}

                                {/* Product suggestions */}
                                {searchResults.filter((s) => s.type === "product").length > 0 && (
                                  <div className="px-3 py-1 mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Products
                                  </div>
                                )}
                                {searchResults
                                  .filter((s) => s.type === "product")
                                  .map((suggestion, index) => (
                                    <motion.button
                                      key={`product-${suggestion.id}-${index}`}
                                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                      onClick={() => handleSearchResultClick(suggestion)}
                                      whileHover={{ x: 5 }}
                                    >
                                      <Hash className="h-4 w-4 mr-3 text-red-400" />
                                      <div className="flex flex-col">
                                        <span>{suggestion.value}</span>
                                        <span className="text-xs text-gray-500">
                                          {suggestion.brand} &gt; {suggestion.category} &gt; {suggestion.subcategory}
                                        </span>
                                      </div>
                                    </motion.button>
                                  ))}
                              </>
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                {isSearching ? "Searching..." : "No results found"}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Scrollable content area */}
                  <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                        <p className="text-gray-400">Loading brands...</p>
                      </div>
                    ) : (
                      <div className="space-y-4 mt-4">
                        {brandsData.map((brand, brandIndex) => (
                          <motion.div
                            key={brand.brand_id}
                            className="border-b border-gray-800 pb-4 last:border-0"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: brandIndex * 0.05 }}
                          >
                            <div className="flex items-center justify-between">
                              <motion.button
                                whileHover={{ x: 5 }}
                                onClick={() => handleBrandClick(brand)}
                                className={`flex items-center text-left text-white hover:text-purple-400 transition-colors duration-200 ${
                                  selectedBrand === brand.brand_name ? "text-purple-400 font-medium" : ""
                                }`}
                              >
                                <Tag className="h-4 w-4 mr-2 text-indigo-400" />
                                <span className="font-medium">{brand.brand_name}</span>
                                {expandedBrands[brand.brand_id] ? (
                                  <ChevronDown className="ml-2 h-4 w-4" />
                                ) : (
                                  <ChevronRight className="ml-2 h-4 w-4" />
                                )}
                              </motion.button>
                              {/* Removed explicit filter button - clicking item filters immediately */}
                            </div>

                            <AnimatePresence>
                              {expandedBrands[brand.brand_id] && brand.categories && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="mt-3 ml-6 space-y-2"
                                >
                                  {brand.categories.map((category, index) => (
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
                                          className={`flex items-center text-left text-gray-300 py-2 px-3 rounded-md hover:bg-gray-800/50 hover:text-white transition-colors duration-200 ${
                                            selectedCategory === category.category_name ? "bg-gray-800 text-white" : ""
                                          }`}
                                        >
                                          <div className="flex items-center">
                                            <Package className="h-4 w-4 mr-2 text-violet-400" />
                                            <span>{category.category_name}</span>
                                          </div>
                                          {expandedCategories[category.category_id] ? (
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                          )}
                                        </motion.button>
                                          {/* Removed explicit filter button - clicking item filters immediately */}
                                      </div>

                                      <AnimatePresence>
                                        {expandedCategories[category.category_id] && category.subcategories && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="ml-4 mt-2 space-y-2"
                                          >
                                            {category.subcategories.map((subcategory, subIndex) => (
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
                                                    className={`flex items-center text-left text-gray-300 py-2 px-3 rounded-md hover:bg-gray-800/50 hover:text-white transition-colors duration-200 ${
                                                      selectedSubcategory === subcategory.subcategory_name
                                                        ? "bg-gray-700 text-white"
                                                        : ""
                                                    }`}
                                                  >
                                                    <div className="flex items-center">
                                                      <Hash className="h-4 w-4 mr-2 text-purple-400" />
                                                      <span>{subcategory.subcategory_name}</span>
                                                    </div>
                                                  </motion.button>
                                                  <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => {
                                                      setSelectedBrand(brand.brand_name)
                                                      setSelectedCategory(category.category_name)
                                                      setSelectedSubcategory(subcategory.subcategory_name)
                                                      if (window.innerWidth < 1024) {
                                                        setTimeout(() => setSidebarOpen(false), 300)
                                                      }
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors duration-200 ml-2"
                                                    title="Filter by this subcategory"
                                                  >
                                                    <Filter className="h-4 w-4" />
                                                  </motion.button>
                                                </div>
                                              </motion.div>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content with sidebar */}
          <div className="pt-6 pb-12 px-4 sm:px-6">
            <div className="max-w-[1800px] mx-auto lg:flex">
              {/* Desktop sidebar - fixed on left with increased width */}
              <div className="hidden lg:block w-[300px] flex-shrink-0">
                <div className="sticky top-24 h-[calc(100vh-6rem)] w-[300px] overflow-hidden rounded-xl border border-red-600/20">
                  <div className="bg-gray-900 text-white flex flex-col h-full relative">
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Brands & Categories</h2>
                      </div>

                      {/* Search Box */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {isSearching ? (
                            <div className="animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent" />
                          ) : (
                            <Search className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <form onSubmit={handleSearchSubmit}>
                          <input
                            type="text"
                            placeholder="Search brands or products..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => searchTerm.trim().length >= 2 && setShowSearchResults(true)}
                            className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </form>
                      </div>

                      {/* Search Results */}
                      <AnimatePresence>
                        {showSearchResults && searchTerm.trim().length >= 2 && (
                          <motion.div
                            className="mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="max-h-60 overflow-y-auto py-2">
                              {searchResults.length > 0 ? (
                                <>
                                  {/* Brand suggestions */}
                                  {searchResults.filter((s) => s.type === "brand").length > 0 && (
                                    <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                      Brands
                                    </div>
                                  )}
                                  {searchResults
                                    .filter((s) => s.type === "brand")
                                    .map((suggestion, index) => (
                                      <motion.button
                                        key={`brand-${suggestion.id}-${index}`}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                        onClick={() => handleSearchResultClick(suggestion)}
                                        whileHover={{ x: 5 }}
                                      >
                                        <Tag className="h-4 w-4 mr-3 text-purple-400" />
                                        <span>{suggestion.value}</span>
                                      </motion.button>
                                    ))}

                                  {/* Product suggestions */}
                                  {searchResults.filter((s) => s.type === "product").length > 0 && (
                                    <div className="px-3 py-1 mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                      Products
                                    </div>
                                  )}
                                  {searchResults
                                    .filter((s) => s.type === "product")
                                    .map((suggestion, index) => (
                                      <motion.button
                                        key={`product-${suggestion.id}-${index}`}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                        onClick={() => handleSearchResultClick(suggestion)}
                                        whileHover={{ x: 5 }}
                                      >
                                        <Hash className="h-4 w-4 mr-3 text-indigo-400" />
                                        <div className="flex flex-col">
                                          <span>{suggestion.value}</span>
                                          <span className="text-xs text-gray-500">
                                            {suggestion.brand} &gt; {suggestion.category} &gt; {suggestion.subcategory}
                                          </span>
                                        </div>
                                      </motion.button>
                                    ))}
                                </>
                              ) : (
                                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                  {isSearching ? "Searching..." : "No results found"}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Scrollable content area */}
                    <div ref={sidebarRef} className="flex-1 overflow-y-auto px-4 pb-4">
                      {loading ? (
                        <div className="flex flex-col items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                          <p className="text-gray-400">Loading brands...</p>
                        </div>
                      ) : (
                        <div className="space-y-4 mt-4">
                          {brandsData.map((brand, brandIndex) => (
                            <motion.div
                              key={brand.brand_id}
                              className="border-b border-gray-800 pb-4 last:border-0"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: brandIndex * 0.05 }}
                            >
                              <div className="flex items-center justify-between">
                                <motion.button
                                  whileHover={{ x: 5 }}
                                  onClick={() => handleBrandClick(brand)}
                                  className={`flex items-center text-left text-white hover:text-purple-400 transition-colors duration-200 ${
                                    selectedBrand === brand.brand_name ? "text-purple-400 font-medium" : ""
                                  }`}
                                >
                                  <Tag className="h-4 w-4 mr-2 text-indigo-400" />
                                  <span className="font-medium">{brand.brand_name}</span>
                                  {expandedBrands[brand.brand_id] ? (
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                  )}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    setSelectedBrand(brand.brand_name)
                                    setSelectedCategory(null)
                                    setSelectedSubcategory(null)
                                  }}
                                  className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors duration-200"
                                  title="Filter by this brand"
                                >
                                  <Filter className="h-4 w-4" />
                                </motion.button>
                              </div>

                              <AnimatePresence>
                                {expandedBrands[brand.brand_id] && brand.categories && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mt-3 ml-6 space-y-2"
                                  >
                                    {brand.categories.map((category, index) => (
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
                                            className={`flex items-center text-left text-gray-300 py-2 px-3 rounded-md hover:bg-gray-800/50 hover:text-white transition-colors duration-200 ${
                                              selectedCategory === category.category_name
                                                ? "bg-gray-800 text-white"
                                                : ""
                                            }`}
                                          >
                                            <div className="flex items-center">
                                              <Package className="h-4 w-4 mr-2 text-violet-400" />
                                              <span>{category.category_name}</span>
                                            </div>
                                            {expandedCategories[category.category_id] ? (
                                              <ChevronDown className="ml-2 h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="ml-2 h-4 w-4" />
                                            )}
                                          </motion.button>
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                              setSelectedBrand(brand.brand_name)
                                              setSelectedCategory(category.category_name)
                                              setSelectedSubcategory(null)
                                            }}
                                            className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors duration-200 ml-2"
                                            title="Filter by this category"
                                          >
                                            <Filter className="h-4 w-4" />
                                          </motion.button>
                                        </div>

                                        <AnimatePresence>
                                          {expandedCategories[category.category_id] && category.subcategories && (
                                            <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: "auto" }}
                                              exit={{ opacity: 0, height: 0 }}
                                              transition={{ duration: 0.3 }}
                                              className="ml-4 mt-2 space-y-2"
                                            >
                                              {category.subcategories.map((subcategory, subIndex) => (
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
                                                      onClick={() =>
                                                        handleSubcategoryClick(brand, category, subcategory)
                                                      }
                                                      className={`flex items-center text-left text-gray-300 py-2 px-3 rounded-md hover:bg-gray-800/50 hover:text-white transition-colors duration-200 ${
                                                        selectedSubcategory === subcategory.subcategory_name
                                                          ? "bg-gray-700 text-white"
                                                          : ""
                                                      }`}
                                                    >
                                                      <div className="flex items-center">
                                                        <Hash className="h-4 w-4 mr-2 text-purple-400" />
                                                        <span>{subcategory.subcategory_name}</span>
                                                      </div>
                                                    </motion.button>
                                                    {/* Removed explicit filter button - clicking item filters immediately */}
                                                  </div>
                                                </motion.div>
                                              ))}
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </motion.div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 lg:pl-12">
                {/* Header with animated elements */}
                <section id="header" className="relative mb-12">
                  <motion.div
                    className="text-center relative z-10"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isVisible["header"] ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                  >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{getCategoryTitle()}</h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-purple-700 via-purple-300 to-purple-700 mx-auto mb-6"></div>

                    {/* Filter description */}
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">{getFilterDescription()}</p>

                    <p className="text-sm text-gray-400 mb-6">{filteredProducts.length} products found</p>

                    {(selectedBrand || selectedCategory || selectedSubcategory) && (
                      <div className="flex flex-wrap gap-2 justify-center mt-2 mb-6">
                        {selectedBrand && (
                          <span className="bg-purple-700/50 px-3 py-1 rounded-full text-sm">
                            Brand: {selectedBrand}
                          </span>
                        )}
                        {selectedCategory && (
                          <span className="bg-purple-700/50 px-3 py-1 rounded-full text-sm">
                            Category: {selectedCategory}
                          </span>
                        )}
                        {selectedSubcategory && (
                          <span className="bg-purple-700/50 px-3 py-1 rounded-full text-sm">
                            Subcategory: {selectedSubcategory}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedBrand(null)
                            setSelectedCategory(null)
                            setSelectedSubcategory(null)
                          }}
                          className="bg-red-600/50 hover:bg-red-600/70 px-3 py-1 rounded-full text-sm transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}

                    <div className="flex justify-center mt-6">
                      <motion.button
                        onClick={refreshProducts}
                        className="flex items-center gap-2 px-4 py-2 bg-none border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Products
                      </motion.button>
                    </div>
                  </motion.div>
                </section>

                {/* Main Content Area: Categories or Products */}
                <section id="products-grid" className="relative">
                  {loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                  ) : error ? (
                    <div className="text-center text-red-400 p-8 border border-red-400/20 rounded-xl">
                      <p>Error loading products: {error}</p>
                      <button
                        className="mt-4 px-4 py-2 bg-none border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                        onClick={refreshProducts}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (selectedBrand && !selectedCategory) ? (
                    // Show categories grid for the selected brand
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {getCategoriesForBrand(selectedBrand).map((cat) => {
                          const productCount = (cat.subcategories || []).reduce((acc, sc) => acc + (sc.products?.length || 0), 0)
                          return (
                            <button
                              key={cat.category_id}
                              onClick={() => setSelectedCategory(cat.category_name)}
                              className="group text-left bg-gradient-to-br from-gray-900/60 to-gray-800/60 border border-red-600/20 hover:border-red-600/40 rounded-2xl p-5 transition-all duration-300 shadow-[0_10px_30px_rgba(220,38,38,0.08)] hover:shadow-[0_14px_34px_rgba(220,38,38,0.15)]"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Tag className="w-5 h-5 text-red-400" />
                                  <h3 className="text-lg font-semibold text-white">{cat.category_name}</h3>
                                </div>
                                <ChevronRight className="w-5 h-5 text-red-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <p className="mt-3 text-sm text-gray-400">{productCount} products</p>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  ) : displayedProducts.length === 0 ? (
                    <div className="text-center text-gray-400 p-8 border border-gray-400/20 rounded-xl">
                      <p>No products found matching your criteria.</p>
                      <button
                        onClick={() => {
                          setSelectedBrand(null)
                          setSelectedCategory(null)
                          setSelectedSubcategory(null)
                        }}
                        className="mt-4 px-4 py-2 bg-none border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        View All {getCategoryTitle()}
                      </button>
                    </div>
                  ) : (
                    <>
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10"
                      >
                        {displayedProducts.map((product, index) => (
                          <motion.div
                            key={product.product_id}
                            className="h-full"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            whileHover={{
                              y: -10,
                              transition: { duration: 0.3 },
                            }}
                          >
                            <div className="bg-none border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-white/30 h-full flex flex-col">
                              {/* Status badge */}
                              {product.condition && (
                                <div
                                  className={`px-2 py-1 text-xs rounded-full m-2 w-fit ${
                                    product.condition === "NEW"
                                      ? "bg-green-500/30 text-green-300"
                                      : "bg-white/10 text-gray-300"
                                  }`}
                                >
                                  {product.condition}
                                </div>
                              )}

                              <div className="relative overflow-hidden group">
                                <div className="relative w-full h-48 overflow-hidden">
                                  <img
                                    src={product.product_image || "/placeholder.svg?height=300&width=300"}
                                    alt={product.product_name || "Product Image"}
                                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
                                    onError={(e) => {
                                      e.target.onerror = null
                                      e.target.src = "/placeholder.svg?height=300&width=300"
                                    }}
                                  />
                                </div>

                                {/* Hover overlay */}
                                <motion.div
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  initial={{ opacity: 0 }}
                                  whileHover={{ opacity: 1 }}
                                >
                                  <button
                                    className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 hover:bg-white/20 transition-colors"
                                    onClick={() => openProductModal(product)}
                                  >
                                    View Details
                                  </button>
                                </motion.div>
                              </div>

                              <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold text-lg text-white line-clamp-1">
                                    {product.product_name}
                                  </h3>
                                  {product.price && (
                                    <div className="flex items-center text-lg font-bold text-white">
                                      ${product.price}
                                    </div>
                                  )}
                                </div>

                                {product.short_des && (
                                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.short_des}</p>
                                )}

                                <div className="mt-auto flex flex-wrap gap-2">
                                  {product.condition && (
                                    <span className="inline-flex items-center px-2 py-1 bg-white/10 rounded-md text-xs">
                                      <Package className="w-3 h-3 mr-1" />
                                      {product.condition}
                                    </span>
                                  )}
                                  {product.SubCondition && (
                                    <span className="inline-flex items-center px-2 py-1 bg-white/10 rounded-md text-xs">
                                      <Star className="w-3 h-3 mr-1" />
                                      {product.SubCondition}
                                    </span>
                                  )}
                                  {product.category_name && (
                                    <span className="inline-flex items-center px-2 py-1 bg-white/10 rounded-md text-xs">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {product.category_name}
                                    </span>
                                  )}
                                </div>

                                <motion.button
                                  className="mt-4 w-full py-2 bg-none border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 relative overflow-hidden group"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <span className="relative z-10">Add to Cart</span>
                                  <ShoppingCart className="w-4 h-4 relative z-10" />
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-gray-700/40 to-gray-500/40 w-0 group-hover:w-full transition-all duration-300"
                                    initial={{ width: 0 }}
                                    whileHover={{ width: "100%" }}
                                  />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="mt-12 flex justify-center items-center">
                          <div className="flex items-center gap-4 bg-none border border-white/10 rounded-full p-2">
                            <motion.button
                              onClick={handlePrevPage}
                              disabled={currentPage === 1}
                              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                currentPage === 1 ? "text-gray-500 cursor-not-allowed" : "text-white hover:bg-white/10"
                              }`}
                              whileHover={
                                currentPage !== 1 ? { scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" } : {}
                              }
                              whileTap={currentPage !== 1 ? { scale: 0.9 } : {}}
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </motion.button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                                // Calculate which page numbers to show
                                let pageNum
                                if (totalPages <= 5) {
                                  pageNum = index + 1
                                } else if (currentPage <= 3) {
                                  pageNum = index + 1
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + index
                                } else {
                                  pageNum = currentPage - 2 + index
                                }

                                // Only render if pageNum is valid
                                if (pageNum > 0 && pageNum <= totalPages) {
                                  return (
                                    <motion.button
                                      key={pageNum}
                                      onClick={() => {
                                        setCurrentPage(pageNum)
                                        window.scrollTo({ top: 0, behavior: "smooth" })
                                      }}
                                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                        currentPage === pageNum
                                          ? "bg-purple-700/50 text-white"
                                          : "text-gray-300 hover:bg-white/10"
                                      }`}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      {pageNum}
                                    </motion.button>
                                  )
                                }
                                return null
                              })}

                              {totalPages > 5 && currentPage < totalPages - 2 && (
                                <>
                                  <span className="text-gray-500">...</span>
                                  <motion.button
                                    onClick={() => {
                                      setCurrentPage(totalPages)
                                      window.scrollTo({ top: 0, behavior: "smooth" })
                                    }}
                                    className="flex items-center justify-center w-8 h-8 rounded-full text-gray-300 hover:bg-white/10"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    {totalPages}
                                  </motion.button>
                                </>
                              )}
                            </div>

                            <motion.button
                              onClick={handleNextPage}
                              disabled={currentPage === totalPages}
                              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                currentPage === totalPages
                                  ? "text-gray-500 cursor-not-allowed"
                                  : "text-white hover:bg-white/10"
                              }`}
                              whileHover={
                                currentPage !== totalPages
                                  ? { scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }
                                  : {}
                              }
                              whileTap={currentPage !== totalPages ? { scale: 0.9 } : {}}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Product Detail Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-gray-900 border border-white/10 rounded-2xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
              {/* Product Image */}
              <div className="flex flex-col items-center justify-center">
                {/* Status badge - Moved above the image */}
                {selectedProduct.condition && (
                  <div
                    className={`self-start px-3 py-1 text-sm font-medium rounded-full mb-2 ${
                      selectedProduct.condition === "NEW"
                        ? "bg-green-500/30 text-green-300"
                        : "bg-white/10 text-gray-300"
                    }`}
                  >
                    {selectedProduct.condition}
                  </div>
                )}

                <motion.div
                  className="relative w-full h-80 overflow-hidden rounded-xl border border-white/10"
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
                      src={selectedProduct.product_image || "/placeholder.svg?height=400&width=400"}
                      alt={selectedProduct.product_name || "Product Image"}
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
                <h2 className="text-2xl font-bold text-white mb-2">{selectedProduct.product_name}</h2>

                {selectedProduct.price && (
                  <div className="text-2xl font-bold text-white mb-4">${selectedProduct.price}</div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedProduct.condition && (
                    <span className="inline-flex items-center px-3 py-1 bg-white/10 rounded-md text-sm">
                      <Package className="w-4 h-4 mr-2" />
                      {selectedProduct.condition}
                    </span>
                  )}
                  {selectedProduct.SubCondition && (
                    <span className="inline-flex items-center px-3 py-1 bg-white/10 rounded-md text-sm">
                      <Star className="w-4 h-4 mr-2" />
                      {selectedProduct.SubCondition}
                    </span>
                  )}
                  {selectedProduct.category_name && (
                    <span className="inline-flex items-center px-3 py-1 bg-white/10 rounded-md text-sm">
                      <Tag className="w-4 h-4 mr-2" />
                      {selectedProduct.category_name}
                    </span>
                  )}
                </div>

                {/* Short Description */}
                {selectedProduct.short_des && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
                    <p className="text-gray-300">{selectedProduct.short_des}</p>
                  </div>
                )}

                {/* Long Description */}
                {selectedProduct.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedProduct.description}</p>
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
                    className="w-full py-3 bg-none border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 relative overflow-hidden group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10">Add to Cart</span>
                    <ShoppingCart className="w-5 h-5 relative z-10" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-700/40 to-indigo-500/40 w-0 group-hover:w-full transition-all duration-300"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                    />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
