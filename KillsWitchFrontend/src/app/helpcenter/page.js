"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Truck,
  Package,
  Shield,
  RotateCcw,
  Cpu,
  MessageCircle,
} from "lucide-react"
import Navbar from "../component/HomeComponents/Navbar"
import Footer from "../component/HomeComponents/Footer"
import Link from "next/link"
import UserChat from "../component/socketsComponents/UserChat"

const faqs = [
  {
    category: "Delivery",
    icon: <Truck className="w-5 h-5" />,
    questions: [
      {
        question: "What shipping options do you provide?",
        answer: [
          "Standard shipping: 3-5 business days.",
          "Expedited shipping: 2 business days.",
          "Overnight delivery: For urgent orders.",
          "International shipments: Processed through our global logistics network."
        ],
      },
      {
        question: "How are shipping costs calculated?",
        answer: [
          "Based on package weight and dimensions.",
          "Depends on the destination.",
          "Varies with selected delivery speed.",
          "Exact cost shown during checkout; free standard shipping for orders over $500."
        ],
      },
    ],
  },
  {
    category: "Order Management",
    icon: <Package className="w-5 h-5" />,
    questions: [
      {
        question: "What payment methods do you accept?",
        answer: [
          "All major credit cards: Visa, Mastercard, American Express.",
          "PayPal for secure online payments.",
          "Bank transfers for larger orders.",
          "Cryptocurrency payments; all transactions secured with 256-bit SSL encryption."
        ],
      },
      {
        question: "Can I cancel or change my order?",
        answer: [
          "Modifications possible within 60 minutes of placement.",
          "For cancellations after 60 minutes, contact support immediately.",
          "We'll accommodate if the order hasn't entered fulfillment.",
        ],
        contact: "contact@killswitch.us",
      },
    ],
  },
  {
    category: "Product Protection",
    icon: <Shield className="w-5 h-5" />,
    questions: [
      {
        question: "What does your warranty cover?",
        answer: [
          "Protection against manufacturing defects.",
          "Coverage for hardware failures.",
          "Includes parts replacement and technical support.",
          "Warranty length: 1-3 years depending on product category."
        ],
      },
      {
        question: "How do warranty claims work?",
        answer: [
          "Submit claim via online portal with order details and issue description.",
          "Support team verifies coverage.",
          "Provides return instructions for approved claims.",
          "Replacement typically within 5-7 business days."
        ],
      },
    ],
  },
  {
    category: "Returns & Refunds",
    icon: <RotateCcw className="w-5 h-5" />,
    questions: [
      {
        question: "What's your return policy timeframe?",
        answer: [
          "Most products returnable within 14 days for full refund.",
          "Special order items may have different conditions.",
          "Customized items require review.",
          "Returns must include original packaging and accessories."
        ],
      },
      {
        question: "Are return shipping costs covered?",
        answer: [
          "Prepaid labels for defective or incorrect items.",
          "Customer responsible for other returns unless due to our error.",
          "Refunds processed within 48 hours of receipt.",
        ],
      },
    ],
  },
  {
    category: "Technical Specifications",
    icon: <Cpu className="w-5 h-5" />,
    questions: [
      {
        question: "Where can I find product specifications?",
        answer: [
          "Available on each product page under 'Details' tab.",
          "Includes full technical specs.",
          "For compatibility, contact technical advisors.",
          "Personalized recommendations based on your setup."
        ],
      },
      {
        question: "Do you provide installation support?",
        answer: [
          "Free basic installation guidance for all products.",
          "Premium packages for complex systems.",
          "Detailed setup videos in knowledge base.",
        ],
      },
    ],
  },
  {
    category: "Accounts and security",
    icon: <Cpu className="w-5 h-5" />,
    questions: [
      {
        question: "How do you keep my data secure?",
        answer: [
          "Site protected with HTTPS (look for the padlock).",
          "256-bit SSL encryption for all transactions.",
          "Regular security audits and compliance with industry standards.",
          "Data stored in encrypted databases with access controls."
        ],
      },
      {
        question: "How do I manage my account?",
        answer: [
          "Update profile details in the account dashboard.",
          "Reset password via email verification.",
          "View order history and track shipments.",
          "Enable two-factor authentication for added security."
        ],
      },
    ],
  },
]

