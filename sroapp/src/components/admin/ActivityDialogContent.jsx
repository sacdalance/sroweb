import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

const formatLabel = (id, options) => {
  return options.find((opt) => opt.id === id)?.label || id;
};

const formatSDGLabels = (sdgRaw) => {
  let ids = [];

  try {
    // Case: valid JSON string
    if (typeof sdgRaw === "string") {
      try {
        const parsed = JSON.parse(sdgRaw);
        if (Array.isArray(parsed)) {
          ids = parsed;
        } else if (typeof parsed === "object") {
          ids = Object.keys(parsed).filter((key) => parsed[key]);
        } else {
          ids = sdgRaw.split(",").map((s) => s.trim());
        }
      } catch {
        // fallback if not JSON parsable
        ids = sdgRaw.split(",").map((s) => s.trim());
      }
    }

    // Case: directly passed as array
    else if (Array.isArray(sdgRaw)) {
      ids = sdgRaw;
    }

    // Case: object like { genderEquality: true }
    else if (typeof sdgRaw === "object" && sdgRaw !== null) {
      ids = Object.keys(sdgRaw).filter((key) => sdgRaw[key]);
    }
  } catch {
    ids = [];
  }

  return ids.map((id) => {
    const match = sdgOptions.find((opt) => opt.id === id);
    return match ? match.label : id;
  });
};



