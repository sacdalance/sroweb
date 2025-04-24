import { useEffect, useState, useRef } from "react";
import axios from "axios";
import supabase from "@/lib/supabase";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, ChevronDown } from "lucide-react";
import { toast, Toaster } from "sonner";
import { approveActivity, rejectActivity } from "@/api/approveRejectRequestAPI";

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
  { id: "others", label: "Others" },
];

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

const formatLabel = (id, options) =>
  options.find((o) => o.id === id)?.label || id;

const formatSDGLabels = (sdg) => {
  try {
    let ids = [];

    if (typeof sdg === "string") {
      try {
        // Try parsing as JSON array
        ids = JSON.parse(sdg);
      } catch {
        // If parsing fails, fallback to comma-separated
        ids = sdg.split(",").map((s) => s.trim());
      }
    } else if (Array.isArray(sdg)) {
      ids = sdg;
    }

    return ids.map((id) => {
      const match = sdgOptions.find((opt) => opt.id === id);
      return match ? match.label : id; // fallback to raw ID if no match
    });
  } catch {
    return [];
  }
};



const ActivityDialogContent = ({
  activity,
  setActivity,
  isModalOpen,
  userRole,
  handleApprove,
  handleReject,
}) => {
  const isSRO = userRole === 2;
  const isODSA = userRole === 3;
  const [showFullDescription, setShowFullDescription] = useState(false);
  const description = activity.activity_description || "";
  const isLong = description.length > 300;
  const [comment, setComment] = useState(() => {
    return userRole === 2
      ? activity?.sro_remarks || ""
      : activity?.odsa_remarks || "";
  });
  useEffect(() => {
    setComment(
      userRole === 2
        ? activity?.sro_remarks || ""
        : activity?.odsa_remarks || ""
    );
  }, [activity, userRole]);
  const isActionLocked =
  (isSRO && activity?.sro_approval_status) ||
  (isODSA && activity?.odsa_approval_status);
  const [showDecisionBox, setShowDecisionBox] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [decisionType, setDecisionType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [scrollKey, setScrollKey] = useState(0);
  const toggleDescription = () => setShowFullDescription(!showFullDescription);
  
  const [localActivity, setLocalActivity] = useState(activity);
  useEffect(() => {
    setLocalActivity(activity);
  }, [activity]);
    
  const commentRef = useRef(null);

  useEffect(() => {
    if (showDecisionBox && commentRef.current) {
      setTimeout(() => {
        commentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [scrollKey]);

  useEffect(() => {
    if (!isModalOpen || !localActivity?.activity_id) return;
  
    const actionTaken =
      (isSRO && localActivity?.sro_approval_status !== null) ||
      (isODSA && localActivity?.odsa_approval_status !== null);
  
    // Reset everything immediately
    setShowDecisionBox(false);
    setConfirmationOpen(false);
    setDecisionType(null);
    setComment(
      isSRO ? localActivity?.sro_remarks || "" : localActivity?.odsa_remarks || ""
    );
  
    if (actionTaken) {
      // Only open + scroll if action was really taken
      setTimeout(() => {
        setShowDecisionBox(true);
        setScrollKey((k) => k + 1);
      }, 100);
    }
  }, [isModalOpen, localActivity?.activity_id]);

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

  return (
    <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-3xl p-0 overflow-hidden">
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
            {console.log("Dialog activity data:", activity)}
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
              <div className="flex items-center gap-2">
              <a
                href={activity.drive_folder_link}
                className="inline-block bg-[#014421] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#012f18] transition"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowDecisionBox(true)}
              >
                View Scanned Form
              </a>
                <button
                  onClick={() => setShowDecisionBox((prev) => !prev)}
                  className="text-[#014421] hover:text-[#012f18] transition-transform transform hover:scale-110"
                  title="Toggle comment and approval options"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${showDecisionBox ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
          </div>
          {showDecisionBox && (
            <div className="mt-4 space-y-3" ref={commentRef}>
              {isODSA && (
                <div className="text-sm">
                  <p className="text-gray-600 mb-1 font-medium">SRO Remarks:</p>
                  <div className="border p-2 rounded bg-gray-50">
                    {activity.sro_remarks?.trim() || "No comment provided."}
                  </div>
                </div>
              )}

              <label className="text-sm font-medium text-gray-700 block">
                {isSRO ? "SRO Remarks" : "ODSA Remarks"}
              </label>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder={
                  ((isSRO && activity.sro_approval_status) ||
                  (isODSA && activity.odsa_approval_status)) && comment.trim() === ""
                    ? "No remark was given."
                    : "Enter your remarks..."
                }
                className="w-full border border-gray-300 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7B1113]"
                disabled={isActionLocked}
              />

              <div className="flex justify-end gap-3">
                {isActionLocked ? (
                <div className="w-full flex justify-end">
                {localActivity.final_status === "Rejected" ? (
                  <span className="px-4 py-1 rounded-full border border-[#7B1113] text-sm text-[#7B1113] font-medium italic">
                    Activity Rejected
                  </span>
                ) : (
                  <span className="px-4 py-1 rounded-full border border-gray-400 text-sm text-gray-500 font-medium italic">
                    {isSRO ? "Waiting for ODSA approval" : "Action already taken"}
                  </span>
                )}
              </div>              
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setDecisionType("approve");
                        setConfirmationOpen(true);
                      }}
                      className="px-5 py-2 rounded-full font-semibold text-sm bg-[#014421] text-white cursor-pointer hover:scale-105 transform transition-transform duration-200 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setDecisionType("reject");
                        setConfirmationOpen(true);
                      }}
                      className="px-5 py-2 rounded-full font-semibold text-sm bg-[#7B1113] text-white cursor-pointer hover:scale-105 transform transition-transform duration-200 transition"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="max-w-md rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[#7B1113] font-bold text-lg">
              Confirmation
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-700 mt-1">
              You are{" "}
              <strong
                className={`uppercase font-bold ${
                  decisionType === "approve" ? "text-[#014421]" : "text-[#7B1113]"
                }`}
              >
                {decisionType === "approve" ? "APPROVING" : "REJECTING"}
              </strong>{" "}
              the request for activity:
            </DialogDescription>
            <p className="text-base mt-2 font-semibold text-black">{activity.activity_name}</p>
          </DialogHeader>

          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1">With reason:</p>
            <div className="border border-gray-300 p-3 rounded-md text-sm bg-gray-50 whitespace-pre-wrap">
              {comment.trim() || "No reason provided."}
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" className="cursor-pointer hover:scale-105 transform transition-transform duration-200" onClick={() => setConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={submitting || !userRole || !activity}
              onClick={async () => {
                setSubmitting(true);
              
                if (!userRole || !activity) {
                  toast.warning("Please wait...");
                  setSubmitting(false);
                  return;
                }
              
                try {
                  if (decisionType === "approve") {
                    await handleApprove(comment);
                    toast.success("Activity approved successfully!");
                    setActivity({
                      ...activity,
                      ...(userRole === 2
                        ? { sro_approval_status: "Approved", sro_remarks: comment }
                        : {
                            odsa_approval_status: "Approved",
                            odsa_remarks: comment,
                            final_status: "Approved",
                          }),
                    });
                  } else {
                    await handleReject(comment);
                    toast.error("Activity rejected.");
                    const updated = {
                      ...(userRole === 2
                        ? {
                            sro_approval_status: "Rejected",
                            sro_remarks: comment,
                            odsa_approval_status: "Rejected",
                            final_status: "Rejected",
                          }
                        : {
                            odsa_approval_status: "Rejected",
                            odsa_remarks: comment,
                            final_status: "Rejected",
                          }),
                    };
                    
                    setActivity((prev) => ({
                      ...prev,
                      ...updated,
                    }));
                    
                    setLocalActivity((prev) => ({
                      ...prev,
                      ...updated,
                    }));
                  }
                } catch (error) {
                  console.error("Reject Error:", error);
                  toast.error(`Something went wrong: ${error.message}`);
                } finally {
                  setSubmitting(false);
                  setConfirmationOpen(false);
                }
              }}
              className={`${
                decisionType === "approve"
                  ? "bg-[#014421] hover:bg-[#013a1c]"
                  : "bg-[#7B1113] hover:bg-[#5a0d0f]"
              } text-white font-semibold cursor-pointer hover:scale-105 transform transition-transform duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContent>
  );
};

const AdminPendingRequests = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appeals");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [allActivities, setAllActivities] = useState([]);
  const [pendingAppeals, setPendingAppeals] = useState([]);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
  
      const { data: { user } } = await supabase.auth.getUser();
      const { data: account, error } = await supabase
      .from("account")
      .select("role_id")
      .eq("email", user.email)
      .single();
  
      if (error) {
        console.error("Error fetching role:", error);
      } else {
        setUserRole(account?.role_id);
        console.log("Fetched user role:", account?.role_id);
      }
    };
  
    fetchRole();
  }, []);

  const refreshSelectedActivity = async (id) => {
    const { data, error } = await supabase
    .from("activity")
    .select(`
      *,
      account:account (*),
      schedule:activity_schedule(*),
      organization:organization(*)
    `)
    .eq("activity_id", activity.activity_id)
    .single();
    
    if (error) {
      console.error("Failed to refresh activity:", error);
    } else {
      setSelectedActivity(data);
    }
  };

  const getActivityTypeLabel = (id) => {
    return activityTypeOptions.find((opt) => opt.id === id)?.label || id;
  };

  const [incomingRequests, setIncomingRequests] = useState([]);
  useEffect(() => {
    if (!userRole) return; // Wait until role is available
  
    const fetchIncoming = async () => {
      try {
        setLoading(true);
        const { data: sessionData, error } = await supabase.auth.getSession();
        const access_token = sessionData?.session?.access_token;
  
        if (!access_token) {
          console.error("No access token found");
          return;
        }
  
        const res = await axios.get("/api/activities/incoming", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
  
        console.log("Fetched incoming:", res.data);
        const allActivities = res.data;
        setAllActivities(allActivities);
        
        const filtered = allActivities.filter((a) => {
          const isAppeal = a.final_status === "For Appeal";  
          if (isAppeal) return false;

          if (userRole === 2) {
            return (
              a.sro_approval_status === null ||
              (a.sro_approval_status === "Approved" && a.odsa_approval_status === null)
            );
          } else if (userRole === 3) {
            // ODSA sees only activities approved by SRO and not yet acted on by them
            return (
              a.sro_approval_status === "Approved" &&
              a.odsa_approval_status === null
            );
          }
          return true; // fallback: show all (for devs/superadmins if needed)
        });
        
        setIncomingRequests(filtered);

      } catch (error) {
        console.error("Failed to fetch incoming submissions:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchIncoming();
  }, [userRole]); // trigger only when userRole is ready
  
  
  useEffect(() => {
    const appeals = allActivities.filter(a => a.final_status === "For Appeal");
    setPendingAppeals(appeals);
  }, [allActivities]);

  const handleViewDetails = async (activity) => {
    const { data, error } = await supabase
    .from("activity")
    .select(`
      *,
      account:account (*),
      schedule:activity_schedule(*),
      organization:organization(*)
    `)
    .eq("activity_id", activity.activity_id)
    .single();
  
    if (error) {
      console.error("Failed to fetch latest activity:", error);
      toast.error("Something went wrong loading this activity.");
      return;
    }
  
    setSelectedActivity(data);
    setIsModalOpen(true);
  };

  const handleApprove = async (comment) => {
    if (!selectedActivity || !userRole) {
      console.error("Missing selectedActivity or userRole.");
      throw new Error("Activity or role not ready.");
    }
  
    await approveActivity(selectedActivity.activity_id, comment, userRole);
    await refreshSelectedActivity(selectedActivity.activity_id);
  };
  
  const handleReject = async (comment) => {
    if (!selectedActivity || !userRole) {
      console.error("Missing selectedActivity or userRole.");
      throw new Error("Activity or role not ready.");
    }
  
    await rejectActivity(selectedActivity.activity_id, comment, userRole);
    await refreshSelectedActivity(selectedActivity.activity_id);
  };


  if (!userRole) return null;

  return (
    <div className="container mx-auto py-8 max-w-[1600px]">
      <Toaster/>
      <h1 className="text-3xl font-bold text-[#7B1113] mb-8">Pending Activity Requests</h1>

      <Tabs defaultValue="submissions" className="w-full mb-8">
        <TabsList className="grid w-[800px] grid-cols-2 h-8 p-0 mx-auto bg-gray-100 rounded-4xl">
        <TabsTrigger  
          value="submissions" 
          className="data-[state=active]:bg-[#7B1113] data-[state=active]:text-white rounded-l-4xl"
        >
          Incoming Submissions ({incomingRequests.length})
        </TabsTrigger>

        <TabsTrigger 
          value="appeals" 
          className="data-[state=active]:bg-[#7B1113] data-[state=active]:text-white rounded-r-4xl"
        >
          Appeals and Cancellations ({pendingAppeals.length})
        </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appeals">
          <Card className="rounded-lg overflow-hidden shadow-md">
            <CardHeader className="py-3 px-6">
              <CardTitle className="text-xl font-bold text-[#000000]">
                Appeals and Cancellations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center ">Activity ID</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center">Submission Date</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center">Activity Type</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center">Organization</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center">Activity Name</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center">Activity Date</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center">Venue</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center">Adviser</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingAppeals.map((request) => (
                      <tr key={request.activity_id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.activity_id}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">
                        {new Date(request.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center break-words">
                        {request.organization?.org_name || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.activity_name}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">
                        {getActivityTypeLabel(request.activity_type)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">
                        {new Date(request.schedule?.[0]?.start_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.venue}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center whitespace-nowrap">
                        {request.organization?.adviser_name || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-sm text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="submissions">
          <Card className="rounded-lg overflow-hidden shadow-md">
            <CardHeader className="py-3 px-6">
              <CardTitle className="text-xl font-bold text-[#000000]">
                Incoming Submissions
              </CardTitle>
              {userRole === 3 && (
                <p className="text-sm text-gray-600 italic mb-1">
                  Showing only activities approved by the SRO.
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center whitespace-nowrap">Activity ID</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center whitespace-nowrap">Organization</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center whitespace-nowrap">Activity Name</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center whitespace-nowrap">Submission Date</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center whitespace-nowrap">Activity Type</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center whitespace-nowrap">Activity Date</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center whitespace-nowrap">Venue</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center whitespace-nowrap">Adviser</th>
                      <th className="px-5 py-3 text-sm font-medium text-black text-center whitespace-nowrap"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center text-gray-500 py-4">Loading incoming submissions...</td>
                    </tr>
                  ) : incomingRequests.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-gray-500 py-4">No incoming submissions.</td>
                    </tr>
                  ) : (
                      incomingRequests.map((request) => (
                        <tr key={request.activity_id} className="hover:bg-gray-50">
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.activity_id}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">
                            {new Date(request.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center break-words">
                            {request.organization?.org_name || "N/A"}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.activity_name}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">
                            {getActivityTypeLabel(request.activity_type)}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">
                            {new Date(request.schedule?.[0]?.start_date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.venue}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center whitespace-nowrap">
                            {request.organization?.adviser_name || "N/A"}
                          </td>
                          <td className="px-5 py-4 text-sm text-center">
                            <div className="flex justify-center">
                              <button
                                onClick={() => handleViewDetails(request)}
                                className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Activity Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedActivity && (
          <ActivityDialogContent
            activity={selectedActivity}
            setActivity={setSelectedActivity}
            isModalOpen={isModalOpen}
            userRole={userRole}
            handleApprove={handleApprove}
            handleReject={handleReject}
          />
        )}
      </Dialog>
    </div>
  );
};

export default AdminPendingRequests; 