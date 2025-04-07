import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import supabase from "@/lib/supabase"; // Import Supabase client

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null); // State to store user data
  const navigate = useNavigate(); // Navigation function

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
    };

    fetchUser();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);


  const isValidUPMail = user && user.email.endsWith("@up.edu.ph"); 

  // Handle Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); // Clear user state
    navigate("/login"); // Redirect to login page
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Sidebar Toggle Button */}
      <SheetTrigger asChild>
        <button 
          className="p-2 m-4 bg-[#7B1113] text-white rounded-md fixed z-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isValidUPMail}>
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>

      {/* Sidebar Content */}
      <SheetContent side="left" className="w-64 bg-[#7B1113] text-white p-4">
        {/* User Info Section */}
        {user && (
          <div className="flex flex-col items-center mb-6">
            <img
              src={user.user_metadata?.avatar_url || "https://via.placeholder.com/80"}
              alt="User Profile"
              className="w-20 h-20 rounded-full border-2 border-white"
            />
            <p className="mt-2 text-lg font-medium">{user.user_metadata?.full_name || "User"}</p>
            <p className="text-sm text-gray-300">{user.email}</p>
          </div>
        )}

        {/* Navigation Links */}
        <ul className="space-y-4">
          <li><Link to="/" className="block hover:text-gray-300">Home</Link></li>
          <li><Link to="/dashboard" className="block hover:text-gray-300">Dashboard</Link></li>
          <li><Link to="/activity-request" className="block hover:text-gray-300">Activity Request</Link></li>
          <li><Link to="/org-recognition" className="block hover:text-gray-300">Org Recognition</Link></li>
          <li><Link to="/reports" className="block hover:text-gray-300">Reports</Link></li>
          <li><Link to="/profile" className="block hover:text-gray-300">Profile</Link></li>
          <li><Link to="/admin" className="block hover:text-gray-300">Admin</Link></li>
        </ul>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="mt-6 w-full bg-[#5e0d0e] text-white py-2 rounded-md hover:bg-[#3D0808] transition"
        >
          Sign Out
        </button>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
