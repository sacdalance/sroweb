import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useState } from "react";

const SIDEBAR_WIDTH = 256; // Tailwind's w-64

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="max-w-full mx-auto h-screen flex bg-[#ffffff]">
      {/* Sidebar: always visible on lg+, toggleable on mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Overlay for mobile */}
      <div
        className={`
          fixed inset-0 bg-black/30 z-20 transition-opacity duration-300
          ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          xl:hidden
        `}
        onClick={() => setSidebarOpen(false)}
      />
      {/* Main content */}
      <div
        className={`
          flex-1 min-w-0 transition-all duration-300
          ${sidebarOpen ? "blur-sm lg:blur-0" : ""}
          xl:ml-[${SIDEBAR_WIDTH}px]
          flex flex-col
          h-screen
        `}
      >
        {/* Mobile menu button */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="pt-20 px-4 md:px-6 lg:px-8 max-w-[2000px] mx-auto w-full min-w-0 flex-1 h-[calc(100vh-5rem)] overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
