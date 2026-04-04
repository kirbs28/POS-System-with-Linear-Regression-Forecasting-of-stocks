import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Jollibee BI System",
  description: "Business Intelligence & POS System",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#4A2800",
                color: "#FFF8E7",
                fontFamily: "Nunito, sans-serif",
                fontWeight: "600",
                borderRadius: "12px",
              },
              success: {
                iconTheme: { primary: "#FFC200", secondary: "#4A2800" },
              },
              error: {
                iconTheme: { primary: "#CC0000", secondary: "white" },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
