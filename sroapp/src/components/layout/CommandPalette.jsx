import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  CalendarCheck,
  Calendar,
  Award,
  BookOpen,
  Shield,
  Users,
  ClipboardList,
  FolderOpen,
  Settings,
} from "lucide-react";

const studentRoutes = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Requests", path: "/requests", icon: FileText },
  { label: "New Activity Request", path: "/activity-request", icon: PlusCircle },
  { label: "Book Appointment", path: "/appointment-booking", icon: CalendarCheck },
  { label: "Activities Calendar", path: "/activities-calendar", icon: Calendar },
  { label: "Recognition Application", path: "/org-application", icon: Award },
  { label: "Annual Report", path: "/annual-report", icon: BookOpen },
];

const adminRoutes = [
  { label: "Admin Dashboard", path: "/admin", icon: Shield },
  { label: "Create Activity", path: "/admin/create-activity", icon: PlusCircle },
  { label: "Student Activities", path: "/admin/student-activities", icon: ClipboardList },
  { label: "Appointments", path: "/admin/appointment-settings", icon: CalendarCheck },
  { label: "Student Forms", path: "/admin/documents", icon: FolderOpen },
  { label: "Organization Summary", path: "/admin/organizations", icon: Users },
  { label: "Recognition Applications", path: "/admin/org-applications", icon: Award },
  { label: "Annual Reports", path: "/admin/annual-reports", icon: BookOpen },
  { label: "Super Admin", path: "/admin/super-admin", icon: Settings },
];

const CommandPalette = ({ open, onOpenChange, role }) => {
  const navigate = useNavigate();

  const isStudent = role === 1;
  const isSRO = role === 2;
  const isODSA = role === 3;
  const isSuperAdmin = role === 4;
  const isAdviser = role === 5;
  const showStudent = isStudent || isSuperAdmin;
  const showAdmin = isSRO || isODSA || isSuperAdmin || isAdviser;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  const handleSelect = (path) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {showStudent && (
          <CommandGroup heading="Student">
            {studentRoutes.map((route) => (
              <CommandItem
                key={route.path}
                onSelect={() => handleSelect(route.path)}
                className="cursor-pointer"
              >
                <route.icon className="w-4 h-4 mr-2 text-sro-primary" />
                {route.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {showStudent && showAdmin && <CommandSeparator />}
        {showAdmin && (
          <CommandGroup heading="Admin">
            {adminRoutes.map((route) => (
              <CommandItem
                key={route.path}
                onSelect={() => handleSelect(route.path)}
                className="cursor-pointer"
              >
                <route.icon className="w-4 h-4 mr-2 text-sro-secondary" />
                {route.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
