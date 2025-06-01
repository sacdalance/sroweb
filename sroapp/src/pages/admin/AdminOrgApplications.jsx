import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateOrgStatus } from "@/api/updateOrgStatusAPI";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import supabase from "@/lib/supabase"; // Only for fetching, NOT for update!
import StatusPill from "@/components/ui/StatusPill";

const statusList = [
  "On Probation", "Warning", "Renewed/Duly", "Recognized", "Disaffiliated"
];

const categoriesList = [
  { id: "academic", name: "Academic & Socio-Academic Student Organizations" },
  { id: "socio-civic", name: "Socio-Civic/Cause-Oriented Organizations" },
  { id: "fraternity", name: "Fraternity/Sorority/Confraternity" },
  { id: "performing", name: "Performing Groups" },
  { id: "political", name: "Political Organizations" },
  { id: "regional", name: "Regional/Provincial and Socio-Cultural Organizations" },
  { id: "special", name: "Special Interests Organizations" },
  { id: "sports", name: "Sports and Recreation Organizations" },
  { id: "probation", name: "On Probation Organizations" }
];

const getCategoryName = (id) => categoriesList.find((cat) => cat.id === id)?.name || id;

const statusPill = (status) => {
  let pillColor = "bg-gray-200 text-gray-700";
  if (status === "Approved") pillColor = "bg-[#014421] text-white";
  else if (status === "Pending") pillColor = "bg-[#FFF7D6] text-[#A05A00]";
  else if (status === "Declined" || status === "Rejected") pillColor = "bg-[#800000] text-white";

  return (
    <span className={`text-xs px-3 py-1 rounded-full font-semibold inline-block ${pillColor}`}>
      {status}
    </span>
  );
};


