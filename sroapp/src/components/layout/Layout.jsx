import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = () => {
  return (
    <div className="flex">
      {/* Sidebar for navigation */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1">
        <Navbar />
        <main className="p-4">
          <Outlet /> {/* This renders the current page inside Layout */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
