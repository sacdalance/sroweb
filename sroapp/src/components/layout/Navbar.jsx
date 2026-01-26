import { Menu } from "lucide-react";
import PropTypes from 'prop-types';
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import SuperadminCheatDialog from "@/components/admin/SuperadminCheatDialog";

const Navbar = ({ onMenuClick }) => {
  const [userEmail, setUserEmail] = useState("");
  const [roleId, setRoleId] = useState(null);
  const [accountId, setAccountId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email);
      const { data: account, error } = await supabase
        .from("account")
        .select("role_id, account_id, email")
        .eq("email", user.email)
        .single();
      if (!error && account) {
        setRoleId(account.role_id);
        setAccountId(account.account_id);
      }
    };
    fetchUser();
  }, []);

  const handleRoleChange = async (newRoleId) => {
    if (!userEmail || !accountId) return;
    const { error } = await supabase
      .from("account")
      .update({ role_id: newRoleId })
      .eq("account_id", accountId);
    if (!error) setRoleId(newRoleId);
    // Optionally, you can show a toast or reload the page
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-[#7B1113] text-white z-50 shadow-md">
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
          <SuperadminCheatDialog
            userEmail={userEmail}
            currentRoleId={roleId}
            onRoleChange={handleRoleChange}
          />
        </div>
      </div>
    </div>
  );
};

Navbar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  sidebarOpen: PropTypes.bool, // Optional, but can be kept for future use
};

export default Navbar;