const ActivityDialogContent = ({
  activity,
  setActivity,
  isModalOpen,
  userRole = null,
  handleApprove,
  handleReject,
  readOnly = false
}) => {
  const isSRO = userRole === 2;
  const isODSA = userRole === 3;
  const [hasViewedScannedForm, setHasViewedScannedForm] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [comment, setComment] = useState(() =>
    userRole === 2 ? activity?.sro_remarks || "" : activity?.odsa_remarks || ""
  );
  const [showDecisionBox, setShowDecisionBox] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [decisionType, setDecisionType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [scrollKey, setScrollKey] = useState(0);

  const description = activity.activity_description || activity.activityDescription || "";
  const isLong = description.length > 300;
  const toggleDescription = () => setShowFullDescription(!showFullDescription);
  const isActionLocked =
    (isSRO && activity?.sro_approval_status) ||
    (isODSA && activity?.odsa_approval_status);

  const [localActivity, setLocalActivity] = useState(activity);
  useEffect(() => setLocalActivity(activity), [activity]);

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
  
    setHasViewedScannedForm(false); // reset on dialog open
    setShowDecisionBox(false);
    setConfirmationOpen(false);
    setDecisionType(null);
    setComment(
      isSRO ? localActivity?.sro_remarks || "" : localActivity?.odsa_remarks || ""
    );
  
    if (actionTaken) {
      setTimeout(() => {
        setShowDecisionBox(true);
        setScrollKey((k) => k + 1);
      }, 100);
    }
  }, [isModalOpen, localActivity?.activity_id]);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return "N/A";
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const [h, m] = timeStr.split(":");
    return new Date(0, 0, 0, h, m).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const sdgs = activity.sdg_goals;

  return (
    <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-3xl p-0 overflow-hidden">
      <ScrollArea className="max-h-[80vh] px-6 py-4">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#7B1113] font-bold">
            {activity.activity_name || activity.activityName}
          </DialogTitle>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {activity.organization?.org_name || activity.organization || "Organization Name"}
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-y-6 text-sm">
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

          <div className="space-y-1">
            <h3 className="text-[#7B1113] font-semibold mb-1">Specifications</h3>
            <div className="pl-4">
              <p><strong>Venue:</strong> {activity.venue || "N/A"}</p>
              <p><strong>Venue Approver:</strong> {activity.venue_approver || "N/A"}</p>
              <p><strong>Venue Contact:</strong> {activity.venue_approver_contact || "N/A"}</p>
              <p><strong>Green Monitor:</strong> {activity.green_monitor_name || "N/A"}</p>
              <p><strong>Monitor Contact:</strong> {activity.green_monitor_contact || "N/A"}</p>
              <p><strong>Off-Campus:</strong> {activity.is_off_campus === "true" ? "Yes" : "No"}</p>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[#7B1113] font-semibold mb-1">Schedule</h3>
            <div className="pl-4">
              <p><strong>Date:</strong> {formatDate(activity.schedule?.[0]?.start_date)}</p>
              <p><strong>Time:</strong> {`${formatTime(activity.schedule?.[0]?.start_time)} - ${formatTime(activity.schedule?.[0]?.end_time)}`}</p>
            </div>
          </div>

          {activity.university_partner === "true" && (
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


          {sdgs.length > 0 && (
            <Collapsible className="border border-gray-300 rounded-md">
              <CollapsibleTrigger className="group w-full px-4 py-2 text-sm font-semibold text-[#7B1113] flex justify-between items-center bg-white rounded-t-md">
                <span>Sustainable Development Goals</span>
                <ChevronDown className="h-4 w-4 text-[#7B1113] transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 py-3 text-sm bg-white border-t border-gray-300">
                {formatSDGLabels(sdgs).join(", ")}
              </CollapsibleContent>
            </Collapsible>
          )}

<div className="space-y-2">
            <p><strong>Status:</strong> {activity.final_status || activity.status || "Pending"}</p>
            {activity.drive_folder_link && (
              <div className="flex items-center gap-2">
              <a
                href={activity.drive_folder_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setHasViewedScannedForm(true);
                  setShowDecisionBox(true);
                }}
                className="inline-block bg-[#014421] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#012f18] transition"
              >
                View Scanned Form
              </a>
                {!readOnly && (
                  <button
                    onClick={() => setShowDecisionBox((prev) => !prev)}
                    className="text-[#014421] hover:text-[#012f18] transition-transform transform hover:scale-110"
                    title="Toggle comment and approval options"
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform ${showDecisionBox ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>
            )}
          </div>

          {!readOnly && showDecisionBox && (
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
                placeholder={((isSRO && activity.sro_approval_status) || (isODSA && activity.odsa_approval_status)) && comment.trim() === ""
                  ? "No remark was given."
                  : "Enter your remarks..."}
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
                  {!hasViewedScannedForm && (
                    <p className="text-sm text-gray-500 italic">Click “View Scanned Form” to activate approval buttons.</p>
                  )}
                    <button
                      disabled={!hasViewedScannedForm}
                      onClick={() => {
                        setDecisionType("approve");
                        setConfirmationOpen(true);
                      }}
                      className="px-5 py-2 rounded-full font-semibold text-sm bg-[#014421] text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:scale-105 transform transition-transform duration-200"
                    >
                      Approve
                    </button>
                    <button
                      disabled={!hasViewedScannedForm}
                      onClick={() => {
                        setDecisionType("reject");
                        setConfirmationOpen(true);
                      }}
                      className="px-5 py-2 rounded-full font-semibold text-sm bg-[#7B1113] text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:scale-105 transform transition-transform duration-200"
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
              You are <strong className={`uppercase font-bold ${decisionType === "approve" ? "text-[#014421]" : "text-[#7B1113]"}`}>
                {decisionType === "approve" ? "APPROVING" : "REJECTING"}
              </strong> the request for activity:
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
              disabled={submitting || !userRole || !localActivity}
              onClick={async () => {
                setSubmitting(true);
                if (!userRole || !localActivity) {
                  toast.warning("Please wait...");
                  setSubmitting(false);
                  return;
                }

                try {
                  if (decisionType === "approve") {
                    await handleApprove(comment, localActivity.activity_id);
                    toast.success("Activity approved successfully!");
                  } else {
                    await handleReject(comment, localActivity.activity_id);
                    toast.error("Activity rejected.");
                  }
                } catch (error) {
                  console.error("Reject Error:", error);
                  toast.error(`Something went wrong: ${error.message}`);
                } finally {
                  setSubmitting(false);
                  setConfirmationOpen(false);
                }
              }}
              className={`${decisionType === "approve" ? "bg-[#014421] hover:bg-[#013a1c]" : "bg-[#7B1113] hover:bg-[#5a0d0f]"} text-white font-semibold cursor-pointer hover:scale-105 transform transition-transform duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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

export default ActivityDialogContent;