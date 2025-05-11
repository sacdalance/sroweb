import { Menu } from "lucide-react";
import PropTypes from 'prop-types';

const Navbar = ({ onMenuClick }) => {
  return (
    <div className="fixed top-0 left-0 w-full bg-[#7B1113] text-white z-30 shadow-md">
      <div className="flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="max-xl:block hidden p-2 hover:bg-[#8B2123] rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="font-bold text-xl md:text-2xl">SRO Management System</h1>
        </div>
      </div>
    </div>
  );
};

Navbar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};

export default Navbar;
