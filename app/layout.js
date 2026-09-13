import "./globals.css";
import { Manrope, Space_Grotesk } from "next/font/google";

const manrope = Manrope({ subsets:["latin"], variable:"--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets:["latin"], variable:"--font-display" });

export const viewport = { themeColor: "#07110f", width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata = {
  title: "BenFit Journey",
  description: "BenFit — nutrition, training and progress in one app",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  appleWebApp: {
    capable: true,
    title: "BenFit",
    statusBarStyle: "black-translucent"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${spaceGrotesk.variable}`}>{children}<script src="/register-sw.js" defer></script></body>
    </html>
  );
}
