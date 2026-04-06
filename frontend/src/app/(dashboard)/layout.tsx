"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import SummaryPanel from "@/components/SummaryPanel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-white w-full overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {showMobileSidebar && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Main Sidebar */}
      <Sidebar 
        isMobile={isMobile}
        showMobile={showMobileSidebar}
        onCloseMobile={() => setShowMobileSidebar(false)}
      />

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out lg:pl-64 w-full"
      >
        {/* Mobile Header (Hidden on Desktop) */}
        {isMobile && (
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={() => setShowMobileSidebar(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
                {/* Placeholder for any header items */}
              </div>
            </div>
          </header>
        )}
        
        <main className="flex-1 w-full relative flex">
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          <SummaryPanel />
        </main>
      </div>
    </div>
  );
}
