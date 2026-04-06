"use client"

import { useState } from "react"
// newsletter uses a direct fetch in this client component to avoid import/resolution issues
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowRight,
  FiExternalLink,
  FiFacebook,
  FiInstagram,
  FiHome,
  FiInfo,
  FiTag,
  FiShoppingCart,
  FiCreditCard,
  FiHelpCircle,
  FiShield,
  FiFileText,
  FiMonitor,
  FiUserPlus,
  FiMessageSquare
} from "react-icons/fi"
import logo from '/public/images/logo.png'

const Footer = () => {
  const [email, setEmail] = useState("")
  const [hoveredLink, setHoveredLink] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setMessage({ type: "error", text: "Please enter a valid email address" })
      return
    }

    setIsSubmitting(true)
    setMessage({ type: "", text: "" })

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${apiUrl}/newsletter/newsletter`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Subscription failed (${res.status})`)
      }

      const data = await res.json()
      if (data && data.success) {
        setMessage({ type: "success", text: "🎉 Thank you for subscribing to our newsletter!" })
        setEmail("")
        setTimeout(() => setMessage({ type: "", text: "" }), 5000)
      } else {
        setMessage({ type: "error", text: data.error || "Subscription failed. Please try again." })
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      setMessage({ type: "error", text: error.message || "An error occurred. Please try again later." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const companyLinks = [
    { name: "About Us", icon: <FiInfo className="w-4 h-4" />, href: "/AboutUs" },
    { name: "Products", icon: <FiTag className="w-4 h-4" />, href: "/products" },
    { name: "IT Equipment", icon: <FiMonitor className="w-4 h-4" />, href: "/ITSectorPage" },
    { name: "Get Quote", icon: <FiMessageSquare className="w-4 h-4" />, href: "/GetAQuote" }
  ]

  const customerLinks = [
    { name: "Shopping Cart", icon: <FiShoppingCart className="w-4 h-4" />, href: "/cart" },
    { name: "Payment Methods", icon: <FiCreditCard className="w-4 h-4" />, href: "/PaymentMethods" },
    { name: "Track Orders", icon: <FiExternalLink className="w-4 h-4" />, href: "/trackorder" },
    { name: "Help Center", icon: <FiHelpCircle className="w-4 h-4" />, href: "/helpcenter" }
  ]

  const legalLinks = [
    { name: "Privacy Policy", icon: <FiShield className="w-4 h-4" />, href: "/PrivacyPolicy" },
    { name: "Terms & Conditions", icon: <FiFileText className="w-4 h-4" />, href: "/TermsAndConditions" },
    { name: "Sign Up", icon: <FiUserPlus className="w-4 h-4" />, href: "/register" }
  ]

  const socialLinks = [
    { icon: <FiFacebook className="w-5 h-5" />, href: "https://www.facebook.com/profile.php?id=61580515739391", name: "Facebook" },
    { icon: <FiInstagram className="w-5 h-5" />, href: "https://www.instagram.com/killswitch_us?igsh=b3B0ZmYxMnNpeGE4", name: "Instagram" }
  ]

  const contactInfo = [
    {
      icon: <FiPhone className="w-5 h-5" />,
      title: "Phone",
      content: "+1 (216) 544-1081",
      href: "tel:+12165441081"
    },
    {
      icon: <FiMail className="w-5 h-5" />,
      title: "Email",
      content: "contact@killswitch.us",
      href: "mailto:contact@killswitch.us"
    },
    {
      icon: <FiMapPin className="w-5 h-5" />,
      title: "Address",
      content: "7840 TYLER BLVD  UNIT 7201\nWAREHOUSE, MENTOR, Ohio 44060-4801",
      href: "https://maps.google.com/?q=7840+TYLER+BLVD+UNIT+7201+WAREHOUSE+MENTOR+Ohio+44060-4801"
    }
  ]

  return (
    <footer className="relative bg-black text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c70007]/10 via-transparent to-[#c70007]/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #c70007 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Company Info - Left Side */}
          <div className="lg:col-span-5 space-y-8">
            {/* Logo & Description */}
            <div className="space-y-6">
              <Link href="/" className="inline-block">
                <Image
                  src={logo}
                  alt="Company Logo"
                  width={80}
                  height={80}
                  className="border border-[#c70007] rounded-lg hover:scale-105 transition-transform duration-300"
                />
              </Link>
              
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#c70007] to-[#a50005] bg-clip-text text-transparent mb-4">
                About Killswitch
                </h2>
                <p className="text-gray-400 leading-relaxed max-w-md">
                We are passionate about powering your play. From custom gaming PCs to high-performance parts and accessories, our mission is to bring gamers and creators the hardware they need to win.
                </p>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Stay Updated</h3>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-transparent transition-all duration-200"
                  />
                </div>
                <motion.button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#c70007] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  <span>{isSubmitting ? "Subscribing..." : "Subscribe to Newsletter"}</span>
                  {!isSubmitting && <FiArrowRight className="w-4 h-4" />}
                </motion.button>
                
                {/* Success/Error Message */}
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-sm p-3 rounded-lg ${
                      message.type === "success" 
                        ? "bg-green-500/10 text-green-400 border border-green-500/30" 
                        : "bg-red-500/10 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {message.text}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Contact Hours */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#c70007] mb-3">Business Hours</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between items-center">
                  <span>We're Available</span>
                  <span className="text-white font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Always Open
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  24/7 Online Support & Shopping
                </div>
              </div>
            </div>
          </div>

          {/* Links Sections - Right Side */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Company Links */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white border-b border-[#c70007] pb-2">Company</h3>
              <ul className="space-y-3">
                {companyLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="group flex items-center space-x-3 text-gray-400 hover:text-[#c70007] transition-colors duration-200"
                      onMouseEnter={() => setHoveredLink(`company-${index}`)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      <span className={`transition-colors duration-200 ${hoveredLink === `company-${index}` ? 'text-[#c70007]' : 'text-gray-500'}`}>
                        {link.icon}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Links */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white border-b border-[#c70007] pb-2">Customer</h3>
              <ul className="space-y-3">
                {customerLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="group flex items-center space-x-3 text-gray-400 hover:text-[#c70007] transition-colors duration-200"
                      onMouseEnter={() => setHoveredLink(`customer-${index}`)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      <span className={`transition-colors duration-200 ${hoveredLink === `customer-${index}` ? 'text-[#c70007]' : 'text-gray-500'}`}>
                        {link.icon}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Support */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white border-b border-[#c70007] pb-2">Support</h3>
              <ul className="space-y-3">
                {legalLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="group flex items-center space-x-3 text-gray-400 hover:text-[#c70007] transition-colors duration-200"
                      onMouseEnter={() => setHoveredLink(`legal-${index}`)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      <span className={`transition-colors duration-200 ${hoveredLink === `legal-${index}` ? 'text-[#c70007]' : 'text-gray-500'}`}>
                        {link.icon}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6">Get In Touch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactInfo.map((item, index) => (
              <motion.a
                key={index}
                href={item.href}
                className="group bg-gray-900/30 border border-gray-800 hover:border-[#c70007]/50 rounded-lg p-4 transition-all duration-200 hover:bg-gray-900/50"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-[#c70007] mt-1 group-hover:scale-110 transition-transform duration-200">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-[#c70007] transition-colors duration-200">
                      {item.title}
                    </h4>
                    <p className="text-gray-400 text-sm mt-1 whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Social Links */}
            <div className="flex items-center space-x-6">
              <span className="text-gray-400 text-sm">Follow Us:</span>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#c70007] transition-colors duration-200"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={social.name}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} KillSwitch. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Crafted with precision and innovation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007]"></div>
    </footer>
  )
}

export default Footer