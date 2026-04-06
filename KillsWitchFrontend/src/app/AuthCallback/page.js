"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notify, ModernNotificationContainer } from "../components/ModernNotification";
import { API } from "../api/api.js";

function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const token = searchParams.get("token");

      if (token) {
        try {
          // The backend has already set cookies, so we just need to verify the user is authenticated
          const profile = await API.auth.getProfile();
          
          if (profile && profile.user) {
            notify.success("Successfully signed in with Google!");
            setTimeout(() => router.push("/"), 1500);
          } else {
            notify.error("Authentication failed. Please try again.");
            setTimeout(() => router.push("/login"), 1500);
          }
        } catch (error) {
          console.error("Authentication verification failed:", error);
          notify.error("Authentication failed. Please try again.");
          setTimeout(() => router.push("/login"), 1500);
        }
      } else {
        notify.error("Authentication failed. Please try again.");
        setTimeout(() => router.push("/login"), 1500);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <ModernNotificationContainer />
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-xl text-white font-semibold">
          Processing your sign in...
        </h2>
        <p className="text-white/70 mt-2">
          Please wait while we complete your authentication
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackInner() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          Loading…
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
