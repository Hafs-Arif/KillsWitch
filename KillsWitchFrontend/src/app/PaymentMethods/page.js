"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CreditCard, Building, Wallet, Bitcoin, Calendar, FileText, Shield, Lock, ChevronRight, Banknote } from "lucide-react"
import dynamic from "next/dynamic"
import Footer from "../component/HomeComponents/Footer"
import Link from "next/link"
import UserChat from "../component/socketsComponents/UserChat"

// Dynamically import Navbar with SSR disabled
const Navbar = dynamic(() => import("../component/HomeComponents/Navbar"), {
  ssr: false,
})

const PaymentMethods = () => {
  const [isVisible, setIsVisible] = useState({})
  const [hoveredCard, setHoveredCard] = useState(null)
  const [isClient, setIsClient] = useState(false) // For client-side particle rendering

  useEffect(() => {
    // Set client-side flag for particles
    setIsClient(true)

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

  const paymentMethods = [
    {
      id: "credit-cards",
      title: "Credit & Debit Cards",
      icon: <CreditCard className="w-8 h-8 text-[#c70007]" />,
      description:
        "We support all major card providers with advanced encryption technology for maximum transaction security.",
      logos: [
        { src: "/placeholder.svg?height=32&width=48", alt: "Visa" },
        { src: "/placeholder.svg?height=32&width=48", alt: "Mastercard" },
        { src: "/placeholder.svg?height=32&width=48", alt: "American Express" },
      ],
    },
    {
      id: "bank-transfer",
      title: "Wire Transfers",
      icon: <Building className="w-8 h-8 text-[#c70007]" />,
      description: "Secure bank-to-bank transfers available for both local and global transactions.",
      details: [
        "Account Holder: Stellar Orbit Technologies",
        "Banking Institution: Universal Finance Bank",
        "Account Number: 9876543210",
        "SWIFT/BIC: UFBINT44",
      ],
    },
    {
      id: "digital-wallets",
      title: "E-Wallets",
      icon: <Wallet className="w-8 h-8 text-[#c70007]" />,
      description: "Quick and convenient payments through trusted digital payment platforms.",
      logos: [
        { src: "/placeholder.svg?height=32&width=48", alt: "PayPal" },
        { src: "/placeholder.svg?height=32&width=48", alt: "Apple Pay" },
        { src: "/placeholder.svg?height=32&width=48", alt: "Google Pay" },
      ],
    },
    {
      id: "cryptocurrency",
      title: "Digital Currency",
      icon: <Bitcoin className="w-8 h-8 text-[#c70007]" />,
      description: "Embrace the future with cryptocurrency payments at current market exchange rates.",
      logos: [
        { src: "/placeholder.svg?height=32&width=48", alt: "Bitcoin" },
        { src: "/placeholder.svg?height=32&width=48", alt: "Ethereum" },
        { src: "/placeholder.svg?height=32&width=48", alt: "USDC" },
      ],
    },
    {
      id: "installment-plans",
      title: "Payment Plans",
      icon: <Calendar className="w-8 h-8 text-[#c70007]" />,
      description: "Spread your payments with customizable installment options through our financial partners.",
      details: [
        "Interest-free options available",
        "Flexible 3-12 month payment terms",
        "Quick approval process for eligible customers",
      ],
    },
    {
      id: "cash-on-delivery",
      title: "Cash on Delivery (COD)",
      icon: <Banknote className="w-8 h-8 text-[#c70007]" />,
      description: "Pay with cash when your order is delivered to your doorstep. Available for local deliveries within supported areas.",
      details: [
        "Payment due upon delivery",
        "Available for orders up to $2,000",
        "Delivery verification required",
        "Local delivery areas only",
      ],
    },
    {
      id: "purchase-orders",
      title: "Corporate Purchasing",
      icon: <FileText className="w-8 h-8 text-[#c70007]" />,
      description: "Official purchase orders accepted from verified organizations and public sector entities.",
      email: "corporate@stellarorbit.com",
    },
  ]

  const securityFeatures = [
    {
      title: "Military-Grade Encryption",
      description: "Every transaction protected with enterprise-level security protocols",
      icon: <Shield className="w-8 h-8 text-[#c70007]" />,
    },
    {
      title: "Industry Compliance",
      description: "Fully certified to meet global payment security standards",
      icon: <Lock className="w-8 h-8 text-[#c70007]" />,
    },
    {
      title: "Zero Data Retention",
      description: "Your financial information is never stored on our systems",
      icon: <CreditCard className="w-8 h-8 text-[#c70007]" />,
    },
  ]

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-20 px-4 sm:px-6 bg-[#000000] text-white">
        {/* Animated background elements */}
        <div className="fixed inset-0 z-[-1] overflow-hidden">
          {/* Grid lines */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-[#c70007]/5"></div>
          <div className="absolute top-0 left-2/4 w-px h-full bg-[#c70007]/5"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-[#c70007]/5"></div>
          <div className="absolute top-1/3 left-0 w-full h-px bg-[#c70007]/5"></div>
          <div className="absolute top-2/3 left-0 w-full h-px bg-[#c70007]/5"></div>

          {/* Animated orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#c70007]/20 blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#c70007]/20 blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
          />
          {/* Animated Particles (client-side only) */}
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

        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section id="hero" className="relative mb-16">
            <motion.div
              className="text-center relative z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["hero"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Flexible Payment Solutions</h1>
              <div className="h-1 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto mb-6"></div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Discover our range of trusted and versatile payment options for a seamless checkout experience
              </p>
            </motion.div>
          </section>

          {/* Payment Methods Section */}
          <section id="payment-methods" className="relative mb-20">
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["payment-methods"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Payment Options</h2>
              <div className="h-0.5 w-16 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mb-6"></div>
              <p className="text-gray-300 max-w-3xl">
                We've implemented diverse payment solutions to match your financial preferences and ensure a
                frictionless purchasing experience.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paymentMethods.map((method, index) => (
                <motion.div
                  key={method.id}
                  className="bg-[#1c1816] border border-[#c70007]/50 rounded-xl overflow-hidden relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible["payment-methods"] ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  onMouseEnter={() => setHoveredCard(method.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Animated background elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#c70007]/20 blur-xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
                    />
                  </div>

                  <div className="p-6 relative z-10">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-[#c70007]/10 rounded-xl mr-4 flex items-center justify-center">
                        {method.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">{method.title}</h3>
                    </div>

                    {method.logos && (
                      <div className="flex space-x-4 mb-4">
                        {method.logos.map((logo, i) => (
                          <img key={i} src={logo.src || "/placeholder.svg"} alt={logo.alt} className="h-8" />
                        ))}
                      </div>
                    )}

                    <p className="text-gray-300 mb-4">{method.description}</p>

                    {method.details && (
                      <ul className="text-gray-300 space-y-2 text-sm mb-4">
                        {method.details.map((detail, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {method.email && (
                      <p className="text-gray-300 text-sm">
                        Send POs to: <span className="text-white">{method.email}</span>
                      </p>
                    )}

                    <motion.div
                      className="h-0.5 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] w-0 absolute bottom-0 left-0"
                      animate={{ width: hoveredCard === method.id ? "100%" : "0%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Security Assurance Section */}
          <section id="security" className="relative">
            <motion.div
              className="bg-[#1c1816] border border-[#c70007]/50 rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["security"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.01 }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 z-0">
                <motion.div
                  className="absolute top-0 left-1/4 w-40 h-40 rounded-full bg-[#c70007]/20 blur-xl"
                  animate={{
                    y: [0, 20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.div
                  className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-[#c70007]/20 blur-xl"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
                />
              </div>

              <div className="p-8 md:p-12 relative z-10">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-white mb-4">Transaction Security Guaranteed</h2>
                  <div className="h-0.5 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto mb-6"></div>
                  <p className="text-gray-300 max-w-3xl mx-auto">
                    We've implemented cutting-edge security protocols to safeguard your financial data throughout every
                    transaction.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {securityFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      className="bg-[#1c1816]/50 p-6 rounded-xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={isVisible["security"] ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className="p-3 bg-[#c70007]/10 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2 text-center">{feature.title}</h3>
                      <p className="text-gray-300 text-center">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="relative mt-20">
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["faq"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Common Questions</h2>
              <div className="h-0.5 w-16 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mb-6"></div>
              <p className="text-gray-300 max-w-3xl">
                Get answers to frequently asked questions about our payment processes and security protocols.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  question: "At what point is my payment processed?",
                  answer:
                    "Card payments are processed immediately upon order confirmation. For bank transfers, your order is finalized once we receive the funds in our account.",
                },
                {
                  question: "Do you support global payments?",
                  answer:
                    "Absolutely. We accept worldwide payments through all our available methods. Please be aware that your financial institution may apply additional fees for cross-border transactions.",
                },
                {
                  question: "How do I set up a payment plan?",
                  answer:
                    "Simply select the payment plan option at checkout and follow the guided application steps. Most decisions are provided within minutes of submission.",
                },
                {
                  question: "Which payment method is most efficient?",
                  answer:
                    "For fastest processing, we suggest using cards or e-wallets. For substantial purchases, wire transfers or corporate purchasing options may be more appropriate.",
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-[#1c1816] border border-[#c70007]/50 rounded-xl p-6 hover:border-[#c70007]/70 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible["faq"] ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                  <p className="text-gray-400">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section id="cta" className="relative mt-20">
            <motion.div
              className="bg-[#1c1816] border border-[#c70007]/50 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["cta"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.01 }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 z-0">
                <motion.div
                  className="absolute top-0 left-1/4 w-40 h-40 rounded-full bg-[#c70007]/20 blur-xl"
                  animate={{
                    y: [0, 20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.div
                  className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-[#c70007]/20 blur-xl"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
                />
              </div>

              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-4">Questions About Payment Options?</h2>
                <p className="text-gray-300 mb-8">
                  Our dedicated payments team is ready to assist with any inquiries regarding payment methods, financing
                  solutions, or business billing arrangements.
                </p>
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] rounded-full text-white transition-all flex items-center space-x-2 mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/ContactUs">
                    <span>Reach Our Payments Team</span>
                  </Link>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
      <UserChat />
      <Footer />
    </>
  )
}

export default PaymentMethods