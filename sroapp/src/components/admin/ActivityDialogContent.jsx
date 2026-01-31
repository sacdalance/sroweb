import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, User, MapPin, Calendar, GraduationCap, Building2, FileText } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import StatusPill from "@/components/ui/StatusPill";

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
        ids = sdgRaw.split(",").map((s) => s.trim());
      }
    } else if (Array.isArray(sdgRaw)) {
      ids = sdgRaw;
    } else if (typeof sdgRaw === "object" && sdgRaw !== null) {
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

// Reusable InfoCard component
const InfoCard = ({ icon: Icon, title, children }) => (
  <div className="info-card">
    <div className="info-card-header">
      {Icon && <Icon className="h-4 w-4" />}
      <span>{title}</span>
    </div>
    <div className="info-card-content">
      {children}
    </div>
  </div>
);

// Reusable InfoRow component
const InfoRow = ({ label, value }) => (
  <div className="info-card-row">
    <span className="info-card-label">{label}</span>
    <span className="info-card-value">{value || "N/A"}</span>
  </div>
);

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
  const isSuperAdmin = userRole === 4;
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

  const [sroComment, setSroComment] = useState(activity?.sro_remarks || "");
  const [odsaComment, setOdsaComment] = useState(activity?.odsa_remarks || "");

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
      (isODSA && localActivity?.odsa_approval_status !== null) ||
      (isSuperAdmin && localActivity?.sro_approval_status !== null && localActivity?.odsa_approval_status !== null);

    setHasViewedScannedForm(false);
    setShowDecisionBox(false);
    setConfirmationOpen(false);
    setDecisionType(null);
    setComment(
      isSRO ? localActivity?.sro_remarks || "" : localActivity?.odsa_remarks || ""
    );
    setSroComment(localActivity?.sro_remarks || "");
    setOdsaComment(localActivity?.odsa_remarks || "");

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

  const getRecurringDays = () => {
    try {
      const days = JSON.parse(activity.schedule?.[0]?.recurring_days || "{}");
      return Object.keys(days).filter(day => days[day]).join(", ") || "N/A";
    } catch {
      return "N/A";
    }
  };

  const sdgs = activity.sdg_goals;
  const title = activity.activity_name || activity.activityName || "";
  const isRecurring = activity.schedule?.[0]?.is_recurring === "true";

  return (
    <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[1400px] h-auto max-h-[90vh] sm:max-h-[80vh] p-0 overflow-hidden">
      <ScrollArea className="h-full max-h-[85vh] sm:max-h-[75vh]">
        <div className="p-3 sm:p-4 md:p-5">
          {/* Header Section */}
          <DialogHeader className="mb-3 sm:pr-12">
            <div className="flex flex-col items-center sm:items-start sm:flex-row sm:justify-between gap-2">
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl text-sro-primary font-bold break-words leading-tight">
                  {title}
                </DialogTitle>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {activity.organization?.org_name || activity.organization || "Organization"}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {formatLabel(activity.activity_type, activityTypeOptions)}
                </p>
              </div>
              <div className="flex-shrink-0">
                <StatusPill status={activity.final_status || activity.status || "Pending"} />
              </div>
            </div>
          </DialogHeader>

          {/* Description */}
          {description && (
            <div className="mb-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
              {!isLong ? (
                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words">{description}</p>
              ) : showFullDescription ? (
                <>
                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words">{description}</p>
                  <button
                    onClick={toggleDescription}
                    className="text-sro-primary text-xs sm:text-sm font-medium hover:underline mt-2"
                  >
                    Show less
                  </button>
                </>
              ) : (
                <>
                  <p
                    className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words overflow-hidden"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {description}
                  </p>
                  <button
                    onClick={toggleDescription}
                    className="text-sro-primary text-xs sm:text-sm font-medium hover:underline mt-1"
                  >
                    Show more
                  </button>
                </>
              )}
            </div>
          )}

          {/* Info Cards Grid */}
          <div className="info-card-grid mb-3">
            {/* Submitter Card */}
            <InfoCard icon={User} title="Submitter">
              <InfoRow label="Name" value={activity.account?.account_name} />
              <InfoRow label="Position" value={activity.student_position} />
              <InfoRow label="Contact" value={activity.student_contact} />
            </InfoCard>

            {/* Venue Card */}
            <InfoCard icon={MapPin} title="Venue & Location">
              <InfoRow label="Venue" value={activity.venue} />
              <InfoRow label="Approver" value={activity.venue_approver} />
              <InfoRow label="Off-Campus" value={activity.is_off_campus === "true" ? "Yes" : "No"} />
            </InfoCard>

            {/* Schedule Card */}
            <InfoCard icon={Calendar} title="Schedule">
              {isRecurring ? (
                <>
                  <InfoRow label="Start" value={formatDate(activity.schedule?.[0]?.start_date)} />
                  <InfoRow label="End" value={formatDate(activity.schedule?.[0]?.end_date)} />
                  <InfoRow label="Time" value={`${formatTime(activity.schedule?.[0]?.start_time)} - ${formatTime(activity.schedule?.[0]?.end_time)}`} />
                  <InfoRow label="Days" value={getRecurringDays()} />
                </>
              ) : (
                <>
                  <InfoRow label="Date" value={formatDate(activity.schedule?.[0]?.start_date)} />
                  <InfoRow label="Time" value={`${formatTime(activity.schedule?.[0]?.start_time)} - ${formatTime(activity.schedule?.[0]?.end_time)}`} />
                </>
              )}
            </InfoCard>

            {/* Adviser Card */}
            <InfoCard icon={GraduationCap} title="Adviser & Fees">
              <InfoRow label="Name" value={activity.organization?.adviser_name} />
              <InfoRow label="Email" value={activity.organization?.adviser_email} />
              <InfoRow label="Charge Fee" value={activity.charge_fee === "true" ? "Yes" : "No"} />
            </InfoCard>

            {/* Green Monitor Card */}
            <InfoCard icon={User} title="Green Monitor">
              <InfoRow label="Name" value={activity.green_monitor_name} />
              <InfoRow label="Contact" value={activity.green_monitor_contact} />
              <InfoRow label="Venue Contact" value={activity.venue_approver_contact} />
            </InfoCard>
          </div>

          {/* Collapsible Sections */}
          <div className="space-y-2 mb-3">
            {activity.university_partner === "true" && (
              <Collapsible className="border border-gray-200 rounded-lg overflow-hidden">
                <CollapsibleTrigger className="group w-full px-3 py-2 text-xs sm:text-sm font-semibold text-sro-primary flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>University Partners</span>
                  </div>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-sro-primary transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 py-2 text-xs sm:text-sm bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700">{activity.partner_name || "None listed"}</p>
                </CollapsibleContent>
              </Collapsible>
            )}

            {sdgs && sdgs.length > 0 && (
              <Collapsible className="border border-gray-200 rounded-lg overflow-hidden">
                <CollapsibleTrigger className="group w-full px-3 py-2 text-xs sm:text-sm font-semibold text-sro-primary flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Sustainable Development Goals</span>
                  </div>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-sro-primary transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 py-2 text-xs sm:text-sm bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700">{formatSDGLabels(sdgs).join(", ")}</p>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Meta Info & Actions */}
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="flex flex-col items-center sm:flex-row sm:justify-between gap-2 text-center sm:text-left">
              <p className="text-xs sm:text-sm text-gray-500">
                <span className="font-medium">Activity ID:</span> {activity.activity_id || "N/A"}
              </p>
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
                    className="inline-block bg-sro-secondary text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sro-secondary/90 transition"
                  >
                    View Scanned Form
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => setShowDecisionBox((prev) => !prev)}
                      className="text-sro-secondary hover:text-sro-secondary/90 transition-transform transform hover:scale-110 p-2"
                      title="Toggle comment and approval options"
                    >
                      <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${showDecisionBox ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Remarks Section (Read-Only) */}
          {readOnly && (activity.sro_remarks || activity.odsa_remarks) && (
            <div className="mt-3 space-y-2">
              {activity.sro_remarks && (
                <div className="info-card">
                  <div className="info-card-header">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>SRO Remarks</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{activity.sro_remarks.trim()}</p>
                </div>
              )}
              {activity.odsa_remarks && (
                <div className="info-card">
                  <div className="info-card-header">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>ODSA Remarks</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{activity.odsa_remarks.trim()}</p>
                </div>
              )}
            </div>
          )}

          {/* Admin Decision Box */}
          {!readOnly && showDecisionBox && (
            <div className="mt-3 space-y-2 border-t border-gray-200 pt-3" ref={commentRef}>
              {/* Appeal/Cancellation Reason */}
              {(activity.final_status === "For Appeal" || activity.final_status === "For Cancellation") && activity.appeal_reason && (
                <div className="info-card bg-amber-50 border-amber-200">
                  <div className="info-card-header text-amber-700 border-amber-200">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Appeal/Cancellation Reason</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-800">{activity.appeal_reason}</p>
                </div>
              )}

              {/* ODSA viewing SRO remarks */}
              {isODSA && (
                <div className="info-card bg-gray-50">
                  <div className="info-card-header">
                    <span>SRO Remarks</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700">{activity.sro_remarks?.trim() || "No comment provided."}</p>
                </div>
              )}

              {/* Remarks Textareas */}
              {isSuperAdmin ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">SRO Remarks</label>
                    <textarea
                      value={sroComment}
                      onChange={e => setSroComment(e.target.value)}
                      rows={2}
                      placeholder="Enter SRO remarks..."
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sro-primary/20 focus:border-sro-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">ODSA Remarks</label>
                    <textarea
                      value={odsaComment}
                      onChange={e => setOdsaComment(e.target.value)}
                      rows={2}
                      placeholder="Enter ODSA remarks..."
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sro-primary/20 focus:border-sro-primary"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">
                    {isSRO ? "SRO Remarks" : "ODSA Remarks"}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder={((isSRO && activity.sro_approval_status) || (isODSA && activity.odsa_approval_status)) && comment.trim() === ""
                      ? "No remark was given."
                      : "Enter your remarks..."}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sro-primary/20 focus:border-sro-primary"
                    disabled={isActionLocked}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
                {isActionLocked ? (
                  <div className="w-full flex justify-end">
                    {localActivity.final_status === "Rejected" ? (
                      <span className="px-3 py-1.5 rounded-lg border border-sro-primary text-xs sm:text-sm text-sro-primary font-medium italic">
                        Activity Rejected
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg border border-gray-400 text-xs sm:text-sm text-gray-500 font-medium italic">
                        {isSRO ? "Waiting for ODSA approval" : "Action already taken"}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    {!hasViewedScannedForm && (
                      <p className="text-xs text-gray-500 italic w-full sm:w-auto">Click "View Scanned Form" first.</p>
                    )}
                    {activity.final_status === "For Cancellation" ? (
                      <button
                        disabled={!hasViewedScannedForm}
                        onClick={() => {
                          setDecisionType("cancel");
                          setConfirmationOpen(true);
                        }}
                        className="px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm bg-sro-primary text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:bg-sro-primary/90 transition"
                      >
                        Cancel Activity
                      </button>
                    ) : (
                      <>
                        <button
                          disabled={!hasViewedScannedForm}
                          onClick={() => {
                            setDecisionType("approve");
                            setConfirmationOpen(true);
                          }}
                          className="px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm bg-sro-secondary text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:bg-sro-secondary/90 transition"
                        >
                          Approve
                        </button>
                        <button
                          disabled={!hasViewedScannedForm}
                          onClick={() => {
                            setDecisionType("reject");
                            setConfirmationOpen(true);
                          }}
                          className="px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm bg-sro-primary text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:bg-sro-primary/90 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="max-w-md rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-sro-primary font-bold text-lg">
              {decisionType === "cancel" ? "Cancel Activity" : "Confirmation"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-700 mt-1">
              {decisionType === "cancel" ? (
                "You are cancelling the activity:"
              ) : (
                <>
                  You are <strong className={`uppercase font-bold ${decisionType === "approve" ? "text-sro-secondary" : "text-sro-primary"}`}>
                    {decisionType === "approve" ? "APPROVING" : "REJECTING"}
                  </strong> the request for activity:
                </>
              )}
            </DialogDescription>
            <p className="text-base mt-2 font-semibold text-black">{activity.activity_name}</p>
          </DialogHeader>

          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1">With reason:</p>
            <div className="border border-gray-300 p-3 rounded-lg text-sm bg-gray-50 whitespace-pre-wrap">
              {isSuperAdmin
                ? `SRO: ${sroComment.trim() || "No reason provided."}\nODSA: ${odsaComment.trim() || "No reason provided."}`
                : comment.trim() || "No reason provided."}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" className="cursor-pointer hover:bg-gray-100" onClick={() => setConfirmationOpen(false)}>
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
                  if (decisionType === "cancel") {
                    await handleReject(
                      isSuperAdmin ? { sro: sroComment, odsa: odsaComment } : comment,
                      localActivity.activity_id
                    );
                    toast.error("Activity cancelled.");
                  } else if (decisionType === "approve") {
                    await handleApprove(
                      isSuperAdmin ? { sro: sroComment, odsa: odsaComment } : comment,
                      localActivity.activity_id
                    );
                    toast.success("Activity approved successfully!");
                  } else {
                    await handleReject(
                      isSuperAdmin ? { sro: sroComment, odsa: odsaComment } : comment,
                      localActivity.activity_id
                    );
                    toast.error("Activity rejected.");
                  }
                } catch (error) {
                  console.error("Error:", error);
                  toast.error(`Something went wrong: ${error.message}`);
                } finally {
                  setSubmitting(false);
                  setConfirmationOpen(false);
                }
              }}
              className={`${decisionType === "approve" ? "bg-sro-secondary hover:bg-sro-secondary/90" : "bg-sro-primary hover:bg-sro-primary/90"} text-white font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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