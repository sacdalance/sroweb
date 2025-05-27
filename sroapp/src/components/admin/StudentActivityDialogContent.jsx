import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

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
  return ids.map((id) => formatLabel(id, sdgOptions));
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

const formatTime = (timeStr) => {
  if (!timeStr) return "N/A";
  const [h, m] = timeStr.split(":");
  return new Date(0, 0, 0, h, m).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const StudentActivityDialogContent = ({ activity, isModalOpen }) => {
  const sdgs = activity.sdg_goals;
  const [isFullDescriptionShown, setIsFullDescriptionShown] = useState(false);

  return (
    <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-3xl p-0 overflow-hidden">
      <ScrollArea className="max-h-[80vh] px-6 py-4">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#7B1113] font-bold">
            {activity.activity_name || activity.activityName}
          </DialogTitle>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {activity.organization?.org_name || "Organization Name"}
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-y-6 text-sm">
          {activity.activity_description && (
            <div className="text-gray-800">
              {activity.activity_description.length > 300 && !isFullDescriptionShown ? (
                <>
                  <p className="whitespace-pre-wrap">{activity.activity_description.slice(0, 300)}...</p>
                  <button
                    onClick={() => setIsFullDescriptionShown(true)}
                    className="text-[#7B1113] text-sm font-medium hover:underline mt-1"
                  >
                    Show more
                  </button>
                </>
              ) : (
                <>
                  <p className="whitespace-pre-wrap">{activity.activity_description}</p>
                  {activity.activity_description.length > 300 && (
                    <button
                      onClick={() => setIsFullDescriptionShown(false)}
                      className="text-[#7B1113] text-sm font-medium hover:underline mt-1"
                    >
                      Show less
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <div className="space-y-1">
            <h3 className="text-[#7B1113] font-semibold mb-1">General Information</h3>
            <div className="pl-4 space-y-1">
              <p><strong>Activity Type:</strong> {formatLabel(activity.activity_type, activityTypeOptions)}</p>
              <p><strong>Charge Fee:</strong> {activity.charge_fee === "true" ? "Yes" : "No"}</p>
              <p><strong>Venue:</strong> {activity.venue || "N/A"}</p>
              <p><strong>Off-Campus:</strong> {activity.is_off_campus === "true" ? "Yes" : "No"}</p>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[#7B1113] font-semibold mb-1">Schedule</h3>
            <div className="pl-4 space-y-1">
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

          {sdgs && formatSDGLabels(sdgs).length > 0 && (
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
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

export default StudentActivityDialogContent;
