import { useState, useEffect, useMemo } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { API_BASE_URL, authFetch } from "@/lib/api-config";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, AlertTriangle, Pencil } from "lucide-react";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import { toast } from 'sonner';
import DataTable from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


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
  const [dialogLoading, setDialogLoading] = useState(false);
  const navigate = useNavigate();
  const [accountId, setAccountId] = useState(null);
  const [annualReports, setAnnualReports] = useState([]);
  const [recognitionApps, setRecognitionApps] = useState([]);

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

  // Pending recognition apps (not fully approved)
  const pendingRecognitions = useMemo(() => recognitionApps?.filter((app) => !(app.sro_approved && app.odsa_approved)) || [], [recognitionApps]);
  // Approved recognition apps
  const approvedRecognitions = useMemo(() => recognitionApps?.filter((app) => app.sro_approved && app.odsa_approved) || [], [recognitionApps]);

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
  const pendingRecognitionOrgOptions = useMemo(() =>
    [...new Set(pendingRecognitions.map((a) => a.org_name || "Unknown"))].sort(),
    [pendingRecognitions]
  );

  const approvedRecognitionOrgOptions = useMemo(() =>
    [...new Set(approvedRecognitions.map((a) => a.org_name || "Unknown"))].sort(),
    [approvedRecognitions]
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
    const fetchActivities = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: account } = await supabase
        .from("account")
        .select("account_id")
        .eq("email", user.email)
        .single();

      if (!account) return;

      const res = await authFetch(`${API_BASE_URL}/activities/user/${account.account_id}`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      setAccountId(account.account_id);
      const all = await res.json();

      const requestedActivities = all.filter((a) => a.final_status !== "Approved");
      const approvedActivities = all.filter((a) => a.final_status === "Approved");

      setRequested(requestedActivities);
      setApproved(approvedActivities);
      setLoading(false);
    };

    fetchActivities();
  }, []);

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
        .select("recognition_id, academic_year, submitted_at, sro_approved, odsa_approved, org_name, org_status")
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
    return <LoadingSpinner text="Loading activities..." variant="section" />;
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
  const handleActivityRowClick = async (act) => {
    setDialogLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/activities/user/${accountId}`);
      const data = await res.json();
      const fullActivity = data.find((a) => a.activity_id === act.activity_id);
      setSelectedActivity(fullActivity);
    } catch (err) {
      console.error("Error fetching activity with account info:", err);
    } finally {
      setDialogLoading(false);
    }
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
        if (!row.adviser_approval_status) return "Pending Adviser";
        if (row.adviser_approval_status === "Approved" && !row.sro_approval_status) return "Pending SRO";
        if (row.sro_approval_status === "Approved" && !row.odsa_approval_status) return "Pending ODSA";
        return "Pending Adviser";
      },
      isStatus: true,
      accessor: (row) => {
        if (row.final_status) return row.final_status;
        if (!row.adviser_approval_status) return "Pending Adviser";
        if (row.adviser_approval_status === "Approved" && !row.sro_approval_status) return "Pending SRO";
        if (row.sro_approval_status === "Approved" && !row.odsa_approval_status) return "Pending ODSA";
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

  // Column definitions for Recognition tables
  const pendingRecognitionColumns = [
    {
      key: "org_name",
      header: "Organization",
      width: "w-[35%]",
      sortable: true,
      filterable: true,
      filterOptions: pendingRecognitionOrgOptions,
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
      isStatus: true,
      accessor: () => "Pending",
    },
  ];

  const approvedRecognitionColumns = [
    {
      key: "org_name",
      header: "Organization",
      width: "w-[35%]",
      sortable: true,
      filterable: true,
      filterOptions: approvedRecognitionOrgOptions,
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
      key: "org_status",
      header: "Org Status",
      width: "w-[20%]",
      sortable: true,
      isStatus: true,
      accessor: (row) => row.org_status || "Pending",
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
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg inline-flex flex-wrap h-auto justify-center md:justify-start w-full md:w-auto">
          <TabsTrigger value="requested" className="px-4 py-2 text-sm font-medium flex-1 md:flex-none">Activity Requests</TabsTrigger>
          <TabsTrigger value="approved" className="px-4 py-2 text-sm font-medium flex-1 md:flex-none">Approved Activities</TabsTrigger>
          <TabsTrigger value="recognition" className="px-4 py-2 text-sm font-medium flex-1 md:flex-none">Org Recognition</TabsTrigger>
          <TabsTrigger value="reports" className="px-4 py-2 text-sm font-medium flex-1 md:flex-none">Annual Reports</TabsTrigger>
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
          <h2 className="text-lg font-semibold mb-4 text-center md:text-left">Pending Recognition Applications</h2>
          <DataTable
            columns={pendingRecognitionColumns}
            data={pendingRecognitions.map(app => ({ ...app, id: app.recognition_id }))}
            emptyMessage="No pending recognition applications found."
            className="mb-8"
            defaultSort={{ key: "submitted_at", direction: "desc" }}
          />

          <h2 className="text-lg font-semibold mb-4 text-center md:text-left mt-8">Approved Recognition Applications</h2>
          <DataTable
            columns={approvedRecognitionColumns}
            data={approvedRecognitions.map(app => ({ ...app, id: app.recognition_id }))}
            emptyMessage="No approved recognition applications found."
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
          {dialogLoading ? (
            <DialogContent
              className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-3xl p-0 overflow-hidden"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <LoadingSpinner text="Loading activity details..." variant="section" />
            </DialogContent>
          ) : (
            <ActivityDialogContent
              activity={selectedActivity}
              isModalOpen={true}
              readOnly={true}
            />
          )}
        </Dialog>
      )}
    </div>
  );
};

export default Requests;
