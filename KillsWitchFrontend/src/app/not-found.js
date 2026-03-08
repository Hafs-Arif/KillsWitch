"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiArrowLeft, FiHome, FiSearch } from "react-icons/fi";
import Navbar from "./component/HomeComponents/Navbar";
import Footer from "./component/HomeComponents/Footer";

export default function NotFound() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-black text-white overflow-hidden">
      <Navbar />

      {/* Main 404 Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0">
          {/* Grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(
                rgba(199, 0, 7, 0.1) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(199, 0, 7, 0.1) 1px,
                transparent 1px
              )`,
              backgroundSize: "50px 50px",
            }}
          />

          {/* Floating gradient orbs */}
          <motion.div
            className="absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(199, 0, 7, 0.2) 0%, transparent 70%)",
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(199, 0, 7, 0.15) 0%, transparent 70%)",
            }}
            animate={{
              x: [0, -40, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Cursor-following glow */}
          <motion.div
            className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 68, 68, 0.1) 0%, transparent 70%)",
              x: mousePosition.x - 192,
              y: mousePosition.y - 192,
            }}
            transition={{ type: "spring", damping: 30, mass: 0.8 }}
          />
        </div>

        {/* Content Container */}
        <motion.div
          className="relative z-10 text-center max-w-3xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* 404 Number with floating animation */}
          <motion.div
            className="mb-8"
            variants={floatingVariants}
            animate="animate"
          >
            <h1 className="text-[140px] md:text-[200px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#E7000B] via-[#E7000B] to-[#E7000B]">
              404
            </h1>
          </motion.div>

          {/* Error Title */}
          <motion.div variants={itemVariants} className="mb-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Page Not Found
            </h2>
            <p className="text-xl md:text-2xl text-gray-400 font-light">
              Oops! It seems you've ventured into uncharted territory.
            </p>
          </motion.div>

          {/* Decorative line */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-8"
          >
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[#c70007] to-transparent rounded-full" />
          </motion.div>

          {/* Error description */}
          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-lg mb-12 leading-relaxed"
          >
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, we have plenty of other pages to explore.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-12"
          >


            {/* Home Button */}
            <Link href="/">
              <motion.button
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-[#c70007] text-[#c70007] font-bold text-lg hover:bg-[#c70007]/10 transition-all duration-300 w-full sm:w-auto"
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(199, 0, 7, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                <FiHome /> Go Home
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating particles background effect */}
        <div className="absolute inset-0 z-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-[#c70007]/30"
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 100 - 50, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
