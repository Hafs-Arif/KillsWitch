"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API } from "../api/api";
import { notify } from "./ModernNotification";
import { Shield, Lock, Loader2 } from "lucide-react";

export default function RouteGuard({
  children,
  allowedRoles = [], // e.g. ["admin"]
  redirectTo = "/login", // where to kick non-authorized users
  showToast = true,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState({
    checking: true,
    allowed: false,
  });

  // Stabilize dependency on roles to avoid re-running effect due to new array identity
  const rolesKey = Array.isArray(allowedRoles)
    ? [...allowedRoles].sort().join(",")
    : "";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await API.auth.getProfile();
        if (!mounted) return;
        const userRole = profile?.role || profile?.user?.role || profile?.userRole;
        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
          if (showToast) notify.error("You are not authorized to view this page");
          if (pathname !== "/") router.replace("/");
          setStatus({ checking: false, allowed: false });
          return;
        }
        setStatus({ checking: false, allowed: true });
      } catch (_) {
        if (showToast) notify.info("Please login to continue");
        const target = `${redirectTo}?next=${encodeURIComponent(pathname)}`;
        if (pathname !== redirectTo) router.replace(target);
        if (mounted) setStatus({ checking: false, allowed: false });
      }
    })();
    return () => { mounted = false; };
  }, [router, pathname, rolesKey, redirectTo, showToast]);

  // prevent flicker
  if (status.checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{backgroundColor: '#000000'}}>
        <div className="flex flex-col items-center space-y-6 p-8 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-500/20" style={{backgroundColor: '#1c1816'}}>
          {/* Animated Shield Icon */}
          <div className="relative">
            <Shield className="w-16 h-16 animate-pulse" style={{color: '#c70007'}} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          </div>
          
          {/* Loading Text */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">KillSwitch Security</h2>
            <p className="text-gray-300 animate-pulse">Verifying authorization...</p>
          </div>
          
          {/* Loading Bar */}
          <div className="w-64 h-2 rounded-full overflow-hidden" style={{backgroundColor: '#1c1816'}}>
            <div className="h-full rounded-full animate-pulse" style={{
              background: 'linear-gradient(90deg, #c70007 0%, #ff4444 50%, #c70007 100%)',
              animation: 'loading-bar 2s ease-in-out infinite'
            }}></div>
          </div>
        </div>
        
        {/* Custom CSS for loading animation */}
        <style jsx>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return status.allowed ? children : null;
}
