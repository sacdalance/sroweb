import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import supabase from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, Dialog as FilterDialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Pencil, ChevronDown, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";

const Activities = () => {
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

  const formatTime = (t) => {
    if (!t) return "N/A";
    const [h, m] = t.split(":");
    return new Date(0, 0, 0, h, m).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center text-gray-600">
        <Loader2 className="h-6 w-6 mb-2 animate-spin text-[#7B1113]" />
        <p>Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#7B1113] mb-8 text-center sm:text-left">My Activities</h1>

      <Dialog
      open={!!selectedActivity}
      onOpenChange={() => setSelectedActivity(null)}>
        {/* Requested Activities */}
        <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 className="text-lg font-semibold">Requested Activities</h2>
          <div className="flex items-center justify-end gap-2">
            {(filterOrg !== "All" || filterStatus !== "All") && (
              <div className="flex items-center gap-2">
                {filterOrg !== "All" && (
                  <div className="flex items-center gap-1 border px-3 py-1 rounded-full text-sm">
                    {filterOrg}
                    <button onClick={() => setFilterOrg("All")}
                      className="hover:text-[#7B1113] transition">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {filterStatus !== "All" && (
                  <div className="flex items-center gap-1 border px-3 py-1 rounded-full text-sm">
                    {filterStatus}
                    <button onClick={() => setFilterStatus("All")}
                      className="hover:text-[#7B1113] transition">
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
                    <Select value={filterOrg} onValueChange={setFilterOrg}>
                      <SelectTrigger className="mt-1 w-full whitespace-normal break-words min-h-[40px]">
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        {orgOptions.map((org) => (
                          <SelectItem key={org} value={org} className="whitespace-normal break-words">
                            {org}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="mt-1 w-full whitespace-normal break-words min-h-[40px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="For Appeal">For Appeal</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="For Cancellation">For Cancellation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={() => setFilterOpen(false)} className="bg-[#7B1113] hover:bg-[#5e0d0e] text-white">
                    Apply Filters
                  </Button>
                </div>
              </DialogContent>
            </FilterDialog>
          </div>
        </div>
          <Card className="w-full relative">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full min-w-[10px] text-sm text-left">
                    <thead className="border-b">
                      <tr>
                        <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Organization</th>
                        <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Title</th>
                        <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Date Range</th>
                        <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Venue</th>
                        <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Status</th>
                        <th className="w-[70px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requested.length > 0 ? (
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
                            className="border-b cursor-pointer hover:bg-gray-50"
                          >
                            <td className="min-w-[150px] max-w-[180px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4 whitespace-normal break-words">
                              <span className="block whitespace-normal break-words">
                                {act.organization?.org_name || "Unknown"}
                              </span>
                            </td>
                            <td className="min-w-[150px] max-w-[180px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4 whitespace-normal break-words">
                              <span className="block whitespace-normal break-words">
                                {act.activity_name}
                              </span>
                            </td>
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">{formatDateRange(act.schedule)}</td>
                            <td className="min-w-[150px] max-w-[180px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4 whitespace-normal break-words">
                              <span className="block whitespace-normal break-words">
                                {act.venue}
                              </span>
                            </td>
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">
                              {act.final_status === "For Appeal" && (
                                <span className="inline-block px-4 py-1 rounded-full bg-[#7B1113] text-white font-semibold text-xs">
                                  For Appeal
                                </span>
                              )}
                              {act.final_status === "Pending" && (
                                <span className="inline-block px-4 py-1 rounded-full bg-[#FFF7D6] text-[#A05A00] font-semibold text-xs border border-[#FFF7D6]">
                                  Pending
                                </span>
                              )}
                              {act.final_status === "Approved" && (
                                <span className="inline-block px-4 py-1 rounded-full bg-[#014421] text-white font-semibold text-xs">
                                  Approved
                                </span>
                              )}
                              {act.final_status === "Rejected" && (
                                <span className="inline-block px-4 py-1 rounded-full bg-gray-100 text-[#1C1C1C] font-semibold text-xs border border-gray-200">
                                  Rejected
                                </span>
                              )}
                              {act.final_status === "For Cancellation" && (
                                <span className="inline-block px-4 py-1 rounded-full bg-[#7B1113] text-white font-semibold text-xs">
                                  For Cancellation
                                </span>
                              )}
                              {["For Appeal", "Pending", "Approved", "Rejected", "For Cancellation"].indexOf(act.final_status) === -1 && (
                                <span className="inline-block px-4 py-1 rounded-full bg-[#FFF7D6] text-[#A05A00] font-semibold text-xs border border-[#FFF7D6]">
                                  {act.final_status || "Pending"}
                                </span>
                              )}
                            </td>

                            <td className="w-[70px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5 px-2">
                              {!["For Appeal", "Rejected", "For Cancellation"].includes(act.final_status) && (
                                <div className="flex items-center justify-center gap-2">
                                {/* Edit Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingActivity(act);
                                    setIsAppealOpen(true);
                                  }}
                                  className="text-gray-600 hover:text-[#014421] transition-transform transform hover:scale-125"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>

                                {/* Cancel Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelActivity(act);
                                    setIsCancelOpen(true);
                                  }}
                                  className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                                >
                                  <X className="h-5 w-5 font-bold" />
                                </button>
                              </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 px-3 text-center text-gray-500">
                            No requested activities found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Approved Activities */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Approved Activities</h2>
          <Card className="w-full relative">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full min-w-[700px] table-fixed text-sm text-left">
                    <thead className="border-b">
                      <tr>
                        <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Organization</th>
                        <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Title</th>
                        <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Date Range</th>
                        <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Venue</th>
                        <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Activity ID</th>
                        <th className="w-[70px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
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
                            className="border-b cursor-pointer hover:bg-gray-50"
                          >
                            <td className="min-w-[150px] max-w-[180px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4 whitespace-normal break-words">
                              <span className="block whitespace-normal break-words">
                                {act.organization?.org_name || "Unknown"}
                              </span>
                            </td>
                            <td className="min-w-[150px] max-w-[180px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4 whitespace-normal break-words">
                              <span className="block whitespace-normal break-words">
                                {act.activity_name}
                              </span>
                            </td>
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5">{formatDateRange(act.schedule)}</td>
                            <td className="min-w-[150px] max-w-[180px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4 whitespace-normal break-words">
                              <span className="block whitespace-normal break-words">
                                {act.venue}
                              </span>
                            </td>
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5">{act.activity_id}</td>
                            <td className="w-[70px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">
                              <div className="flex items-center justify-center gap-2">
                                {/* Edit Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingActivity(act);
                                    setIsAppealOpen(true);
                                  }}
                                  className="text-gray-600 hover:text-[#014421] transition-transform transform hover:scale-125"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>

                                {/* Cancel Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelActivity(act);
                                    setIsCancelOpen(true);
                                  }}
                                  className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                                >
                                  <X className="h-5 w-5 font-bold" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 px-3 text-center text-gray-500">
                            No approved activities found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </Dialog>
      <Dialog open={isAppealOpen} onOpenChange={setIsAppealOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Submission</DialogTitle>
            <p className="text-sm text-red-700">
              WARNING: Editing your submission will change your request from [APPROVED/PENDING] to <strong>FOR APPEAL.</strong> 
              <br/><br/>
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
                  console.log("Edit Submission for:", editingActivity, "Reason:", modalAppealReason);
                  navigate("/edit-activity", { state: { activity: editingActivity, appealReason: modalAppealReason } });
                  setIsAppealOpen(false);
                  setModalAppealReason("");
                }}
                disabled={modalAppealReason.trim() === ""}
                className={`px-4 py-2 cursor-pointer rounded-md text-white font-medium transition ${
                  modalAppealReason.trim() === ""
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#014421] hover:bg-[#012f18]"
                }`}
              >
                Edit Submission
              </button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cancel Submission</DialogTitle>
            <p className="text-sm text-red-700">
              WARNING: Editing your submission will change your request from [APPROVED/PENDING] to <strong>FOR CANCELLATION.</strong> <br/><br/><strong>This is IRREVERSIBLE.</strong>
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
                onClick={() => {
                  // Submit cancel later
                  console.log("Cancel Submission for:", cancelActivity, "Reason:", cancelReason);
                  setIsCancelOpen(false);
                  setCancelReason("");
                }}
                disabled={cancelReason.trim() === ""}
                className={`px-4 py-2 cursor-pointer rounded-md text-white font-medium transition ${
                  cancelReason.trim() === ""
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#7B1113] hover:bg-[#5e0d0e]"
                }`}
              >
                Cancel Submission
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedActivity && (
        <Dialog open={true} onOpenChange={() => setSelectedActivity(null)}>
          {dialogLoading ? (
            <DialogContent
              className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-3xl p-0 overflow-hidden"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 mb-4 animate-spin text-[#7B1113]" />
                <span className="text-[#7B1113] font-semibold">Loading activity details...</span>
              </div>
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

export default Activities;
