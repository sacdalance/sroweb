import { Menu, Search, PanelLeftClose, PanelLeft } from "lucide-react";
import PropTypes from "prop-types";
import Breadcrumbs from "./Breadcrumbs";
import NotificationsDropdown from "./NotificationsDropdown";

const Navbar = ({ onMenuClick, onCollapseToggle, sidebarCollapsed, accountId }) => {
  return (
    <div className="fixed top-0 left-0 w-full bg-sro-primary text-white z-50 shadow-md">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={onMenuClick}
            className="xl:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop sidebar collapse toggle */}
          <button
            onClick={onCollapseToggle}
            className="hidden xl:flex p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <div className="hidden sm:flex items-center gap-3">
            <div className="w-px h-5 bg-white/20" />
            <Breadcrumbs />
          </div>

          {/* Mobile title fallback */}
          <span className="sm:hidden font-semibold text-sm">SRO Portal</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Command palette hint */}
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-white/60 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Notifications */}
          <NotificationsDropdown accountId={accountId} />
        </div>
      </div>
    </div>
  );
};

Navbar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  onCollapseToggle: PropTypes.func,
  sidebarCollapsed: PropTypes.bool,
  accountId: PropTypes.number,
};

export default Navbar;
