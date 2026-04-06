"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw, Menu } from "lucide-react";
import { useSearchParams } from "next/navigation";
import BrandSidebar from "../component/ProductsComponents/BrandSidebar";
import ProductCard from "../component/ProductsComponents/ProductCard";
import { fetchAllProducts } from "../api/api";
import Navbar from "../component/HomeComponents/Navbar";
import Footer from "../component/HomeComponents/Footer";

function ProductsPageInner() {
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    type: "all",
    brandName: null,
    categoryName: null,
    subcategoryName: null,
    partNumber: null,
    search: null,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [isVisible, setIsVisible] = useState({});

  const sidebarRef = useRef(null);

  // Parse URL parameters for filtering
  useEffect(() => {
    const brandName = searchParams.get("brandName");
    const categoryName = searchParams.get("categoryName");
    const subcategoryName = searchParams.get("subcategoryName");
    const partNumber = searchParams.get("partNumber");
    const search = searchParams.get("search");

    if (brandName || categoryName || subcategoryName || partNumber || search) {
      let filterType = "all";
      if (partNumber) filterType = "product";
      else if (subcategoryName) filterType = "subcategory";
      else if (categoryName) filterType = "category";
      else if (brandName) filterType = "brand";
      else if (search) filterType = "search";

      setFilter({
        type: filterType,
        brandName,
        categoryName,
        subcategoryName,
        partNumber,
        search,
      });
    }
  }, [searchParams]);

  // Remove duplicate initial fetch block (consolidated below)

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        sidebarOpen
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  // Handle window resize to close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [sidebarOpen]);

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("section");
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionId = section.id;
        if (sectionTop < window.innerHeight * 0.75) {
          setIsVisible((prev) => ({ ...prev, [sectionId]: true }));
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch all products once when component mounts
  useEffect(() => {
    const loadAllProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchAllProducts();
        setAllProducts(data);
        setFilteredProducts(data);
        setTotalPages(Math.ceil(data.length / productsPerPage));
      } catch (err) {
        console.error("Error loading products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadAllProducts();
  }, [productsPerPage]);

  // Apply filters whenever filter state changes
  useEffect(() => {
    if (allProducts.length === 0) return;

    let filtered = [...allProducts];

    // Filter by brand
    if (filter.brandName) {
      filtered = filtered.filter((product) => {
        const brandLower = filter.brandName.toLowerCase().trim();
        const productBrandName = product.brand_brand_name?.toLowerCase().trim();
        return productBrandName === brandLower;
      });
    }

    // Filter by category
    if (filter.categoryName) {
      filtered = filtered.filter((product) => {
        const categoryLower = filter.categoryName.toLowerCase().trim();
        const productCategory = product.category_category_name
          ?.toLowerCase()
          .trim();
        return productCategory === categoryLower;
      });
      
    }

    // Filter by subcategory
    if (filter.subcategoryName) {
      filtered = filtered.filter((product) => {
        const subcategoryLower = filter.subcategoryName.toLowerCase().trim();
        const productSubcategory = product.subcategory_subcategory_name
          ?.toLowerCase()
          .trim();
        return productSubcategory === subcategoryLower;
      });
    }

    // Filter by part number
    if (filter.partNumber) {
      filtered = filtered.filter((product) => {
        const partNumberLower = filter.partNumber.toLowerCase().trim();
        const productPartNumber = product.product_part_number
          ?.toLowerCase()
          .trim();
        return productPartNumber === partNumberLower;
      });
    }

    // Filter by search query
    if (filter.search) {
      const searchLower = filter.search.toLowerCase().trim();
      filtered = filtered.filter((product) => {
        const brandName = product.brand_brand_name?.toLowerCase() || "";
        const partNumber = product.product_part_number?.toLowerCase() || "";
        const productName = product.product_name?.toLowerCase() || "";
        const description =
          product.product_short_description?.toLowerCase() || "";

        return (
          brandName.includes(searchLower) ||
          partNumber.includes(searchLower) ||
          productName.includes(searchLower) ||
          description.includes(searchLower)
        );
      });
    }

    setFilteredProducts(filtered);
    setTotalPages(Math.ceil(filtered.length / productsPerPage));
    setCurrentPage(1);

    // Close sidebar on mobile after applying filter
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [filter, allProducts, productsPerPage]);

  // Update displayed products when page changes
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const handleBrandSelect = (brandName) => {
    setFilter({
      type: "brand",
      brandName,
      categoryName: null,
      subcategoryName: null,
      partNumber: null,
      search: null,
    });
  };

  const handleCategorySelect = (brandName, categoryName) => {
    
    setFilter({
      type: "category",
      brandName,
      categoryName,
      subcategoryName: null,
      partNumber: null,
      search: null,
    });
  };

  const handleSubcategorySelect = (
    brandName,
    categoryName,
    subcategoryName
  ) => {
    setFilter({
      type: "subcategory",
      brandName,
      categoryName,
      subcategoryName,
      partNumber: null,
      search: null,
    });
  };

  const handleProductSelect = (brandName, partNumber) => {
    setFilter({
      type: "product",
      brandName,
      categoryName: null,
      subcategoryName: null,
      partNumber,
      search: null,
    });
  };

  const refreshProducts = async () => {
    setLoading(true);
    localStorage.removeItem("killswitch_products");
    localStorage.removeItem("killswitch_products_timestamp");

    try {
      const data = await fetchAllProducts();
      setAllProducts(data);

      // Re-apply current filters
      let filtered = [...data];

      if (filter.brandName) {
        filtered = filtered.filter(
          (product) =>
            product.brand_brand_name?.toLowerCase().trim() ===
            filter.brandName.toLowerCase().trim()
        );
      }

      if (filter.categoryName) {
        filtered = filtered.filter(
          (product) =>
            product.category_category_name?.toLowerCase().trim() ===
            filter.categoryName.toLowerCase().trim()
        );
      }

      if (filter.subcategoryName) {
        filtered = filtered.filter(
          (product) =>
            product.subcategory_subcategory_name?.toLowerCase().trim() ===
            filter.subcategoryName.toLowerCase().trim()
        );
      }

      if (filter.partNumber) {
        filtered = filtered.filter(
          (product) =>
            product.product_part_number?.toLowerCase().trim() ===
            filter.partNumber.toLowerCase().trim()
        );
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase().trim();
        filtered = filtered.filter((product) => {
          const brandName = product.brand_brand_name?.toLowerCase() || "";
          const partNumber = product.product_part_number?.toLowerCase() || "";
          const productName = product.product_name?.toLowerCase() || "";
          const description =
            product.product_short_description?.toLowerCase() || "";

          return (
            brandName.includes(searchLower) ||
            partNumber.includes(searchLower) ||
            productName.includes(searchLower) ||
            description.includes(searchLower)
          );
        });
      }

      setFilteredProducts(filtered);
      setTotalPages(Math.ceil(filtered.length / productsPerPage));
      setCurrentPage(1);
    } catch (err) {
      console.error("Error refreshing products:", err);
      setError("Failed to refresh products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const sidebarVariants = { 
    closed: {
      x: "-100%",
      boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)",
    },
    open: {
      x: 0,
      boxShadow: "20px 0px 60px rgba(220, 38, 38, 0.15)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  // Generate filter description
  const getFilterDescription = () => {
    if (filter.search) {
      return `Search results for "${filter.search}"`;
    } else if (filter.partNumber) {
      return `${filter.partNumber} in ${filter.brandName}`;
    } else if (filter.subcategoryName) {
      return `${filter.subcategoryName} subcategory in ${filter.categoryName} category, ${filter.brandName} brand`;
    } else if (filter.categoryName) {
      return `${filter.categoryName} category in ${filter.brandName} brand`;
    } else if (filter.brandName) {
      return `${filter.brandName} brand`;
    } else {
      return "All Products";
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen text-white" style={{backgroundColor: '#000000'}}>
        <Navbar />

        <div className="flex-1 relative">
          {/* Ultra-modern animated background */}
          <div className="fixed inset-0 z-[-1] overflow-hidden">
            {/* Dynamic mesh gradient */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(199,0,7,0.08),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(199,0,7,0.04),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(199,0,7,0.04),transparent_50%)]" />
            </div>
            
            {/* Floating geometric elements */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-1/4 left-1/6 w-32 h-32 border border-[#c70007]/20 rotate-45 rounded-lg" />
              <div className="absolute top-3/4 right-1/4 w-24 h-24 border border-[#c70007]/15 rotate-12 rounded-full" />
              <div className="absolute top-1/2 left-3/4 w-16 h-16 border border-[#c70007]/10 -rotate-12 rounded-lg" />
            </div>

            {/* Animated red orbs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#c70007]/10 to-[#c70007]/10 blur-3xl"
              animate={{
                x: [0, 50, 0],
                y: [0, -50, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 25, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-[#c70007]/10 to-[#c70007]/10 blur-3xl"
              animate={{
                x: [0, -60, 0],
                y: [0, 60, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 30, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-gradient-to-r from-[#c70007]/5 to-[#c70007]/5 blur-2xl"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.3, 1],
              }}
              transition={{ 
                duration: 40, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          </div>

          {/* Ultra-modern sidebar toggle */}
          {!sidebarOpen && (
            <motion.button
              className="fixed top-24 left-4 z-50 p-4 backdrop-blur-2xl rounded-2xl border border-white/10 text-white lg:hidden overflow-hidden group"
              style={{backgroundColor: '#1c1816'}}
              whileHover={{ 
                scale: 1.05,
                borderColor: "rgba(199, 0, 7, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#c70007]/10 to-[#c70007]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Menu className="w-6 h-6 relative z-10" />
            </motion.button>
          )}

          {/* Mobile sidebar with red accent shadow */}
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
                <BrandSidebar
                  onBrandSelect={handleBrandSelect}
                  onCategorySelect={handleCategorySelect}
                  onSubcategorySelect={handleSubcategorySelect}
                  onProductSelect={handleProductSelect}
                  onClose={() => setSidebarOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content */}
          <div className="py-16 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto lg:flex lg:gap-8">
              {/* Compact desktop sidebar */}
              <div className="hidden lg:block w-[300px] flex-shrink-0">
                <div className="sticky top-24 h-[calc(100vh-6rem)] w-[300px] overflow-hidden rounded-2xl border border-white/10 backdrop-blur-2xl transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.3)]" style={{backgroundColor: '#1c1816'}}>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#c70007]/5 via-transparent to-[#c70007]/5" />
                  <BrandSidebar
                    onBrandSelect={handleBrandSelect}
                    onCategorySelect={handleCategorySelect}
                    onSubcategorySelect={handleSubcategorySelect}
                    onProductSelect={handleProductSelect}
                  />
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1">
                {/* Refined header */}
                <section id="header" className="relative mb-16">
                  <motion.div
                    className="text-center relative z-10"
                    initial={{ opacity: 0, y: 60 }}
                    animate={isVisible["header"] ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  >
                    {/* Clean heading */}
                    <motion.h1 
                      className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent mb-6 leading-tight tracking-tight"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    >
                      Products
                    </motion.h1>
                    
                    {/* Subtle accent line */}
                    <motion.div 
                      className="flex justify-center items-center gap-3 mb-8"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    >
                      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c70007] rounded-full" />
                      <div className="w-2 h-2 bg-[#c70007] rounded-full" />
                      <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c70007] rounded-full" />
                    </motion.div>

                    {/* Refined filter description */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="mb-8"
                    >
                      <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed">
                        {getFilterDescription()}
                      </p>

                      <p className="text-sm text-[#c70007] font-medium">
                        {filteredProducts.length} products available
                      </p>
                    </motion.div>

                    {/* Active filters */}
                    {filter.type !== "all" && (
                      <div className="flex flex-wrap gap-2 justify-center mt-4 mb-8">
                        {filter.brandName && (
                          <motion.span 
                            className="backdrop-blur-xl border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-gray-300" style={{backgroundColor: '#1c1816'}}
                            whileHover={{ scale: 1.05, borderColor: "#c70007" }}
                          >
                            Brand: {filter.brandName}
                          </motion.span>
                        )}
                        {filter.categoryName && (
                          <motion.span 
                            className="backdrop-blur-xl border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-gray-300" style={{backgroundColor: '#1c1816'}}
                            whileHover={{ scale: 1.05, borderColor: "#c70007" }}
                          >
                            Category: {filter.categoryName}
                          </motion.span>
                        )}
                        {filter.subcategoryName && (
                          <motion.span 
                            className="backdrop-blur-xl border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-gray-300" style={{backgroundColor: '#1c1816'}}
                            whileHover={{ scale: 1.05, borderColor: "#c70007" }}
                          >
                            Subcategory: {filter.subcategoryName}
                          </motion.span>
                        )}
                        {filter.partNumber && (
                          <motion.span 
                            className="backdrop-blur-xl border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-gray-300" style={{backgroundColor: '#1c1816'}}
                            whileHover={{ scale: 1.05, borderColor: "#c70007" }}
                          >
                            Part Number: {filter.partNumber}
                          </motion.span>
                        )}
                        {filter.search && (
                          <motion.span 
                            className="backdrop-blur-xl border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-gray-300" style={{backgroundColor: '#1c1816'}}
                            whileHover={{ scale: 1.05, borderColor: "#c70007" }}
                          >
                            Search: {filter.search}
                          </motion.span>
                        )}
                        <motion.button
                          onClick={() =>
                            setFilter({
                              type: "all",
                              brandName: null,
                              categoryName: null,
                              subcategoryName: null,
                              partNumber: null,
                              search: null,
                            })
                          }
                          className="bg-gradient-to-r from-[#c70007] to-[#c70007] hover:from-[#c70007]/80 hover:to-[#c70007]/80 px-3 py-1 rounded-full text-xs font-medium text-white transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Clear Filters
                        </motion.button>
                      </div>
                    )}

                  </motion.div>
                </section>

                {/* Products Grid */}
                <section id="products-grid" className="relative">
                  {loading ? (
                    <div className="flex justify-center items-center h-96">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#c70007]"></div>
                        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-[#c70007]/50"></div>
                      </div>
                    </div>
                  ) : error ? (
                    <motion.div 
                      className="text-center p-12 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-[#c70007]/50 rounded-2xl shadow-2xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-[#c70007] text-xl mb-6">Error loading products: {error}</p>
                      <motion.button
                        className="px-6 py-3 bg-gradient-to-r from-[#c70007] to-[#c70007] hover:from-[#c70007]/80 hover:to-[#c70007]/80 rounded-xl text-white font-medium transition-all duration-300 shadow-lg"
                        onClick={refreshProducts}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Try Again
                      </motion.button>
                    </motion.div>
                  ) : displayedProducts.length === 0 ? (
                    <motion.div 
                      className="text-center p-12 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700 hover:border-[#c70007]/50 rounded-2xl shadow-2xl transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-gray-300 text-xl mb-6">No products found matching your criteria.</p>
                      <motion.button
                        onClick={() =>
                          setFilter({
                            type: "all",
                            brandName: null,
                            categoryName: null,
                            subcategoryName: null,
                            partNumber: null,
                            search: null,
                          })
                        }
                        className="px-6 py-3 bg-gradient-to-r from-[#c70007] to-[#c70007] hover:from-[#c70007]/80 hover:to-[#c70007]/80 rounded-xl text-white font-medium transition-all duration-300 shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View All Products
                      </motion.button>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div 
                        variants={containerVariants} 
                        initial="hidden" 
                        animate="visible" 
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                      >
                        {displayedProducts.map((product) => (
                          <ProductCard
                            key={product.product_product_id}
                            product={product}
                          />
                        ))}
                      </motion.div>

                      {/* Compact pagination controls */}
                      {totalPages > 1 && (
                        <div className="mt-12 flex justify-center items-center">
                          <div className="flex items-center gap-1 backdrop-blur-xl border border-white/10 rounded-xl p-2" style={{backgroundColor: '#1c1816'}}>
                            <motion.button
                              onClick={handlePrevPage}
                              disabled={currentPage === 1}
                              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
                                currentPage === 1
                                  ? "text-gray-500 cursor-not-allowed"
                                  : "text-white hover:bg-[#c70007]/20 hover:border-[#c70007]/50 border border-transparent"
                              }`}
                              whileHover={
                                currentPage !== 1
                                  ? { scale: 1.1 }
                                  : {}
                              }
                              whileTap={currentPage !== 1 ? { scale: 0.9 } : {}}
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </motion.button>

                            <div className="flex items-center gap-1 mx-2">
                              {Array.from({
                                length: Math.min(5, totalPages),
                              }).map((_, index) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = index + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = index + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + index;
                                } else {
                                  pageNum = currentPage - 2 + index;
                                }

                                if (pageNum > 0 && pageNum <= totalPages) {
                                  return (
                                    <motion.button
                                      key={pageNum}
                                      onClick={() => {
                                        setCurrentPage(pageNum);
                                        window.scrollTo({
                                          top: 0,
                                          behavior: "smooth",
                                        });
                                      }}
                                      className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all duration-300 ${
                                        currentPage === pageNum
                                          ? "bg-gradient-to-r from-[#c70007] to-[#c70007] text-white shadow-lg"
                                          : "text-gray-300 hover:bg-[#c70007]/20 hover:text-white border border-transparent hover:border-[#c70007]/50"
                                      }`}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      {pageNum}
                                    </motion.button>
                                  );
                                }
                                return null;
                              })}

                              {totalPages > 5 &&
                                currentPage < totalPages - 2 && (
                                  <>
                                    <span className="text-gray-500 mx-2">...</span>
                                    <motion.button
                                      onClick={() => {
                                        setCurrentPage(totalPages);
                                        window.scrollTo({
                                          top: 0,
                                          behavior: "smooth",
                                        });
                                      }}
                                      className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#c70007]/20 hover:text-white border border-transparent hover:border-[#c70007]/50 transition-all duration-300"
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
                              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
                                currentPage === totalPages
                                  ? "text-gray-500 cursor-not-allowed"
                                  : "text-white hover:bg-[#c70007]/20 hover:border-[#c70007]/50 border border-transparent"
                              }`}
                              whileHover={
                                currentPage !== totalPages
                                  ? { scale: 1.1 }
                                  : {}
                              }
                              whileTap={
                                currentPage !== totalPages ? { scale: 0.9 } : {}
                              }
                            >
                              <ChevronRight className="w-6 h-6" />
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
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#c70007] mx-auto mb-4"></div>
            <p className="text-xl text-gray-300">Loading Products...</p>
          </div>
        </div>
      }
    >
      <ProductsPageInner />
    </Suspense>
  );
}