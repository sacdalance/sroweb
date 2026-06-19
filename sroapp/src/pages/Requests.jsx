import { useState, useEffect, useMemo } from "react";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL, authFetch } from "@/lib/api-config";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { useAuth } from "@/context/UserAuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, AlertTriangle, Pencil, ExternalLink } from "lucide-react";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import { toast } from 'sonner';
import DataTable from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StatusPill from "@/components/ui/StatusPill";


const Requests = () => {
  const [requested, setRequested] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isAppealOpen, setIsAppealOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelActivity, setCancelActivity] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [modalAppealReason, setModalAppealReason] = useState("");
  const [editingActivity, setEditingActivity] = useState(null);
  const navigate = useNavigate();
  const { accountId, loading: authLoading } = useAuth();
  const [annualReports, setAnnualReports] = useState([]);
  const [recognitionApps, setRecognitionApps] = useState([]);
  const [selectedRecognition, setSelectedRecognition] = useState(null);

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

  const formatDateRange = (schedule) => {
    if (!Array.isArray(schedule) || schedule.length === 0) return "TBD";
    const { start_date, end_date } = schedule[0];
    try {
      const start = new Date(start_date).toLocaleDateString();
      const endFormatted = end_date ? new Date(end_date).toLocaleDateString() : "";
      return start === endFormatted || !endFormatted ? start : `${start} - ${endFormatted}`;
    } catch {
      return "TBD";
    }
  }


  const isEventPassed = (schedule) => {
    if (!Array.isArray(schedule) || schedule.length === 0) return false;
    const lastEvent = schedule[schedule.length - 1]; // Use the last scheduled date? Or the first? Usually last.
    // Let's check the start_date of the first event, as usually that's the main reference, or maybe the end_date if it exists.
    // SAFE BET: Check the activity's END date (or start if single day). If Today > End Date, it's passed.

    // We can iterate and find the LATEST date in the schedule.
    let maxDate = 0;
    schedule.forEach(s => {
      const end = s.end_date ? new Date(s.end_date).getTime() : new Date(s.start_date).getTime();
      if (end > maxDate) maxDate = end;
    });

    // Compare with today (set to midnight to be lenient, or use current time)
    // Actually, simple check: if maxDate < today, it's passed.
    return maxDate < new Date().setHours(0, 0, 0, 0);
  };

  const getRecognitionStatus = (app) => {
    if (app.sro_approved === false || app.odsa_approved === false) return "Rejected";
    if (app.sro_approved && app.odsa_approved) return app.org_status || "Recognized";
    return "Pending";
  };

  // Get unique org options for filter (Activity Requests)
  const orgOptions = useMemo(() =>
    [...new Set(requested.map((a) => a.organization?.org_name || "Unknown"))].sort(),
    [requested]
  );

  // Get unique org options for Approved Activities filter
  const approvedOrgOptions = useMemo(() =>
    [...new Set(approved.map((a) => a.organization?.org_name || "Unknown"))].sort(),
    [approved]
  );

  // Get unique options for Recognition filters
  const recognitionOrgOptions = useMemo(() =>
    [...new Set(recognitionApps?.map((a) => a.org_name || "Unknown") || [])].sort(),
    [recognitionApps]
  );

  const recognitionStatusOptions = useMemo(() =>
    [...new Set(recognitionApps?.map((a) => getRecognitionStatus(a)) || [])].sort(),
    [recognitionApps]
  );

  const recognitionYearOptions = useMemo(() =>
    [...new Set(recognitionApps?.map((a) => a.academic_year) || [])].sort().reverse(),
    [recognitionApps]
  );

  // Get unique options for Annual Reports filters
  const reportsOrgOptions = useMemo(() =>
    [...new Set(annualReports.map((r) => r.organization?.org_name || r.org_name || "Unknown"))].sort(),
    [annualReports]
  );
  const reportsYearOptions = useMemo(() =>
    [...new Set(annualReports.map((r) => r.academic_year))].sort().reverse(),
    [annualReports]
  );

  useEffect(() => {
    if (authLoading || !accountId) return;

    const fetchActivities = async () => {
      const res = await authFetch(`${API_BASE_URL}/activities/user/${accountId}?limit=200`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      const result = await res.json();
      const all = result.data ?? result;

      const requestedActivities = all.filter((a) => a.final_status !== "Approved");
      const approvedActivities = all.filter((a) => a.final_status === "Approved");

      setRequested(requestedActivities);
      setApproved(approvedActivities);
      setLoading(false);
    };

    fetchActivities();
  }, [accountId, authLoading]);

  useEffect(() => {
    const fetchAnnualReports = async () => {
      const { data, error } = await supabase
        .from("org_annual_report")
        .select("*, organization:org_id (org_name)")
        .eq("submitted_by", accountId);

      if (!error && data) setAnnualReports(data);
    };

    if (accountId) fetchAnnualReports();
  }, [accountId]);

  useEffect(() => {
    const fetchRecognitionApps = async () => {
      const { data, error } = await supabase
        .from("org_recognition")
        .select("recognition_id, academic_year, submitted_at, sro_approved, odsa_approved, org_name, org_status, org_type, org_chairperson, drive_folder_link")
        .eq("submitted_by", accountId);

      if (!error && data) {
        setRecognitionApps(data);
      }
    };

    if (accountId) {
      fetchRecognitionApps();
    }
  }, [accountId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">My Requests</h1>
        <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-28" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const handleCancel = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/activityCancel/cancel/${cancelActivity.activity_id}`, {
        method: 'PUT',
        body: JSON.stringify({ appeal_reason: cancelReason }),
      });

      if (response.ok) {
        setRequested(prev => [...prev, { ...cancelActivity, final_status: "For Cancellation", appeal_reason: cancelReason }]);
        setApproved(prev => prev.filter(act => act.activity_id !== cancelActivity.activity_id));
        setIsCancelOpen(false);
        setCancelReason("");
        toast.success("Activity marked for cancellation");
      }
    } catch (error) {
      console.error("Error cancelling activity:", error);
      toast.error("Failed to cancel activity");
    }
  };

  // Handle row click for activity tables
  // The row already carries the full activity record from the initial fetch
  // (same endpoint/payload as below), so just reuse it instead of refetching.
  const handleActivityRowClick = (act) => {
    setSelectedActivity(act);
  };

  // Column definitions for Activity Requests table
  const requestedColumns = [
    {
      key: "organization",
      header: "Organization",
      width: "w-[18%]",
      sortable: true,
      filterable: true,
      filterOptions: orgOptions,
      filterLabel: "Organizations",
      filterAccessor: (row) => row.organization?.org_name || "Unknown",
      sortAccessor: (row) => row.organization?.org_name || "Unknown",
      render: (row) => (
        <span className="truncate block text-gray-700" title={row.organization?.org_name || "Unknown"}>
          {row.organization?.org_name || "Unknown"}
        </span>
      ),
    },
    {
      key: "activity_name",
      header: "Title",
      width: "w-[22%]",
      sortable: true,
      render: (row) => (
        <span className="truncate block text-gray-700 font-medium" title={row.activity_name}>
          {row.activity_name}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Submission Date",
      width: "w-[15%]",
      sortable: true,
      sortAccessor: (row) => new Date(row.created_at).getTime(),
      render: (row) => (
        <span className="text-gray-600">
          {new Date(row.created_at).toLocaleDateString('en-US')}
        </span>
      ),
    },
    {
      key: "schedule",
      header: "Activity Date",
      width: "w-[15%]",
      sortable: true,
      sortAccessor: (row) => row.schedule?.[0]?.start_date || "",
      render: (row) => (
        <span className="text-gray-600">{formatDateRange(row.schedule)}</span>
      ),
    },
    {
      key: "final_status",
      header: "Status",
      width: "w-[12%]",
      sortable: true,
      filterable: true,
      filterOptions: ["Pending Adviser", "Pending SRO", "Pending ODSA", "For Appeal", "Rejected", "For Cancellation"],
      filterLabel: "Statuses",
      filterAccessor: (row) => {
        if (row.final_status) return row.final_status;
        if (!row.adviser_approval_status || row.adviser_approval_status === "Pending") return "Pending Adviser";
        if (row.adviser_approval_status === "Approved" && (!row.sro_approval_status || row.sro_approval_status === "Pending")) return "Pending SRO";
        if (row.sro_approval_status === "Approved" && (!row.odsa_approval_status || row.odsa_approval_status === "Pending")) return "Pending ODSA";
        return "Pending Adviser";
      },
      isStatus: true,
      accessor: (row) => {
        if (row.final_status) return row.final_status;
        if (!row.adviser_approval_status || row.adviser_approval_status === "Pending") return "Pending Adviser";
        if (row.adviser_approval_status === "Approved" && (!row.sro_approval_status || row.sro_approval_status === "Pending")) return "Pending SRO";
        if (row.sro_approval_status === "Approved" && (!row.odsa_approval_status || row.odsa_approval_status === "Pending")) return "Pending ODSA";
        return "Pending Adviser";
      },
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[15%]",
      render: (row) => (
        !["For Appeal", "Rejected", "For Cancellation"].includes(row.final_status) && !isEventPassed(row.schedule) && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingActivity(row);
                setIsAppealOpen(true);
              }}
              className="p-1.5 text-gray-500 hover:text-sro-secondary transition-colors rounded hover:bg-gray-100"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCancelActivity(row);
                setIsCancelOpen(true);
              }}
              className="p-1.5 text-gray-500 hover:text-sro-primary transition-colors rounded hover:bg-gray-100"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      ),
    },
  ];

  // Column definitions for Approved Activities table
  const approvedColumns = [
    {
      key: "organization",
      header: "Organization",
      width: "w-[18%]",
      sortable: true,
      filterable: true,
      filterOptions: approvedOrgOptions,
      filterLabel: "Organizations",
      filterAccessor: (row) => row.organization?.org_name || "Unknown",
      sortAccessor: (row) => row.organization?.org_name || "Unknown",
      render: (row) => (
        <span className="truncate block text-gray-700" title={row.organization?.org_name || "Unknown"}>
          {row.organization?.org_name || "Unknown"}
        </span>
      ),
    },
    {
      key: "activity_name",
      header: "Title",
      width: "w-[22%]",
      sortable: true,
      render: (row) => (
        <span className="truncate block text-gray-700 font-medium" title={row.activity_name}>
          {row.activity_name}
        </span>
      ),
    },
    {
      key: "schedule",
      header: "Activity Date",
      width: "w-[15%]",
      sortable: true,
      sortAccessor: (row) => row.schedule?.[0]?.start_date || "",
      render: (row) => (
        <span className="text-gray-600">{formatDateRange(row.schedule)}</span>
      ),
    },
    {
      key: "venue",
      header: "Proposed Venue",
      width: "w-[18%]",
      sortable: true,
      render: (row) => (
        <span className="truncate block text-gray-600" title={row.venue}>
          {row.venue}
        </span>
      ),
    },
    {
      key: "activity_id",
      header: "Activity ID",
      width: "w-[12%]",
      sortable: true,
      render: (row) => (
        <span className="text-gray-600 font-mono text-xs">{row.activity_id}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[15%]",
      render: (row) => (
        !isEventPassed(row.schedule) && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingActivity(row);
                setIsAppealOpen(true);
              }}
              className="p-1.5 text-gray-500 hover:text-sro-secondary transition-colors rounded hover:bg-gray-100"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCancelActivity(row);
                setIsCancelOpen(true);
              }}
              className="p-1.5 text-gray-500 hover:text-sro-primary transition-colors rounded hover:bg-gray-100"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

        )
      ),
    },
  ];

  // Column definitions for Recognition table
  const recognitionColumns = [
    {
      key: "org_name",
      header: "Organization",
      width: "w-[35%]",
      sortable: true,
      filterable: true,
      filterOptions: recognitionOrgOptions,
      filterLabel: "Organizations",
      filterAccessor: (row) => row.org_name || "Unknown",
      render: (row) => (
        <span className="truncate block text-gray-700" title={row.org_name || "Unknown"}>
          {row.org_name || "Unknown"}
        </span>
      ),
    },
    {
      key: "academic_year",
      header: "Academic Year",
      width: "w-[20%]",
      sortable: true,
      filterable: true,
      filterOptions: recognitionYearOptions,
      filterLabel: "Years",
      render: (row) => <span className="text-gray-600">{row.academic_year}</span>,
    },
    {
      key: "submitted_at",
      header: "Submission Date",
      width: "w-[25%]",
      sortable: true,
      sortAccessor: (row) => new Date(row.submitted_at).getTime(),
      render: (row) => (
        <span className="text-gray-600">
          {new Date(row.submitted_at).toLocaleDateString('en-US')}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "w-[20%]",
      sortable: true,
      filterable: true,
      filterOptions: recognitionStatusOptions,
      filterLabel: "Status",
      isStatus: true,
      accessor: (row) => getRecognitionStatus(row),
    },
  ];

  // Column definitions for Annual Reports table
  const annualReportsColumns = [
    {
      key: "organization",
      header: "Organization",
      width: "w-[35%]",
      sortable: true,
      filterable: true,
      filterOptions: reportsOrgOptions,
      filterLabel: "Organizations",
      filterAccessor: (row) => row.organization?.org_name || row.org_name || "Unknown",
      sortAccessor: (row) => row.organization?.org_name || row.org_name || "Unknown",
      render: (row) => (
        <span className="truncate block text-gray-700" title={row.organization?.org_name || row.org_name || "Unknown"}>
          {row.organization?.org_name || row.org_name || "Unknown"}
        </span>
      ),
    },
    {
      key: "academic_year",
      header: "Academic Year",
      width: "w-[20%]",
      sortable: true,
      filterable: true,
      filterOptions: reportsYearOptions,
      filterLabel: "Years",
      render: (row) => <span className="text-gray-600">{row.academic_year}</span>,
    },
    {
      key: "submitted_at",
      header: "Submission Date",
      width: "w-[25%]",
      sortable: true,
      sortAccessor: (row) => new Date(row.submitted_at).getTime(),
      render: (row) => (
        <span className="text-gray-600">
          {new Date(row.submitted_at).toLocaleDateString('en-US')}
        </span>
      ),
    },
    {
      key: "report_id",
      header: "Report ID",
      width: "w-[20%]",
      sortable: true,
      render: (row) => (
        <span className="text-gray-600 font-mono text-xs">{row.report_id}</span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">My Requests</h1>

      <Tabs defaultValue="requested" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="requested">Activity Requests</TabsTrigger>
          <TabsTrigger value="approved">Approved Activities</TabsTrigger>
          <TabsTrigger value="recognition">Org Recognition</TabsTrigger>
          <TabsTrigger value="reports">Annual Reports</TabsTrigger>
        </TabsList>

        {/* Activity Requests Tab */}
        <TabsContent value="requested">
          <DataTable
            columns={requestedColumns}
            data={requested.map(act => ({ ...act, id: act.activity_id }))}
            onRowClick={handleActivityRowClick}
            emptyMessage="No activity requests found."
            defaultSort={{ key: "created_at", direction: "desc" }}
          />
        </TabsContent>

        {/* Approved Activities Tab */}
        <TabsContent value="approved">
          <DataTable
            columns={approvedColumns}
            data={approved.map(act => ({ ...act, id: act.activity_id }))}
            onRowClick={handleActivityRowClick}
            emptyMessage="No approved activities found."
            defaultSort={{ key: "created_at", direction: "desc" }}
          />
        </TabsContent>

        {/* Org Recognition Tab */}
        <TabsContent value="recognition">
          <DataTable
            columns={recognitionColumns}
            data={(recognitionApps || []).map(app => ({ ...app, id: app.recognition_id }))}
            onRowClick={setSelectedRecognition}
            emptyMessage="No recognition applications found."
            defaultSort={{ key: "submitted_at", direction: "desc" }}
          />
        </TabsContent>

        {/* Annual Reports Tab */}
        <TabsContent value="reports">
          <DataTable
            columns={annualReportsColumns}
            data={annualReports.map(report => ({ ...report, id: report.report_id }))}
            onRowClick={(row) => window.open(row.drive_folder_link, '_blank')}
            emptyMessage="No annual reports found."
            defaultSort={{ key: "submitted_at", direction: "desc" }}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Submission Dialog */}
      <Dialog open={isAppealOpen} onOpenChange={setIsAppealOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] max-w-[90vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-sro-secondary text-center sm:text-left">
              Edit Submission
            </DialogTitle>
            <DialogDescription className="text-center sm:text-left">
              You will be redirected to a form prefilled with your activity data where you can edit it.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col items-center sm:flex-row sm:items-start gap-3 my-2 text-center sm:text-left">
            <AlertTriangle className="hidden sm:block h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 flex-1">
              <p className="font-semibold mb-1">Warning: Irreversible Action</p>
              <p>Editing your submission will revert its status to <strong>FOR APPEAL</strong>. You will need to wait for approval again.</p>
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="appealReason" className="text-sm font-medium">Reason for Appeal</Label>
              <Textarea
                id="appealReason"
                value={modalAppealReason}
                onChange={(e) => setModalAppealReason(e.target.value)}
                placeholder="Please describe why you need to edit this submission..."
                className="resize-none min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAppealOpen(false);
                setModalAppealReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="sro-secondary"
              onClick={() => {
                navigate("/edit-activity", { state: { activity: editingActivity, appealReason: modalAppealReason } });
                setIsAppealOpen(false);
                setModalAppealReason("");
              }}
              disabled={!modalAppealReason.trim()}
            >
              Proceed to Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Submission Dialog */}
      {/* Cancel Submission Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] max-w-[90vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-sro-primary text-center sm:text-left">
              Cancel Submission
            </DialogTitle>
            <DialogDescription className="text-center sm:text-left">
              Completely withdraw your activity request.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col items-center sm:flex-row sm:items-start gap-3 my-2 text-center sm:text-left">
            <AlertTriangle className="hidden sm:block h-5 w-5 text-sro-primary shrink-0 mt-0.5" />
            <div className="text-sm text-sro-primary flex-1">
              <p className="font-semibold mb-1">Warning: Irreversible Action</p>
              <p>Cancelling your submission will change its status to <strong>FOR CANCELLATION</strong>. This cannot be undone.</p>
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cancelReason" className="text-sm font-medium">Reason for Cancellation</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please explain why you are cancelling this submission..."
                className="resize-none min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelOpen(false);
                setCancelReason("");
              }}
            >
              Keep Submission
            </Button>
            <Button
              variant="sro-primary"
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Details Dialog */}
      {selectedActivity && (
        <Dialog open={true} onOpenChange={() => setSelectedActivity(null)}>
          <ActivityDialogContent
            activity={selectedActivity}
            isModalOpen={true}
            readOnly={true}
          />
        </Dialog>
      )}

      {/* Org Recognition Details Dialog */}
      <Dialog open={!!selectedRecognition} onOpenChange={() => setSelectedRecognition(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sro-primary">Recognition Application Details</DialogTitle>
            <DialogDescription>
              Status for <strong>{selectedRecognition?.org_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedRecognition && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">Organization Name</p>
                  <p className="text-sm font-semibold">{selectedRecognition.org_name || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">Category</p>
                  <p className="text-sm">{getCategoryName(selectedRecognition.org_type)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">Chairperson</p>
                  <p className="text-sm">{selectedRecognition.org_chairperson || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">Academic Year</p>
                  <p className="text-sm font-mono">{selectedRecognition.academic_year}</p>
                </div>
                <div className="sm:col-span-2 pt-2 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <p className="text-xs text-gray-500 italic">
                    Submitted on {new Date(selectedRecognition.submitted_at).toLocaleString()}
                  </p>
                  {selectedRecognition.drive_folder_link && (
                    <Button variant="outline" size="sm" asChild className="gap-2 w-full sm:w-auto">
                      <a href={selectedRecognition.drive_folder_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Files
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">SRO Status</span>
                  <StatusPill status={selectedRecognition.sro_approved === true ? "Approved" : selectedRecognition.sro_approved === false ? "Rejected" : "Pending"} compact />
                </div>
                <div className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">ODSA Status</span>
                  <StatusPill status={selectedRecognition.odsa_approved === true ? "Approved" : selectedRecognition.odsa_approved === false ? "Rejected" : "Pending"} compact />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Requests;
