// ALTER TABLE organization DROP CONSTRAINT IF EXISTS organization_academic_year_key;

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { updateOrgStatus } from "@/api/updateOrgStatusAPI";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, ExternalLink, ClipboardList } from "lucide-react";
import supabase from "@/lib/supabase";
import StatusPill from "@/components/ui/StatusPill";
import LoadingSpinner from "@/components/ui/loading-spinner";
import DataTable from "@/components/ui/DataTable";

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
  const [dataLoading, setDataLoading] = useState(true);

  // 1. Fetch roleId from account using supabase_uid
  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("account")
        .select("role_id")
        .eq("supabase_uid", user.id)
        .single();
      if (profile) setRoleId(profile.role_id);
    };
    fetchRole();
  }, []);

  // 2. Fetch applications - Preserving existing role-based filtering logic
  useEffect(() => {
    if (!roleId) return;
    const fetchData = async () => {
      setDataLoading(true);
      try {
        let query = supabase.from("org_recognition").select("*").order("submitted_at", { ascending: false });
        
        // ROLE LOGIC: ODSA only sees what SRO has already approved
        if (roleId === 3) query = query.eq("sro_approved", true);
        
        const { data: appData, error: appError } = await query;
        if (!appError) setApplications(appData || []);

        const { data: orgData, error: orgError } = await supabase.from("organization").select("org_name, academic_year");
        if (!orgError) setExistingOrgs(orgData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [roleId]);

  const handleRowClick = (app) => {
    setSelectedApp(app);
    setDecision(app.sro_approved === true ? "yes" : app.sro_approved === false ? "no" : null);
    setOdsaDecision(app.odsa_approved === true ? "yes" : app.odsa_approved === false ? "no" : null);
    setStatus(app.org_status || "");
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedApp) return;
    
    // ROLE LOGIC: Define roles
    const isSRO = roleId === 2;
    const isODSA = roleId === 3;
    const isSuper = roleId === 4;

    let update = {};
    
    if (isSuper) {
      // SuperAdmin can update anything provided.
      if (decision !== null) update.sro_approved = decision === "yes";
      if (odsaDecision !== null) update.odsa_approved = odsaDecision === "yes";
      if (status) update.org_status = status;
      
      if (Object.keys(update).length === 0) {
        toast.error("Please make at least one decision before saving.");
        return;
      }
    } else if (isSRO) {
      if (decision === null || !status) {
        toast.error("SRO must provide both SRO approval, and a final organization status.");
        return;
      }
      update = { sro_approved: decision === "yes", org_status: status };
    } else if (isODSA) {
      if (odsaDecision === null) {
        toast.error("ODSA must provide an endorsement decision.");
        return;
      }
      update = { odsa_approved: odsaDecision === "yes" };
    }

    setLoading(true);
    try {
      await updateOrgStatus(selectedApp.recognition_id, update);

      toast.success("Changes saved successfully.");
      setDialogOpen(false);
      setApplications(prev =>
        prev.map(a =>
          a.recognition_id === selectedApp.recognition_id ? { ...a, ...update } : a
        )
      );
    } catch (error) {
      toast.error(error.message || "Failed to save update");
    } finally {
      setLoading(false);
    }
  };

  const isOrgExisting = (app) => {
    return existingOrgs.some(
      (org) => org.org_name === app.org_name && org.academic_year === app.academic_year
    );
  };

  // Define columns - Separate SRO and ODSA status columns as requested
  const columns = useMemo(() => {
    const cols = [
      {
        key: "submitted_at",
        header: "Submission Date",
        sortable: true,
        width: "w-32",
        render: (row) => (
          <div className="text-xs text-gray-500">
            {new Date(row.submitted_at).toLocaleDateString("en-US", {
              year: 'numeric', month: 'short', day: 'numeric'
            })}
          </div>
        )
      },
      {
        key: "org_name",
        header: "Organization Details",
        sortable: true,
        render: (row) => (
          <div className="flex flex-col text-left">
            <span className="font-semibold text-sm">{row.org_name}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{row.org_chairperson}</span>
          </div>
        )
      },
      {
        key: "org_type",
        header: "Type",
        sortable: true,
        filterable: true,
        filterLabel: "Category",
        filterOptions: categoriesList.map(cat => cat.name),
        filterAccessor: (row) => getCategoryName(row.org_type),
        render: (row) => (
          <div className="text-[11px] text-gray-600 line-clamp-1 max-w-[180px]" title={getCategoryName(row.org_type)}>
            {getCategoryName(row.org_type)}
          </div>
        )
      },
      {
        key: "academic_year",
        header: "Academic Year",
        sortable: true,
        width: "w-32",
        render: (row) => <div className="text-xs font-semibold text-gray-600 text-center bg-gray-50 px-2 py-0.5 rounded border border-gray-100 w-fit mx-auto">{row.academic_year}</div>
      },
      {
        key: "existing",
        header: "Existing?",
        sortable: true,
        width: "w-24",
        render: (row) => (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            isOrgExisting(row) ? "bg-sro-secondary/10 text-sro-secondary border border-sro-secondary/20" : "bg-gray-50 text-gray-400 border border-gray-100"
          }`}>
            {isOrgExisting(row) ? "Yes" : "No"}
          </span>
        )
      }
    ];

    // ROLE LOGIC: SRO status visible to SRO and SuperAdmin
    if (roleId === 2 || roleId === 4) {
      cols.push({
        key: "sro_status",
        header: "SRO Status",
        width: "w-32",
        isStatus: true,
        accessor: (row) => row.sro_approved === true ? "Approved" : row.sro_approved === false ? "Rejected" : "Pending"
      });
    }

    // ROLE LOGIC: ODSA status visible to ODSA and SuperAdmin
    if (roleId === 3 || roleId === 4) {
      cols.push({
        key: "odsa_status",
        header: "ODSA Status",
        width: "w-32",
        isStatus: true,
        accessor: (row) => row.odsa_approved === true ? "Approved" : row.odsa_approved === false ? "Rejected" : "Pending"
      });
    }

    // FINAL RECOGNITION STATUS
    cols.push({
      key: "final_status",
      header: "Final Status",
      width: "w-32",
      isStatus: true,
      accessor: (row) => {
        if (row.sro_approved === true && row.odsa_approved === true) return row.org_status || "Recognized";
        if (row.sro_approved === false || row.odsa_approved === false) return "Rejected";
        return "In Progress";
      }
    });

    return cols;
  }, [roleId, existingOrgs]);

  if (dataLoading) return <LoadingSpinner text="Loading recognition data..." variant="section" />;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-[1600px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b pb-6">
        <div>
          <h1 className="page-header text-sro-primary mb-0">Recognition Applications</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            Process and evaluate student organization recognition requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-sro-primary/5 border border-sro-primary/10 rounded-full px-4 py-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-sro-primary" />
            <span className="text-sm font-bold text-sro-primary">{applications.length} Applications Total</span>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={applications}
        onRowClick={handleRowClick}
        emptyMessage="No applications available for your current role permissions."
        defaultPageSize={10}
        defaultSort={{ key: "submitted_at", direction: "desc" }}
        viewMode="table"
        hideViewToggle={true}
        compactStatus={true}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sro-primary flex items-center gap-2">
              Review Application: {selectedApp?.org_id}
            </DialogTitle>
            <DialogDescription>
              Managing recognition status for <strong>{selectedApp?.org_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6 pt-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">Organization Name</p>
                  <p className="text-sm font-semibold">{selectedApp.org_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">Category</p>
                  <p className="text-sm">{getCategoryName(selectedApp.org_type)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">Chairperson</p>
                  <p className="text-sm">{selectedApp.org_chairperson}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">Academic Year</p>
                  <p className="text-sm font-mono">{selectedApp.academic_year}</p>
                </div>
                <div className="col-span-2 pt-2 border-t flex justify-between items-center">
                   <p className="text-xs text-gray-500 italic">Submitted on {new Date(selectedApp.submitted_at).toLocaleString()}</p>
                   <Button variant="outline" size="sm" asChild className="gap-2">
                    <a href={selectedApp.drive_folder_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Files
                    </a>
                  </Button>
                </div>
              </div>

              {/* SRO SECTION */}
              {(roleId === 2 || roleId === 4) && (
                <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
                  <h3 className="text-sm font-bold border-b pb-2 flex justify-between items-center text-gray-700">
                    SRO EVALUATION
                    {selectedApp.sro_approved !== null && (
                      <StatusPill status={selectedApp.sro_approved ? "Approved" : "Rejected"} compact />
                    )}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold block mb-2 text-gray-600">Approval Decision</label>
                      <RadioGroup value={decision} onValueChange={setDecision} className="flex gap-4">
                        <div className="flex items-center gap-2 border px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 bg-white">
                          <RadioGroupItem value="yes" id="sro-yes" className="text-sro-secondary border-sro-secondary" />
                          <label htmlFor="sro-yes" className="text-sm cursor-pointer font-medium">Approved</label>
                        </div>
                        <div className="flex items-center gap-2 border px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 bg-white">
                          <RadioGroupItem value="no" id="sro-no" className="text-sro-primary border-sro-primary" />
                          <label htmlFor="sro-no" className="text-sm cursor-pointer font-medium text-sro-primary">Declined</label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-2 text-gray-600">Official Status</label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full bg-white h-10">
                          <SelectValue placeholder="Select official status" />
                        </SelectTrigger>
                        <SelectContent className="z-[10001]">
                          {statusList.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* ODSA SECTION */}
              {(roleId === 3 || roleId === 4) && (
                <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
                  <h3 className="text-sm font-bold border-b pb-2 flex justify-between items-center text-gray-700">
                    ODSA FINAL APPROVAL
                    {selectedApp.odsa_approved !== null && (
                      <StatusPill status={selectedApp.odsa_approved ? "Approved" : "Rejected"} compact />
                    )}
                  </h3>
                  <div>
                    <label className="text-xs font-semibold block mb-2 text-gray-600">Final Endorsement</label>
                    <RadioGroup value={odsaDecision} onValueChange={setOdsaDecision} className="flex gap-4">
                      <div className="flex items-center gap-2 border px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 bg-white">
                        <RadioGroupItem value="yes" id="odsa-yes" className="text-sro-secondary border-sro-secondary" />
                        <label htmlFor="odsa-yes" className="text-sm cursor-pointer font-medium">Endorsed</label>
                      </div>
                      <div className="flex items-center gap-2 border px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 bg-white">
                        <RadioGroupItem value="no" id="odsa-no" className="text-sro-primary border-sro-primary" />
                        <label htmlFor="odsa-no" className="text-sm cursor-pointer font-medium text-sro-primary">Disapproved</label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
                <Button 
                  onClick={handleConfirm} 
                  className="bg-sro-primary hover:bg-sro-primary/90 text-white min-w-[120px]" 
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Selection"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrgApplications;
