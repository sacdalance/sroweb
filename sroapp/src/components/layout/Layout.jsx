import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useState } from "react";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 w-full">
        <Navbar onMenuClick={toggleSidebar} />
        <main className="pt-20 px-4 md:px-6 lg:px-8 min-h-screen max-w-[2000px] mx-auto">
          <div className="max-xl:ml-0 xl:ml-64 max-2xl:ml-64 ml-80 transition-all duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
