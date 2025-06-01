import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

// Editable list of superadmin emails
export const SUPERADMIN_EMAILS = [
  "clpagunsan@up.edu.ph",
  "dvnisay1@up.edu.ph",
  "mmlarua@up.edu.ph",
  "ltcuadra@up.edu.ph",
  "lssacdalan@up.edu.ph",
];

const ROLE_OPTIONS = [
  { id: 1, label: "Student" },
  { id: 2, label: "SRO" },
  { id: 3, label: "ODSA" },
  { id: 4, label: "Superadmin" },
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
        className="ml-4 px-4 py-2 rounded bg-[#7B1113] hover:bg-[#5e0d0e] text-white font-semibold text-sm shadow transition"
        style={{ border: "1px solid #fff", marginLeft: 16 }}
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
              <Select value={String(selectedRole)} onValueChange={val => setSelectedRole(Number(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.id} value={String(opt.id)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-[#014421] hover:bg-[#013a1c] text-white"
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