import { useState } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Sidebar Toggle Button */}
      <SheetTrigger asChild>
        <button className="p-2 m-4 bg-[#9B2242] text-white rounded-md fixed z-50">
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>

      {/* Sidebar Content */}
      <SheetContent side="left" className="w-64 bg-[#9B2242] text-white p-4">
        <h2 className="text-xl font-semibold mb-6">SRO Menu</h2>
        <ul className="space-y-4">
          <li>
            <Link to="/" className="block hover:text-gray-300">Home</Link>
          </li>
          <li>
            <Link to="/dashboard" className="block hover:text-gray-300">Dashboard</Link>
          </li>
          <li>
            <Link to="/activity-request" className="block hover:text-gray-300">Activity Request</Link>
          </li>
          <li>
            <Link to="/org-recognition" className="block hover:text-gray-300">Org Recognition</Link>
          </li>
          <li>
            <Link to="/reports" className="block hover:text-gray-300">Reports</Link>
          </li>
          <li>
            <Link to="/profile" className="block hover:text-gray-300">Profile</Link>
          </li>
          <li>
            <Link to="/admin" className="block hover:text-gray-300">Admin</Link>
          </li>
        </ul>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
