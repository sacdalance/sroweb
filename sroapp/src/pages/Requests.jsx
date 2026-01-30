import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { API_BASE_URL } from "@/lib/api-config";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import supabase from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, Dialog as FilterDialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import { toast } from 'sonner';
import StatusPill from "@/components/ui/StatusPill";

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

const Submissions = () => {
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
  const [filterOrg, setFilterOrg] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const orgOptions = [...new Set(requested.map((a) => a.organization?.org_name || "Unknown"))];
  const filteredRequested = requested.filter((act) => {
    const orgMatch = filterOrg === "All" || act.organization?.org_name === filterOrg;
    const statusMatch =
      filterStatus === "All" ||
      act.final_status === filterStatus ||
      (filterStatus === "Pending" && !act.final_status);
    return orgMatch && statusMatch;
  });

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

  const [annualReports, setAnnualReports] = useState([]);
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

  const [recognitionApps, setRecognitionApps] = useState([]);

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
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-semibold">Activity Requests ({filteredRequested.length})</h2>
            <div className="flex items-center justify-end gap-2">
              {(filterOrg !== "All" || filterStatus !== "All") && (
                <div className="flex items-center gap-2">
                  {filterOrg !== "All" && (
                    <div className="flex items-center gap-1 border px-3 py-1 rounded-full text-sm">
                      {filterOrg}
                      <button onClick={() => setFilterOrg("All")}
                        className="hover:text-sro-primary transition">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {filterStatus !== "All" && (
                    <div className="flex items-center gap-1 border px-3 py-1 rounded-full text-sm">
                      {filterStatus}
                      <button onClick={() => setFilterStatus("All")}
                        className="hover:text-sro-primary transition">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              <FilterDialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md w-[90vw] max-w-[90vw]">
                  <DialogHeader>
                    <DialogTitle>Filter Activities</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Organization</label>
                      <UnifiedDropdown
                        options={["All", ...orgOptions]}
                        value={filterOrg}
                        onChange={setFilterOrg}
                        placeholder="Select organization"
                        searchable
                        searchPlaceholder="Search organization..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <UnifiedDropdown
                        options={["All", "Pending", "For Appeal", "Rejected", "For Cancellation"]}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        placeholder="Select status"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => setFilterOpen(false)} className="bg-sro-primary hover:bg-sro-primary/90 text-white">
                      Apply Filters
                    </Button>
                  </div>
                </DialogContent>
              </FilterDialog>
            </div>
          </div>
          <Card className="w-full shadow-sm border">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-left w-[18%]">Organization</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-left w-[25%]">Title</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[15%]">Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-left w-[20%]">Venue</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[12%]">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[10%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequested.length > 0 ? (
                      filteredRequested.map((act) => (
                        <tr
                          key={act.activity_id}
                          onClick={async () => {
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
                          }}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700 truncate">
                            {act.organization?.org_name || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-medium truncate">
                            {act.activity_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {formatDateRange(act.schedule)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 truncate">
                            {act.venue}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusPill status={act.final_status || "Pending"} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {!["For Appeal", "Rejected", "For Cancellation"].includes(act.final_status) && (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingActivity(act);
                                    setIsAppealOpen(true);
                                  }}
                                  className="p-1 text-gray-500 hover:text-sro-secondary transition-colors rounded hover:bg-gray-100"
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelActivity(act);
                                    setIsCancelOpen(true);
                                  }}
                                  className="p-1 text-gray-500 hover:text-sro-primary transition-colors rounded hover:bg-gray-100"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No activity requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Activities Tab */}
        <TabsContent value="approved">
          <h2 className="text-lg font-semibold mb-4">Approved Activities ({approved.length})</h2>
          <Card className="w-full shadow-sm border">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-left w-[18%]">Organization</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-left w-[25%]">Title</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[15%]">Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-left w-[20%]">Venue</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[12%]">Activity ID</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[10%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {approved.length > 0 ? (
                      approved.map((act) => (
                        <tr
                          key={act.activity_id}
                          onClick={async () => {
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
                          }}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700 truncate">
                            {act.organization?.org_name || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-medium truncate">
                            {act.activity_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {formatDateRange(act.schedule)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 truncate">
                            {act.venue}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center font-mono">
                            {act.activity_id}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingActivity(act);
                                  setIsAppealOpen(true);
                                }}
                                className="p-1 text-gray-500 hover:text-sro-secondary transition-colors rounded hover:bg-gray-100"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelActivity(act);
                                  setIsCancelOpen(true);
                                }}
                                className="p-1 text-gray-500 hover:text-sro-primary transition-colors rounded hover:bg-gray-100"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No approved activities found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Org Recognition Tab */}
        <TabsContent value="recognition">
          <h2 className="text-lg font-semibold mb-4">Pending Recognition Applications ({pendingRecognitions.length})</h2>
          <Card className="w-full shadow-sm border mb-8">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-left w-[35%]">Organization</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[20%]">Academic Year</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[25%]">Submission Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[20%]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingRecognitions.length > 0 ? (
                      pendingRecognitions.map((app) => (
                        <tr key={app.recognition_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-700 truncate">
                            {app.org_name || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {app.academic_year}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {new Date(app.submitted_at).toLocaleDateString('en-US')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusPill status="Pending" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No pending recognition applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold mb-4">Approved Recognition Applications ({approvedRecognitions.length})</h2>
          <Card className="w-full shadow-sm border">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-left w-[35%]">Organization</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[20%]">Academic Year</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[25%]">Submission Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[20%]">Org Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {approvedRecognitions.length > 0 ? (
                      approvedRecognitions.map((app) => (
                        <tr key={app.recognition_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-700 truncate">
                            {app.org_name || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {app.academic_year}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {new Date(app.submitted_at).toLocaleDateString('en-US')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {app.new_org_status || "N/A"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No approved recognition applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Annual Reports Tab */}
        <TabsContent value="reports">
          <h2 className="text-lg font-semibold mb-4">Annual Reports ({annualReports.length})</h2>
          <Card className="w-full shadow-sm border">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-left w-[35%]">Organization</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[20%]">Academic Year</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[25%]">Submission Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-[20%]">Report ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {annualReports?.length > 0 ? (
                      annualReports.map((report) => (
                        <tr
                          key={report.report_id}
                          onClick={() => window.open(report.drive_folder_link, '_blank')}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700 truncate">
                            {report.organization?.org_name || report.org_name || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {report.academic_year}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {new Date(report.submitted_at).toLocaleDateString('en-US')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center font-mono">
                            {report.report_id}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No annual reports found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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

export default Submissions;
