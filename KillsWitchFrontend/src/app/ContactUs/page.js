"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import {
  FiPhone,
  FiMapPin,
  FiMail,
  FiMessageSquare,
  FiSmartphone,
  FiArrowRight,
  FiClock,
  FiCalendar,
  FiBriefcase,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiGlobe,
  FiUsers,
  FiTrendingUp
} from "react-icons/fi"
import Footer from "../component/HomeComponents/Footer"
import { BASE_URL } from "../api/api"

// Dynamically import Navbar with SSR disabled
const Navbar = dynamic(() => import("../component/HomeComponents/Navbar"), {
  ssr: false,
})

export default function ContactUs() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneno: "",
    message: "",
    subject: "General Inquiry",
  })
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({
    type: "",
    message: "",
  })
  const [visibleSections, setVisibleSections] = useState({})
  const [isClient, setIsClient] = useState(false) // New state for client-side rendering

  const [selectedSubject, setSelectedSubject] = useState("General Inquiry")

  const subjectOptions = [
    { 
      value: "General Inquiry", 
      icon: <FiMessageSquare className="w-5 h-5" />,
      color: "from-[#c70007] to-[#a50005]"
    },
    { 
      value: "Technical Support", 
      icon: <FiBriefcase className="w-5 h-5" />,
      color: "from-[#c70007] to-[#a50005]"
    },
    { 
      value: "Partnership", 
      icon: <FiUsers className="w-5 h-5" />,
      color: "from-[#c70007] to-[#a50005]"
    },
    { 
      value: "Consultation", 
      icon: <FiCalendar className="w-5 h-5" />,
      color: "from-[#c70007] to-[#a50005]"
    },
  ]

  // Set isClient to true only on client-side
  useEffect(() => {
    setIsClient(true)
  }, [])

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject)
    setFormData({
      ...formData,
      subject: subject,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name || !formData.email || !formData.message) {
        setModalContent({
          type: "error",
          message: "Please fill in all required fields",
        })
        setShowModal(true)
        setLoading(false)
        return
      }

      const requestBody = {
        name: formData.name,
        email: formData.email,
        phoneno: formData.phoneno,
        message: formData.message,
        subject: formData.subject,
        recipient_email: "contact@killswitch.us", 
      }
      // Use the correct API endpoint
      const apiUrl = `${BASE_URL}/contact`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      setModalContent({
        type: "success",
        message: "Your message has been sent successfully! We'll get back to you soon.",
      })
      setShowModal(true)
      setFormData({ name: "", email: "", phoneno: "", message: "", subject: "General Inquiry" })
      setSelectedSubject("General Inquiry")
    } catch (error) {
      console.error("Error submitting form:", error)
      
      let errorMessage = "Failed to send message. Please try again later."
      
      // Check for specific CORS error
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        errorMessage = "Unable to connect to server. This might be a network issue or the server may be temporarily unavailable. Please try again later or contact us directly at contact@killswitch.us"
      }
      
      setModalContent({
        type: "error",
        message: errorMessage,
      })
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
  }

  return (
    <>
      <div className="bg-[#000000] text-white min-h-screen overflow-hidden">
        <Navbar />
        {/* Background Elements */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#c70007]/10 via-transparent to-[#c70007]/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(199,0,7,0.15),transparent_50%)]" />
          {/* Animated Particles (only render on client) */}
          {isClient && [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#c70007]/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1c1816] border border-[#c70007]/50 rounded-xl p-6 max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  {modalContent.type === "success" ? (
                    <FiCheckCircle className="w-6 h-6 text-[#c70007]" />
                  ) : (
                    <FiAlertCircle className="w-6 h-6 text-[#c70007]" />
                  )}
                  <h3 className="text-lg font-semibold text-white">
                    {modalContent.type === "success" ? "Success!" : "Error"}
                  </h3>
                </div>
                <p className="text-gray-300 mb-6">{modalContent.message}</p>
                <button
                  onClick={closeModal}
                  className="w-full bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Hero Section */}
          <section id="hero" className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections.hero ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-8"
            >
              <div className="inline-flex items-center space-x-2 bg-[#c70007]/10 border border-[#c70007]/30 rounded-full px-4 py-2 mb-6">
                <FiMessageSquare className="w-4 h-4 text-[#c70007]" />
                <span className="text-[#c70007] font-medium">Get In Touch</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  Let's Start a
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#c70007] to-[#a50005] bg-clip-text text-transparent">
                  Conversation
                </span>
              </h1>

              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Ready to transform your technology infrastructure? Our expert team is here to help you navigate the complexities of modern technology.
              </p>

              <div className="h-1 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto rounded-full" />
            </motion.div>
          </section>

          {/* Contact Form Section */}
          <section id="contact-form" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections["contact-form"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="bg-[#1c1816] border border-[#1c1816]/50 rounded-2xl backdrop-blur-sm overflow-hidden"
            >
              {/* Form Header */}
              <div className="border-b border-[#1c1816]/50 p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Send Us a Message</h2>
                    <p className="text-gray-400">We typically respond within 24 hours</p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <motion.a
                      href="tel:+12165441081"
                      className="flex items-center gap-2 bg-[#c70007]/10 border border-[#c70007]/30 rounded-full px-4 py-2 text-sm text-[#c70007] hover:bg-[#c70007]/20 transition-all"
                      whileHover={{ scale: 1.05 }}
                    >
                      <FiPhone className="w-4 h-4 text-white" />
                      <span>+1 (216) 544-1081</span>
                    </motion.a>

                    <motion.a
                      href="mailto:contact@killswitch.us"
                      className="flex items-center gap-2 bg-[#c70007]/10 border border-[#c70007]/30 rounded-full px-4 py-2 text-sm text-[#c70007] hover:bg-[#c70007]/20 transition-all"
                      whileHover={{ scale: 1.05 }}
                    >
                      <FiMail className="w-4 h-4 text-white" />
                      <span>contact@killswitch.us</span>
                    </motion.a>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Subject Selection */}
                  <div>
                    <label className="block text-white text-lg font-semibold mb-4">
                      What can we help you with?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {subjectOptions.map((option) => (
                        <motion.div
                          key={option.value}
                          className={`cursor-pointer border rounded-xl p-4 text-center transition-all duration-300 ${
                            selectedSubject === option.value
                              ? "border-[#c70007]/50 bg-[#c70007]/10"
                              : "border-[#1c1816]/50 hover:border-[#c70007]/50 hover:bg-[#1c1816]/80"
                          }`}
                          onClick={() => handleSubjectSelect(option.value)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className={`p-3 rounded-full ${
                              selectedSubject === option.value 
                                ? "bg-gradient-to-r from-[#c70007] to-[#a50005] text-white" 
                                : "bg-[#1c1816] text-gray-400"
                            }`}>
                              {option.icon}
                            </div>
                            <span className={`text-sm font-medium ${
                              selectedSubject === option.value ? "text-white" : "text-gray-400"
                            }`}>
                              {option.value}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-grow bg-[#1c1816]/50"></div>
                      <h3 className="text-lg font-semibold text-white">Your Information</h3>
                      <div className="h-px flex-grow bg-[#1c1816]/50"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Name Field */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className="w-full bg-[#000000] border border-[#c70007]/50 text-white rounded-lg px-4 py-3 outline-none transition-all duration-300"
                          required
                        />
                      </div>

                      {/* Email Field */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email address"
                          className="w-full bg-[#000000] border border-[#c70007]/50 text-white rounded-lg px-4 py-3 outline-none transition-all duration-300"
                          required
                        />
                      </div>

                      {/* Phone Field */}
                      <div className="relative lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          name="phoneno"
                          value={formData.phoneno}
                          onChange={handleChange}
                          placeholder="Enter your phone number"
                          className="w-full bg-[#000000] border border-[#c70007]/50 text-white rounded-lg px-4 py-3 outline-none transition-all duration-300"
                        />
                        <p className="mt-2 text-xs text-gray-400">We'll only use this for urgent communications</p>
                      </div>
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-grow bg-[#1c1816]/50"></div>
                      <h3 className="text-lg font-semibold text-white">Your Message</h3>
                      <div className="h-px flex-grow bg-[#1c1816]/50"></div>
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        How can we help you? *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Please describe your inquiry in detail..."
                        rows="6"
                        className="w-full bg-[#000000] border border-[#c70007]/50 text-white rounded-lg px-4 py-3 outline-none transition-all duration-300 resize-none"
                        required
                      ></textarea>
                    </div>
                  </div>

                  {/* Submit Section */}
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-6 border-t border-[#1c1816]/50">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <FiClock className="w-4 h-4 text-white" />
                      <span>We typically respond within 24 hours</span>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 flex items-center space-x-2"
                      whileHover={!loading ? { scale: 1.02 } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <FiSend className="w-4 h-4 text-white" />
                          <span>Send Message</span>
                          <FiArrowRight className="w-4 h-4 text-white" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </section>

          {/* Contact Information Cards */}
          <section id="contact-info" className="mb-20">
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections["contact-info"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Office Location */}
              <motion.div
                className="bg-[#1c1816] border border-[#1c1816]/50 rounded-xl p-6 hover:border-[#c70007]/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="bg-gradient-to-r from-[#c70007] to-[#a50005] p-3 rounded-lg w-fit mb-4">
                  <FiMapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Office Location</h3>
                <div className="space-y-2 text-gray-300">
                  <p>7840 TYLER BLVD UNIT 7201</p>
                  <p>WAREHOUSE, MENTOR, Ohio 44060-4801</p>
                </div>
              </motion.div>

              {/* Business Hours */}
              <motion.div
                className="bg-[#1c1816] border border-[#1c1816]/50 rounded-xl p-6 hover:border-[#c70007]/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="bg-gradient-to-r from-[#c70007] to-[#a50005] p-3 rounded-lg w-fit mb-4">
                  <FiClock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Business Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monday - Friday</span>
                    <span className="text-white">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Saturday</span>
                    <span className="text-white">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sunday</span>
                    <span className="text-white">Closed</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#1c1816]/50">
                  <p className="text-sm text-gray-400">24/7 emergency support for enterprise clients</p>
                </div>
              </motion.div>

              {/* Connect With Us */}
              <motion.div
                className="bg-[#1c1816] border border-[#1c1816]/50 rounded-xl p-6 hover:border-[#c70007]/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="bg-gradient-to-r from-[#c70007] to-[#a50005] p-3 rounded-lg w-fit mb-4">
                  <FiPhone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Connect With Us</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FiPhone className="w-4 h-4 text-[#c70007]" />
                    <a href="tel:+12165441081" className="text-white hover:text-[#c70007] transition-colors">
                      +1 (216) 544-1081
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMail className="w-4 h-4 text-[#c70007]" />
                    <a href="mailto:contact@killswitch.us" className="text-white hover:text-[#c70007] transition-colors">
                      contact@killswitch.us
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiGlobe className="w-4 h-4 text-[#c70007]" />
                    <a href="https://killswitch.us" className="text-white hover:text-[#c70007] transition-colors">
                      killswitch.us
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="mb-20">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections.faq ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto rounded-full mb-6" />
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Find quick answers to common questions about our services and support
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6">
              {[
                {
                  question: "What are your response times?",
                  answer: "We typically respond to all inquiries within 24 business hours. For urgent matters, please call us directly or indicate urgency in your message for prioritized handling."
                },
                {
                  question: "Do you offer on-site consultations?",
                  answer: "Yes, we provide comprehensive on-site consultations for enterprise clients. Our expert team can visit your location to assess needs and provide tailored technology solutions."
                },
                {
                  question: "What information should I include?",
                  answer: "Please include project details, timeline, budget considerations, and specific requirements or challenges. The more information you provide, the better we can assist you."
                },
                {
                  question: "Do you provide emergency support?",
                  answer: "We offer 24/7 emergency support services for our enterprise clients. Contact us to learn about our comprehensive support packages and SLA options."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-[#1c1816] border border-[#1c1816]/50 rounded-xl p-6 hover:border-[#c70007]/50 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={visibleSections.faq ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                  whileHover={{ y: -2 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section id="cta">
            <motion.div
              className="bg-[#c70007]/10 border border-[#c70007]/30 rounded-2xl p-12 text-center backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }}
              animate={visibleSections.cta ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Ready to Transform Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#c70007] to-[#a50005] bg-clip-text text-transparent">
                  Technology Infrastructure?
                </span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Our team of experts is ready to help you navigate modern technology complexities and find perfect solutions for your business needs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.button
                  className="bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Schedule Consultation</span>
                  <FiArrowRight className="w-5 h-5 text-white" />
                </motion.button>

                <motion.button
                  className="border border-[#c70007] text-[#c70007] hover:bg-[#c70007] hover:text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiTrendingUp className="w-5 h-5" />
                  <span>View Case Studies</span>
                </motion.button>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}