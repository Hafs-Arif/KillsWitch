"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Lock, FileText, ChevronRight, Eye, Database, Bell, Settings } from "lucide-react"
import Navbar from "../component/HomeComponents/Navbar"
import Footer from "../component/HomeComponents/Footer"

import Link from "next/link"
import UserChat from "../component/socketsComponents/UserChat"


export default function PrivacyPolicy() {
  const [isVisible, setIsVisible] = useState({})
  const [hoveredCard, setHoveredCard] = useState(null)

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

  const privacySections = [
    {
      id: "information-collection",
      title: "Data Collection Practices",
      icon: <Database className="w-6 h-6" />,
      content:
        "Our platform gathers essential user details including contact information and technical data about your device and browsing patterns to enhance service delivery.",
    },
    {
      id: "information-usage",
      title: "Purpose of Data Processing",
      icon: <Eye className="w-6 h-6" />,
      items: [
        "Facilitating seamless service transactions",
        "Optimizing customer support systems",
        "Customizing platform experience",
        "Sending service-related communications",
        "Continuous platform improvement",
      ],
    },
    {
      id: "data-protection",
      title: "Security Measures",
      icon: <Shield className="w-6 h-6" />,
      content:
        "We employ advanced security protocols including end-to-end encryption, routine vulnerability assessments, and strict access management to safeguard your information.",
    },
    {
      id: "third-party",
      title: "Data Sharing Policy",
      icon: <FileText className="w-6 h-6" />,
      content:
        "User information is shared only with verified partners essential for service operations, under strict confidentiality agreements that prohibit unauthorized use.",
    },
    {
      id: "your-rights",
      title: "User Control Options",
      icon: <Settings className="w-6 h-6" />,
      items: [
        "Access your stored personal information",
        "Request data corrections",
        "Initiate data deletion",
        "Limit processing activities",
        "Withdraw consent for data usage",
      ],
    },
    {
      id: "cookies",
      title: "Tracking Technologies",
      icon: <Lock className="w-6 h-6" />,
      content:
        "Essential and analytical cookies are utilized to maintain platform functionality. Browser settings can be adjusted to manage cookie preferences, though this may impact service features.",
    },
    {
      id: "updates",
      title: "Policy Modifications",
      icon: <Bell className="w-6 h-6" />,
      content:
        "This policy undergoes periodic reviews. Significant changes will be communicated through platform notifications and updated revision dates on this document.",
    },
    {
      id: "contact",
      title: "Privacy Inquiries",
      icon: <ChevronRight className="w-6 h-6" />,
      content: "For any privacy-related concerns or questions, our dedicated team can be reached at:",
      contact: "contact@killswitch.us",
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
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Data Protection Policy</h1>
              <div className="h-1 w-24 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 mx-auto mb-6"></div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                we prioritizes your digital privacy. This comprehensive policy outlines our strict data handling procedures,
                your rights as a user, and our unwavering commitment to information security across all services.
              </p>
            </motion.div>
          </section>

          {/* Main Content Section */}
          <section id="privacy-content" className="relative mb-20">
            <div className="grid md:grid-cols-2 gap-8">
              {privacySections.map((section, index) => (
                <motion.div
                  key={section.id}
                  className="bg-none border border-white/10 rounded-xl overflow-hidden relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible["privacy-content"] ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  onMouseEnter={() => setHoveredCard(section.id)}
                  onMouseLeave={() => setHoveredCard(null)}
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
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-white/5 rounded-xl mr-4 flex items-center justify-center">
                        {section.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">{section.title}</h3>
                    </div>

                    {section.content && <p className="text-gray-300 mb-4">{section.content}</p>}

                    {section.items && (
                      <ul className="text-gray-300 space-y-2 text-sm mb-4">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.contact && <p className="text-gray-200 font-medium mt-2">{section.contact}</p>}

                    <motion.div
                      className="h-0.5 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 w-0 absolute bottom-0 left-0"
                      animate={{ width: hoveredCard === section.id ? "100%" : "0%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Commitment Section */}
          <section id="commitment" className="relative">
            <motion.div
              className="bg-none border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["commitment"] ? { opacity: 1, y: 0 } : {}}
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
                <h2 className="text-3xl font-bold text-white mb-4">Our Data Protection Pledge</h2>
                <div className="h-0.5 w-24 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 mx-auto mb-6"></div>
                <p className="text-gray-300 max-w-3xl mx-auto mb-8">
                  Your use of our services signifies acceptance of these data protection terms. We maintain
                  industry-leading security standards and complete transparency in all data processing activities.
                </p>
                <motion.button
                  className="px-8 py-4 bg-none border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors flex items-center space-x-2 mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href='/ContactUs'> <span>Reach Our Data Protection Officer</span> </Link>
                  <ChevronRight className="w-5 h-5 ml-2" />
                </motion.button>
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
              <p className="text-gray-400 text-sm">Policy Effective Date: April 16, 2025</p>
            </motion.div>
          </section>
        </div>
      </div>
      <UserChat/>
      <Footer />
    </>
  )
}