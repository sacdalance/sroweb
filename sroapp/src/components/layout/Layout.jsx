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
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        className="xl:flex"
      />
      <div className="flex-1 w-full">
        <Navbar onMenuClick={toggleSidebar} />
        <main className="pt-20 p-4 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
