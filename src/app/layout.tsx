import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeOracle — AI Job Matcher",
  description: "Upload your resume, find perfectly matched jobs, and tailor your resume with Gemini AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0d0e17] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
