"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Search,
  Plus,
  Activity,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Database,
  MessageSquare,
  Star,
  Trash2,
  Eye,
  User,
  Calendar,
  Filter,
  BarChart3,
  Mail,
  Ticket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchAllProducts, fetchBrands, productAPI, API, reviewAPI } from "../api/api";
import Navbar from "../component/HomeComponents/Navbar";
import Footer from "../component/HomeComponents/Footer";
import ProductCard from "../component/admin/ProductCard";
import ProductForm from "../component/admin/ProductForm";
import ProductModal from "../component/admin/ProductModal";
import Pagination from "../component/admin/Pagination";
import ProgressIndicator from "../component/admin/ProgressIndicator";
import AdminChat from "../component/socketsComponents/AdminChat";
import RouteGuard from "../components/RouteGuard";
// Using centralized productAPI functions from api.js

export default function AdminPortal() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  // Show header animations immediately on load
  const [isVisible, setIsVisible] = useState({ header: true });

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Filter state
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [newProduct, setNewProduct] = useState({
    part_number: "",
    price: "",
    sale_price: "",
    short_description: "",
    long_description: "",
    condition: "",
    sub_condition: "",
    quantity: "",
    brand_name: "",
    category_name: "",
    sub_category_name: "",
    status: "Approved",
    image: "",
    imageFile: null,
    additional_images: [],
    additional_image_files: [],
    videoFile: null,
    videoFileName: "",
    
    // Specification fields
    product_model: "",
    motherboard: "",
    material: "",
    front_ports: "",
    gpu_length: "",
    cpu_height: "",
    hdd_support: "",
    ssd_support: "",
    expansion_slots: "",
    case_size: "",
    water_cooling_support: "",
    case_fan_support: "",
    carton_size: "",
    loading_capacity: "",
    
    // Pump specs
    pump_parameter: "",
    pump_bearing: "",
    pump_speed: "",
    pump_interface: "",
    pump_noise: "",
    tdp: "",
    pipe_length_material: "",
    light_effect: "",
    drainage_size: "",
    
    // Fan specs
    fan_size: "",
    fan_speed: "",
    fan_voltage: "",
    fan_interface: "",
    fan_airflow: "",
    fan_wind_pressure: "",
    fan_noise: "",
    fan_bearing_type: "",
    fan_power: "",
    fan_rated_voltage: "",
    
    // Keyboard specs
    axis: "",
    number_of_keys: "",
    weight: "",
    carton_weight: "",
    package_size: "",
    carton_size_kb: "",
    keycap_technology: "",
    wire_length: "",
    lighting_style: "",
    body_material: "",
    
    // Mouse specs
    dpi: "",
    return_rate: "",
    engine_solution: "",
    surface_technology: "",
    
    // Packaging & Customization
    package: "",
    packing: "",
    moq_customization: "",
    customization_options: "",
  });

  // Brands and categories data
  const [brands, setBrands] = useState([]);
  const [brandCategories, setBrandCategories] = useState([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState([]);
  const [showRecentActivity, setShowRecentActivity] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  // Tab management
  const [activeTab, setActiveTab] = useState("products");

  // Progress tracking state
  const [progressIndicator, setProgressIndicator] = useState({
    isVisible: false,
    currentStep: 0,
    totalSteps: 5,
    message: "Processing...",
    error: null,
    success: false
  });
  
  // Cancel operation state
  const [operationCancelled, setOperationCancelled] = useState(false);

  // Review management state
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewSearchTerm, setReviewSearchTerm] = useState("");
  const [reviewFilterRating, setReviewFilterRating] = useState("all");
  const [reviewSortBy, setReviewSortBy] = useState("newest");
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  // Fetch all products, brands, and categories
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch products and brands in parallel using your existing API functions
        const productsData = await fetchAllProducts();
        const brandsData = await fetchBrands();

        // Fetch brand categories using your API.brands.fetchBrandsCategories function
        const categoriesResponse = await API.brands.fetchBrandsCategories();
        const categoriesData = await categoriesResponse.json();

        setProducts(productsData);
        setFilteredProducts(productsData);
        setBrands(brandsData);
        setBrandCategories(categoriesData);
        setTotalPages(Math.ceil(productsData.length / productsPerPage));

      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [productsPerPage]);

  // Fetch all reviews when Reviews tab is active
  useEffect(() => {
    if (activeTab === "reviews") {
      fetchAllReviews();
    }
  }, [activeTab]);

  const fetchAllReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      
      // Fetch all reviews from all products
      const allReviews = [];
      
      // Get reviews for each product
      for (const product of products) {
        try {
          const productReviews = await reviewAPI.getProductReviews(product.product_product_id);
          const normalizedReviews = Array.isArray(productReviews)
            ? productReviews
            : (productReviews?.data || productReviews?.reviews || []);
          
          // Add product information to each review
          const reviewsWithProduct = normalizedReviews.map(review => ({
            ...review,
            product_name: product.product_part_number,
            product_id: product.product_product_id,
            product_image: product.product_image,
            product_price: product.product_price
          }));
          
          allReviews.push(...reviewsWithProduct);
        } catch (err) {
          console.warn(`Failed to fetch reviews for product ${product.product_product_id}:`, err);
        }
      }
      
      setReviews(allReviews);
      setFilteredReviews(allReviews);
      
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setReviewsError("Failed to fetch reviews. Please try again.");
    } finally {
      setReviewsLoading(false);
    }
  };

  // Listen for EntityManagement updates via localStorage events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'entityManagement_update') {
        refreshBrandsAndCategories();
        // Remove the trigger to avoid multiple refreshes
        localStorage.removeItem('entityManagement_update');
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for same-tab updates
    const checkForUpdates = () => {
      const updateFlag = localStorage.getItem('entityManagement_update');
      if (updateFlag) {
        refreshBrandsAndCategories();
        localStorage.removeItem('entityManagement_update');
      }
    };
    
    const updateInterval = setInterval(checkForUpdates, 2000); // Check every 2 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(updateInterval);
    };
  }, []);

  // Auto-refresh data every 30 seconds to ensure freshness
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      refreshBrandsAndCategories();
    }, 30000); // 30 seconds
    
    return () => clearInterval(autoRefreshInterval);
  }, []);

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
    handleScroll(); // Check on initial load
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Apply filters and search
  useEffect(() => {
    if (products.length === 0) return;

    let filtered = [...products];

    // Apply search filter
    if (searchTerm.trim() !== "") {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((product) => {
        const name =
          product.product_name?.toLowerCase() ||
          product.product_part_number?.toLowerCase() ||
          "";
        const brand = product.brand_brand_name?.toLowerCase() || "";
        const category = product.category_category_name?.toLowerCase() || "";
        const description =
          product.product_short_description?.toLowerCase() || "";

        return (
          name.includes(normalizedSearch) ||
          brand.includes(normalizedSearch) ||
          category.includes(normalizedSearch) ||
          description.includes(normalizedSearch)
        );
      });
    }

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter(
        (product) =>
          product.category_category_name?.toLowerCase() ===
          filterCategory.toLowerCase()
      );
    }

    // Apply brand filter
    if (filterBrand !== "all") {
      filtered = filtered.filter(
        (product) =>
          product.brand_brand_name?.toLowerCase() === filterBrand.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
        );
        break;
      case "price-high":
        filtered.sort(
          (a, b) =>
            Number.parseFloat(b.product_price || 0) -
            Number.parseFloat(a.product_price || 0)
        );
        break;
      case "price-low":
        filtered.sort(
          (a, b) =>
            Number.parseFloat(a.product_price || 0) -
            Number.parseFloat(b.product_price || 0)
        );
        break;
      case "name-asc":
        filtered.sort((a, b) =>
          (a.product_name || a.product_part_number || "").localeCompare(
            b.product_name || b.product_part_number || ""
          )
        );
        break;
      case "name-desc":
        filtered.sort((a, b) =>
          (b.product_name || b.product_part_number || "").localeCompare(
            a.product_name || a.product_part_number || ""
          )
        );
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
    setTotalPages(Math.ceil(filtered.length / productsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    searchTerm,
    filterCategory,
    filterBrand,
    sortBy,
    products,
    productsPerPage,
  ]);

  // Apply filters and search for reviews
  useEffect(() => {
    if (reviews.length === 0) return;

    let filtered = [...reviews];

    // Apply search filter
    if (reviewSearchTerm.trim() !== "") {
      const normalizedSearch = reviewSearchTerm.toLowerCase().trim();
      filtered = filtered.filter((review) => {
        const productName = review.product_name?.toLowerCase() || "";
        const reviewerName = review.reviewer_name?.toLowerCase() || "";
        const comment = review.comment?.toLowerCase() || "";
        return (
          productName.includes(normalizedSearch) ||
          reviewerName.includes(normalizedSearch) ||
          comment.includes(normalizedSearch)
        );
      });
    }

    // Apply rating filter
    if (reviewFilterRating !== "all") {
      const targetRating = parseInt(reviewFilterRating);
      filtered = filtered.filter(review => review.rating === targetRating);
    }

    // Apply sorting
    switch (reviewSortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt || a.created_at || 0) - new Date(b.createdAt || b.created_at || 0));
        break;
      case "rating-high":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "rating-low":
        filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case "product-name":
        filtered.sort((a, b) => (a.product_name || "").localeCompare(b.product_name || ""));
        break;
      default:
        break;
    }

    setFilteredReviews(filtered);
  }, [reviewSearchTerm, reviewFilterRating, reviewSortBy, reviews]);

  // Update displayed products when page changes
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setIsSearching(e.target.value.trim() !== "");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refreshProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchAllProducts({ force: true });
      setProducts(data);
      setFilteredProducts(data);
      setTotalPages(Math.ceil(data.length / productsPerPage));
      setCurrentPage(1);
    } catch (err) {
      console.error("Error refreshing products:", err);
      setError("Failed to refresh products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh brands and categories data
  const refreshBrandsAndCategories = async () => {
    setRefreshing(true);
    try {
      // Clear localStorage cache to force fresh data
      localStorage.removeItem("killswitch_brands");
      localStorage.removeItem("killswitch_brands_timestamp");
      
      // Fetch fresh data
      const brandsData = await fetchBrands();
      const categoriesResponse = await API.brands.fetchBrandsCategories();
      const categoriesData = await categoriesResponse.json();
      
      setBrands(brandsData);
      setBrandCategories(categoriesData);
      setLastUpdateTime(Date.now());

    } catch (err) {
      console.error("Error refreshing brands and categories:", err);
      setError("Failed to refresh brands and categories. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh all data (products, brands, categories)
  const refreshAllData = async () => {
    setLoading(true);
    try {
      // Clear all localStorage cache
      localStorage.removeItem("killswitch_products");
      localStorage.removeItem("killswitch_products_timestamp");
      localStorage.removeItem("killswitch_brands");
      localStorage.removeItem("killswitch_brands_timestamp");
      
      // Fetch all data fresh
      const [productsData, brandsData, categoriesResponse] = await Promise.all([
        fetchAllProducts({ force: true }),
        fetchBrands(),
        API.brands.fetchBrandsCategories()
      ]);
      
      const categoriesData = await categoriesResponse.json();
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      setBrands(brandsData);
      setBrandCategories(categoriesData);
      setTotalPages(Math.ceil(productsData.length / productsPerPage));
      setCurrentPage(1);
      setLastUpdateTime(Date.now());
      

    } catch (err) {
      console.error("Error refreshing all data:", err);
      setError("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const navigateToProductDetail = (productId) => {
    router.push(`/${productId}`);
  };

  // Get unique categories and brands for filters
  const categories = [
    "all",
    ...new Set(products.map((p) => p.category_category_name).filter(Boolean)),
  ];
  const productBrands = [
    "all",
    ...new Set(products.map((p) => p.brand_brand_name).filter(Boolean)),
  ];

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

  // Navigation handlers
  const navigateToActivityLogs = () => {
    router.push("/ActivityLogs");
  };

  const navigateToOrders = () => {
    router.push("/AllOrdersPage");
  };

  const navigateToAnalyticsDashboard = () => {
    router.push("/Admin/analytics");
  };

  const navigateToNewsletterSubscribers = () => {
    router.push("/Admin/newsletter");
  };

  const navigateToCouponCodes = () => {
    router.push("/Admin/coupon-codes");
  };

  const navigateToAdminRoleManagement = () => {
    router.push("/AdminRoleManagement");
  };

  const navigateToEntityManagement = () => {
    router.push("/EntityManagement");
  };

  // Review management functions
  const handleReviewSearch = (e) => {
    setReviewSearchTerm(e.target.value);
  };

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setShowReviewModal(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this review? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      setDeletingReviewId(reviewId);
      
      // Delete the review using the API
      await reviewAPI.deleteReview(reviewId);
      
      // Remove the review from local state
      const updatedReviews = reviews.filter(review => review.id !== reviewId);
      setReviews(updatedReviews);
      setFilteredReviews(updatedReviews.filter(review => {
        // Apply current filters
        let matches = true;
        
        if (reviewSearchTerm.trim() !== "") {
          const normalizedSearch = reviewSearchTerm.toLowerCase().trim();
          const productName = review.product_name?.toLowerCase() || "";
          const reviewerName = review.reviewer_name?.toLowerCase() || "";
          const comment = review.comment?.toLowerCase() || "";
          
          matches = matches && (
            productName.includes(normalizedSearch) ||
            reviewerName.includes(normalizedSearch) ||
            comment.includes(normalizedSearch)
          );
        }
        
        if (reviewFilterRating !== "all") {
          const targetRating = parseInt(reviewFilterRating);
          matches = matches && review.rating === targetRating;
        }
        
        return matches;
      }));
      
      setSuccessMessage("Review deleted successfully!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (err) {
      console.error("Error deleting review:", err);
      setError("Failed to delete review. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingReviewId(null);
    }
  };

  const refreshReviews = async () => {
    await fetchAllReviews();
  };

  // Helper functions for dropdown options
  const getCategoriesForBrand = (brandName) => {
    const brand = brandCategories.find((b) => b.brand_name === brandName);
    return brand ? brand.categories : [];
  };

  const getSubCategoriesForCategory = (brandName, categoryName) => {
    const brand = brands.find((b) => b.brand_name === brandName);
    if (!brand) return [];

    const category = brand.categories.find(
      (c) => c.category_name === categoryName
    );
    return category
      ? category.subcategories.map((sc) => sc.subcategory_name)
      : [];
  };

  // Product form handlers
  const handleAddNewProduct = () => {
    setEditProductId(null);
    setNewProduct({
      part_number: "",
      price: "",
      short_description: "",
      long_description: "",
      condition: "",
      sub_condition: "",
      quantity: "",
      brand_name: "",
      category_name: "",
      sub_category_name: "",
      status: "Approved",
      image: "",
      imageFile: null,
      additional_images: [],
      additional_image_files: [],
      slug: "",
      sale_price: "",
      video_url: "",
      videoFile: null,
      videoFileName: "",
      
      // Reset all specification fields
      product_model: "",
      motherboard: "",
      material: "",
      front_ports: "",
      gpu_length: "",
      cpu_height: "",
      hdd_support: "",
      ssd_support: "",
      expansion_slots: "",
      case_size: "",
      water_cooling_support: "",
      case_fan_support: "",
      carton_size: "",
      loading_capacity: "",
      pump_parameter: "",
      pump_bearing: "",
      pump_speed: "",
      pump_interface: "",
      pump_noise: "",
      tdp: "",
      pipe_length_material: "",
      light_effect: "",
      drainage_size: "",
      fan_size: "",
      fan_speed: "",
      fan_voltage: "",
      fan_interface: "",
      fan_airflow: "",
      fan_wind_pressure: "",
      fan_noise: "",
      fan_bearing_type: "",
      fan_power: "",
      fan_rated_voltage: "",
      axis: "",
      number_of_keys: "",
      weight: "",
      carton_weight: "",
      package_size: "",
      carton_size_kb: "",
      keycap_technology: "",
      wire_length: "",
      lighting_style: "",
      body_material: "",
      dpi: "",
      return_rate: "",
      engine_solution: "",
      surface_technology: "",
      package: "",
      packing: "",
      moq_customization: "",
      customization_options: "",
    });
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditProductId(product.product_product_id);

    setNewProduct({
      part_number: product.product_part_number || "",
      price: product.product_price || "",
      short_description: product.product_short_description || "",
      long_description: product.product_long_description || "",
      condition: product.product_condition || "",
      sub_condition: product.product_sub_condition || "",
      quantity: product.product_quantity || "",
      brand_name: product.brand_brand_name || "",
      category_name: product.category_category_name || "",
      sub_category_name: product.sub_category_sub_category_name || "",
      status: product.product_status === "true" || product.product_status === true ? "Approved" : 
              product.product_status === "false" || product.product_status === false ? "Not Approved" : 
              product.product_status || "Approved",
      image: product.product_image || "",
      imageFile: null,
      additional_images: product.product_images || [],
      additional_image_files: [],
      slug: product.slug || "",
      sale_price: product.sale_price || "",
      videoFile: null,
      video_url: product.video_url || "",
      videoFileName: product.video_url ? product.video_url.split('/').pop() : "",
      
      // Load all specification fields
      product_model: product.product_model || "",
      motherboard: product.motherboard || "",
      material: product.material || "",
      front_ports: product.front_ports || "",
      gpu_length: product.gpu_length || "",
      cpu_height: product.cpu_height || "",
      hdd_support: product.hdd_support || "",
      ssd_support: product.ssd_support || "",
      expansion_slots: product.expansion_slots || "",
      case_size: product.case_size || "",
      water_cooling_support: product.water_cooling_support || "",
      case_fan_support: product.case_fan_support || "",
      carton_size: product.carton_size || "",
      loading_capacity: product.loading_capacity || "",
      pump_parameter: product.pump_parameter || "",
      pump_bearing: product.pump_bearing || "",
      pump_speed: product.pump_speed || "",
      pump_interface: product.pump_interface || "",
      pump_noise: product.pump_noise || "",
      tdp: product.tdp || "",
      pipe_length_material: product.pipe_length_material || "",
      light_effect: product.light_effect || "",
      drainage_size: product.drainage_size || "",
      fan_size: product.fan_size || "",
      fan_speed: product.fan_speed || "",
      fan_voltage: product.fan_voltage || "",
      fan_interface: product.fan_interface || "",
      fan_airflow: product.fan_airflow || "",
      fan_wind_pressure: product.fan_wind_pressure || "",
      fan_noise: product.fan_noise || "",
      fan_bearing_type: product.fan_bearing_type || "",
      fan_power: product.fan_power || "",
      fan_rated_voltage: product.fan_rated_voltage || "",
      axis: product.axis || "",
      number_of_keys: product.number_of_keys || "",
      weight: product.weight || "",
      carton_weight: product.carton_weight || "",
      package_size: product.package_size || "",
      carton_size_kb: product.carton_size_kb || "",
      keycap_technology: product.keycap_technology || "",
      wire_length: product.wire_length || "",
      lighting_style: product.lighting_style || "",
      body_material: product.body_material || "",
      dpi: product.dpi || "",
      return_rate: product.return_rate || "",
      engine_solution: product.engine_solution || "",
      surface_technology: product.surface_technology || "",
      package: product.package || "",
      packing: product.packing || "",
      moq_customization: product.moq_customization || "",
      customization_options: product.customization_options || "",
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      setLoading(true);
      await productAPI.deleteProduct(id);

      // Update local state to remove the product
      const updatedProducts = products.filter(
        (product) => product.product_product_id !== id
      );
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      // Show success message
      setSuccessMessage("Product deleted successfully!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("❌ Form submission error:", error);
      setError(`Submission failed: ${error.message || "Please try again."}`);
      
      // Show error in progress indicator
      setProgressIndicator({
        isVisible: true,
        currentStep: 0,
        totalSteps: 5,
        message: "Submission failed",
        error: error.message || "An unexpected error occurred. Please try again.",
        success: false
      });
      
      setTimeout(() => {
        setError(null);
        setProgressIndicator(prev => ({ ...prev, isVisible: false }));
      }, 5000);
    } finally {
      setFormLoading(false);
      
      // Hide progress indicator after delay if successful
      if (!progressIndicator.error) {
        setTimeout(() => {
          setProgressIndicator(prev => ({ ...prev, isVisible: false }));
        }, 3000);
      }
    }
  };

  // Toggle product approval status
  const handleToggleProductStatus = async (product) => {
    try {
      setLoading(true);
      
      // Determine new status (toggle between "Approved" and "Not Approved")
      const currentStatus = product.product_status === "Approved" || product.product_status === "true" || product.product_status === true;
      const newStatus = currentStatus ? "Not Approved" : "Approved";
 

      // Create FormData for the backend (since updateProduct expects FormData)
      const formData = new FormData();
      formData.append('status', newStatus);

      // Call the update API with FormData
      await productAPI.updateProduct(product.product_product_id, formData);
      
      // Refresh products from backend to ensure consistency
      const refreshedProducts = await fetchAllProducts({ force: true });
      setProducts(refreshedProducts);
      setFilteredProducts(refreshedProducts);
      
      // Show success message
      const statusText = newStatus === "Approved" ? "approved" : "disapproved";
      setSuccessMessage(`Product ${statusText} successfully!`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error("❌ Status toggle error:", error);
      setError(`Failed to update product status: ${error.message || "Please try again."}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Cancel operation handler
  const handleCancelOperation = () => {
    setOperationCancelled(true);
    setFormLoading(false);
    setProgressIndicator({
      isVisible: true,
      currentStep: 0,
      totalSteps: 5,
      message: "Operation cancelled",
      error: "Operation was cancelled by user",
      success: false
    });
    
    // Hide progress indicator after delay
    setTimeout(() => {
      setProgressIndicator(prev => ({ ...prev, isVisible: false }));
      setOperationCancelled(false);
    }, 3000);
  };
  
  // Dismiss progress indicator
  const handleDismissProgress = () => {
    setProgressIndicator(prev => ({ ...prev, isVisible: false }));
  };

  const handleProductFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setOperationCancelled(false); // Reset cancel state
    
    // ⚡ PERFORMANCE OPTIMIZATION: Add progress tracking
    const startTime = performance.now();

    try {
      // ⚡ Early validation with better error messages
      const validationErrors = [];
      if (!newProduct.part_number?.trim()) validationErrors.push("Part number is required");
      if (!newProduct.price || isNaN(parseFloat(newProduct.price))) validationErrors.push("Valid price is required");
      if (!newProduct.brand_name?.trim()) validationErrors.push("Brand name is required");
      if (!newProduct.category_name?.trim()) validationErrors.push("Category name is required");
      if (!newProduct.imageFile && !editProductId) validationErrors.push("Product image is required");
      
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // ⚡ PERFORMANCE OPTIMIZATION: Optimized FormData creation
      const formData = new FormData();
      
      // Core required fields first
      const coreFields = {
        brand_name: newProduct.brand_name,
        category_name: newProduct.category_name,
        price: newProduct.price,
        quantity: newProduct.quantity || "1",
        short_description: newProduct.short_description || "",
        status: newProduct.status === "Approved" || newProduct.status === "true" ? "Approved" : "Not Approved",
        part_number: newProduct.part_number,
        condition: newProduct.condition || ""
      };
      
      // Append core fields
      Object.entries(coreFields).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      
      // Optional fields
      const optionalFields = {
        sub_condition: newProduct.sub_condition,
        long_description: newProduct.long_description,
        sub_category_name: newProduct.sub_category_name,
        // include sale_price and slug for backend
        sale_price: newProduct.sale_price,
        slug: newProduct.slug,
      };
      
      Object.entries(optionalFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'string' ? value.trim() : true) {
            formData.append(key, value);
          }
        }
      });

      // ⚡ PERFORMANCE OPTIMIZATION: Optimized image file handling
      
      // Append main image file if available
      if (newProduct.imageFile) {
        // Direct append without unnecessary File constructor
        formData.append("image", newProduct.imageFile, newProduct.imageFile.name);
      }

      // ⚡ Batch process additional images
      if (newProduct.additional_image_files?.length > 0) {
        
        // Validate total image count
        if (newProduct.additional_image_files.length > 9) {
          throw new Error("Maximum 9 additional images allowed");
        }
        
        newProduct.additional_image_files.forEach((file, index) => {
          formData.append("additional_images", file, file.name);
        });
      }

      // Append product video if available
      if (newProduct.videoFile) {
        formData.append("video", newProduct.videoFile, newProduct.videoFile.name);
      }

      // ⚡ PERFORMANCE OPTIMIZATION: Batch process specification fields
      
      const specFieldGroups = {
        case: ['product_model', 'motherboard', 'material', 'front_ports', 'gpu_length', 'cpu_height', 'hdd_support', 'ssd_support', 'expansion_slots', 'case_size', 'water_cooling_support', 'case_fan_support', 'carton_size', 'loading_capacity'],
        pump: ['pump_parameter', 'pump_bearing', 'pump_speed', 'pump_interface', 'pump_noise', 'tdp', 'pipe_length_material', 'light_effect', 'drainage_size'],
        fan: ['fan_size', 'fan_speed', 'fan_voltage', 'fan_interface', 'fan_airflow', 'fan_wind_pressure', 'fan_noise', 'fan_bearing_type', 'fan_power', 'fan_rated_voltage'],
        keyboard: ['axis', 'number_of_keys', 'weight', 'carton_weight', 'package_size', 'carton_size_kb', 'keycap_technology', 'wire_length', 'lighting_style', 'body_material'],
        mouse: ['dpi', 'return_rate', 'engine_solution', 'surface_technology'],
        packaging: ['package', 'packing', 'moq_customization', 'customization_options']
      };
      
      let specFieldCount = 0;
      Object.entries(specFieldGroups).forEach(([groupName, fields]) => {
        fields.forEach(field => {
          if (newProduct[field]?.trim()) {
            formData.append(field, newProduct[field]);
            specFieldCount++;
          }
        });
      });
      

      // ⚡ PERFORMANCE OPTIMIZATION: Efficient FormData logging
      let totalSize = 0;
      let imageCount = 0;
      let additionalImageCount = 0;
      let fieldCount = 0;
      
      for (const [key, value] of formData.entries()) {
        if (key === "image") {
          imageCount++;
          totalSize += value.size;
        } else if (key === "additional_images") {
          additionalImageCount++;
          totalSize += value.size;
        } else if (value instanceof File) {
          totalSize += value.size;
        } else {
          fieldCount++;
        }
      }
      
      // ⚡ PERFORMANCE OPTIMIZATION: Enhanced progress tracking
      setProgressIndicator({
        isVisible: true,
        currentStep: 1,
        totalSteps: 5,
        message: "Validating form data...",
        error: null,
        success: false
      });
      
      // Step 2: Processing images
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX
      
      // Check if operation was cancelled
      if (operationCancelled) {
        return;
      }
      
      setProgressIndicator(prev => ({
        ...prev,
        currentStep: 2,
        message: `Processing ${imageCount + additionalImageCount} images...`
      }));
      
      let result;
      const apiStartTime = performance.now();
      
      // Step 3: Uploading
      // Check if operation was cancelled
      if (operationCancelled) {
        return;
      }
      
      setProgressIndicator(prev => ({
        ...prev,
        currentStep: 3,
        message: editProductId ? "Updating product..." : "Creating product..."
      }));
      
      if (editProductId) {
        result = await productAPI.updateProduct(editProductId, formData);
        
        // Step 4: Database operations
        // Check if operation was cancelled
        if (operationCancelled) {
          return;
        }
        
        setProgressIndicator(prev => ({
          ...prev,
          currentStep: 4,
          message: "Updating database and cache..."
        }));
        
        // ⚡ Optimized cache clearing
        const cacheKeys = ["killswitch_products", "killswitch_products_timestamp", "killswitch_brands", "killswitch_brands_timestamp"];
        cacheKeys.forEach(key => localStorage.removeItem(key));
        
        // Extract the product data from the result
        const updatedProductData = result.product || result;
        
        // ⚡ Optimized state updates
        setRecentlyUpdated(prev => [
          { ...updatedProductData, action: "updated" },
          ...prev.slice(0, 4),
        ]);

        // Step 5: Finalizing
        setProgressIndicator(prev => ({
          ...prev,
          currentStep: 5,
          message: "Refreshing product list..."
        }));

        // ⚡ Background refresh for better UX
        fetchAllProducts().then(refreshedProducts => {
          setProducts(refreshedProducts);
          setFilteredProducts(refreshedProducts);
          setLastUpdateTime(Date.now());
        }).catch(err => console.warn("Background refresh failed:", err));

        setSuccessMessage("Product updated successfully! 🎉");
      } else {
        result = await productAPI.addProduct(formData);
        
        // Step 4: Database operations
        // Check if operation was cancelled
        if (operationCancelled) {
          return;
        }
        
        setProgressIndicator(prev => ({
          ...prev,
          currentStep: 4,
          message: "Saving to database..."
        }));
        
        setRecentlyUpdated(prev => [
          { ...result, action: "added" },
          ...prev.slice(0, 4),
        ]);

        // Step 5: Finalizing
        setProgressIndicator(prev => ({
          ...prev,
          currentStep: 5,
          message: "Refreshing product list..."
        }));

        // ⚡ Background refresh for new products
        fetchAllProducts().then(updatedProducts => {
          setProducts(updatedProducts);
          setFilteredProducts(updatedProducts);
        }).catch(err => console.warn("Background refresh failed:", err));

        setSuccessMessage("Product added successfully! 🎉");
      }
      
      const totalTime = performance.now() - startTime;
      
      // Show success
      setProgressIndicator({
        isVisible: true,
        currentStep: 5,
        totalSteps: 5,
        message: editProductId ? "Product updated successfully!" : "Product added successfully!",
        error: null,
        success: true
      });

      // ⚡ PERFORMANCE OPTIMIZATION: Optimized form reset
      setShowProductForm(false);
      setEditProductId(null);
      setNewProduct({
        part_number: "",
        price: "",
        short_description: "",
        long_description: "",
        condition: "",
        sub_condition: "",
        quantity: "",
        brand_name: "",
        category_name: "",
        sub_category_name: "",
        status: "Approved",
        image: "",
        imageFile: null,
        additional_images: [],
        additional_image_files: [],
        
        // Reset all specification fields
        product_model: "",
        motherboard: "",
        material: "",
        front_ports: "",
        gpu_length: "",
        cpu_height: "",
        hdd_support: "",
        ssd_support: "",
        expansion_slots: "",
        case_size: "",
        water_cooling_support: "",
        case_fan_support: "",
        carton_size: "",
        loading_capacity: "",
        pump_parameter: "",
        pump_bearing: "",
        pump_speed: "",
        pump_interface: "",
        pump_noise: "",
        tdp: "",
        pipe_length_material: "",
        light_effect: "",
        drainage_size: "",
        fan_size: "",
        fan_speed: "",
        fan_voltage: "",
        fan_interface: "",
        fan_airflow: "",
        fan_wind_pressure: "",
        fan_noise: "",
        fan_bearing_type: "",
        fan_power: "",
        fan_rated_voltage: "",
        axis: "",
        number_of_keys: "",
        weight: "",
        carton_weight: "",
        package_size: "",
        carton_size_kb: "",
        keycap_technology: "",
        wire_length: "",
        lighting_style: "",
        body_material: "",
        dpi: "",
        return_rate: "",
        engine_solution: "",
        surface_technology: "",
        package: "",
        packing: "",
        moq_customization: "",
        customization_options: "",
        // reset new fields
        slug: "",
        sale_price: "",
        video_url: "",
        videoFile: null,
        videoFileName: "",
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error submitting product form:", err);
      setError(err.message || "Failed to submit product. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <RouteGuard allowedRoles={["admin"]} redirectTo="/login">
      <div className="flex flex-col min-h-screen text-white" style={{backgroundColor: '#000000'}}>
        <Navbar />

        <div className="flex-1 relative">
          {/* Animated background elements */}
          <div className="fixed inset-0 z-[-1] overflow-hidden">
            {/* Grid lines */}
            <div className="absolute top-0 left-1/4 w-px h-full bg-white/5"></div>
            <div className="absolute top-0 left-2/4 w-px h-full bg-white/5"></div>
            <div className="absolute top-0 left-3/4 w-px h-full bg-white/5"></div>
            <div className="absolute top-1/3 left-0 w-full h-px bg-white/5"></div>
            <div className="absolute top-2/3 left-0 w-full h-px bg-white/5"></div>

            {/* Animated orbs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl" style={{backgroundColor: '#c70007', opacity: '0.2'}}
              animate={{
                x: [0, 30, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{backgroundColor: '#c70007', opacity: '0.2'}}
              animate={{
                x: [0, -40, 0],
                y: [0, 40, 0],
              }}
              transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>

          {/* Main content */}
          <div className="pt-6 pb-12 px-4 sm:px-6">
            <div className="max-w-[1800px] mx-auto">
              {/* Header with animated elements */}
              <section id="header" className="relative mb-12">
                <motion.div
                  className="text-center relative z-10"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isVisible["header"] ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8 }}
                >
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Admin Dashboard
                  </h1>
                  <div className="h-1 w-24 mx-auto mb-6" style={{background: 'linear-gradient(to right, #c70007, #ff4444, #c70007)'}}></div>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
                    Manage your product inventory
                  </p>
                  <p className="text-sm text-gray-400 mb-6">
                    {filteredProducts.length} products found
                  </p>

                  {/* Recent Activity Button (Left-aligned) */}
                  {recentlyUpdated.length > 0 && (
                    <div className="absolute top-4 left-4 md:top-8 md:left-8">
                      <button
                        onClick={() =>
                          setShowRecentActivity(!showRecentActivity)
                        }
                        className="flex items-center justify-center gap-2 px-4 py-2 text-white hover:opacity-80 rounded-lg transition-all duration-300 ease-in-out hover:scale-[1.03] border border-gray-500/30" style={{backgroundColor: '#1c1816'}}
                      >
                        <span className="font-medium">
                          {showRecentActivity
                            ? "Hide Recent Activity"
                            : "Show Recent Activity"}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ease-in-out ${
                            showRecentActivity ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {showRecentActivity && (
                        <div className="absolute z-10 mt-2 p-4 backdrop-blur-sm rounded-lg border border-gray-500/30 shadow-xl w-[250px] transition-all duration-300 ease-in-out" style={{backgroundColor: '#1c1816', opacity: showRecentActivity ? 1 : 0}}>
                          <div className="flex flex-wrap gap-2">
                            {recentlyUpdated.map((product, index) => (
                              <span
                                key={index}
                                className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ease-in-out ${
                                  product.action === "added"
                                    ? "text-green-300 border border-green-500/30"
                                    : "text-white border border-gray-500/30"
                                }`}
                                style={{
                                  backgroundColor: product.action === "added" ? "rgba(34, 197, 94, 0.2)" : "#1c1816"
                                }}
                              >
                                {product.product_part_number} ({product.action})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="flex flex-wrap justify-center gap-4 mb-8">
                    <motion.button
                      onClick={handleAddNewProduct}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-5 h-5" />
                      Add New Product
                    </motion.button>


                    <motion.button
                      onClick={refreshAllData}
                      className="flex items-center gap-2 px-6 py-3 border border-gray-500/30 rounded-lg text-white hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={loading}
                    >
                      <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} style={{color: 'white'}} />
                      {loading ? 'Refreshing...' : 'Refresh All'}
                    </motion.button>

                    {/* Activity Logs Button */}
                    <motion.button
                      onClick={navigateToActivityLogs}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Activity className="w-5 h-5" />
                      Activity Logs
                    </motion.button>

                    {/* All Orders Button */}
                    <motion.button
                      onClick={navigateToOrders}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      All Orders
                    </motion.button>

                    <motion.button
                      onClick={navigateToAdminRoleManagement}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Assign Role
                    </motion.button>

                    <motion.button
                      onClick={navigateToEntityManagement}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Database className="w-5 h-5" />
                      Entity Management
                    </motion.button>

                    {/* Dashboard Analytics Button */}
                    <motion.button
                      onClick={navigateToAnalyticsDashboard}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BarChart3 className="w-5 h-5" />
                      Dashboard Analytics
                    </motion.button>

                    {/* Newsletter Subscribers Button */}
                    <motion.button
                      onClick={navigateToNewsletterSubscribers}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Mail className="w-5 h-5" />
                      Newsletter Subscribers
                    </motion.button>

                    {/* Coupon Codes Button */}
                    <motion.button
                      onClick={navigateToCouponCodes}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Ticket className="w-5 h-5" />
                      Coupon Codes
                    </motion.button>
                  </div>

                  {/* Search and Filter Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Search Box */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isSearching ? (
                          <div className="animate-spin h-4 w-4 border-2 rounded-full border-t-transparent" style={{borderColor: '#c70007'}} />
                        ) : (
                          <Search className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-gray-300" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}}
                      />
                    </div>

                    {/* Category Filter */}
                    <div>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="block w-full py-3 px-4 rounded-lg border border-gray-500/30 text-white focus:outline-none focus:ring-1 focus:border-gray-300" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}}
                      >
                        <option value="all">All Categories</option>
                        {categories
                          .filter((cat) => cat !== "all")
                          .map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Brand Filter */}
                    <div>
                      <select
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                        className="block w-full py-3 px-4 rounded-lg border border-gray-500/30 text-white focus:outline-none focus:ring-1 focus:border-gray-300" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}}
                      >
                        <option value="all">All Brands</option>
                        {productBrands
                          .filter((brand) => brand !== "all")
                          .map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="block w-full py-3 px-4 rounded-lg border border-gray-500/30 text-white focus:outline-none focus:ring-1 focus:border-gray-300" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="name-asc">Name: A to Z</option>
                        <option value="name-desc">Name: Z to A</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              </section>

              {/* Tab Navigation */}
              <section className="mb-8">
                <div className="flex border-b border-gray-500/30">
                  <button
                    onClick={() => setActiveTab("products")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === "products"
                        ? "border-b-2" 
                        : "text-gray-400 hover:text-white"
                    }`}
                    style={activeTab === "products" ? {color: '#c70007', borderBottomColor: '#c70007'} : {}}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Products ({filteredProducts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === "reviews"
                        ? "border-b-2"
                        : "text-gray-400 hover:text-white"
                    }`}
                    style={activeTab === "reviews" ? {color: '#c70007', borderBottomColor: '#c70007'} : {}}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Reviews ({filteredReviews.length})
                  </button>
                </div>
              </section>

              {/* Tab Content */}
              {activeTab === "products" && (
                <section id="products-grid" className="relative">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{borderTopColor: '#c70007', borderBottomColor: '#c70007'}}></div>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-400 p-8 border border-red-400/20 rounded-xl">
                    <p>Error loading products: {error}</p>
                    <button
                      className="mt-4 px-4 py-2 border border-gray-500/30 rounded-lg hover:opacity-80 transition-colors" style={{backgroundColor: '#1c1816'}}
                      onClick={refreshProducts}
                    >
                      Try Again
                    </button>
                  </div>
                ) : displayedProducts.length === 0 ? (
                  <div className="text-center text-gray-400 p-8 border border-gray-400/20 rounded-xl">
                    <p>No products found matching your criteria.</p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterCategory("all");
                        setFilterBrand("all");
                        setSortBy("newest");
                      }}
                      className="mt-4 px-4 py-2 border border-gray-500/30 rounded-lg hover:opacity-80 transition-colors" style={{backgroundColor: '#1c1816'}}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                    >
                      {displayedProducts.map((product, index) => (
                        <ProductCard
                          key={product.product_product_id || index}
                          product={product}
                          onEdit={handleEditProduct}
                          onDelete={handleDeleteProduct}
                          onView={openProductModal}
                          onNavigate={navigateToProductDetail}
                          onToggleStatus={handleToggleProductStatus}
                        />
                      ))}
                    </motion.div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    )}
                  </>
                )}
              </section>
              )}

              {/* Reviews Management Tab */}
              {activeTab === "reviews" && (
                <section id="reviews-management" className="relative">
                  {/* Review Controls */}
                  <div className="mb-8">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                      <h2 className="text-2xl font-bold text-white">Review Management</h2>
                      <motion.button
                        onClick={refreshReviews}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors" style={{backgroundColor: '#c70007'}}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={reviewsLoading}
                      >
                        <RefreshCw className={`w-4 h-4 ${reviewsLoading ? 'animate-spin' : ''}`} style={{color: 'white'}} />
                        {reviewsLoading ? 'Refreshing...' : 'Refresh Reviews'}
                      </motion.button>
                    </div>

                    {/* Review Search and Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Search Box */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search reviews, products, users..."
                          value={reviewSearchTerm}
                          onChange={handleReviewSearch}
                          className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-gray-300" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}}
                        />
                      </div>

                      {/* Rating Filter */}
                      <div>
                        <select
                          value={reviewFilterRating}
                          onChange={(e) => setReviewFilterRating(e.target.value)}
                          className="block w-full py-3 px-4 rounded-lg border border-gray-500/30 text-white focus:outline-none focus:ring-1 focus:border-gray-300" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}}
                        >
                          <option value="all">All Ratings</option>
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="2">2 Stars</option>
                          <option value="1">1 Star</option>
                        </select>
                      </div>

                      {/* Sort By */}
                      <div>
                        <select
                          value={reviewSortBy}
                          onChange={(e) => setReviewSortBy(e.target.value)}
                          className="block w-full py-3 px-4 rounded-lg border border-gray-500/30 text-white focus:outline-none focus:ring-1 focus:border-gray-300" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}}
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="rating-high">Highest Rating</option>
                          <option value="rating-low">Lowest Rating</option>
                          <option value="product-name">Product Name</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  {reviewsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{borderTopColor: '#c70007', borderBottomColor: '#c70007'}}></div>
                    </div>
                  ) : reviewsError ? (
                    <div className="text-center text-red-400 p-8 border border-red-400/20 rounded-xl">
                      <p>Error loading reviews: {reviewsError}</p>
                      <button
                        className="mt-4 px-4 py-2 border border-gray-500/30 rounded-lg hover:opacity-80 transition-colors" style={{backgroundColor: '#1c1816'}}
                        onClick={refreshReviews}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredReviews.length === 0 ? (
                    <div className="text-center text-gray-400 p-8 border border-gray-400/20 rounded-xl">
                      <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-xl font-semibold mb-2">No Reviews Found</p>
                      <p>No reviews match your current filters.</p>
                      <button
                        onClick={() => {
                          setReviewSearchTerm("");
                          setReviewFilterRating("all");
                          setReviewSortBy("newest");
                        }}
                        className="mt-4 px-4 py-2 border border-gray-500/30 rounded-lg hover:opacity-80 transition-colors" style={{backgroundColor: '#1c1816'}}
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredReviews.map((review, index) => (
                        <motion.div
                          key={review.id || index}
                          className="rounded-lg p-6 border border-gray-500/30 hover:border-gray-300 transition-all duration-300" style={{backgroundColor: '#1c1816'}}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Review Header */}
                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-white font-medium">{review.reviewer_name || 'Anonymous'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < (review.rating || 0)
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-400"
                                      }`}
                                    />
                                  ))}
                                  <span className="text-gray-300 text-sm ml-1">({review.rating}/5)</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(review.createdAt || review.created_at).toLocaleDateString()}
                                </div>
                              </div>

                              {/* Product Info */}
                              <div className="flex items-center gap-3 mb-3 p-3 border border-gray-500/30 rounded-lg" style={{backgroundColor: '#1c1816'}}>
                                {review.product_image && (
                                  <img
                                    src={review.product_image}
                                    alt={review.product_name}
                                    className="w-12 h-12 object-contain rounded-lg" style={{backgroundColor: '#1c1816'}}
                                  />
                                )}
                                <div>
                                  <h4 className="text-white font-medium">{review.product_name}</h4>
                                  {review.product_price && (
                                    <p className="text-green-400 text-sm">${review.product_price}</p>
                                  )}
                                </div>
                              </div>

                              {/* Review Content */}
                              <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 ml-4">
                              <motion.button
                                onClick={() => handleViewReview(review)}
                                className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDeleteReview(review.id)}
                                disabled={deletingReviewId === review.id}
                                className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors disabled:opacity-50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Delete Review"
                              >
                                {deletingReviewId === review.id ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-red-300 rounded-full border-t-transparent" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>

        <AdminChat />
        <Footer />
      </div>

      {showModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setShowModal(false)}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {showProductForm && (
        <ProductForm
          editProductId={editProductId}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          formLoading={formLoading}
          onSubmit={handleProductFormSubmit}
          onClose={() => setShowProductForm(false)}
          brands={brands}
          getCategoriesForBrand={getCategoriesForBrand}
          getSubCategoriesForCategory={getSubCategoriesForCategory}
        />
      )}

      {/* Review Detail Modal */}
      {showReviewModal && selectedReview && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowReviewModal(false)}
        >
          <motion.div
            className="rounded-xl border border-gray-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{backgroundColor: '#1c1816'}}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Review Details</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:opacity-80 rounded-lg transition-colors" style={{backgroundColor: '#1c1816'}}
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Reviewer Info */}
              <div className="flex items-center gap-4 p-4 border border-gray-500/30 rounded-lg" style={{backgroundColor: '#1c1816'}}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#c70007'}}>
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{selectedReview.reviewer_name || 'Anonymous User'}</h3>
                  <p className="text-gray-400 text-sm">
                    Reviewed on {new Date(selectedReview.createdAt || selectedReview.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex items-center gap-4 p-4 border border-gray-500/30 rounded-lg" style={{backgroundColor: '#1c1816'}}>
                {selectedReview.product_image && (
                  <img
                    src={selectedReview.product_image}
                    alt={selectedReview.product_name}
                    className="w-16 h-16 object-contain rounded-lg" style={{backgroundColor: '#1c1816'}}
                  />
                )}
                <div>
                  <h3 className="text-white font-semibold">{selectedReview.product_name}</h3>
                  {selectedReview.product_price && (
                    <p className="text-green-400">${selectedReview.product_price}</p>
                  )}
                  <button
                    onClick={() => router.push(`/${selectedReview.product_id}`)}
                    className="hover:opacity-80 text-sm underline" style={{color: '#c70007'}}
                  >
                    View Product
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="p-4 border border-gray-500/30 rounded-lg" style={{backgroundColor: '#1c1816'}}>
                <h4 className="text-white font-semibold mb-2">Rating</h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < (selectedReview.rating || 0)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white font-medium text-lg">
                    {selectedReview.rating}/5 Stars
                  </span>
                </div>
              </div>



              {/* Review Comment */}
              <div className="p-4 border border-gray-500/30 rounded-lg" style={{backgroundColor: '#1c1816'}}>
                <h4 className="text-white font-semibold mb-2">Review Comment</h4>
                <p className="text-gray-300 leading-relaxed">{selectedReview.comment}</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-80 transition-colors" style={{backgroundColor: '#1c1816'}}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    handleDeleteReview(selectedReview.id);
                  }}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-80 transition-colors flex items-center gap-2" style={{backgroundColor: '#c70007'}}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Review
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showSuccess && (
        <motion.div
          className="fixed bottom-5 right-5 text-green-300 border border-green-500/30 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2" style={{backgroundColor: "rgba(34, 197, 94, 0.2)"}}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {successMessage}
        </motion.div>
      )}

      {error && (
        <motion.div
          className="fixed bottom-5 right-5 bg-red-500/20 text-red-300 border border-red-500/30 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </motion.div>
      )}
      
      {/* Enhanced Progress Indicator */}
      <ProgressIndicator
        isVisible={progressIndicator.isVisible}
        currentStep={progressIndicator.currentStep}
        totalSteps={progressIndicator.totalSteps}
        message={progressIndicator.message}
        error={progressIndicator.error}
        success={progressIndicator.success}
        onCancel={formLoading && !progressIndicator.success && !progressIndicator.error ? handleCancelOperation : null}
        onDismiss={handleDismissProgress}
      />
    </RouteGuard>
  );
}