const AdminOrgApplications = () => {
  const [roleId, setRoleId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [existingOrgs, setExistingOrgs] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [decision, setDecision] = useState(null);
  const [odsaDecision, setOdsaDecision] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Fetch roleId from account using supabase_uid
  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return toast.error("Not logged in.");
      const { data: profile, error } = await supabase
        .from("account")
        .select("role_id")
        .eq("supabase_uid", user.id)
        .single();
      if (error || !profile) toast.error("Account/role not found.");
      else setRoleId(profile.role_id);
    };
    fetchRole();
  }, []);

  // 2. Fetch applications and recognized orgs
  useEffect(() => {
    if (!roleId) return;
    const fetchApplications = async () => {
      let query = supabase.from("org_recognition").select("*").order("submitted_at", { ascending: false });
      if (roleId === 3) query = query.eq("sro_approved", true);
      const { data, error } = await query;
      if (!error) setApplications(data || []);
    };
    const fetchExistingOrgs = async () => {
      const { data, error } = await supabase.from("organization").select("org_name, academic_year");
      if (!error) setExistingOrgs(data || []);
    };
    fetchApplications();
    fetchExistingOrgs();
  }, [roleId]);

  const handleRowClick = (app) => {
    setSelectedApp(app);
    setDecision(app.sro_approved === true ? "yes" : app.sro_approved === false ? "no" : null);
    setOdsaDecision(app.odsa_approved === true ? "yes" : app.odsa_approved === false ? "no" : null);
    setStatus(app.new_org_status || "");
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedApp) return;
    if ((roleId === 2 && (decision === null || !status))
      || (roleId === 3 && odsaDecision === null)
      || (roleId === 4 && (decision === null || odsaDecision === null || !status))
    ) {
      toast.error("Complete all fields before submitting.");
      return;
    }
    setLoading(true);
    try {
      let update = {};
      if (roleId === 2) update = { sro_approved: decision === "yes", new_org_status: status };
      if (roleId === 3) update = { odsa_approved: odsaDecision === "yes" };
      if (roleId === 4) update = {
        sro_approved: decision === "yes",
        odsa_approved: odsaDecision === "yes",
        new_org_status: status,
      };
      await updateOrgStatus(selectedApp.recognition_id, update);

      toast.success("Decision saved.");
      setDialogOpen(false);
      setApplications(prev =>
        prev.map(a =>
          a.recognition_id === selectedApp.recognition_id ? { ...a, ...update } : a
        )
      );
    } catch (error) {
      toast.error(error.message || "Failed to save approval");
    } finally {
      setLoading(false);
    }
  };

  const isOrgExisting = (app) => {
    return existingOrgs.some(
      (org) => org.org_name === app.org_name && org.academic_year === app.academic_year
    );
  };

  const getStatus = (app) => {
    if (roleId === 2)
      return <StatusPill status={app.sro_approved === true ? "Approved" : app.sro_approved === false ? "Declined" : "Pending"} />;
    if (roleId === 3)
      return <StatusPill status={app.odsa_approved === true ? "Approved" : app.odsa_approved === false ? "Declined" : "Pending"} />;
    if (roleId === 4)
      return (
        <>
          <StatusPill status={app.sro_approved === true ? "Approved" : app.sro_approved === false ? "Declined" : "Pending"} />
          <br />
          <StatusPill status={app.odsa_approved === true ? "Approved" : app.odsa_approved === false ? "Declined" : "Pending"} />
        </>
      );
    return "-";
  };

  return (
    <div className="container mx-auto py-6 max-w-[1550px] scale-100 sm:scale-[0.97] transform origin-top">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#7B1113] mb-6">Organization Recognition Applications</h1>
      <div className="rounded-lg overflow-hidden shadow-md bg-white border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Submission Date</TableHead>
              <TableHead className="text-center">Organization</TableHead>
              <TableHead className="text-center">Organization Type</TableHead>
              <TableHead className="text-center">Chairperson</TableHead>
              <TableHead className="text-center">Academic Year</TableHead>
              <TableHead className="text-center">Existing Org?</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  No applications found for your role.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow
                  key={app.recognition_id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(app)}
                >
                  <TableCell className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">
                    {new Date(app.submitted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[150px] truncate" title={app.org_name}>
                    {app.org_name}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">
                    {getCategoryName(app.org_type)}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[150px] truncate" title={app.org_chairperson}>
                    {app.org_chairperson}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">
                    {app.academic_year}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">
                    {isOrgExisting(app) ? (
                      <span className="bg-[#014421] text-white text-xs px-3 py-1 rounded-full">Yes</span>
                    ) : (
                      <span className="bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded-full">No</span>
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[150px] truncate">
                    {getStatus(app)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog with <DialogDescription> for accessibility */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#3F3F3F]">
              {(roleId === 2 && "SRO") || (roleId === 3 && "ODSA") || (roleId === 4 && "Superadmin")} Approval
            </DialogTitle>
            <DialogDescription>
              {selectedApp
                ? `You are reviewing "${selectedApp.org_name}". Fill in the approval fields below and click confirm to proceed.`
                : "Approve or decline this organization application."}
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                <div>
                  <p className="font-semibold text-gray-700">Organization</p>
                  <p className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[150px] truncate" title={selectedApp.org_name}>
                    {selectedApp.org_name}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Type</p>
                  <p className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">
                    {getCategoryName(selectedApp.org_type)}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Chairperson</p>
                  <p className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[150px] truncate" title={selectedApp.org_chairperson}>
                    {selectedApp.org_chairperson}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Academic Year</p>
                  <p className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">
                    {selectedApp.academic_year}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Submitted At</p>
                  <p className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">
                    {new Date(selectedApp.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Existing Org?</p>
                  <p className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">
                    {isOrgExisting(selectedApp) ? (
                      <span className="bg-[#014421] text-white text-xs px-3 py-1 rounded-full">Yes</span>
                    ) : (
                      <span className="bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded-full">No</span>
                    )}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-semibold text-gray-700">Adviser</p>
                  <p className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[150px] truncate">
                    {selectedApp.org_adviser}
                  </p>
                </div>
                <div className="sm:col-span-2 pt-2">
                  <p className="font-semibold text-gray-700 mb-2">Drive Folder</p>
                  <Button className="bg-[#014421] hover:bg-[#013319] text-white font-medium px-4 py-2" asChild>
                    <a href={selectedApp.drive_folder_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Drive Folder
                    </a>
                  </Button>
                </div>
              </div>
              {(roleId === 2 || roleId === 4) && (
                <>
                  <div>
                    <label className="font-semibold text-gray-800">SRO Approval</label>
                    <RadioGroup value={decision} onValueChange={setDecision} className="flex gap-6 mt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <RadioGroupItem value="yes" className="border-black text-black" />
                        <span>Yes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <RadioGroupItem value="no" className="border-black text-black" />
                        <span>No</span>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 text-gray-800">New Organization Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full border rounded px-3 py-2">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusList.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {(roleId === 3 || roleId === 4) && (
                <div>
                  <label className="font-semibold text-gray-800">ODSA Approval</label>
                  <RadioGroup value={odsaDecision} onValueChange={setOdsaDecision} className="flex gap-6 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <RadioGroupItem value="yes" className="border-black text-black" />
                      <span>Yes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <RadioGroupItem value="no" className="border-black text-black" />
                      <span>No</span>
                    </div>
                  </RadioGroup>
                </div>
              )}
              <DialogFooter className="pt-4">
                <Button onClick={handleConfirm} className="bg-[#014421] hover:bg-green-900 text-white" disabled={loading}>Confirm</Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrgApplications;
