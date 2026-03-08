'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronRight, Server, Shield, Cloud, Cpu, Smartphone, Settings, Keyboard } from "lucide-react";
import Navbar from "../component/HomeComponents/Navbar";
import Footer from "../component/HomeComponents/Footer";
import UserChat from "../component/socketsComponents/UserChat";

const ITSectorPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("section");
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionId = section.id;
        if (sectionTop < window.innerHeight * 0.75) {
          setIsVisible((prev) => ({ ...prev, [sectionId]: true }));
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const services = [
    {
      icon: <Server className="w-8 h-8 text-white" />,
      title: "ATX & ITX Cases",
      description:
        "From full-sized ATX builds with maximum expansion and airflow to compact ITX systems built for space efficiency, our cases deliver durability, cooling, and sleek designs. Whether you’re a gamer or creator, there’s a perfect fit for performance and style.",
    },
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: "Cooling Coil",
      description:
        "Eliminate heat with ease, even under heavy loads. Our fine-fin copper coils maximize heat transfer for ultra-stable CPU temps. Durable, efficient, and quiet, they keep your PC reliable for gaming, streaming, or creating.",
    },
    {
      icon: <Cloud className="w-8 h-8 text-white" />,
      title: "ARGB Fans",
      description:
        "Every keystroke is sharp and strong. Our gaming keyboards feature fast mechanical switches, anti-ghosting, and customizable lighting—built for endurance, comfort, and competitive play.",
    },
    {
      icon: <Cpu className="w-8 h-8 text-white" />,
      title: "Gaming Mouse",
      description:
        "Fast. Precise. Built for victory. Our gaming mice feature customizable DPI, programmable buttons, and ergonomic comfort. Lightweight yet strong, they react instantly to keep you ahead in every game.",
    },
    {
      icon: <Keyboard className="w-8 h-8 text-white" />,
      title: "Gaming Keyboard",
      description:
        "Each stroke of the key, sharp and strong. We manufacture gaming keyboards that are fast, precise and comfortable. They have mechanical switches, anti-ghosting, and adjustable lighting to play competitively and in real life. Strong and enduring and able to work long hours.",
    },
  ];

  const benefits = [
    {
      title: "Performance You Can Count On",
      description:
        "Play any game, have quicker workflows and reliable system performance regardless of the challenge of the task",
    },
    {
      title: "Built To Last",
      description:
        "Invest once and enjoy the benefit of the durable hardware that will last you years without failure.",
    },
    {
      title: "A Better Every Day",
      description:
        "With silent cooling, cozy setting, and more, our products will give you an enjoyable time with your PC.",
    },
    {
      title: "Believe in Your System",
      description:
        " Know that your system is strong, stylish, and ready whenever you are.",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="font-sans text-white min-h-screen" style={{ backgroundColor: '#000000' }}>
        {/* Hero Section */}
        <section id="hero" className="relative h-[80vh] overflow-hidden" style={{ backgroundColor: '#000000' }}>
          {/* Animated Particles - Client-only to avoid hydration mismatch */}
          {isMounted && (
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
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
          )}

          {/* Animated Grid Lines */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-px h-full bg-white/10"></div>
            <div className="absolute top-0 left-2/4 w-px h-full bg-white/10"></div>
            <div className="absolute top-0 left-3/4 w-px h-full bg-white/10"></div>
            <div className="absolute top-1/3 left-0 w-full h-px bg-white/10"></div>
            <div className="absolute top-2/3 left-0 w-full h-px bg-white/10"></div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["hero"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-4xl"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                <span className="text-white">Advance </span>
                <span className="text-[#c70007]"> Gaming Hardware</span>
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto mb-6"></div>
              <p className="text-xl md:text-2xl text-white mb-8">
                Get Hardware Like You Never Had Before.
              </p>
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white rounded-full transition-colors flex items-center space-x-2 mx-auto"
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(199, 0, 7, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/products')}
              >
                <span>Explore Solutions</span>
                <ChevronRight className="w-5 h-5 text-white" />
              </motion.button>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-8 h-12 rounded-full border-2 border-[#c70007]/30 flex justify-center">
              <motion.div
                className="w-1 h-3 bg-[#c70007]/60 rounded-full mt-2"
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </section>

        {/* Introduction Section */}
        <section id="intro" className="relative py-20" style={{ backgroundColor: '#000000' }}>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["intro"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-white">Unstoppable </span>
                <span className="text-[#c70007]">Performance</span>
              </h2>
              <div className="h-0.5 w-20 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mb-8"></div>
              <p className="text-lg text-gray-300 mb-6">
                We make every part gamer friendly, including cases and cooling, fans, keyboards and mice. Every product is designed to provide you with good performance,
                durability and the style that makes you set-up distinguished. Our components make you fast, keep you cool and in control no matter what you are creating,
                a powerful rig or a small system.
              </p>
              <ul className="list-disc list-inside text-lg text-gray-300 space-y-2">
              <li>Strong and durable builds</li>
              <li>Smooth cooling for stable performance</li>
              <li>Stylish designs with modern features</li>
              <li>Comfortable and gamer-focused gear</li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Services Section with Tabs */}
        <section id="services" className="py-20 relative" style={{ backgroundColor: '#000000' }}>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["services"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-white">Next-Gen </span>
                <span className="text-[#c70007]">Gaming Components</span>
              </h2>
              <div className="h-0.5 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto mb-6"></div>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Our next-gen gaming components bring modern designs and advanced technology to make your gameplay smoother and more powerful.
              </p>
            </motion.div>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap justify-center mb-12 gap-2">
              {services.map((service, index) => (
                <motion.button
                  key={index}
                  className={`px-4 py-2 rounded-full text-sm md:text-base transition-all duration-300 ${
                    activeTab === index
                      ? "bg-gradient-to-r from-[#c70007] to-[#a50005] text-white border border-[#c70007]/50"
                      : "bg-[#1c1816]/50 border border-[#1c1816]/50 text-gray-400 hover:text-white hover:bg-[#1c1816]/80"
                  }`}
                  onClick={() => setActiveTab(index)}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 10px rgba(199, 0, 7, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  {service.title}
                </motion.button>
              ))}
            </div>

            {/* Tabs Content */}
            <div className="relative min-h-[400px] overflow-hidden">
              {services.map((service, index) => (
                <AnimatePresence key={index}>
                  {activeTab === index && (
                    <motion.div
                      className="absolute inset-0 grid md:grid-cols-2 gap-8 items-center"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {/* Left side - Visual */}
                      <motion.div
                        className="border border-[#1c1816]/50 rounded-2xl p-8 h-full flex flex-col justify-center relative overflow-hidden"
                        style={{ backgroundColor: '#1c1816' }}
                        whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(199, 0, 7, 0.3)" }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Animated background elements */}
                        <motion.div
                          className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#c70007]/10 blur-xl"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                          }}
                          transition={{ duration: 8, repeat: Infinity }}
                        />

                        <div className="relative z-10">
                          <motion.div
                            className="w-20 h-20 bg-gradient-to-br from-[#c70007] to-[#a50005] rounded-2xl flex items-center justify-center border border-[#c70007]/50 mb-6"
                            animate={{
                              rotateY: [0, 360],
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          >
                            <div className="text-white">{service.icon}</div>
                          </motion.div>

                          <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                          <div className="h-0.5 w-16 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mb-6"></div>
                          <p className="text-gray-300">{service.description}</p>
                        </div>

                        {/* Animated corner accent */}
                        <motion.div
                          className="absolute bottom-0 right-0 w-32 h-32"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 1, delay: 0.5 }}
                        >
                          <svg viewBox="0 0 100 100" className="w-full h-full opacity-10">
                            <motion.path
                              d="M0,100 L100,100 L100,0"
                              fill="none"
                              stroke="#c70007"
                              strokeWidth="1"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            />
                          </svg>
                        </motion.div>
                      </motion.div>

                      {/* Right side - Features */}
                      <div className="space-y-4">
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        >
                          <h4 className="text-xl font-semibold mb-6">Key Features</h4>

                          {[1, 2, 3].map((item, i) => (
                            <motion.div
                              key={i}
                              className="flex items-start gap-4 mb-6 group"
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                              whileHover={{ x: 5 }}
                            >
                              <div className="mt-1 flex-shrink-0">
                                <motion.div
                                  className="w-8 h-8 rounded-full bg-[#1c1816]/50 border border-[#c70007]/50 flex items-center justify-center"
                                  whileHover={{ scale: 1.2, backgroundColor: "rgba(199, 0, 7, 0.2)" }}
                                >
                                  <span className="text-sm font-bold text-white">{i + 1}</span>
                                </motion.div>
                              </div>
                              <div>
                                <h5 className="text-lg font-medium mb-1 group-hover:text-white transition-colors">
                                  {/* ATX & ITX Cases - Index 0 */}
                                  {index === 0 && i === 0 && "Freedom of Choice"}
                                  {index === 0 && i === 1 && "Reliable Cooling"}
                                  {index === 0 && i === 2 && "Durability & Style"}
                                  
                                  {/* Cooling Coil - Index 1 */}
                                  {index === 1 && i === 0 && "Stable Performance"}
                                  {index === 1 && i === 1 && "Silent Operation"}
                                  {index === 1 && i === 2 && "Maximum Efficiency"}
                                  
                                  {/* ARGB Fans - Index 2 */}
                                  {index === 2 && i === 0 && "Powerful Airflow"}
                                  {index === 2 && i === 1 && "Custom Lighting"}
                                  {index === 2 && i === 2 && "Precision Keystrokes"}
                                  
                                  {/* Gaming Mouse - Index 3 */}
                                  {index === 3 && i === 0 && "Custom Lighting"}
                                  {index === 3 && i === 1 && "Long-Lasting Build"}
                                  {index === 3 && i === 2 && "Customizable DPI & Accurate Tracking"}
                                  
                                  {/* Gaming Keyboard - Index 4 (Fixed!) */}
                                  {index === 4 && i === 0 && "Precision Keystrokes"}
                                  {index === 4 && i === 1 && "Custom Lighting"}
                                  {index === 4 && i === 2 && "Long-Lasting Build"}
                                </h5>
                                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                                  {/* ATX & ITX Cases - Index 0 */}
                                  {index === 0 && i === 0 && "Build the way you want with ATX for expansion or ITX for compact power."}
                                  {index === 0 && i === 1 && "Enjoy better airflow that keeps your system stable."}
                                  {index === 0 && i === 2 && "Strong frames with sleek designs to showcase your build."}
                                  
                                  {/* Cooling Coil - Index 1 */}
                                  {index === 1 && i === 0 && "Keep your CPU ultra-steady, even under heavy loads."}
                                  {index === 1 && i === 1 && "Work or play without the noise of cooling."}
                                  {index === 1 && i === 2 && "Fine-fin copper delivers fast, effective heat transfer."}
                                  
                                  {/* ARGB Fans - Index 2 */}
                                  {index === 2 && i === 0 && "Maintain peak system performance with effective cooling."}
                                  {index === 2 && i === 1 && "Low-noise design keeps your system smooth."}
                                  {index === 2 && i === 2 && "Add vivid ARGB effects to personalize your rig."}
                                  
                                  {/* Gaming Mouse - Index 3 */}
                                  {index === 3 && i === 0 && "Mechanical switches with anti-ghosting for fast response."}
                                  {index === 3 && i === 1 && "Adjustable effects to fit your gaming setup."}
                                  {index === 3 && i === 2 && "Designed for endurance during long sessions."}
                                  
                                  {/* Gaming Keyboard - Index 4 (Fixed!) */}
                                  {index === 4 && i === 0 && "Mechanical switches with anti-ghosting for fast response."}
                                  {index === 4 && i === 1 && "Adjustable effects to fit your gaming setup."}
                                  {index === 4 && i === 2 && "Designed for endurance during long sessions."}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center mt-12 space-x-2">
              {services.map((_, index) => (
                <motion.button
                  key={index}
                  className={`w-3 h-3 rounded-full ${activeTab === index ? "bg-[#c70007] w-8" : "bg-gray-600 hover:bg-gray-500"}`}
                  onClick={() => setActiveTab(index)}
                  whileHover={{ scale: 1.5 }}
                  whileTap={{ scale: 0.8 }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 relative" style={{ backgroundColor: '#000000' }}>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["benefits"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
             <span className="text-white">Why Choose</span>
             <span className="text-[#c70007]"> Our Hardware Products</span>
              </h2>

              <div className="h-0.5 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto mb-6"></div>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Power, precision, and reliability—everything your rig deserves.
              </p>
            </motion.div>

            {/* Beneath section: Box with top-left cutted/shaded border */}
            <div
              className="relative p-6 border border-[#1c1816]/50 rounded-lg shadow-lg"
              style={{
                clipPath: 'polygon(20px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 20px)',
                // For shaded effect, enhance shadow according to theme
                boxShadow: '0 4px 6px rgba(199, 0, 7, 0.1), 0 1px 3px rgba(199, 0, 7, 0.08)',
                backgroundColor: '#1c1816',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="border border-[#1c1816]/50 rounded-xl relative overflow-hidden"
                    style={{ backgroundColor: '#1c1816' }}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    animate={isVisible["benefits"] ? { opacity: 1, x: 0, scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1, ease: [0.4, 0, 0.2, 1], scale: { duration: 2, repeat: Infinity } }}
                    whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(199, 0, 7, 0.3)" }}
                  >
                    <div className="p-8">
                      <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                      <p className="text-gray-400">{benefit.description}</p>
                    </div>
                    <motion.div
                      className="h-0.5 bg-gradient-to-r from-[#c70007] to-[#a50005] w-0"
                      initial={{ width: "0%" }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-20 relative" style={{ backgroundColor: '#000000' }}>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["cta"] ? { opacity: 1, y: 0, scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], scale: { duration: 2, repeat: Infinity } }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Hardware Infrastructure?</h2>
              <p className="text-lg text-gray-300 mb-8">
                Contact our team of experts to discuss how our hardware solutions can address your specific business
                challenges and drive innovation across your organization.
              </p>
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white rounded-full transition-colors flex items-center space-x-2 mx-auto"
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(199, 0, 7, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/products')}
              >
                <span>Browse Products</span>
                <ChevronRight className="w-5 h-5 text-white" />
              </motion.button>
            </motion.div>
          </div>
        </section>
      </div>
      <UserChat />
      <Footer />
    </>
  );
};

export default ITSectorPage;