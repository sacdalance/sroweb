import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import supabase from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Pencil, ChevronDown, X } from "lucide-react";

const formatLabel = (value, options) => {
  const found = options.find(opt => opt.id === value);
  return found ? found.label : value;
};

const sdgOptions = [
  { id: "noPoverty", label: "No Poverty" },
  { id: "zeroHunger", label: "Zero Hunger" },
  { id: "goodHealth", label: "Good Health and Well-Being" },
  { id: "qualityEducation", label: "Quality Education" },
  { id: "genderEquality", label: "Gender Equality" },
  { id: "cleanWater", label: "Clean Water and Sanitation" },
  { id: "affordableEnergy", label: "Affordable and Clean Energy" },
  { id: "decentWork", label: "Decent Work and Economic Work" },
  { id: "industryInnovation", label: "Industry Innovation and Infrastructure" },
  { id: "reducedInequalities", label: "Reduced Inequalities" },
  { id: "sustainableCities", label: "Sustainable Cities and Communities" },
  { id: "responsibleConsumption", label: "Responsible Consumption and Production" },
  { id: "climateAction", label: "Climate Action" },
  { id: "lifeBelowWater", label: "Life Below Water" },
  { id: "lifeOnLand", label: "Life on Land" },
  { id: "peaceJustice", label: "Peace, Justice and Strong Institutions" },
  { id: "partnerships", label: "Partnerships for the Goals" }
];

const activityTypeOptions = [
  { id: "charitable", label: "Charitable" },
  { id: "serviceWithinUPB", label: "Service within UPB" },
  { id: "serviceOutsideUPB", label: "Service outside UPB" },
  { id: "contestWithinUPB", label: "Contest within UPB" },
  { id: "contestOutsideUPB", label: "Contest outside UPB" },
  { id: "educational", label: "Educational" },
  { id: "incomeGenerating", label: "Income-Generating Project" },
  { id: "massOrientation", label: "Mass Orientation/General Assembly" },
  { id: "booth", label: "Booth" },
  { id: "rehearsals", label: "Rehearsals/Preparation" },
  { id: "specialEvents", label: "Special Events" },
  { id: "others", label: "Others" }
];

const formatSDGLabels = (sdgString) => {
  const ids = sdgString?.split(",") || [];
  return ids.map(id => {
    const match = sdgOptions.find(opt => opt.id === id);
    return match ? match.label : id;
  });
};

