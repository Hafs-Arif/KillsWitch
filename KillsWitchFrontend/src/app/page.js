"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notify, ModernNotificationContainer } from "./components/ModernNotification";
import StatsComponent from "./component/HomeComponents/Counter";
import Footer from "./component/HomeComponents/Footer";
import FeaturedProducts from "./component/HomeComponents/FeaturedProducts";
import ImageCarousel from "./component/HomeComponents/ImageCarousel";
import ModernBanner from "./component/HomeComponents/ModernBanner";
import Navbar from "./component/HomeComponents/Navbar";
import TopProducts from "./component/HomeComponents/TopProducts";
import VideoSection from "./component/HomeComponents/VideoSection";
import UserChat from "./component/socketsComponents/UserChat";
import { API } from "./api/api";

export default function Home() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const handleAuthToken = async () => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const error = urlParams.get("error");

        // Handle OAuth error
        if (error === "oauth_failed") {
          notify.error("Google authentication failed. Please try again.");
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setAuthChecked(true);
          return;
        }

        // Handle successful OAuth with token
        if (token) {
          try {
            // Clean up the URL first
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Wait a bit for cookies to be fully set
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify authentication by calling profile endpoint
            const profile = await API.auth.getProfile();
            
            if (profile && profile.user) {
              notify.success("Successfully signed in with Google!");
              
              // Force navbar to re-check authentication
              window.dispatchEvent(new CustomEvent('auth-changed'));
            } else {
              notify.error("Authentication verification failed. Please try logging in again.");
            }
          } catch (error) {
            notify.error("Authentication failed. Please try logging in again.");
          }
        }
        setAuthChecked(true);
      }
    };

    handleAuthToken();
  }, [router]);

  return (
    <div className="relative">
      <ModernNotificationContainer />
      <Navbar key={authChecked ? "auth-checked" : "auth-pending"} />
      <ImageCarousel />
      
      <TopProducts />
      <StatsComponent />
      <FeaturedProducts />
      <VideoSection />
      <UserChat />
      <ModernBanner />
      <Footer />
    </div>
  );
}
