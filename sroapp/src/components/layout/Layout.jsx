import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import CommandPalette from "./CommandPalette";
import { useState, useCallback, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import NetworkGuard from "@/components/NetworkGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import supabase from "@/lib/supabase";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data } = await supabase.from("account").select("role_id").eq("email", user.email).single();
        if (data) setUserRole(data.role_id);
      }
    };
    fetchRole();
  }, []);

  return (
    <div className="fixed w-full h-screen flex bg-sro-bg-off-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        setIsOpen={setSidebarOpen}
        collapsed={sidebarCollapsed}
      />

      {/* Mobile overlay */}
      <div
        className={`
          fixed inset-0 bg-black/30 z-[55] transition-opacity duration-300 mt-14
          ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          xl:hidden
        `}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0 transition-all duration-300 flex flex-col h-screen">
        <Navbar
          onMenuClick={() => setSidebarOpen((open) => !open)}
          onCollapseToggle={() => setSidebarCollapsed((c) => !c)}
          sidebarCollapsed={sidebarCollapsed}
          sidebarOpen={sidebarOpen}
        />
        <main className="pt-14 px-4 md:px-6 lg:px-8 w-full min-w-0 xl:min-w-[unset] flex-1 h-[calc(100vh-3.5rem)] overflow-auto">
          <ErrorBoundary>
            <NetworkGuard>
              <div className="py-6">
                <Outlet />
              </div>
            </NetworkGuard>
          </ErrorBoundary>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        role={userRole}
      />

      <Toaster position="bottom-right" />
    </div>
  );
};

export default Layout;
