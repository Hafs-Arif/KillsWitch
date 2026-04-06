"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  UserCheck,
  ShieldCheck,
  CreditCard,
  Copyright,
  AlertTriangle,
  RefreshCw,
  Mail,
  ChevronDown,
} from "lucide-react"
import Navbar from "../component/HomeComponents/Navbar"
import Footer from "../component/HomeComponents/Footer"
import UserChat from "../component/socketsComponents/UserChat"

export default function TermsAndConditions() {
  const [isVisible, setIsVisible] = useState({})
  const [expandedSection, setExpandedSection] = useState(null)

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

  const toggleSection = (id) => {
    if (expandedSection === id) {
      setExpandedSection(null)
    } else {
      setExpandedSection(id)
    }
  }

  const termsData = [
    {
      id: "acceptance",
      title: "1. Agreement Acceptance",
      icon: <BookOpen className="w-6 h-6" />,
      content:
        "By utilizing Stellar Nexus services, you acknowledge that you have thoroughly reviewed, comprehended, and consent to abide by these Terms. If you disagree with any provisions, you must refrain from using our platform.",
    },
    {
      id: "account",
      title: "2. User Registration & Account Protection",
      icon: <UserCheck className="w-6 h-6" />,
      items: [
        "You must submit precise and comprehensive information during account creation",
        "You bear full responsibility for safeguarding your account credentials",
        "You are required to promptly inform us of any unauthorized account access",
        "We maintain the right to disable or terminate accounts violating these guidelines",
      ],
    },
    {
      id: "usage",
      title: "3. Service Utilization Guidelines",
      icon: <ShieldCheck className="w-6 h-6" />,
      items: [
        "You commit to utilizing our services exclusively for legitimate purposes",
        "You will not compromise or disrupt the platform's security features",
        "You will not attempt to gain unauthorized access to protected system areas",
        "Business usage requires explicit written authorization from Stellar Nexus",
      ],
    },
    {
      id: "payments",
      title: "4. Financial Transactions",
      icon: <CreditCard className="w-6 h-6" />,
      items: [
        "All pricing is displayed in USD unless explicitly indicated otherwise",
        "We support major credit cards and alternative payment methods as shown",
        "You provide authorization to bill your selected payment method for all relevant fees",
        "All purchases are non-refundable unless specified in our Refund Guidelines",
      ],
    },
    {
      id: "intellectual",
      title: "5. Intellectual Property Rights",
      icon: <Copyright className="w-6 h-6" />,
      content:
        "All website materials, including textual content, visual elements, brand identifiers, and software, remain the exclusive property of Stellar Nexus and are safeguarded by intellectual property legislation. Unauthorized usage is strictly prohibited.",
    },
    {
      id: "liability",
      title: "6. Liability Limitations",
      icon: <AlertTriangle className="w-6 h-6" />,
      content:
        "To the maximum extent permitted by applicable law, Stellar Nexus shall not be held liable for any indirect, consequential, special, exemplary, or punitive damages arising from your use or inability to access our services.",
    },
    {
      id: "modifications",
      title: "7. Terms Amendments",
      icon: <RefreshCw className="w-6 h-6" />,
      content:
        "We retain the right to revise these Terms at any time. Significant modifications will be communicated through our website or via email. Continued platform usage constitutes acceptance of the updated Terms.",
    },
    {
      id: "contact",
      title: "8. Communication Details",
      icon: <Mail className="w-6 h-6" />,
      content: "For any inquiries regarding these Terms and Conditions, please reach out to us at:",
      contact: "help@stellarnexus.com",
    },
  ]

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
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gray-700/20 blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section id="hero" className="relative mb-16">
            <motion.div
              className="text-center relative z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["hero"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Legal Terms & Conditions</h1>
              <div className="h-1 w-24 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 mx-auto mb-6"></div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Welcome to Stellar Nexus. The following Terms and Conditions govern your interaction with our platform
                and services. By accessing or utilizing our services, you acknowledge and consent to these terms and our
                Privacy Statement.
              </p>
            </motion.div>
          </section>

          {/* Terms Accordion Section */}
          <section id="terms-content" className="relative mb-20">
            <motion.div
              className="bg-none border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-8 md:p-12"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["terms-content"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-6">
                {termsData.map((term, index) => (
                  <motion.div
                    key={term.id}
                    className="border-b border-white/10 pb-6 last:border-b-0 last:pb-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible["terms-content"] ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <motion.button
                      className="w-full flex items-center justify-between text-left"
                      onClick={() => toggleSection(term.id)}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-white/5 rounded-xl mr-4 flex items-center justify-center">
                          {term.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white">{term.title}</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSection === term.id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </motion.div>
                    </motion.button>

                    <motion.div
                      className="overflow-hidden"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: expandedSection === term.id ? "auto" : 0,
                        opacity: expandedSection === term.id ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="pt-4 pl-16">
                        {term.content && <p className="text-gray-300 mb-4">{term.content}</p>}

                        {term.items && (
                          <ul className="text-gray-300 space-y-2 text-sm mb-4">
                            {term.items.map((item, i) => (
                              <li key={i} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {term.contact && <p className="text-gray-200 font-medium mt-2">{term.contact}</p>}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Summary Cards Section */}
          <section id="summary" className="relative mb-20">
            <motion.div
              className="mb-12 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["summary"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Essential Highlights</h2>
              <div className="h-0.5 w-16 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 mx-auto mb-6"></div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "User Obligations",
                  points: [
                    "Submit accurate personal details",
                    "Ensure account credential security",
                    "Utilize platform within legal boundaries",
                    "Complete payment for purchased offerings",
                  ],
                },
                {
                  title: "Our Assurances",
                  points: [
                    "Deliver protected digital environment",
                    "Safeguard your confidential information",
                    "Communicate substantial modifications",
                    "Address customer concerns expeditiously",
                  ],
                },
                {
                  title: "Legal Structure",
                  points: [
                    "Proprietary content safeguards",
                    "Responsibility constraints",
                    "Terms revision procedures",
                    "Conflict resolution protocols",
                  ],
                },
              ].map((card, index) => (
                <motion.div
                  key={index}
                  className="bg-none border border-white/10 rounded-xl overflow-hidden relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible["summary"] ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  {/* Animated background elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/5 blur-xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
                    />
                  </div>

                  <div className="p-6 relative z-10">
                    <h3 className="text-xl font-bold text-white mb-4 text-center">{card.title}</h3>
                    <ul className="text-gray-300 space-y-3">
                      {card.points.map((point, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Agreement Section */}
          <section id="agreement" className="relative">
            <motion.div
              className="bg-none border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["agreement"] ? { opacity: 1, y: 0 } : {}}
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
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.div
                  className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-gray-700/20 blur-xl"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
                />
              </div>

              <div className="p-8 md:p-12 relative z-10 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Your Consent</h2>
                <div className="h-0.5 w-24 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 mx-auto mb-6"></div>
                <p className="text-gray-300 max-w-3xl mx-auto">
                  By engaging with our platform, you confirm that you have reviewed, comprehended, and accepted these
                  Terms and Conditions. Should you have any questions or require clarification, please do not hesitate
                  to contact our customer support team.
                </p>
              </div>
            </motion.div>
          </section>

          {/* Last Updated Section */}
          <section id="last-updated" className="relative mt-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible["last-updated"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <p className="text-gray-400 text-sm">Document Revised: April 16, 2025</p>
            </motion.div>
          </section>
        </div>
      </div>
      <UserChat/>
      <Footer />
    </>
  )
}
