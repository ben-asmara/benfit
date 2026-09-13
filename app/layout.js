import "./globals.css";

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
      <body>{children}<script src="/register-sw.js" defer></script></body>
    </html>
  );
}
