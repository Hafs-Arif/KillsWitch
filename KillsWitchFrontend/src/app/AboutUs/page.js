"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  FiArrowRight,
  FiCode,
  FiGlobe,
  FiShield,
  FiAward,
  FiClock,
  FiEye,
  FiZap,
  FiChevronDown,
  FiUsers,
  FiTarget,
  FiTrendingUp,
  FiStar,
  FiPlay,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiMessageCircle
} from "react-icons/fi"
import Navbar from "../component/HomeComponents/Navbar"
import Footer from "../component/HomeComponents/Footer"
import Counter from '../component/HomeComponents/Counter'
import { API } from "../api/api"

const AboutUs = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [expandedValue, setExpandedValue] = useState(null)
  const [visibleSections, setVisibleSections] = useState({})
  const [reviews, setReviews] = useState([])
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [reviewsError, setReviewsError] = useState(null)

  // Fetch reviews - Works for both guest and logged-in users
  useEffect(() => {
    let isMounted = true;
    
    const fetchReviews = async () => {
      try {
        setIsLoadingReviews(true)
        setReviewsError(null)
        
        const response = await API.reviews.getFeaturedReviews(12)
        
        if (!isMounted) return; // Prevent state update if component unmounted
        
        if (response && response.success && Array.isArray(response.data)) {
          setReviews(response.data)
        } else {
          console.warn('Invalid reviews response:', response)
          setReviews([])
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading reviews:', error)
        setReviewsError(error.message || 'Failed to load reviews')
        setReviews([])
      } finally {
        if (isMounted) {
          setIsLoadingReviews(false)
        }
      }
    }
    
    fetchReviews()
    
    return () => {
      isMounted = false; // Cleanup flag
    }
  }, [])

  // Auto-play reviews slider
  useEffect(() => {
    if (!isAutoPlaying || reviews.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [isAutoPlaying, reviews.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({
              ...prev,
              [entry.target.id]: true
            }))
          }
        })
      },
      { threshold: 0.3 }
    )

    document.querySelectorAll('[id]').forEach((section) => {
      observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  

  const storyTabs = [
    {
      id: "who-we-are",
      title: "About Us",
      icon: <FiClock className="w-5 h-5 text-white" />,
      content: {
        heading: "Gamers. Engineers. Innovators.",
        description: "We are gamers, engineers and tech enthusiasts, who know what it takes to go to the limit to win. And during long gaming nights, in tournaments, we have realized every second matters, and so does your equipment. This is why we are presently geared towards producing items that never make you late.",
        highlights: [
        "Built by gamers, for gamers",
        "Performance-focused designs",
        "Reliability when it matters most",
      ],
        image: "/about/about4.jpeg"
      }
    },
    {
      id: "mission",
      title: "Our Mission",
      icon: <FiTarget className="w-5 h-5 text-white" />,
      content: {
        heading: "Gaming Without Limits",
        description:  "Our mission is to create high-performance hardware and intelligent accessories which provide gamers with the speed, comfort and control they require to play their best.Gaming to us is not merely a game but it is passion, ability, and bonding. This is why all our products are designed in such a way that they eliminate boundaries, improve the gameplay, and bring the players closer to victory.",
        highlights: ["High-performance hardware",
        "Designed for comfort and control",
        "Eliminating limits to gameplay"],
        image: "/about/about5.jpeg"
      }
    },
    {
      id: "vision",
      title: "Our Vision",
      icon: <FiEye className="w-5 h-5 text-white" />,
      content: {
        heading: "A Future of Limitless Gaming",
        description:  "It is our vision to establish a future in which gaming will feel limitless. Our mission is to create products that make all players faster, more comfortable and have complete command over their games. Gaming is not merely winning to us but about passion, learning and the connections that we form in the process. That is why we want to make gamers closer to each other, eliminate the factors which stop them and provide them with the opportunities to achieve their potential. In such a future, all challenges can be opportunities, all games can be experiences, and all victories can be steps to something new.",
        highlights: [
        "Closer player connections",
        "Breaking boundaries in gaming",
        "Transforming every challenge into opportunity",
      ],
        image: "/about/about6.jpeg"
      }
    }
  ]

  const coreValues = [
    {
      title:  "Pro-Grade Performance",
      description:   "Our gaming hardware and accessories are created to provide lag free, powerful and smooth performance. Servers, accessories, everything is designed to take extreme gaming sessions without reducing its speed.",
      icon: <FiZap className="w-6 h-6 text-white" />
    },
    {
      title:  "Latest Technology",
      description: "Our products are designed using the latest technology in the gaming industry. It translates to higher speeds, enhanced stability and capabilities that will keep you on the forefront of the competition whether that is in an informal or professional game.",
      icon: <FiShield className="w-6 h-6 text-white" />
    },
    {
      title: "Gamer-Focused Design",
      description: "Every product we create is built with gamers in mind. From cooling coils and ARGB fans to keyboards and mice, each detail is designed to give you the perfect mix of comfort, speed, and durability. Our goal is simple, to deliver hardware that feels good, performs flawlessly, and keeps you focused on the game.",
      icon: <FiTarget className="w-6 h-6 text-white" />
    },
    {
      title: "Trusted Support",
      description:  "We do not simply end at the hardware provision. We have professional staff who will assist you anytime you require assistance, to ensure that your set up remains robust and that you have the best gaming experience at all times.",
      icon: <FiUsers className="w-6 h-6 text-white" />
    }
  ]


  return (
    <>
      <div className="text-white min-h-screen overflow-hidden" style={{ backgroundColor: '#000000' }}>
        <Navbar/>
        {/* Hero Section */}
        <section id="hero" className="relative h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#c70007]/10 via-transparent to-[#c70007]/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(199,0,7,0.15),transparent_50%)]" />
          </div>

          {/* Animated Background Particles - Fixed positions to avoid hydration mismatch */}
          <div className="absolute inset-0">
            {[
              { left: 10, top: 20 },
              { left: 25, top: 80 },
              { left: 40, top: 15 },
              { left: 55, top: 70 },
              { left: 70, top: 30 },
              { left: 85, top: 60 },
              { left: 15, top: 50 },
              { left: 90, top: 25 },
              { left: 5, top: 75 },
              { left: 60, top: 90 },
              { left: 35, top: 40 },
              { left: 75, top: 10 },
              { left: 20, top: 65 },
              { left: 50, top: 35 },
              { left: 80, top: 85 },
              { left: 12, top: 45 },
              { left: 65, top: 55 },
              { left: 45, top: 25 },
              { left: 30, top: 95 },
              { left: 95, top: 50 }
            ].map((pos, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-[#c70007]/30 rounded-full"
                style={{
                  left: `${pos.left}%`,
                  top: `${pos.top}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections.hero ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-8"
            >
              <div className="inline-flex items-center space-x-2 bg-[#c70007]/10 border border-[#c70007]/30 rounded-full px-4 py-2">
                <FiStar className="w-4 h-4 text-[#c70007]" />
                <span className="text-[#c70007] font-medium">About killswitch</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">Gaming</span>
                <span className="bg-gradient-to-r from-[#c70007] to-[#a50005] bg-clip-text text-transparent"> Without Limits</span>
              </h1>

              <p className="text-xl lg:text-2xl text-gray-300  mx-auto leading-relaxed">
              At Killswitch, gaming is not just a mere form of entertainment, but rather, it is passion, community, and competition. Our gaming hardware and accessories are based on high performance to offer the speed, precision, and reliability that the players require to do their best.
              </p>

              <motion.button
                className="group bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 flex items-center space-x-2 mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/products')}
              >
                <span>View Our Products</span>
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiChevronDown className="w-8 h-8 text-gray-400" />
          </motion.div>
        </section>

        {/* Stats Section */}
        <Counter />

        {/* Story Tabs Section */}
        <section id="story" className="relative py-20" style={{ backgroundColor: '#000000' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections.story ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-white">Who </span>
              <span className="text-[#c70007]">We Are</span>
              </h2>

              <div className="h-1 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto rounded-full mb-6" />
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our identity is built on delivering quality products with purpose and precision.
              </p>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div
              className="flex justify-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections.story ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="bg-[#1c1816]/50 border border-[#1c1816]/50 rounded-full p-2 backdrop-blur-sm">
                <div className="flex space-x-2">
                  {storyTabs.map((tab, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTab(index)}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                        activeTab === index
                          ? 'bg-gradient-to-r from-[#c70007] to-[#a50005] text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-[#1c1816]/80'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="grid lg:grid-cols-2 gap-12 items-center"
              >
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-white">
                    {storyTabs[activeTab].content.heading}
                  </h3>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    {storyTabs[activeTab].content.description}
                  </p>
                  <ul className="space-y-3">
                    {storyTabs[activeTab].content.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <FiCheck className="w-5 h-5 text-[#c70007] flex-shrink-0" />
                        <span className="text-gray-300">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="relative">
                  <div className="aspect-w-16 aspect-h-12 rounded-xl overflow-hidden">
                    <img
                      src={storyTabs[activeTab].content.image}
                      alt={storyTabs[activeTab].title}
                      className="w-full h-80 object-cover rounded-xl border border-gray-700"
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Core Values Section */}
        <section id="values" className="relative py-20" style={{ backgroundColor: '#000000' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections.values ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-white">Why </span>
              <span className="text-[#c70007]">Choose Us?</span>
              </h2>

              <div className="h-1 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto rounded-full mb-6" />
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Find out what makes us unique in our gaming hardware and accessories.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {coreValues.map((value, index) => (
                <motion.div
                  key={index}
                  className="border border-[#1c1816]/50 hover:border-[#c70007]/50 rounded-xl overflow-hidden transition-all duration-300"
                  initial={{ opacity: 0, y: 30 }}
                  animate={visibleSections.values ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                  style={{ backgroundColor: '#1c1816' }}
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedValue(expandedValue === index ? null : index)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-[#c70007] to-[#a50005] p-2 rounded-lg text-white">
                          {value.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white">{value.title}</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedValue === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FiChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {expandedValue === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="text-gray-300 leading-relaxed">{value.description}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section id="reviews" className="relative py-20" style={{ backgroundColor: '#000000' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections.reviews ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="text-white">What Our </span>
                <span className="text-[#c70007]">Customers Say</span>
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto rounded-full mb-6" />
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Real feedback from gamers who trust KillSwitch for their hardware needs
              </p>
            </motion.div>

            {isLoadingReviews ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c70007] mb-4"></div>
                <p className="text-gray-400">Loading reviews...</p>
              </div>
            ) : reviewsError ? (
              <div className="text-center py-12">
                <p className="text-red-400 mb-2">Error loading reviews</p>
                <p className="text-gray-500 text-sm">{reviewsError}</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="relative">
                {/* Reviews Slider */}
                <div className="relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentReviewIndex}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {reviews.slice(currentReviewIndex, currentReviewIndex + 3).map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-[#1c1816] border border-[#c70007]/20 rounded-xl p-6 hover:border-[#c70007]/50 transition-all duration-300 relative"
                          onMouseEnter={() => setIsAutoPlaying(false)}
                          onMouseLeave={() => setIsAutoPlaying(true)}
                        >
                          {/* Quote Icon */}
                          <div className="absolute top-4 right-4 text-[#c70007]/20">
                            <FiMessageCircle className="w-8 h-8" />
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating
                                    ? 'fill-[#c70007] text-[#c70007]'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-400">
                              {review.rating}.0
                            </span>
                          </div>


                          {/* Review Comment */}
                          <p className="text-gray-300 mb-4 line-clamp-4">
                            {review.comment || 'Great product! Highly recommended.'}
                          </p>

                          {/* Reviewer Info */}
                          <div className="pt-4 border-t border-gray-700">
                            <div className="flex items-start gap-3">
                              {/* User Icon */}
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#c70007] to-[#a50005] rounded-full flex items-center justify-center">
                                <FiUsers className="w-5 h-5 text-white" />
                              </div>
                              
                              {/* User Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">
                                  {review.reviewer_name || review.user?.name || 'Anonymous User'}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                                {review.product && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Reviewed: <span className="text-[#c70007] font-medium">{review.product.part_number}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <motion.button
                    onClick={() => {
                      setCurrentReviewIndex((prev) => 
                        prev === 0 ? Math.max(0, reviews.length - 3) : prev - 1
                      )
                      setIsAutoPlaying(false)
                    }}
                    className="p-3 bg-[#1c1816] border border-[#c70007]/30 rounded-full text-white hover:bg-[#c70007] hover:border-[#c70007] transition-all duration-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={currentReviewIndex === 0}
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </motion.button>

                  {/* Pagination Dots */}
                  <div className="flex gap-2">
                    {Array.from({ length: Math.ceil(reviews.length / 3) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentReviewIndex(index * 3)
                          setIsAutoPlaying(false)
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          Math.floor(currentReviewIndex / 3) === index
                            ? 'bg-[#c70007] w-8'
                            : 'bg-gray-600 w-2 hover:bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>

                  <motion.button
                    onClick={() => {
                      setCurrentReviewIndex((prev) => 
                        prev >= reviews.length - 3 ? 0 : prev + 1
                      )
                      setIsAutoPlaying(false)
                    }}
                    className="p-3 bg-[#1c1816] border border-[#c70007]/30 rounded-full text-white hover:bg-[#c70007] hover:border-[#c70007] transition-all duration-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={currentReviewIndex >= reviews.length - 3}
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Auto-play indicator */}
                <div className="text-center mt-4">
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="text-sm text-gray-400 hover:text-[#c70007] transition-colors"
                  >
                    {isAutoPlaying ? '⏸ Pause' : '▶ Play'} Auto-scroll
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No reviews available yet.</p>
                <p className="text-gray-500 text-sm mt-2">Be the first to leave a review!</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="relative py-20" style={{ backgroundColor: '#000000' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="bg-[#c70007]/10 border border-[#c70007]/30 rounded-2xl p-12 text-center backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections.cta ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Take Your Gaming to 
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#c70007] to-[#a50005] bg-clip-text text-transparent">
               the Next Level
                </span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Get premium hardware and accessories built for speed, stability, and smooth play
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.button
                  className="bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/ITSectorPage')}
                >
                  <span>See the Specs</span>
                  <FiArrowRight className="w-5 h-5" />
                </motion.button>

                <motion.button
                  className="border border-[#c70007] text-[#c70007] hover:bg-[#c70007] hover:text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/products')}
                >
                  <FiPlay className="w-5 h-5" />
                  <span>Explore Hardware</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}

export default AboutUs