const ActivityDialogContent = ({ activity }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const description = activity.activity_description || "";
  const isLong = description.length > 300;
  const toggleDescription = () => setShowFullDescription(!showFullDescription);

  const formatDateRange = (schedule) => {
    if (!Array.isArray(schedule) || schedule.length === 0) return "TBD";
    const { start_date, end_date } = schedule[0];
    const start = new Date(start_date).toLocaleDateString();
    const endFormatted = end_date ? new Date(end_date).toLocaleDateString() : "";
    return start === endFormatted || !endFormatted ? start : `${start} - ${endFormatted}`;
  };

  const formatTime = (t) => {
    if (!t) return "N/A";
    const [h, m] = t.split(":");
    return new Date(0, 0, 0, h, m).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  console.log("Activity dialog data:", activity);

  return (
    <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-3xl overflow-hidden">
      <ScrollArea className="max-h-[80vh] px-6 py-4">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#7B1113] font-bold">{activity.activity_name}</DialogTitle>
          <p className="text-sm font-semibold text-gray-700 mb-2">{activity.organization?.org_name || "Organization Name"}</p>
        </DialogHeader>

        <div className="flex flex-col gap-y-6 text-sm">
        {/* Description */}
        <div className="text-gray-800">
          {!isLong ? (
            <p className="whitespace-pre-wrap">{description}</p>
          ) : showFullDescription ? (
            <>
              <p className="whitespace-pre-wrap">{description}</p>
              <button
                onClick={toggleDescription}
                className="text-[#7B1113] text-sm font-medium hover:underline mt-1"
              >
                Show less
              </button>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap">{description.slice(0, 300)}...</p>
              <button
                onClick={toggleDescription}
                className="text-[#7B1113] text-sm font-medium hover:underline mt-1"
              >
                Show more
              </button>
            </>
          )}
        </div>

          {/* General Info */}
          <div className="space-y-1">
            <h3 className="text-[#7B1113] font-semibold mb-1">General Information</h3>
            <div className="pl-4">
              <p><strong>Submitted by:</strong> {activity.account?.account_name || "N/A"}</p>
              <p><strong>Position:</strong> {activity.student_position || "N/A"}</p>
              <p><strong>Contact:</strong> {activity.student_contact || "N/A"}</p>
              <p><strong>Activity Type:</strong> {formatLabel(activity.activity_type, activityTypeOptions)}</p>
              <p><strong>Charge Fee:</strong> {activity.charge_fee === "true" ? "Yes" : "No"}</p>
              <p><strong>Adviser Name:</strong> {activity.organization?.adviser_name || "N/A"}</p>
              <p><strong>Adviser Contact:</strong> {activity.organization?.adviser_email || "N/A"}</p>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-1">
            <h3 className="text-[#7B1113] font-semibold mb-1">Specifications</h3>
            <div className="pl-4">
              <p><strong>Venue:</strong> {activity.venue}</p>
              <p><strong>Venue Approver:</strong> {activity.venue_approver}</p>
              <p><strong>Venue Contact:</strong> {activity.venue_approver_contact}</p>
              <p><strong>Green Monitor:</strong> {activity.green_monitor_name}</p>
              <p><strong>Monitor Contact:</strong> {activity.green_monitor_contact}</p>
              <p><strong>Off-Campus:</strong> {activity.is_off_campus === "true" ? "Yes" : "No"}</p>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-1">
            <h3 className="text-[#7B1113] font-semibold mb-1">Schedule</h3>
            <div className="pl-4">
              <p><strong>Date:</strong> {formatDateRange(activity.schedule)}</p>
              <p><strong>Time:</strong> {`${formatTime(activity.schedule?.[0]?.start_time)} - ${formatTime(activity.schedule?.[0]?.end_time)}`}</p>
              {activity.schedule?.[0]?.is_recurring !== "one-time" && (
                <p><strong>Recurring Days:</strong> {activity.schedule?.[0]?.recurring_days || "N/A"}</p>
              )}
            </div>
          </div>

          {/* University Partners */}
          {activity.university_partner && (
            <Collapsible className="border border-gray-300 rounded-md">
              <CollapsibleTrigger className="group w-full px-4 py-2 text-sm font-semibold text-[#7B1113] flex justify-between items-center bg-white rounded-t-md">
                <span>University Partners</span>
                <ChevronDown className="h-4 w-4 text-[#7B1113] transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 py-3 text-sm bg-white border-t border-gray-300">
                <p>{activity.partner_name || "None listed"}</p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* SDG Goals */}
          <Collapsible className="border border-gray-300 rounded-md">
            <CollapsibleTrigger className="group w-full px-4 py-2 text-sm font-semibold text-[#7B1113] flex justify-between items-center bg-white rounded-t-md">
              <span>Sustainable Development Goals</span>
              <ChevronDown className="h-4 w-4 text-[#7B1113] transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-6 py-3 text-sm bg-white border-t border-gray-300">
              {formatSDGLabels(activity.sdg_goals).join(", ") || "None listed"}
            </CollapsibleContent>
          </Collapsible>

          {/* Status + Button */}
          <div className="space-y-2">
            <p><strong>Status:</strong> {activity.final_status || "Pending"}</p>
            {activity.final_status === "For Appeal" && activity.appeal_reason && (
            <div className="space-y-1">
              <h3 className="text-[#7B1113] font-semibold text-sm">Appeal Reason</h3>
              <p className="bg-gray-50 border mt-2 mb-5 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap">
                {activity.appeal_reason}
              </p>
            </div>
            )}
            {activity.drive_folder_link && (
              <a
                href={activity.drive_folder_link}
                className="inline-block bg-[#014421] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#012f18] transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Scanned Form
              </a>
            )}
          </div>

          {/* Remarks Section */}
          {(activity.sro_remarks || activity.odsa_remarks) && (
            <div className="space-y-2 mt-4">
              {activity.sro_remarks && (
                <div>
                  <h3 className="text-[#7B1113] font-semibold text-sm">SRO Remarks</h3>
                  <p className="bg-gray-50 border p-3 rounded text-sm text-gray-700 whitespace-pre-wrap">
                    {activity.sro_remarks.trim()}
                  </p>
                </div>
              )}
              {activity.odsa_remarks && (
                <div>
                  <h3 className="text-[#7B1113] font-semibold text-sm">ODSA Remarks</h3>
                  <p className="bg-gray-50 border p-3 rounded text-sm text-gray-700 whitespace-pre-wrap">
                    {activity.odsa_remarks.trim()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

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
          <h2 className="text-lg font-semibold mb-2 ">Requested Activities</h2>
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
                        requested.map((act) => (
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
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">{act.organization?.org_name || "Unknown"}</td>
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">{act.activity_name}</td>
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">{formatDateRange(act.schedule)}</td>
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">{act.venue}</td>
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
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5">{act.organization?.org_name || "Unknown"}</td>
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5">{act.activity_name}</td>
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5">{formatDateRange(act.schedule)}</td>
                            <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5">{act.venue}</td>
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
        <DialogContent className="sm:max-w-md">
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
        <DialogContent className="sm:max-w-md">
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
          <DialogContent
            className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-3xl p-0 overflow-hidden"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {dialogLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 mb-4 animate-spin text-[#7B1113]" />
                <span className="text-[#7B1113] font-semibold">Loading activity details...</span>
              </div>
            ) : (
              <ActivityDialogContent activity={selectedActivity} />
            )}
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default Activities;
