import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";
import { Button } from "@/components/ui/button";
import { SettingsSkeleton } from "@/components/ui/skeletons";

const ROLE_OPTIONS = [
    { id: 1, label: "Student" },
    { id: 2, label: "SRO" },
    { id: 3, label: "ODSA" },
    { id: 4, label: "Superadmin" },
    { id: 5, label: "Advisor" },
];

import { SUPERADMIN_EMAILS } from "@/lib/permissions";


const SuperAdminPage = () => {
    const [user, setUser] = useState(null);
    const [currentRole, setCurrentRole] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [accountId, setAccountId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [skipValidation, setSkipValidation] = useState(
        () => sessionStorage.getItem("sroSkipValidation") === "true"
    );

    useEffect(() => {
        const fetchUserAndRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data, error } = await supabase
                    .from("account")
                    .select("role_id, account_id")
                    .eq("email", user.email)
                    .single();

                if (!error && data) {
                    setCurrentRole(data.role_id);
                    setSelectedRole(data.role_id); // Initialize dropdown with current role
                    setAccountId(data.account_id);
                }
            }
            setLoading(false);
        };

        fetchUserAndRole();
    }, []);

    const handleRoleChange = async () => {
        if (!accountId) return;

        // Optimistic update or waiting?
        const { error } = await supabase
            .from("account")
            .update({ role_id: selectedRole })
            .eq("account_id", accountId);

        if (!error) {
            alert("Role updated! The page will reload.");
            window.location.reload();
        } else {
            alert("Error updating role: " + error.message);
        }
    };

    if (loading) return <SettingsSkeleton />;

    if (!user || !SUPERADMIN_EMAILS.includes(user.email)) {
        return <div className="p-8 text-center text-red-600">Unauthorized Access</div>;
    }

    return (
        <div className="p-6 md:p-10 space-y-6">
            <h1 className="text-3xl font-bold text-sro-primary">Super Admin Controls</h1>
            <p className="text-gray-600">Use this page to manage sensitive settings and testing utilities.</p>

            <div className="bg-white p-6 rounded-lg shadow-md border max-w-md">
                <h2 className="text-xl font-semibold mb-4">Testing Cheats</h2>
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Skip Form Validation</label>
                        <p className="text-xs text-gray-500">Bypass all required fields in activity forms</p>
                    </div>
                    <button
                        onClick={() => {
                            const next = !skipValidation;
                            setSkipValidation(next);
                            sessionStorage.setItem("sroSkipValidation", String(next));
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${skipValidation ? "bg-sro-primary" : "bg-gray-300"}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${skipValidation ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                </div>
                <h3 className="text-lg font-semibold mb-3">Role Switcher</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Current Role: <span className="font-bold">{ROLE_OPTIONS.find(r => r.id === currentRole)?.label || "Unknown"}</span></label>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Select New Role</label>
                        <UnifiedDropdown
                            options={ROLE_OPTIONS.map(opt => ({ value: String(opt.id), label: opt.label }))}
                            value={String(selectedRole)}
                            onChange={val => setSelectedRole(Number(val))}
                            placeholder="Select role"
                        />
                    </div>
                    <Button
                        className="w-full bg-sro-primary hover:bg-sro-primary/90 text-white"
                        onClick={handleRoleChange}
                    >
                        Apply Role & Reload
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminPage;
