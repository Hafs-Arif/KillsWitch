import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useScrollAnimation, useParallaxScroll } from '../../hooks/useScrollAnimation';

// Add responsive styles for very small screens
const responsiveStyles = `
  @media (max-width: 474px) {
    .hero-welcome-text {
      font-size: 0.75rem !important;
      margin-top: 0.5rem !important;
      margin-bottom: 0.5rem !important;
    }
    .hero-main-title {
      font-size: 1rem !important;
      margin-top: 0.25rem !important;
      margin-bottom: 0.75rem !important;
      line-height: 1.2 !important;
    }
    .hero-description {
      font-size: 0.625rem !important;
      margin-top: 0.5rem !important;
      margin-bottom: 1rem !important;
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }
    .hero-button {
      font-size: 0.625rem !important;
      padding: 0.375rem 1rem !important;
    }
    .hero-button-icon {
      width: 1rem !important;
      height: 1rem !important;
    }
    .hero-button-icon img {
      width: 0.625rem !important;
      height: 0.625rem !important;
    }
  }
  
  @media (max-width: 374px) {
    .hero-main-title {
      font-size: 0.875rem !important;
    }
    .hero-description {
      font-size: 0.5rem !important;
    }
  }
`;

const HeroSection = () => {
  const router = useRouter();
  const [contentVisible, setContentVisible] = useState(false);
  
  // Scroll animation hooks
  const [sectionRef, isInView] = useScrollAnimation({ once: true, margin: "-200px" });
  const [parallaxRef, parallaxOffset] = useParallaxScroll(0.3);

  const handleShopNow = () => {
    router.push('/products');
  };

  // Background animation variants: start zoomed in (scale 1.5), zoom out to normal (scale 1) with ease
  const backgroundVariants = {
    initial: { scale: 1.5 },
    animate: { scale: 1, transition: { duration: 2, ease: 'easeOut' } },
  };

  // Enhanced content container variants with scroll-triggered animations
  const contentVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: 'easeOut',
        when: 'beforeChildren', // Animate children after container
        staggerChildren: 0.3, // Stagger child elements for sequential entry
      },
    },
  };

  // Variants for welcome text: subtle fade from slight above
  const welcomeVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut', type: 'spring', bounce: 0.3 } },
  };

  // Variants for upper title part: slide in from above
  const upperTitleVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut', type: 'spring', bounce: 0.3 } },
  };

  // Variants for lower title part: slide in from below
  const lowerTitleVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut', type: 'spring', bounce: 0.3 } },
  };

  // Variants for description: fade in from below
  const descriptionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  // Enhanced button variants with scroll-triggered animations
  const buttonVariants = {
    initial: { scale: 1, opacity: 0.8 },
    hover: { 
      scale: 1.05, 
      opacity: 1,
      boxShadow: "0 10px 30px rgba(199, 0, 7, 0.3)",
      transition: { duration: 0.3 } 
    },
    tap: { scale: 0.95 },
    pulse: { 
      scale: [1, 1.02, 1], 
      opacity: [0.9, 1, 0.9],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } 
    },
  };

  return (
    <>
      {/* Inject responsive styles */}
      <style jsx>{responsiveStyles}</style>
      
      <section
        ref={sectionRef}
        className="min-h-screen w-full relative overflow-hidden flex justify-center items-center px-2 xs:px-4 sm:px-6 lg:px-8"
        style={{
          height: '100vh',
          minHeight: '450px', // Further reduced for very small screens
          maxHeight: '100vh', // Prevent overflow on smaller screens
        }}
      >
      {/* Background motion div with zoom-out animation and parallax */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/home/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translateY(${parallaxOffset * 0.5}px)`,
        }}
        variants={backgroundVariants}
        initial="initial"
        animate="animate"
        onAnimationComplete={() => setContentVisible(true)}
      />

      {/* Parallax background elements - optimized responsive sizes */}
      <motion.div
        ref={parallaxRef}
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      >
        <div className="absolute top-1/4 left-1/4 w-32 h-32 xs:w-40 xs:h-40 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-[#c70007]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 xs:w-32 xs:h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-[#c70007]/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </motion.div>

      {/* Enhanced dark overlay for better text contrast */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(199, 0, 7, 0.1) 50%, rgba(0, 0, 0, 0.6) 100%)',
          zIndex: 1,
        }}
      />

      {/* Content motion div with enhanced scroll-triggered animations */}
      {contentVisible && (
        <motion.div
          className="relative z-10 text-center text-white w-full max-w-6xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8"
          variants={contentVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Welcome text - optimized for smaller screens */}
          <motion.h2
            className="hero-welcome-text text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold uppercase mt-2 xs:mt-3 sm:mt-4 md:mt-6 mb-2 xs:mb-3 sm:mb-4 md:mb-6 tracking-wide"
            style={{
              fontFamily: 'var(--font-bricolage-grotesque), sans-serif',
            }}
            variants={welcomeVariants}
          >
            Welcome to Killswitch
          </motion.h2>

          {/* Main title split into two lines - optimized for smaller screens */}
          <motion.h1
            className="hero-main-title text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold uppercase text-red-600 mt-1 xs:mt-2 sm:mt-3 md:mt-4 mb-3 xs:mb-4 sm:mb-6 md:mb-8 leading-tight"
            style={{
              letterSpacing: '0.5px',
              fontFamily: 'var(--font-bricolage-grotesque), sans-serif',
            }}
          >
            <motion.span
              className="block mb-1 xs:mb-2 sm:mb-3 md:mb-4"
              variants={upperTitleVariants}
            >
              Power-Up Your
            </motion.span>
            <motion.span
              className="block"
              variants={lowerTitleVariants}
            >
              Hardware Experience
            </motion.span>
          </motion.h1>

          {/* Description - optimized for smaller screens */}
          <motion.p
            className="hero-description text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl mt-2 xs:mt-3 sm:mt-4 mb-4 xs:mb-6 sm:mb-8 md:mb-10 leading-relaxed max-w-3xl mx-auto px-1 xs:px-2 sm:px-4"
            style={{
              fontFamily: 'var(--font-bricolage-grotesque), sans-serif',
            }}
            variants={descriptionVariants}
          >
            Next generation gaming devices designed to be champions, streamers, and fearless adventurers. Our hardware is built to speed, power and full immersion giving you control over every battle.
          </motion.p>

          {/* Shop Now button - optimized for smaller screens */}
          <motion.button
            onClick={handleShopNow}
            className="hero-button inline-flex items-center gap-1 xs:gap-2 sm:gap-3 py-1.5 xs:py-2 sm:py-3 pl-1.5 xs:pl-2 sm:pl-3 pr-4 xs:pr-6 sm:pr-8 md:pr-10 bg-red-600 text-white border-none rounded-full text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-bold uppercase cursor-pointer"
            style={{
              fontFamily: 'var(--font-bricolage-grotesque), sans-serif',
            }}
            variants={buttonVariants}
            initial="initial"
            animate="pulse"
            whileHover="hover"
            whileTap="tap"
          >
            <span className="hero-button-icon flex justify-center items-center bg-transparent border-2 sm:border-3 md:border-4 border-white rounded-full w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white">
              <img 
                src="/home/shopping-bag.png"
                alt="Shop Icon"
                className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 invert"
              />
            </span>
            Shop Now
          </motion.button>
        </motion.div>
      )}
    </section>
    </>
  );
};

export default HeroSection;