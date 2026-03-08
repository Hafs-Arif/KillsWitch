"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { useScrollAnimation, useParallaxScroll } from "../../hooks/useScrollAnimation"

export default function VideoSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [videoErrors, setVideoErrors] = useState({})
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [intervalTime] = useState(5000)
  const videoRefs = useRef([])
  const intervalRef = useRef(null)
  
  // Scroll animation hooks
  const [sectionRef, isInView] = useScrollAnimation({ once: true, margin: "-150px" })
  const [parallaxRef, parallaxOffset] = useParallaxScroll(0.2)

  const videos = [
    {
      id: 1,
      src: "/products/video2.mp4",
      title: "Premium Gaming Setup Collection",
      description: "High-performance components for ultimate gaming experience",
    },
    {
      id: 2,
      src: "/home/video.mp4",
      title: "Elite Gaming Workstation",
      description: "Professional-grade setup with RGB lighting and premium peripherals",
    },
  ]

  const goToNext = useCallback(() => {
    setActiveIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % videos.length
      if (videoRefs.current[nextIndex]) {
        videoRefs.current[nextIndex].load()
      }
      return nextIndex
    })
  }, [videos.length])

  const goToPrev = () => {
    setActiveIndex((prevIndex) => {
      const prevIdx = (prevIndex - 1 + videos.length) % videos.length
      if (videoRefs.current[prevIdx]) {
        videoRefs.current[prevIdx].load()
      }
      return prevIdx
    })
  }

  const handleChange = (index) => {
    setActiveIndex(index)
    setAutoPlay(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setTimeout(() => {
      setAutoPlay(true)
    }, 10000)
  }

  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[activeIndex]
    if (currentVideo) {
      if (isPaused) {
        currentVideo.play()
        setIsPaused(false)
      } else {
        currentVideo.pause()
        setIsPaused(true)
      }
    }
  }

  const toggleMute = () => {
    const currentVideo = videoRefs.current[activeIndex]
    if (currentVideo) {
      currentVideo.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVideoClick = () => {
    if (isMuted) {
      toggleMute()
    }
    togglePlayPause()
  }

  const handleVideoLoad = (index) => {
    setVideoErrors((prev) => ({ ...prev, [index]: false }))
    if (index === 0) setIsLoading(false)
  }

  const handleVideoError = (index) => {
    setVideoErrors((prev) => ({ ...prev, [index]: true }))
    if (index === 0) setIsLoading(false)
  }

  const handleVideoEnded = () => {
    if (autoPlay) {
      goToNext()
    }
  }

  useEffect(() => {
    if (autoPlay && !isPaused) {
      intervalRef.current = setInterval(goToNext, intervalTime)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoPlay, isPaused, goToNext, intervalTime])

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && index !== activeIndex) {
        video.load()
      }
    })
  }, [activeIndex])

  useEffect(() => {
    const handleKeyPress = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;
      if (isEditable) return; // let focused inputs handle typing (including space)

      if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === " ") {
        e.preventDefault();
        handleVideoClick();
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToNext, isMuted]);

  // Advanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const videoVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.9,
      rotateX: -10
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
        duration: 0.8
      }
    }
  }

  return (
    <div 
      ref={sectionRef}
      className="relative flex items-center justify-center min-h-[60vh] xs:min-h-[70vh] sm:min-h-[80vh] md:min-h-[92vh] p-2 xs:p-4 sm:p-6 md:p-8 w-full" 
      style={{ backgroundColor: "#000000" }}
    >
      {/* Enhanced Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#c70007]/30 to-transparent"></div>
        <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-[#c70007]/30 to-transparent"></div>
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-[#c70007]/30 to-transparent"></div>
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c70007]/30 to-transparent"></div>
        <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c70007]/30 to-transparent"></div>
        
        {/* Parallax background elements */}
        <motion.div
          ref={parallaxRef}
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        >
          <div className="absolute top-1/4 right-1/6 w-32 h-32 xs:w-48 xs:h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-[#c70007]/6 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/6 w-24 h-24 xs:w-40 xs:h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 bg-[#c70007]/4 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        </motion.div>
      </div>

      <button
        onClick={goToPrev}
        className="absolute left-1 xs:left-2 sm:left-3 md:left-4 z-20 bg-[#1c1816]/80 hover:bg-[#c70007]/80 text-white p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 border border-[#c70007]/50 hover:border-[#a50005]"
        aria-label="Previous video"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c70007"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <motion.div 
        className="relative w-full max-w-6xl flex flex-col items-center"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.div
          className="relative w-full md:w-[1200px] h-96 md:h-[500px] mb-5 rounded-xl overflow-hidden border border-[#1c1816]/50 hover:border-[#c70007]/50 transition-all duration-300"
          style={{ backgroundColor: "#1c1816" }}
          variants={videoVariants}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.3 }
          }}
        >
          {videos.map((video, index) => (
            <div
              key={video.id}
              className={`absolute w-full md:w-4/5 h-full left-0 right-0 mx-auto transition-all duration-500 ease-in-out ${
                index === activeIndex ? "opacity-100 z-10 transform scale-100" : "opacity-0 z-0 transform scale-95"
              }`}
            >
              {videoErrors[index] ? (
                <div className="w-full h-full flex flex-col items-center justify-center rounded-xl border border-[#c70007]/50" style={{ backgroundColor: "#1c1816" }}>
                  <div className="text-gray-300 mb-4">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <p className="text-gray-300 text-center">Video unavailable</p>
                  <p className="text-gray-400 text-sm text-center mt-2">{video.title}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={video.src}
                    className="w-full h-full object-cover rounded-xl cursor-pointer"
                    autoPlay={index === activeIndex && autoPlay && !isPaused}
                    loop={false}
                    muted={index === activeIndex ? isMuted : true}
                    playsInline
                    onLoadedData={() => handleVideoLoad(index)}
                    onError={() => handleVideoError(index)}
                    onEnded={handleVideoEnded}
                    onClick={handleVideoClick}
                    preload={index === activeIndex ? "auto" : "metadata"}
                  />

                  {/* Play/Pause Overlay */}
                  {isPaused && index === activeIndex && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1c1816]/20 rounded-xl">
                      <button
                        onClick={handleVideoClick}
                        className="bg-[#1c1816]/80 hover:bg-[#c70007]/80 text-[#c70007] p-4 rounded-full transition-all duration-300 transform hover:scale-110"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Video Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1c1816]/80 via-[#1c1816]/40 to-transparent text-white p-4 md:p-6 rounded-b-xl">
                    <h3 className="text-xl md:text-2xl font-bold mb-2 leading-tight bg-gradient-to-r from-[#c70007] to-[#a50005] bg-clip-text text-transparent">
                      {video.title}
                    </h3>
                    <p className="text-gray-300 text-sm md:text-base opacity-90 hover:text-gray-200 transition-colors duration-300">
                      {video.description}
                    </p>
                    {/* Mute/Unmute Button */}
                    {index === activeIndex && (
                      <button
                        onClick={toggleMute}
                        className="absolute top-2 right-2 p-2 rounded-full bg-[#1c1816]/80 hover:bg-[#c70007]/80 text-[#c70007] transition-all duration-300"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          {isMuted ? (
                            <path d="M16.5 12c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5zm-4.5 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm7.59-2.04c.4.36.64.86.64 1.4s-.24 1.04-0.64 1.4l1.96 1.96c.77-.77 1.23-1.9 1.23-3.36s-.46-2.59-1.23-3.36l-3.31-3.31c-.6-.6-1.44-1.05-2.38-1.05s-1.78.45-2.38 1.05l-1.96-1.96c1.08-1.08 2.58-1.77 4.23-1.77 1.95 0 3.73.78 5.06 2.05zM3 3v18h18V3H3zm18 16H3V5h16V3H3c-1.1 0-2 .9-2 .9v16c0 1.1.9 2 2 2h16c1.1 0 0 0 0-1.1V19z" />
                          ) : (
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5zm-2.5-2c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm6.5 7.59c.4.36.64.86.64 1.4s-.24 1.04-.64 1.4l1.96 1.96c.77-.77 1.23-1.9 1.23-3.36s-.46-2.59-1.23-3.36l-3.31-3.31c-.6-.6-1.44-1.05-2.38-1.05s-1.78.45-2.38 1.05l-1.96-1.96c1.08-1.08 2.58-1.77 4.23-1.77 1.95 0 3.73.78 5.06 2.05z" />
                          )}
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </motion.div>

        {/* Auto-play and Mute Status Indicators */}
        <motion.div 
          className="flex items-center gap-3 mb-4"
          variants={videoVariants}
        >
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="text-gray-300 hover:text-gray-200 transition-colors text-sm flex items-center gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${autoPlay ? "bg-[#c70007]" : "bg-gray-500"}`}></div>
            Auto-play {autoPlay ? "ON" : "OFF"}
          </button>

          <button
            onClick={toggleMute}
            className="text-gray-300 hover:text-gray-200 transition-colors text-sm flex items-center gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${isMuted ? "bg-gray-500" : "bg-[#c70007]"}`}></div>
            {isMuted ? "Muted" : "Sound ON"}
          </button>

          <span className="text-gray-300 text-sm">
            {activeIndex + 1} of {videos.length}
          </span>
        </motion.div>
      </motion.div>

      {/* Right Navigation Button */}
      <button
        onClick={goToNext}
        className="absolute right-2 md:right-4 z-20 bg-[#1c1816]/80 hover:bg-[#c70007]/80 text-white p-2 md:p-3 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 border border-[#c70007]/50 hover:border-[#a50005]"
        aria-label="Next video"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c70007"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Progress Indicators */}
      <motion.div 
        className="absolute bottom-2 sm:bottom-4 flex gap-2 sm:gap-3 z-20"
        variants={videoVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ delay: 0.5 }}
      >
        {videos.map((video, index) => (
          <button
            key={index}
            onClick={() => handleChange(index)}
            className={`group relative transition-all duration-300 ${
              index === activeIndex
                ? "w-6 sm:w-8 h-2 sm:h-3 bg-[#c70007] rounded-full"
                : "w-2 sm:w-3 h-2 sm:h-3 bg-[#c70007]/50 hover:bg-[#c70007]/70 rounded-full hover:scale-110"
            }`}
            aria-label={`Go to video ${index + 1}: ${video.title}`}
            title={video.title}
          >
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1c1816]/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:block">
              {video.title}
            </div>
          </button>
        ))}
      </motion.div>

      {/* Keyboard Controls Hint */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 text-gray-300 text-xs hidden lg:block">
        <p></p>
      </div>
    </div>
  )
}