"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { getSafeCategory, getCategoryName, isSameCategory } from "@/app/utils/categoryUtils";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Star, 
  Package, 
  Tag, 
  Plus, 
  Minus, 
  X,
  Heart,
  Share2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Truck,
  Shield,
  RotateCcw,
  Info,
  MessageSquare,
  FileText
} from "lucide-react";
import { fetchAllProducts, productAPI, reviewAPI, cartAPI, API, enhancedProductAPI } from "../../api/api";
import Navbar from "../../component/HomeComponents/Navbar";
import Footer from "../../component/HomeComponents/Footer";
import Modal from "../../component/GeneralComponents/Modal";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  // support both the old /products/:id route and new root-level slug route
  const productId = params.id || params.slug;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalInfo, setModalInfo] = useState({ type: "success", message: "" });
  const [reviews, setReviews] = useState([]);
  const [isVisible, setIsVisible] = useState({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false);
  const videoRef = useRef(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [navigationFeedback, setNavigationFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, reviewCount: 0 });
  const getProductById = productAPI.getProductById;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, name: "", comment: "" });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [summaryHoveredRating, setSummaryHoveredRating] = useState(0);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        try {
          const cached = JSON.parse(localStorage.getItem("killswitch_products") || "[]");
          const filtered = Array.isArray(cached) ? cached.filter(p => (p.product_product_id || p.id) != productId) : [];
          localStorage.setItem("killswitch_products", JSON.stringify(filtered));
        } catch (_) {}
        
        // Check if productId is numeric (ID) or text (slug)
        let data;
        if (productId && /^\d+$/.test(productId)) {
          data = await getProductById(productId);
        } else if (productId) {
          const allProducts = await fetchAllProducts();
          data = allProducts.find(p => p.slug === productId);
          if (!data) {
            throw new Error(`Product with slug "${productId}" not found`);
          }
        } else {
          throw new Error('Product ID or slug not provided');
        }
        
        // Add debug logging for category
        if (data) {
        }
        
        setProduct(data);
      } catch (err) {
        setError(err.message || "Failed to fetch product");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // if user lands on legacy /products/... path redirect to canonical slug URL
  useEffect(() => {
    if (product && (product.slug || product.product_product_id)) {
      const identifier = product.slug || product.product_product_id;
      if (typeof window !== 'undefined') {
        if (window.location.pathname.startsWith('/products/')) {
          router.replace(`/${identifier}`);
        } else if (window.location.pathname.startsWith('/product/')) {
          // also redirect single-product path to root-level slug
          router.replace(`/${identifier}`);
        }
      }
    }
  }, [product, router]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const profile = await API.auth.getProfile();
        setIsLoggedIn(!!profile);
        // store current user email for review lookup
        const email = profile?.user?.email || profile?.email || null;
        setCurrentUserEmail(email);
        // prefill reviewer name in form using profile
        const defaultName = profile?.user?.name || profile?.name ||
          [profile?.user?.firstName, profile?.user?.lastName].filter(Boolean).join(" ") ||
          [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
          (email ? email.split("@")[0] : "");
        setReviewForm(frm => ({ ...frm, name: defaultName }));
      } catch (_) {
        setIsLoggedIn(false);
        setCurrentUserEmail(null);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      // Use product's numeric ID, not the slug
      const numericProductId = product?.product_product_id || product?.id;
      if (!numericProductId) return;
      
      try {
        const reviewData = await reviewAPI.getProductReviews(numericProductId);
        const normalized = Array.isArray(reviewData)
          ? reviewData 
          : (reviewData?.data || reviewData?.reviews || []);
        setReviews(normalized);
        
        // Check if current user has already reviewed
        if (currentUserEmail && normalized.length > 0) {
          const userReview = normalized.find(review => 
            review.reviewer_email === currentUserEmail || 
            review.user_email === currentUserEmail ||
            review.email === currentUserEmail
          );
          setUserHasReviewed(!!userReview);
        } else {
          setUserHasReviewed(false);
        }
        
        // Calculate review stats from actual reviews
        if (normalized.length > 0) {
          const totalRating = normalized.reduce((sum, review) => sum + Number(review.rating || 0), 0);
          const avgRating = totalRating / normalized.length;
          setReviewStats({
            averageRating: avgRating,
            reviewCount: normalized.length
          });
        } else {
          setReviewStats({ averageRating: 0, reviewCount: 0 });
        }
        
        // Also try to get stats from backend as backup
        try {
          const stats = await reviewAPI.getProductReviewStats(numericProductId);
          if (stats && stats.totalReviews > 0) {
            setReviewStats({
              averageRating: stats?.averageRating || 0,
              reviewCount: stats?.totalReviews || 0
            });
          }
        } catch (statsErr) {
          console.warn("Failed to fetch backend stats:", statsErr);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setReviewStats({ averageRating: 0, reviewCount: 0 });
        setUserHasReviewed(false);
      }
    };

    fetchReviews();
  }, [product, currentUserEmail]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {

        if (!product) {
          setRelatedProducts([]);
          return;
        }

        // Get safe category info with fallbacks
        const currentCategory = getSafeCategory(product);
        const currentCategoryName = currentCategory.category_name;

        if (!currentCategoryName || currentCategory.isFallback) {
          console.warn('No valid category found for related products, will try fallback approach');
          // Don't return here, try to fetch some related products anyway
        }
        
        // Try to get products by category first
        try {
          const categoryProducts = await enhancedProductAPI.getProductsByCategoryWithSpecs(currentCategoryName);
          
          if (Array.isArray(categoryProducts) && categoryProducts.length > 0) {
            // Filter out the current product and limit to 4
            const related = categoryProducts
              .filter(p => p && (p.product_product_id || p.id) !== (product.product_product_id || product.id))
              .slice(0, 4)
              .map(p => ({
                ...p,
                category: getSafeCategory(p)
              }));
              
            setRelatedProducts(related);
            return;
          }
        } catch (categoryErr) {
          console.warn('Error fetching by category, falling back to all products:', categoryErr);
        }
        
        
        try {
          const allProducts = await fetchAllProducts();
          
          if (!Array.isArray(allProducts)) {
            console.error('Invalid products data received');
            setRelatedProducts([]);
            return;
          }
                    
          // Get current product ID for comparison
          const currentProductId = product?.product_product_id || product?.id;
          if (!currentProductId) {
            console.error('Current product has no valid ID');
            setRelatedProducts([]);
            return;
          }
          
          // Process products in chunks to avoid blocking the UI
          const chunkSize = 50;
          const chunks = [];
          for (let i = 0; i < allProducts.length; i += chunkSize) {
            chunks.push(allProducts.slice(i, i + chunkSize));
          }
          
          let related = [];
          
          // Process each chunk
          for (const chunk of chunks) {
            const chunkResults = chunk
              .filter(p => {
                if (!p) return false;
                
                // Skip if it's the same product
                const pId = p.product_product_id || p.id;
                if (pId == currentProductId) return false;
                
                // Check if categories match
                try {
                  return isSameCategory(p, product);
                } catch (err) {
                  console.warn('Error comparing categories:', err);
                  return false;
                }
              });
              
            related = [...related, ...chunkResults];
            
            // If we have enough results, stop processing
            if (related.length >= 8) {
              related = related.slice(0, 8);
              break;
            }
          }
          
          // If we don't have enough related products, try to get some fallback products
          if (related.length < 4) {
            const fallbackProducts = allProducts
              .filter(p => {
                const pId = p?.product_product_id || p?.id;
                return p && pId !== currentProductId;
              })
              .slice(0, 4 - related.length);
              
            related = [...related, ...fallbackProducts];
          }
          
          // Ensure all products have a safe category
          const safeRelated = related
            .slice(0, 4) // Max 4 related products
            .map(p => ({
              ...p,
              category: getSafeCategory(p)
            }));
            
          setRelatedProducts(safeRelated);
          
        } catch (err) {
          console.error('Error in fallback product fetching:', err);
          setRelatedProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch related products:", err);
        setRelatedProducts([]);
      }
    };

    // Only fetch related products if we have a valid product ID
    if (productId) {
      fetchRelated();
    } else {
      setRelatedProducts([]);
    }
  }, [product, productId]); // Only depend on product and productId

  // Get product images - improved: handle many common API shapes
  const productImages = (() => {
    if (!product) return [];

    const images = [];

    // Common single-image keys (string urls)
    const singleKeys = [
      'product_image',
      'product_image_url',
      'image',
      'image_url',
      'primary_image',
      'thumbnail',
      'product_image_path',
    ];

    singleKeys.forEach(k => {
      const v = product[k];
      if (v && typeof v === 'string' && !images.includes(v)) images.push(v);
    });

    // Helper to normalize array entries
    const resolveImage = (img) => {
      if (!img) return null;
      if (typeof img === 'string') return img;
      return img.url || img.src || img.image_url || img.path || img.image || null;
    };

    // Common array keys
    const arrayKeys = ['product_images', 'images', 'image_gallery', 'image_urls', 'media', 'photos'];
    arrayKeys.forEach(k => {
      const arr = product[k];
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          const url = resolveImage(item);
          if (url && !images.includes(url)) images.push(url);
        });
      }
    });

    // Nested product.images fallback
    if (product.product && Array.isArray(product.product.images)) {
      product.product.images.forEach(item => {
        const url = resolveImage(item);
        if (url && !images.includes(url)) images.push(url);
      });
    }

    return images.filter(Boolean);
  })();

  // Navigation helper functions - FIXED: Proper bounds checking with video support
  const goToPreviousImage = useCallback((e) => {
    if (e) e.stopPropagation();
    
    const totalMedia = productImages.length + (product?.video_url ? 1 : 0);
    if (totalMedia <= 1) return;
    
    setSelectedImageIndex(prevIndex => {
      let newIndex;
      if (prevIndex === -1) {
        // Currently on video, go to last image
        newIndex = productImages.length - 1;
      } else if (prevIndex === 0) {
        // Go to video if available, otherwise last image
        newIndex = product?.video_url ? -1 : productImages.length - 1;
      } else {
        newIndex = prevIndex - 1;
      }
      
      const label = newIndex === -1 ? 'Video' : `Image ${newIndex + 1}/${productImages.length}`;
      setNavigationFeedback(`← ${label}`);
      setTimeout(() => setNavigationFeedback(""), 1000);
      
      return newIndex;
    });
  }, [productImages.length, product?.video_url]);

  const goToNextImage = useCallback((e) => {
    if (e) e.stopPropagation();
    
    const totalMedia = productImages.length + (product?.video_url ? 1 : 0);
    if (totalMedia <= 1) return;
    
    setSelectedImageIndex(prevIndex => {
      let newIndex;
      if (prevIndex === -1) {
        // Currently on video, go to first image
        newIndex = 0;
      } else if (prevIndex === productImages.length - 1) {
        // Last image, go to video if available, otherwise wrap to 0
        newIndex = product?.video_url ? -1 : 0;
      } else {
        newIndex = prevIndex + 1;
      }
      
      const label = newIndex === -1 ? 'Video' : `Image ${newIndex + 1}/${productImages.length}`;
      setNavigationFeedback(`→ ${label}`);
      setTimeout(() => setNavigationFeedback(""), 1000);
      
      return newIndex;
    });
  }, [productImages]);

  // Handle direct thumbnail click - FIXED: Proper validation
  const handleThumbnailClick = useCallback((index, e) => {
    if (e) e.stopPropagation();
    
    if (index < 0 || index >= productImages.length) return;
    
    setSelectedImageIndex(index);
    setNavigationFeedback(`Image ${index + 1}/${productImages.length}`);
    setTimeout(() => setNavigationFeedback(""), 1000);
  }, [productImages]);

  // Reset selected image index when product changes - FIXED
  useEffect(() => {
    if (productImages.length > 0) {
      if (selectedImageIndex >= productImages.length || selectedImageIndex < 0) {
        setSelectedImageIndex(0);
      }
    } else {
      setSelectedImageIndex(0);
    }
  }, [productImages.length, product]);

  // Keyboard navigation for images - FIXED: Better event handling
  useEffect(() => {
    if (productImages.length <= 1) return;
    
    const handleKeyPress = (e) => {
      // Only handle arrow keys when not in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextImage();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [goToPreviousImage, goToNextImage, productImages.length]);

  const handleScroll = () => {
    const sections = ['product-images', 'product-info', 'reviews'];
    const visible = {};
    sections.forEach(section => {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        visible[section] = rect.top < window.innerHeight && rect.bottom > 0;
      }
    });
    setIsVisible(visible);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));




  const addToCart = async () => {
    try {
      // Import and use the cartSync utility which handles both backend + localStorage
      const { addToCart: addToCartUtil } = await import("../../utils/cartSync");
      await addToCartUtil(product, quantity);
      
      setModalInfo({
        type: "success",
        message: `${product.product_part_number} has been added to your cart.`,
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setModalInfo({
        type: "error",
        message: "Failed to add item to cart. Please try again.",
      });
      setShowModal(true);
    }
  };
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you could implement favorite functionality with API
  };

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.product_part_number,
          text: product.product_short_description,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setModalInfo({
        type: "success",
        message: "Product link copied to clipboard!",
      });
      setShowModal(true);
    }
  };

  const buyNow = async () => {
    try {
      // Check if user is authenticated using cookie-based session
      const profile = await API.auth.getProfile();
      if (!profile || !profile.user) {
        throw new Error('Unauthenticated');
      }
      
      // Create checkout data
      const effectivePrice = product.sale_price ? Number.parseFloat(product.sale_price) : Number.parseFloat(product.product_price) || 0;
      const checkoutData = {
        items: [{ ...product, quantity: quantity }],
        totalAmount: effectivePrice * quantity,
        itemCount: quantity,
        checkoutType: "single",
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
      router.push("/Payment");
    } catch (error) {
      setModalInfo({
        type: "error",
        message: "Please log in to place an order. You will be redirected to the login page.",
      });
      setShowModal(true);
      // Redirect immediately and preserve current product page so login can redirect back
      router.push("/login?next=" + encodeURIComponent(window.location.pathname));
    }
  };

  // Tab content components
  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return (
          <div className="space-y-6">
            {/* Short Description */}
            {product.product_short_description && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
                <p className="text-gray-300 leading-relaxed">
                  {product.product_short_description}
                </p>
              </div>
            )}

            {/* Long Description */}
            {product.product_long_description && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300 leading-relaxed">
                  {product.product_long_description}
                </p>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                <Truck className="w-6 h-6 text-green-400" />
                <div>
                  <h4 className="text-white font-medium">Free Shipping</h4>
                  <p className="text-gray-400 text-sm">On orders over $100</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                <RotateCcw className="w-6 h-6 text-blue-400" />
                <div>
                  <h4 className="text-white font-medium">Easy Returns</h4>
                  <p className="text-gray-400 text-sm">30-day return policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                <Shield className="w-6 h-6 text-purple-400" />
                <div>
                  <h4 className="text-white font-medium">Warranty</h4>
                  <p className="text-gray-400 text-sm">1-year warranty</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "additional":
        return (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
            
            {/* Case Specifications */}
            {(product.product_model || product.motherboard || product.material || product.case_size || product.front_ports || product.gpu_length || product.cpu_height || product.hdd_support || product.ssd_support || product.expansion_slots || product.water_cooling_support || product.case_fan_support || product.carton_size || product.loading_capacity) && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-[#c70007] mb-3 flex items-center">
                  <span className="w-2 h-2 bg-[#c70007] rounded-full mr-2"></span>
                  Case Specifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 backdrop-blur-xl rounded-lg p-4 border border-white/10" style={{backgroundColor: '#1c1816'}}>
                  {product.product_model && (
                    <div>
                      <span className="text-gray-400 text-sm">Model:</span>
                      <p className="text-white font-medium">{product.product_model}</p>
                    </div>
                  )}
                  {product.motherboard && (
                    <div>
                      <span className="text-gray-400 text-sm">Motherboard Support:</span>
                      <p className="text-white font-medium">{product.motherboard}</p>
                    </div>
                  )}
                  {product.material && (
                    <div>
                      <span className="text-gray-400 text-sm">Material:</span>
                      <p className="text-white font-medium">{product.material}</p>
                    </div>
                  )}
                  {product.case_size && (
                    <div>
                      <span className="text-gray-400 text-sm">Case Size:</span>
                      <p className="text-white font-medium">{product.case_size}</p>
                    </div>
                  )}
                  {product.front_ports && (
                    <div>
                      <span className="text-gray-400 text-sm">Front Ports:</span>
                      <p className="text-white font-medium">{product.front_ports}</p>
                    </div>
                  )}
                  {product.gpu_length && (
                    <div>
                      <span className="text-gray-400 text-sm">Max GPU Length:</span>
                      <p className="text-white font-medium">{product.gpu_length}</p>
                    </div>
                  )}
                  {product.cpu_height && (
                    <div>
                      <span className="text-gray-400 text-sm">Max CPU Height:</span>
                      <p className="text-white font-medium">{product.cpu_height}</p>
                    </div>
                  )}
                  {product.hdd_support && (
                    <div>
                      <span className="text-gray-400 text-sm">HDD Support:</span>
                      <p className="text-white font-medium">{product.hdd_support}</p>
                    </div>
                  )}
                  {product.ssd_support && (
                    <div>
                      <span className="text-gray-400 text-sm">SSD Support:</span>
                      <p className="text-white font-medium">{product.ssd_support}</p>
                    </div>
                  )}
                  {product.expansion_slots && (
                    <div>
                      <span className="text-gray-400 text-sm">Expansion Slots:</span>
                      <p className="text-white font-medium">{product.expansion_slots}</p>
                    </div>
                  )}
                  {product.water_cooling_support && (
                    <div>
                      <span className="text-gray-400 text-sm">Water Cooling:</span>
                      <p className="text-white font-medium">{product.water_cooling_support}</p>
                    </div>
                  )}
                  {product.case_fan_support && (
                    <div>
                      <span className="text-gray-400 text-sm">Fan Support:</span>
                      <p className="text-white font-medium">{product.case_fan_support}</p>
                    </div>
                  )}
                  {product.carton_size && (
                    <div>
                      <span className="text-gray-400 text-sm">Carton Size:</span>
                      <p className="text-white font-medium">{product.carton_size}</p>
                    </div>
                  )}
                  {product.loading_capacity && (
                    <div>
                      <span className="text-gray-400 text-sm">Loading Capacity:</span>
                      <p className="text-white font-medium">{product.loading_capacity}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pump Specifications */}
            {(product.pump_parameter || product.pump_bearing || product.pump_speed || product.pump_interface || product.pump_noise || product.tdp || product.pipe_length_material || product.light_effect || product.drainage_size) && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-[#c70007] mb-3 flex items-center">
                  <span className="w-2 h-2 bg-[#c70007] rounded-full mr-2"></span>
                  Pump Specifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 backdrop-blur-xl rounded-lg p-4 border border-white/10" style={{backgroundColor: '#1c1816'}}>
                  {product.pump_parameter && (<div><span className="text-gray-400 text-sm">Parameter:</span><p className="text-white font-medium">{product.pump_parameter}</p></div>)}
                  {product.pump_bearing && (<div><span className="text-gray-400 text-sm">Bearing:</span><p className="text-white font-medium">{product.pump_bearing}</p></div>)}
                  {product.pump_speed && (<div><span className="text-gray-400 text-sm">Speed:</span><p className="text-white font-medium">{product.pump_speed}</p></div>)}
                  {product.pump_interface && (<div><span className="text-gray-400 text-sm">Interface:</span><p className="text-white font-medium">{product.pump_interface}</p></div>)}
                  {product.pump_noise && (<div><span className="text-gray-400 text-sm">Noise:</span><p className="text-white font-medium">{product.pump_noise}</p></div>)}
                  {product.tdp && (<div><span className="text-gray-400 text-sm">TDP:</span><p className="text-white font-medium">{product.tdp}</p></div>)}
                  {product.pipe_length_material && (<div><span className="text-gray-400 text-sm">Pipe Length/Material:</span><p className="text-white font-medium">{product.pipe_length_material}</p></div>)}
                  {product.light_effect && (<div><span className="text-gray-400 text-sm">Light Effect:</span><p className="text-white font-medium">{product.light_effect}</p></div>)}
                  {product.drainage_size && (<div><span className="text-gray-400 text-sm">Drainage Size:</span><p className="text-white font-medium">{product.drainage_size}</p></div>)}
                </div>
              </div>
            )}

            {/* Fan Specifications */}
            {(product.fan_size || product.fan_speed || product.fan_voltage || product.fan_interface || product.fan_airflow || product.fan_wind_pressure || product.fan_noise || product.fan_bearing_type || product.fan_power || product.fan_rated_voltage) && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-[#c70007] mb-3 flex items-center">
                  <span className="w-2 h-2 bg-[#c70007] rounded-full mr-2"></span>
                  Fan Specifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 backdrop-blur-xl rounded-lg p-4 border border-white/10" style={{backgroundColor: '#1c1816'}}>
                  {product.fan_size && (<div><span className="text-gray-400 text-sm">Size:</span><p className="text-white font-medium">{product.fan_size}</p></div>)}
                  {product.fan_speed && (<div><span className="text-gray-400 text-sm">Speed:</span><p className="text-white font-medium">{product.fan_speed}</p></div>)}
                  {product.fan_voltage && (<div><span className="text-gray-400 text-sm">Voltage:</span><p className="text-white font-medium">{product.fan_voltage}</p></div>)}
                  {product.fan_interface && (<div><span className="text-gray-400 text-sm">Interface:</span><p className="text-white font-medium">{product.fan_interface}</p></div>)}
                  {product.fan_airflow && (<div><span className="text-gray-400 text-sm">Airflow:</span><p className="text-white font-medium">{product.fan_airflow}</p></div>)}
                  {product.fan_wind_pressure && (<div><span className="text-gray-400 text-sm">Wind Pressure:</span><p className="text-white font-medium">{product.fan_wind_pressure}</p></div>)}
                  {product.fan_noise && (<div><span className="text-gray-400 text-sm">Noise:</span><p className="text-white font-medium">{product.fan_noise}</p></div>)}
                  {product.fan_bearing_type && (<div><span className="text-gray-400 text-sm">Bearing Type:</span><p className="text-white font-medium">{product.fan_bearing_type}</p></div>)}
                  {product.fan_power && (<div><span className="text-gray-400 text-sm">Power:</span><p className="text-white font-medium">{product.fan_power}</p></div>)}
                  {product.fan_rated_voltage && (<div><span className="text-gray-400 text-sm">Rated Voltage:</span><p className="text-white font-medium">{product.fan_rated_voltage}</p></div>)}
                </div>
              </div>
            )}

            {/* Keyboard Specifications */}
            {(product.axis || product.number_of_keys || product.weight || product.carton_weight || product.package_size || product.carton_size_kb || product.keycap_technology || product.wire_length || product.lighting_style || product.body_material) && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-[#c70007] mb-3 flex items-center">
                  <span className="w-2 h-2 bg-[#c70007] rounded-full mr-2"></span>
                  Keyboard Specifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 backdrop-blur-xl rounded-lg p-4 border border-white/10" style={{backgroundColor: '#1c1816'}}>
                  {product.axis && (<div><span className="text-gray-400 text-sm">Axis:</span><p className="text-white font-medium">{product.axis}</p></div>)}
                  {product.number_of_keys && (<div><span className="text-gray-400 text-sm">Number of Keys:</span><p className="text-white font-medium">{product.number_of_keys}</p></div>)}
                  {product.weight && (<div><span className="text-gray-400 text-sm">Weight:</span><p className="text-white font-medium">{product.weight}</p></div>)}
                  {product.carton_weight && (<div><span className="text-gray-400 text-sm">Carton Weight:</span><p className="text-white font-medium">{product.carton_weight}</p></div>)}
                  {product.package_size && (<div><span className="text-gray-400 text-sm">Package Size:</span><p className="text-white font-medium">{product.package_size}</p></div>)}
                  {product.carton_size_kb && (<div><span className="text-gray-400 text-sm">Carton Size:</span><p className="text-white font-medium">{product.carton_size_kb}</p></div>)}
                  {product.keycap_technology && (<div><span className="text-gray-400 text-sm">Keycap Technology:</span><p className="text-white font-medium">{product.keycap_technology}</p></div>)}
                  {product.wire_length && (<div><span className="text-gray-400 text-sm">Wire Length:</span><p className="text-white font-medium">{product.wire_length}</p></div>)}
                  {product.lighting_style && (<div><span className="text-gray-400 text-sm">Lighting Style:</span><p className="text-white font-medium">{product.lighting_style}</p></div>)}
                  {product.body_material && (<div><span className="text-gray-400 text-sm">Body Material:</span><p className="text-white font-medium">{product.body_material}</p></div>)}
                </div>
              </div>
            )}

            {/* Mouse Specifications */}
            {(product.dpi || product.return_rate || product.engine_solution || product.surface_technology) && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-[#c70007] mb-3 flex items-center">
                  <span className="w-2 h-2 bg-[#c70007] rounded-full mr-2"></span>
                  Mouse Specifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 backdrop-blur-xl rounded-lg p-4 border border-white/10" style={{backgroundColor: '#1c1816'}}>
                  {product.dpi && (<div><span className="text-gray-400 text-sm">DPI:</span><p className="text-white font-medium">{product.dpi}</p></div>)}
                  {product.return_rate && (<div><span className="text-gray-400 text-sm">Return Rate:</span><p className="text-white font-medium">{product.return_rate}</p></div>)}
                  {product.engine_solution && (<div><span className="text-gray-400 text-sm">Engine Solution:</span><p className="text-white font-medium">{product.engine_solution}</p></div>)}
                  {product.surface_technology && (<div><span className="text-gray-400 text-sm">Surface Technology:</span><p className="text-white font-medium">{product.surface_technology}</p></div>)}
                </div>
              </div>
            )}

            {/* Packaging & Customization */}
            {(product.package || product.packing || product.moq_customization || product.customization_options) && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-[#c70007] mb-3 flex items-center">
                  <span className="w-2 h-2 bg-[#c70007] rounded-full mr-2"></span>
                  Packaging & Customization
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 backdrop-blur-xl rounded-lg p-4 border border-white/10" style={{backgroundColor: '#1c1816'}}>
                  {product.package && (
                    <div>
                      <span className="text-gray-400 text-sm">Package:</span>
                      <p className="text-white font-medium">{product.package}</p>
                    </div>
                  )}
                  {product.packing && (
                    <div>
                      <span className="text-gray-400 text-sm">Packing:</span>
                      <p className="text-white font-medium">{product.packing}</p>
                    </div>
                  )}
                  {product.moq_customization && (
                    <div>
                      <span className="text-gray-400 text-sm">MOQ Customization:</span>
                      <p className="text-white font-medium">{product.moq_customization}</p>
                    </div>
                  )}
                  {product.customization_options && (
                    <div>
                      <span className="text-gray-400 text-sm">Customization Options:</span>
                      <p className="text-white font-medium">{product.customization_options}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "reviews":
        return (
          <div id="reviews-section">
            {/* Add Review Form (only if logged in and hasn't reviewed) */}
            {isLoggedIn && !userHasReviewed && (
              <div className="mb-8 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Write a review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Rating</label>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="p-1"
                          aria-label={`Rate ${star} star${star>1?"s":""}`}
                        >
                          <Star
                            className={`w-6 h-6 ${star <= (hoveredRating || reviewForm.rating) ? "text-yellow-400 fill-current" : "text-gray-500"}`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-gray-300 text-sm">{reviewForm.rating}/5</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Your Name</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg text-white p-2"
                      placeholder="Your name"
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm text-gray-400 mb-2">Comment</label>
                  <textarea
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg text-white p-3"
                    rows={4}
                    placeholder="Share your experience..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    disabled={submittingReview || !reviewForm.comment.trim()}
                    onClick={async () => {
                      try {
                        setSubmittingReview(true);
                        const profile = await API.auth.getProfile();
                        // determine reviewer name: use form value if provided, otherwise profile
                        const defaultName = profile?.user?.name
                          || [profile?.user?.firstName, profile?.user?.lastName].filter(Boolean).join(" ")
                          || profile?.name
                          || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ")
                          || profile?.email?.split("@")[0]
                          || "User";
                        const reviewerName = reviewForm.name.trim() || defaultName;

                        // send the actual numeric product id (not the slug) so backend can look it up
                        const numericProductId = product?.product_product_id || product?.id;
                        const created = await reviewAPI.createReview({
                          productId: numericProductId,
                          rating: Number(reviewForm.rating),
                          comment: reviewForm.comment,
                          reviewer_name: reviewerName,
                          userId: profile?.user?.id || profile?.id || null
                        });
                        
                        // Mark user as having reviewed
                        setUserHasReviewed(true);
                        
                        // Optimistically add the created review (if backend returned it)
                        if (created && (created.data || created.review)) {
                          const newReview = created.data || created.review;
                          const updatedReviews = [newReview, ...reviews];
                          setReviews(updatedReviews);
                          
                          // Update stats optimistically
                          const totalRating = updatedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
                          const avgRating = updatedReviews.length > 0 ? totalRating / updatedReviews.length : 0;
                          
                          setReviewStats({
                            averageRating: avgRating,
                            reviewCount: updatedReviews.length
                          });
                        } else {
                          // Fallback: refetch both reviews and stats
                          const numericProductId = product?.product_product_id || product?.id;
                          const newReviews = await reviewAPI.getProductReviews(numericProductId, { cacheBust: Date.now() });
                          const normalizedReviews = Array.isArray(newReviews)
                            ? newReviews
                            : (newReviews?.data || newReviews?.reviews || []);
                          setReviews(normalizedReviews);
                          
                          // Calculate stats from fetched reviews
                          const totalRating = normalizedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
                          const avgRating = normalizedReviews.length > 0 ? totalRating / normalizedReviews.length : 0;
                          
                          setReviewStats({
                            averageRating: avgRating,
                            reviewCount: normalizedReviews.length
                          });
                        }
                        
                        // Try to get updated stats from backend as well
                        try {
                          const numericProductId = product?.product_product_id || product?.id;
                          const stats = await reviewAPI.getProductReviewStats(numericProductId);
                          if (stats && stats.totalReviews > 0) {
                            setReviewStats({
                              averageRating: stats?.averageRating || 0,
                              reviewCount: stats?.totalReviews || 0
                            });
                          }
                        } catch (statsError) {
                          console.warn("Failed to fetch updated stats:", statsError);
                        }
                        
                        setReviewForm({ rating: 5, name: "", comment: "" });
                        setModalInfo({ type: "success", message: "Review submitted successfully! Thank you for your feedback." });
                        setShowModal(true);
                      } catch (err) {
                        setModalInfo({ type: "error", message: err.message || "Failed to submit review" });
                        setShowModal(true);
                      } finally {
                        setSubmittingReview(false);
                      }
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-[#c70007] to-[#c70007] hover:from-[#c70007]/80 hover:to-[#c70007]/80 rounded-lg text-white disabled:opacity-50 transition-all duration-300 shadow-lg"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            )}

            {/* Message for users who have already reviewed */}
            {isLoggedIn && userHasReviewed && (
              <div className="mb-8 bg-gray-800/30 border border-white/20 rounded-lg p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#c70007] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Thank you for your review!</h3>
                    <p className="text-gray-300 text-sm">You have already reviewed this product. Each user can only submit one review per product.</p>
                  </div>
                </div>
              </div>
            )}

            {reviews.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Customer Reviews ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(reviewStats?.averageRating || 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-300 font-medium">
                      {reviewStats?.averageRating > 0 
                        ? `${reviewStats.averageRating.toFixed(1)} out of 5` 
                        : "No ratings yet"
                      }
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={review.id || index} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-400"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-400">{review.rating}/5</span>
                          </div>

                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          <div>by {review.reviewer_name}</div>
                          <div>{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <p className="text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Reviews Yet</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-gray-400" />
                    ))}
                  </div>
                  <span className="text-gray-400 font-medium">0.0 (0 reviews)</span>
                </div>
                <p className="text-gray-400">Be the first to review this product!</p>
                {isLoggedIn && !userHasReviewed && (
                  <button
                    onClick={() => {
                      setReviewForm({ rating: 5, name: "", comment: "" });
                      // Focus on the comment textarea
                      setTimeout(() => {
                        const textarea = document.querySelector('textarea[placeholder="Share your experience..."]');
                        if (textarea) textarea.focus();
                      }, 100);
                    }}
                    className="mt-4 bg-gradient-to-r from-[#c70007] to-[#c70007] hover:from-[#c70007]/80 hover:to-[#c70007]/80 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg"
                  >
                    Write First Review
                  </button>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-black text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-[#c70007] mx-auto mb-6"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border border-[#c70007]/30 mx-auto"></div>
            </div>
            <p className="text-2xl text-gray-300 font-light">Loading Product Details...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the product information</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-black text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="text-center p-8 bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-[#c70007]/50 shadow-2xl">
            <h2 className="text-3xl font-bold text-[#c70007] mb-4">Product Not Found</h2>
            <p className="text-gray-300 mb-6 text-lg">{error || "The product you're looking for doesn't exist."}</p>
            <button
              onClick={() => router.push("/products")}
              className="px-8 py-4 bg-gradient-to-r from-[#c70007] to-[#c70007] hover:from-[#c70007]/80 hover:to-[#c70007]/80 rounded-xl text-white font-medium transition-all duration-300 shadow-lg"
            >
              Browse All Products
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Navbar />

      <div className="flex-1 relative">
        {/* Modern KillSwitch background elements */}
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

          {/* Animated KillSwitch orbs */}
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
        </div>

        <div className="pt-6 pb-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <motion.button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-6 py-3 mb-8 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-[#c70007]/20 hover:border-[#c70007]/50 transition-all duration-300 shadow-lg"
              style={{backgroundColor: '#1c1816'}}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Products
            </motion.button>

            {/* Product Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Product Images - FIXED */}
              <section id="product-images" className="relative">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  {/* Main Image or Video */}
                  <div className="relative mb-6">
                    {/* Media Counter Badge */}
                    {(productImages.length > 1 || product.video_url) && (
                      <div className="absolute top-4 right-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {selectedImageIndex === -1 ? 'Video' : `${selectedImageIndex + 1} / ${productImages.length}`}
                      </div>
                    )}
                    
                    {/* Navigation Feedback */}
                    {navigationFeedback && (
                      <div className="absolute top-4 left-4 z-10 bg-[#c70007]/90 backdrop-blur-xl text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse border border-[#c70007]/50">
                        {navigationFeedback}
                      </div>
                    )}
                    
                    {selectedImageIndex === -1 ? (
                      // Video Display - separate from image container to avoid blocking clicks
                      product.video_url ? (
                        <div
                          className="relative w-full h-96 rounded-2xl overflow-hidden border border-white/10 bg-gray-800/30 backdrop-blur-xl shadow-2xl"
                          style={{backgroundColor: '#1c1816'}}
                        >
                          <div
                            className="relative w-full h-full cursor-pointer group"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setShowFullscreenVideo(true);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <video
                              ref={videoRef}
                              controls
                              autoPlay
                              className="w-full h-full object-contain"
                              style={{backgroundColor: '#0a0a0a'}}
                              controlsList="nodownload"
                            >
                              <source src={product.video_url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                              <div className="flex flex-col items-center gap-2">
                                <ZoomIn className="w-8 h-8 text-white" />
                                <p className="text-sm text-white">Double-click for fullscreen</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-96 rounded-2xl overflow-hidden border border-white/10 bg-gray-800/30 backdrop-blur-xl shadow-2xl flex items-center justify-center text-gray-500" style={{backgroundColor: '#1c1816'}}>
                          <Package className="w-16 h-16" />
                        </div>
                      )
                    ) : (
                      <div
                        className="relative w-full h-96 rounded-2xl overflow-hidden cursor-zoom-in border border-white/10 bg-gray-800/30 backdrop-blur-xl shadow-2xl"
                        style={{backgroundColor: '#1c1816'}}
                        onClick={() => setShowImageModal(true)}
                      >
                        {productImages.length > 0 ? (
                          <img
                            src={productImages[selectedImageIndex]}
                            alt={`${product.product_part_number} - Image ${selectedImageIndex + 1}`}
                            className={`w-full h-full object-contain p-4 transition-transform duration-300 ${
                              isZoomed ? "scale-150" : "hover:scale-110"
                            }`}
                            onError={(e) => {
                              console.error("Image failed to load:", e.target.src);
                              e.target.src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Package className="w-16 h-16" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}

                    {/* Image Navigation - FIXED */}
                    {(productImages.length > 1 || product.video_url) && (
                      <div className="flex justify-between items-center mt-4">
                        <motion.button
                          onClick={goToPreviousImage}
                          className="p-3 rounded-full backdrop-blur-xl border border-white/10 hover:bg-[#c70007]/20 hover:border-[#c70007]/50 active:bg-[#c70007]/30 transition-all duration-300 disabled:opacity-50 shadow-lg"
                          style={{backgroundColor: '#1c1816'}}
                          title="Previous media (← key)"
                          disabled={(productImages.length <= 1) && !product.video_url}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </motion.button>
                        <span className="text-sm text-gray-400">
                          {selectedImageIndex === -1 ? 'Video' : `${selectedImageIndex + 1} / ${productImages.length}`}
                        </span>
                        <motion.button
                          onClick={goToNextImage}
                          className="p-3 rounded-full backdrop-blur-xl border border-white/10 hover:bg-[#c70007]/20 hover:border-[#c70007]/50 active:bg-[#c70007]/30 transition-all duration-300 disabled:opacity-50 shadow-lg"
                          style={{backgroundColor: '#1c1816'}}
                          title="Next media (→ key)"
                          disabled={(productImages.length <= 1) && !product.video_url}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Images & Video - FIXED */}
                  {(productImages.length > 1 || product.video_url) ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-300">
                          Media ({productImages.length + (product.video_url ? 1 : 0)})
                        </h4>
                        <p className="text-xs text-gray-400">
                          Click to view • Use ← → keys to navigate
                        </p>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        
                        {productImages.map((image, index) => (
                          <motion.button
                            key={index}
                            onClick={(e) => handleThumbnailClick(index, e)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              selectedImageIndex === index
                                ? "border-[#c70007] shadow-lg shadow-[#c70007]/25 ring-2 ring-[#c70007]/20"
                                : "border-white/20 hover:border-white/40"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <img
                              src={image}
                              alt={`${product.product_part_number} ${index + 1}`}
                              className="w-full h-full object-contain p-1"
                              style={{backgroundColor: '#1c1816'}}
                              onError={(e) => {
                                e.target.src = "/placeholder.svg";
                              }}
                            />
                            {selectedImageIndex === index && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-[#c70007] rounded-full shadow-lg"></div>
                              </div>
                            )}
                          </motion.button>
                        ))}
                        {product.video_url && (
                          <motion.button
                            onClick={() => {
                              setSelectedImageIndex(-1);
                              setNavigationFeedback('Video');
                              setTimeout(() => setNavigationFeedback(''), 1000);
                            }}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 flex items-center justify-center ${
                              selectedImageIndex === -1
                                ? "border-[#c70007] shadow-lg shadow-[#c70007]/25 ring-2 ring-[#c70007]/20"
                                : "border-white/20 hover:border-white/40"
                            }`}
                            style={{backgroundColor: '#1c1816'}}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="text-center">
                              <div className="text-xl">🎬</div>
                              <p className="text-xs text-gray-300 mt-1">Video</p>
                            </div>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ) : (
                    (productImages.length === 1 && !product.video_url) && (
                      <div className="text-center py-2">
                        <p className="text-xs text-gray-500">
                          📸 Single product image available
                        </p>
                      </div>
                    )
                  )}
                </motion.div>
              </section>

              {/* Product Information */}
              <section id="product-info" className="relative">
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-6"
                >
                  {/* Product Title and Actions */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-white mb-2">
                        {product.product_part_number}
                      </h1>
                      {product.product_price && (
                        <div className="mb-4">
                          {product.sale_price ? (
                            <div className="flex flex-col">
                              <span className="text-xl font-bold text-gray-400 line-through">
                                ${parseFloat(product.product_price).toFixed(2)}
                              </span>
                              <span className="text-2xl font-bold text-green-400">
                                ${parseFloat(product.sale_price).toFixed(2)}
                              </span>
                              <div className="text-sm text-gray-400 mt-1">
                                Save {((1 - product.sale_price / product.product_price) * 100).toFixed(0)}%
                              </div>
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-[#c70007]">
                              ${parseFloat(product.product_price).toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={toggleFavorite}
                        className={`p-3 rounded-full border backdrop-blur-xl transition-all duration-300 shadow-lg ${
                          isFavorite
                            ? "bg-[#c70007] border-[#c70007] text-white"
                            : "border-white/10 text-white hover:bg-[#c70007]/20 hover:border-[#c70007]/50"
                        }`}
                        style={!isFavorite ? {backgroundColor: '#1c1816'} : {}}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                      </motion.button>
                      <motion.button
                        onClick={shareProduct}
                        className="p-3 rounded-full backdrop-blur-xl border border-white/10 text-white hover:bg-[#c70007]/20 hover:border-[#c70007]/50 transition-all duration-300 shadow-lg"
                        style={{backgroundColor: '#1c1816'}}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Share2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Product Tags */}
                  <div className="flex flex-wrap gap-2">
                    {product.product_condition && (
                      <span className="inline-flex items-center px-3 py-1 bg-[#c70007]/10 border border-[#c70007]/20 rounded-md text-sm text-[#c70007] backdrop-blur-xl">
                        <Package className="w-4 h-4 mr-2" />
                        {product.product_condition}
                      </span>
                    )}
                    {product.product_sub_condition && (
                      <span className="inline-flex items-center px-3 py-1 bg-[#c70007]/10 border border-[#c70007]/20 rounded-md text-sm text-[#c70007] backdrop-blur-xl">
                        <Star className="w-4 h-4 mr-2" />
                        {product.product_sub_condition}
                      </span>
                    )}
                    {product.category_category_name && (
                      <span className="inline-flex items-center px-3 py-1 bg-[#c70007]/10 border border-[#c70007]/20 rounded-md text-sm text-[#c70007] backdrop-blur-xl">
                        <Tag className="w-4 h-4 mr-2" />
                        {product.category_category_name}
                      </span>
                    )}
                    {product.brand_brand_name && (
                      <span className="inline-flex items-center px-3 py-1 bg-gray-800/30 border border-white/20 rounded-md text-sm text-gray-300 backdrop-blur-xl">
                        <Tag className="w-4 h-4 mr-2" />
                        {product.brand_brand_name}
                      </span>
                    )}
                  </div>

                  {/* Review Stats - Enhanced Functional Rating */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setSummaryHoveredRating(star)}
                          onMouseLeave={() => setSummaryHoveredRating(0)}
                          onClick={() => {
                            if (isLoggedIn) {
                              setActiveTab("reviews");
                              setReviewForm(prev => ({ ...prev, rating: star }));
                              // Smooth scroll to reviews section
                              setTimeout(() => {
                                const el = document.getElementById("reviews-section");
                                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                              }, 50);
                            } else {
                              setModalInfo({
                                type: "info",
                                message: "Please log in to rate this product. You will be redirected to the login page.",
                              });
                              setShowModal(true);
                              setTimeout(() => {
                                router.push("/login?next=" + encodeURIComponent(window.location.pathname));
                              }, 2000);
                            }
                          }}
                          className="p-0.5 hover:scale-110 transition-transform duration-200"
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''} or view reviews`}
                          title={isLoggedIn ? "Click to rate and write a review" : "Login to rate this product"}
                        >
                          <Star
                            className={`w-5 h-5 transition-colors duration-200 ${
                              star <= (summaryHoveredRating || Math.round(reviewStats?.averageRating || 0))
                                ? "text-yellow-400 fill-current"
                                : "text-gray-400 hover:text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("reviews");
                          setTimeout(() => {
                            const el = document.getElementById("reviews-section");
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 50);
                        }}
                        className="text-gray-300 hover:text-white transition-colors font-medium"
                        title="View all reviews"
                      >
                        {reviewStats?.averageRating > 0 
                          ? `${reviewStats.averageRating.toFixed(1)}` 
                          : "0.0"
                        }
                      </button>
                      <span className="text-gray-400">
                        ({reviewStats?.reviewCount || 0} {reviewStats?.reviewCount === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Quantity</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
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
                        {product.product_price && (
                          <span className="text-gray-400">
                            Total: <span className="text-white font-medium">
                              ${((parseFloat(product.product_price)) * quantity).toFixed(2)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <motion.button
                        onClick={addToCart}
                        className="flex-1 py-4 bg-gradient-to-r from-[#c70007] to-[#c70007] hover:from-[#c70007]/80 hover:to-[#c70007]/80 border border-[#c70007]/30 rounded-xl text-white transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group shadow-[0_8px_20px_rgba(199,0,7,0.25)] backdrop-blur-xl"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-10">Add to Cart</span>
                        <ShoppingCart className="w-5 h-5 relative z-10" />
                        <motion.div className="absolute inset-0 bg-white/10 w-0 group-hover:w-full transition-all duration-300" />
                      </motion.button>
                      <motion.button
                        onClick={buyNow}
                        className="flex-1 py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-[#c70007]/20 hover:to-[#c70007]/20 border border-white/20 hover:border-[#c70007]/50 rounded-xl text-white transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group shadow-lg backdrop-blur-xl"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-10">Buy Now</span>
                        <CheckCircle className="w-5 h-5 relative z-10" />
                        <motion.div className="absolute inset-0 bg-white/10 w-0 group-hover:w-full transition-all duration-300" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </section>
            </div>


            {/* Tabs Section */}
            <div className="mt-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-700 mb-8">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === "details"
                        ? "text-[#c70007] border-b-2 border-[#c70007]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Info className="w-4 h-4" />
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("additional")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === "additional"
                        ? "text-[#c70007] border-b-2 border-[#c70007]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Additional Information
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === "reviews"
                        ? "text-[#c70007] border-b-2 border-[#c70007]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Reviews ({reviews.length})
                  </button>
                </div>

                {/* Tab Content */}
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="min-h-[400px]"
                >
                  {renderTabContent()}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="py-16 relative">
          {/* KillSwitch themed background */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(199,0,7,0.06),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(199,0,7,0.04),transparent_50%)]" />
          </div>
          
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center mb-12"> 
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h2 className="text-4xl font-bold text-white mb-4">
                    <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Related Products
                    </span>
                  </h2>
                  <div className="flex justify-center items-center gap-3 mb-4">
                    <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c70007] rounded-full" />
                    <div className="w-2 h-2 bg-[#c70007] rounded-full" />
                    <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c70007] rounded-full" />
                  </div>
                  <p className="text-gray-400 text-lg">You might also be interested in these products</p>
                </motion.div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct, index) => (
                  <motion.div
                    key={relatedProduct.product_product_id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="backdrop-blur-xl rounded-2xl border border-white/10 hover:border-[#c70007]/50 transition-all duration-300 group overflow-hidden shadow-2xl hover:shadow-[0_20px_40px_rgba(199,0,7,0.15)]"
                    style={{backgroundColor: '#1c1816'}}
                  >
                    <div className="relative">
                      <img
                        src={relatedProduct.product_image || "/placeholder.svg"}
                        alt={relatedProduct.product_part_number}
                        className="w-full h-48 object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "/placeholder.svg";
                        }}
                      />
                      <div className="absolute top-3 right-3">
                        <span className="bg-[#c70007] text-white text-xs px-2 py-1 rounded-full backdrop-blur-xl">
                          {relatedProduct.brand_brand_name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-[#c70007] transition-colors">
                        {relatedProduct.product_part_number}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {relatedProduct.product_short_description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          {relatedProduct.sale_price ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-400 line-through">
                                ${parseFloat(relatedProduct.product_price).toFixed(2)}
                              </span>
                              <span className="text-[#c70007] font-bold text-lg">
                                ${parseFloat(relatedProduct.sale_price).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#c70007] font-bold text-lg">
                              ${parseFloat(relatedProduct.product_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const identifier = relatedProduct.slug || relatedProduct.product_product_id;
                            router.push(`/${identifier}`);
                          }}
                          className="bg-gradient-to-r from-[#c70007] to-[#c70007] hover:from-[#c70007]/80 hover:to-[#c70007]/80 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {relatedProducts.length >= 8 && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => router.push('/products')}
                    className="bg-gradient-to-r from-[#c70007] to-[#c70007] hover:from-[#c70007]/80 hover:to-[#c70007]/80 text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-lg backdrop-blur-xl border border-[#c70007]/30"
                  >
                    View All Products
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      <Footer />

      {/* Image Modal - FIXED */}
      <AnimatePresence>
        {showImageModal && productImages.length > 0 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh] overflow-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                onClick={() => setShowImageModal(false)}
              >
                <X className="w-6 h-6" />
              </button>
              
              {/* Navigation in modal */}
              {productImages.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                    onClick={goToPreviousImage}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                    onClick={goToNextImage}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
                    {selectedImageIndex + 1} / {productImages.length}
                  </div>
                </>
              )}
              
              <img
                src={productImages[selectedImageIndex] || "/placeholder.svg"}
                alt={`${product.product_part_number} - Image ${selectedImageIndex + 1}`}
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  e.target.src = "/placeholder.svg";
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {showFullscreenVideo && product?.video_url && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullscreenVideo(false)}
          >
            <motion.div
              className="relative w-full max-w-6xl aspect-video"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute -top-10 right-0 p-2 rounded-full hover:bg-white/20 text-white transition-colors z-10"
                onClick={() => setShowFullscreenVideo(false)}
                title="Close fullscreen"
              >
                <X className="w-8 h-8" />
              </button>
              
              <video
                controls
                autoPlay
                className="w-full h-full rounded-lg"
                style={{backgroundColor: '#0a0a0a'}}
                controlsList="nodownload"
              >
                <source src={product.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type={modalInfo.type}
        message={modalInfo.message}
      />
    </div>
  );
}