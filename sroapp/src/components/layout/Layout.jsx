import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import CommandPalette from "./CommandPalette";
import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import NetworkGuard from "@/components/NetworkGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/context/UserAuthContext";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const { role, accountId } = useAuth();

  const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="fixed w-full h-[100svh] flex bg-sro-bg-off-white">
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
      <div className="flex-1 min-w-0 transition-all duration-300 flex flex-col h-[100svh]">
        <Navbar
          onMenuClick={() => setSidebarOpen((open) => !open)}
          onCollapseToggle={() => setSidebarCollapsed((c) => !c)}
          sidebarCollapsed={sidebarCollapsed}
          sidebarOpen={sidebarOpen}
          accountId={accountId}
        />
        <main className="pt-14 px-4 md:px-6 lg:px-8 w-full min-w-0 xl:min-w-[unset] flex-1 h-[calc(100svh-3.5rem)] overflow-auto no-scrollbar">
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
        role={role}
      />

      <Toaster position="bottom-right" />
    </div>
  );
};

export default Layout;
