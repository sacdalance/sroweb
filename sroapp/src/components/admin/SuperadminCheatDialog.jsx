import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";

import { SUPERADMIN_EMAILS } from "@/lib/permissions";


const ROLE_OPTIONS = [
  { id: 1, label: "Student" },
  { id: 2, label: "SRO" },
  { id: 3, label: "ODSA" },
  { id: 4, label: "Superadmin" },
  { id: 5, label: "Advisor" },
];

export default function SuperadminCheatDialog({ userEmail, currentRoleId, onRoleChange }) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRoleId || 1);

  useEffect(() => {
    setSelectedRole(currentRoleId);
  }, [currentRoleId]);

  // Only show for superadmin emails
  if (!SUPERADMIN_EMAILS.includes(userEmail)) return null;

  return (
    <>
      {/* Navbar-style button */}
      <button
        className="ml-4 px-4 py-2 rounded bg-sro-primary hover:bg-sro-primary/90 text-white font-semibold text-sm shadow transition border border-white ml-4"
        onClick={() => setOpen(true)}
      >
        Super Idol Cheats
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Superadmin Cheats</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block mb-1 text-sm font-medium">Set Role</label>
              <UnifiedDropdown
                options={ROLE_OPTIONS.map(opt => ({ value: String(opt.id), label: opt.label }))}
                value={String(selectedRole)}
                onChange={val => setSelectedRole(Number(val))}
                placeholder="Select role"
              />
            </div>
            <Button
              className="w-full bg-sro-secondary hover:bg-sro-secondary/90 text-white"
              onClick={() => {
                onRoleChange(selectedRole);
                setOpen(false);
                window.location.reload();
              }}
            >
              Apply Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 