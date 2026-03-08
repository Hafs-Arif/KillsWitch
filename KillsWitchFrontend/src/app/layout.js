import "./globals.css";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import Navbar from "./component/HomeComponents/Navbar";
import { CookieConsentProvider } from "./contexts/CookieConsentContext";
import CookieConsentBanner from "./components/CookieConsentBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

export const metadata = {
  title: "KillSwitch - Premium Gaming Hardware & PC Components",
  description: "Discover premium gaming hardware, PC components, and cutting-edge technology at KillSwitch. From high-performance gaming keyboards and mice to advanced cooling solutions and custom PC cases - elevate your gaming experience with our curated selection of top-tier hardware.",
  keywords: "gaming hardware, PC components, gaming keyboards, gaming mice, PC cases, cooling solutions, gaming accessories, computer hardware, gaming gear, custom PCs",
  author: "KillSwitch Gaming Hardware",
  robots: "index, follow",
  openGraph: {
    title: "KillSwitch - Premium Gaming Hardware & PC Components",
    description: "Discover premium gaming hardware and PC components. Elevate your gaming experience with our curated selection of top-tier hardware.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "KillSwitch - Premium Gaming Hardware",
    description: "Premium gaming hardware and PC components for the ultimate gaming experience.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bricolageGrotesque.variable} antialiased`}
        suppressHydrationWarning
      >
        <CookieConsentProvider>
          {children}
          <CookieConsentBanner />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
