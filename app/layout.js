import "./globals.css";
import { Manrope, Space_Grotesk } from "next/font/google";

const manrope = Manrope({ subsets:["latin"], variable:"--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets:["latin"], variable:"--font-display" });

export const metadata = {
  title: "BenFit Journey",
  description: "Cloud synced fitness, nutrition and progress tracker",
  manifest: "/manifest.webmanifest",
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
