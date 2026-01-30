import { useState, useEffect, useMemo } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { API_BASE_URL } from "@/lib/api-config";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import supabase from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, X } from "lucide-react";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import { toast } from 'sonner';
import DataTable from "@/components/ui/DataTable";

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

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

      const res = await axios.get(`/activities/user/${account.account_id}`);
      setAccountId(account.account_id);
      const all = res.data;

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
        .select("recognition_id, academic_year, submitted_at, sro_approved, odsa_approved, org_name, new_org_status")
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
      const response = await axios.put(`/activityCancel/cancel/${cancelActivity.activity_id}`, {
        appeal_reason: cancelReason
      });

      if (response.status === 200) {
        setRequested(prev => [...prev, { ...cancelActivity, final_status: "For Cancellation", appeal_reason: cancelReason }]);
        setApproved(prev => prev.filter(act => act.activity_id !== cancelActivity.activity_id));
        setIsCancelOpen(false);
        setCancelReason("");
        toast.success("Activity marked for cancellation");
      }
    } catch (error) {
      console.error("Error cancelling activity:", error);
      toast.error(error.response?.data?.error || "Failed to cancel activity");
    }
  };

  // Pending recognition apps (not fully approved)
  const pendingRecognitions = recognitionApps?.filter((app) => !(app.sro_approved && app.odsa_approved)) || [];
  // Approved recognition apps
  const approvedRecognitions = recognitionApps?.filter((app) => app.sro_approved && app.odsa_approved) || [];

  // Handle row click for activity tables
  const handleActivityRowClick = async (act) => {
    setDialogLoading(true);
    try {
      const res = await axios.get(`/activities/user/${accountId}`);
      const fullActivity = res.data.find((a) => a.activity_id === act.activity_id);
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
      header: "Venue",
      width: "w-[18%]",
      sortable: true,
      render: (row) => (
        <span className="truncate block text-gray-600" title={row.venue}>
          {row.venue}
        </span>
      ),
    },
    {
      key: "final_status",
      header: "Status",
      width: "w-[12%]",
      sortable: true,
      filterable: true,
      filterOptions: ["Pending", "For Appeal", "Rejected", "For Cancellation"],
      filterLabel: "Statuses",
      filterAccessor: (row) => row.final_status || "Pending",
      isStatus: true,
      accessor: (row) => row.final_status || "Pending",
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[15%]",
      render: (row) => (
        !["For Appeal", "Rejected", "For Cancellation"].includes(row.final_status) && (
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
      header: "Venue",
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
      key: "new_org_status",
      header: "Org Status",
      width: "w-[20%]",
      sortable: true,
      isStatus: true,
      accessor: (row) => row.new_org_status || "Pending",
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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="page-header text-black">My Requests</h1>

      <Tabs defaultValue="requested" className="w-full">
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="requested" className="px-4 py-2 text-sm font-medium">Activity Requests</TabsTrigger>
          <TabsTrigger value="approved" className="px-4 py-2 text-sm font-medium">Approved Activities</TabsTrigger>
          <TabsTrigger value="recognition" className="px-4 py-2 text-sm font-medium">Org Recognition</TabsTrigger>
          <TabsTrigger value="reports" className="px-4 py-2 text-sm font-medium">Annual Reports</TabsTrigger>
        </TabsList>

        {/* Activity Requests Tab */}
        <TabsContent value="requested">
          <h2 className="text-lg font-semibold mb-4">Activity Requests</h2>
          <DataTable
            columns={requestedColumns}
            data={requested.map(act => ({ ...act, id: act.activity_id }))}
            onRowClick={handleActivityRowClick}
            emptyMessage="No activity requests found."
          />
        </TabsContent>

        {/* Approved Activities Tab */}
        <TabsContent value="approved">
          <h2 className="text-lg font-semibold mb-4">Approved Activities</h2>
          <DataTable
            columns={approvedColumns}
            data={approved.map(act => ({ ...act, id: act.activity_id }))}
            onRowClick={handleActivityRowClick}
            emptyMessage="No approved activities found."
          />
        </TabsContent>

        {/* Org Recognition Tab */}
        <TabsContent value="recognition">
          <h2 className="text-lg font-semibold mb-4">Pending Recognition Applications</h2>
          <DataTable
            columns={pendingRecognitionColumns}
            data={pendingRecognitions.map(app => ({ ...app, id: app.recognition_id }))}
            emptyMessage="No pending recognition applications found."
            className="mb-8"
          />

          <h2 className="text-lg font-semibold mb-4">Approved Recognition Applications</h2>
          <DataTable
            columns={approvedRecognitionColumns}
            data={approvedRecognitions.map(app => ({ ...app, id: app.recognition_id }))}
            emptyMessage="No approved recognition applications found."
          />
        </TabsContent>

        {/* Annual Reports Tab */}
        <TabsContent value="reports">
          <h2 className="text-lg font-semibold mb-4">Annual Reports</h2>
          <DataTable
            columns={annualReportsColumns}
            data={annualReports.map(report => ({ ...report, id: report.report_id }))}
            onRowClick={(row) => window.open(row.drive_folder_link, '_blank')}
            emptyMessage="No annual reports found."
          />
        </TabsContent>
      </Tabs>

      {/* Edit Submission Dialog */}
      <Dialog open={isAppealOpen} onOpenChange={setIsAppealOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Submission</DialogTitle>
            <p className="text-sm text-red-700">
              WARNING: Editing your submission will change your request from [APPROVED/PENDING] to <strong>FOR APPEAL.</strong>
              <br /><br />
              <strong>This is IRREVERSIBLE.</strong>
            </p>
          </DialogHeader>
          <div className="space-y-2 mt-1">
            <label htmlFor="appealReason" className="text-sm font-medium">Reason for Appeal</label>
            <textarea
              id="appealReason"
              value={modalAppealReason}
              onChange={(e) => setModalAppealReason(e.target.value)}
              placeholder="Provide a reason for editing your submission..."
              className="w-full p-2 border rounded-md text-sm resize-none"
              rows={4}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  navigate("/edit-activity", { state: { activity: editingActivity, appealReason: modalAppealReason } });
                  setIsAppealOpen(false);
                  setModalAppealReason("");
                }}
                disabled={modalAppealReason.trim() === ""}
                className={`px-4 py-2 cursor-pointer rounded-md text-white font-medium transition ${modalAppealReason.trim() === ""
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-sro-secondary hover:bg-sro-secondary/90"
                  }`}
              >
                Edit Submission
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Submission Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cancel Submission</DialogTitle>
            <p className="text-sm text-red-700">
              WARNING: Editing your submission will change your request from [APPROVED/PENDING] to <strong>FOR CANCELLATION.</strong> <br /><br /><strong>This is IRREVERSIBLE.</strong>
            </p>
          </DialogHeader>
          <div className="space-y-2 mt-1">
            <label htmlFor="cancelReason" className="text-sm font-medium">Reason for Cancellation</label>
            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Provide a reason for cancelling your submission..."
              className="w-full p-2 border rounded-md text-sm resize-none"
              rows={4}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleCancel}
                disabled={cancelReason.trim() === ""}
                className={`px-4 py-2 cursor-pointer rounded-md text-white font-medium transition ${cancelReason.trim() === ""
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-sro-primary hover:bg-sro-primary/90"
                  }`}
              >
                Cancel Submission
              </button>
            </div>
          </div>
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
