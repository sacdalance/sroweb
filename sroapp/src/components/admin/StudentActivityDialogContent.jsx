import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Calendar, MapPin, Clock, Users, Tag, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

// Activity type color mapping
const activityTypeColors = {
  charitable: { bg: "bg-pink-100", text: "text-pink-700" },
  serviceWithinUPB: { bg: "bg-blue-100", text: "text-blue-700" },
  serviceOutsideUPB: { bg: "bg-cyan-100", text: "text-cyan-700" },
  contestWithinUPB: { bg: "bg-purple-100", text: "text-purple-700" },
  contestOutsideUPB: { bg: "bg-violet-100", text: "text-violet-700" },
  educational: { bg: "bg-emerald-100", text: "text-emerald-700" },
  incomeGenerating: { bg: "bg-amber-100", text: "text-amber-700" },
  massOrientation: { bg: "bg-indigo-100", text: "text-indigo-700" },
  booth: { bg: "bg-orange-100", text: "text-orange-700" },
  rehearsals: { bg: "bg-slate-100", text: "text-slate-700" },
  specialEvents: { bg: "bg-rose-100", text: "text-rose-700" },
  others: { bg: "bg-gray-100", text: "text-gray-700" },
};

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

// Generate Google Calendar URL
const generateGoogleCalendarUrl = (activity) => {
  const schedule = activity.schedule?.[0];
  if (!schedule) return null;

  const title = encodeURIComponent(activity.activity_name || "Activity");
  const startDate = new Date(schedule.start_date);
  const endDate = schedule.end_date ? new Date(schedule.end_date) : startDate;

  // Format dates for Google Calendar (YYYYMMDD format)
  const formatGoogleDate = (date) => {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  };

  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
  const location = encodeURIComponent(activity.venue || "");
  const description = encodeURIComponent(
    `${activity.activity_description || ""}\n\nOrganized by: ${activity.organization?.org_name || "Unknown"}`
  );

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${description}`;
};

const StudentActivityDialogContent = ({ activity }) => {
  const sdgs = activity.sdg_goals;
  const [isFullDescriptionShown, setIsFullDescriptionShown] = useState(false);
  const typeColors = activityTypeColors[activity.activity_type] || activityTypeColors.others;
  const googleCalendarUrl = generateGoogleCalendarUrl(activity);

  return (
    <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden">
      <ScrollArea className="max-h-[80vh] px-6 py-5">
        <DialogHeader className="space-y-3">
          {/* Status and Type Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
              {activity.final_status || activity.status || "Approved"}
            </Badge>
            <Badge className={`${typeColors.bg} ${typeColors.text} hover:${typeColors.bg} border-0`}>
              {formatLabel(activity.activity_type, activityTypeOptions)}
            </Badge>
          </div>

          <DialogTitle className="text-2xl text-sro-primary font-bold pr-8 break-words">
            {activity.activity_name || activity.activityName}
          </DialogTitle>

          <div className="flex items-center gap-2 text-gray-600">
            <Building2 className="h-4 w-4 text-sro-secondary" />
            <span className="font-medium">{activity.organization?.org_name || "Organization Name"}</span>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-y-5 text-sm mt-5">
          {/* Description */}
          {activity.activity_description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800 leading-relaxed">
                {activity.activity_description.length > 300 && !isFullDescriptionShown ? (
                  <>
                    <span className="whitespace-pre-wrap">{activity.activity_description.slice(0, 300)}...</span>
                    <button
                      onClick={() => setIsFullDescriptionShown(true)}
                      className="text-sro-primary text-sm font-medium hover:underline ml-1"
                    >
                      Show more
                    </button>
                  </>
                ) : (
                  <>
                    <span className="whitespace-pre-wrap">{activity.activity_description}</span>
                    {activity.activity_description.length > 300 && (
                      <button
                        onClick={() => setIsFullDescriptionShown(false)}
                        className="text-sro-primary text-sm font-medium hover:underline ml-1"
                      >
                        Show less
                      </button>
                    )}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Schedule Section */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sro-primary font-semibold">
              <Calendar className="h-4 w-4" />
              Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
              {activity.schedule?.[0]?.is_recurring === "true" ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-[80px]">Start:</span>
                    <span className="font-medium">{formatDate(activity.schedule?.[0]?.start_date)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-[80px]">End:</span>
                    <span className="font-medium">{formatDate(activity.schedule?.[0]?.end_date)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="font-medium">{`${formatTime(activity.schedule?.[0]?.start_time)} - ${formatTime(activity.schedule?.[0]?.end_time)}`}</span>
                  </div>
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <span className="text-gray-500">Recurring:</span>
                    <span className="font-medium">{(() => {
                      try {
                        const days = JSON.parse(activity.schedule?.[0]?.recurring_days || "{}");
                        return Object.keys(days).filter(day => days[day]).join(", ") || "N/A";
                      } catch {
                        return "N/A";
                      }
                    })()}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-[80px]">Date:</span>
                    <span className="font-medium">{formatDate(activity.schedule?.[0]?.start_date)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="font-medium">{`${formatTime(activity.schedule?.[0]?.start_time)} - ${formatTime(activity.schedule?.[0]?.end_time)}`}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Venue Section */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sro-primary font-semibold">
              <MapPin className="h-4 w-4" />
              Venue
            </h3>
            <div className="pl-6">
              <p className="font-medium">{activity.venue || "N/A"}</p>
              {activity.is_off_campus === "true" && (
                <Badge variant="outline" className="mt-1 text-amber-600 border-amber-300 bg-amber-50">
                  Off-Campus
                </Badge>
              )}
            </div>
          </div>

          {/* General Info */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sro-primary font-semibold">
              <Tag className="h-4 w-4" />
              Details
            </h3>
            <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-start gap-2">
                <span className="text-gray-500">Charge Fee:</span>
                <span className="font-medium">{activity.charge_fee === "true" ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          {/* University Partners */}
          {activity.university_partner === "true" && (
            <Collapsible className="border border-gray-200 rounded-lg overflow-hidden">
              <CollapsibleTrigger className="group w-full px-4 py-3 text-sm font-semibold text-sro-primary flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  University Partners
                </span>
                <ChevronDown className="h-4 w-4 text-sro-primary transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 text-sm bg-white border-t border-gray-200">
                <p>{activity.partner_name || "None listed"}</p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* SDG Goals */}
          {sdgs && formatSDGLabels(sdgs).length > 0 && (
            <Collapsible className="border border-gray-200 rounded-lg overflow-hidden">
              <CollapsibleTrigger className="group w-full px-4 py-3 text-sm font-semibold text-sro-primary flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <span>Sustainable Development Goals</span>
                <ChevronDown className="h-4 w-4 text-sro-primary transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 text-sm bg-white border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {formatSDGLabels(sdgs).map((sdg, index) => (
                    <Badge key={index} variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                      {sdg}
                    </Badge>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Activity ID Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-xs text-gray-400">
              Activity ID: {activity.activity_id || "N/A"}
            </span>

            {/* Add to Calendar Button */}
            {googleCalendarUrl && (
              <Button
                variant="outline"
                size="sm"
                className="text-sro-secondary border-sro-secondary hover:bg-sro-secondary/10"
                onClick={() => window.open(googleCalendarUrl, '_blank')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Add to Calendar
                <ExternalLink className="h-3 w-3 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

export default StudentActivityDialogContent;