const FAQS = () => {
  const [isVisible, setIsVisible] = useState({})
  const [openQuestions, setOpenQuestions] = useState({})
  const [activeCategory, setActiveCategory] = useState("Delivery")

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

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`
    setOpenQuestions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-20 px-4 sm:px-6 bg-none text-white">
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
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gray-700/20 blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gray-700/20 blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <section id="header" className="relative mb-12">
            <motion.div
              className="text-center relative z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["header"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Support Center</h1>
              <div className="h-1 w-24 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 mx-auto mb-6"></div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Comprehensive answers to your most common questions about orders, products, and services
              </p>
            </motion.div>
          </section>

          {/* FAQ Content */}
          <section id="faq-content" className="relative">
            <motion.div
              className="bg-none border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["faq-content"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/5 blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-white/5 blur-xl"
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
              </div>

              {/* Category Tabs */}
              <div className="relative z-10 p-6 border-b border-white/10 overflow-x-auto">
                <div className="flex space-x-2 md:space-x-4 min-w-max">
                  {faqs.map((section, index) => (
                    <motion.button
                      key={index}
                      className={`px-4 py-2 rounded-full text-sm md:text-base transition-all duration-300 flex items-center gap-2 ${
                        activeCategory === section.category
                          ? "bg-white/10 border border-white/30 text-white"
                          : "bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                      }`}
                      onClick={() => setActiveCategory(section.category)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {section.icon}
                      <span>{section.category}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* FAQ Questions and Answers */}
              <div className="relative z-10 p-6 md:p-8">
                {faqs.map((section, sectionIndex) => (
                  <AnimatePresence key={sectionIndex}>
                    {activeCategory === section.category && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                      >
                        {section.questions.map((faq, questionIndex) => {
                          const isOpen = openQuestions[`${sectionIndex}-${questionIndex}`]
                          return (
                            <motion.div
                              key={questionIndex}
                              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: questionIndex * 0.1 }}
                              whileHover={{ y: -2 }}
                            >
                              <motion.button
                                className="w-full text-left p-5 flex justify-between items-center"
                                onClick={() => toggleQuestion(sectionIndex, questionIndex)}
                              >
                                <h3 className="text-lg font-medium text-white">{faq.question}</h3>
                                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                </motion.div>
                              </motion.button>

                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-5 pt-0 border-t border-white/10">
                                      <div className="pl-4 border-l-2 border-white/20">
                                        <ul className="list-disc pl-6 text-gray-300 space-y-1">
                                          {faq.answer?.map((point, i) => (
                                            <li key={i}>{point}</li>
                                          ))}
                                        </ul>
                                        {faq.contact && (
                                          <p className="mt-2 text-white font-medium">
                                            Contact: <span className="text-gray-300">{faq.contact}</span>
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                ))}
              </div>

              {/* Additional Help Section */}
              <div className="relative z-10 p-8 border-t border-white/10 bg-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-full">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Need personalized assistance?</h3>
                      <p className="text-gray-400">Our technical support specialists are available 24/7</p>
                    </div>
                  </div>

                  {/* <motion.a
                    href="/contactus"
                    className="px-6 py-3 bg-none border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Live Chat Support</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.a> */}
                </div>
              </div>
            </motion.div>
          </section>

          {/* Search Section */}
          <section id="search" className="relative mt-20">
            <motion.div
              className="bg-none border border-white/10 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["search"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.01 }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 z-0">
                <motion.div
                  className="absolute top-0 left-1/4 w-40 h-40 rounded-full bg-gray-700/20 blur-xl"
                  animate={{
                    y: [0, 20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ duration: 10, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-gray-700/20 blur-xl"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ duration: 10, repeat: Infinity }}
                />
              </div>

              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-4">Still Have Questions?</h2>
                <p className="text-gray-300 mb-8">
                  Explore our detailed documentation or connect directly with our technical experts
                </p>
                <motion.button
                  className="px-8 py-4 bg-none border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors flex items-center space-x-2 mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href='/ContactUs'> <span>Contact Us</span> </Link>
                  <ChevronRight className="w-5 h-5 ml-2" />
                </motion.button>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
      <UserChat/>
      <Footer />
    </>
  )
}

export default FAQS