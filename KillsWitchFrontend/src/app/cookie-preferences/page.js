"use client";

import { motion } from 'framer-motion';
import Navbar from '../component/HomeComponents/Navbar';
import Footer from '../component/HomeComponents/Footer';
import CookieConsentManager from '../components/CookieConsentManager';
import { Shield, Cookie, Eye, Lock } from 'lucide-react';

export default function CookiePreferencesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Cookie className="w-8 h-8 text-[#c70007]" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Cookie Preferences
              </h1>
            </div>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Manage your cookie preferences and control how we use cookies to enhance your experience on our website.
            </p>
          </motion.div>

          {/* Information Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-[#1c1816] border border-[#c70007]/30 rounded-xl p-6 text-center">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
              <p className="text-sm text-gray-400">
                Your privacy is our priority. We only collect data that helps improve your experience.
              </p>
            </div>

            <div className="bg-[#1c1816] border border-[#c70007]/30 rounded-xl p-6 text-center">
              <Eye className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Transparency</h3>
              <p className="text-sm text-gray-400">
                We're transparent about what cookies we use and why we use them.
              </p>
            </div>

            <div className="bg-[#1c1816] border border-[#c70007]/30 rounded-xl p-6 text-center">
              <Lock className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Your Control</h3>
              <p className="text-sm text-gray-400">
                You have full control over your cookie preferences and can change them anytime.
              </p>
            </div>
          </motion.div>

          {/* Cookie Consent Manager */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <CookieConsentManager />
          </motion.div>

          {/* Cookie Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 bg-[#1c1816] border border-[#c70007]/30 rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">About Our Cookies</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Essential Cookies</h3>
                <p className="text-gray-400 mb-2">
                  These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services.
                </p>
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  <li>Authentication and security</li>
                  <li>Shopping cart functionality</li>
                  <li>Form submissions</li>
                  <li>Basic site navigation</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Analytics Cookies</h3>
                <p className="text-gray-400 mb-2">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  <li>Page views and user behavior</li>
                  <li>Site performance metrics</li>
                  <li>Error tracking and debugging</li>
                  <li>Popular content analysis</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Marketing Cookies</h3>
                <p className="text-gray-400 mb-2">
                  These cookies are used to deliver advertisements more relevant to you and your interests.
                </p>
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  <li>Personalized product recommendations</li>
                  <li>Targeted advertising</li>
                  <li>Social media integration</li>
                  <li>Cross-site tracking prevention</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                For more information about our data practices, please read our{' '}
                <a 
                  href="/PrivacyPolicy" 
                  className="text-[#c70007] hover:text-[#a50005] underline transition-colors"
                >
                  Privacy Policy
                </a>
                {' '}and{' '}
                <a 
                  href="/terms" 
                  className="text-[#c70007] hover:text-[#a50005] underline transition-colors"
                >
                  Terms of Service
                </a>
                .
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
