import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import axios from "axios";
import { Eye, Pencil, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

const formatLabel = (value, options) => {
  if (!Array.isArray(options)) {
    console.warn("Invalid options passed to formatLabel:", options);
    return value;
  }

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
  return ids.map((id) => {
    const match = sdgOptions.find(opt => opt.id === id);
    return match ? match.label : id;
  });
};

const formatActivityTypeLabel = (id) => formatLabel(activityTypeOptions, id);

const formatLabelArray = (idsString, options) => {
  if (!idsString) return [];
  const ids = idsString.split(",");
  return ids.map(id => formatLabel(id, options));
};


const Activities = () => {
  const [requested, setRequested] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

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
      <div className="p-6 max-w-6xl mx-auto text-center">
        <p className="text-gray-600">Loading activities...</p>
      </div>
    );
  }

  const renderDialogContent = (activity) => {
    return (
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle className="text-xl">Activity Details</DialogTitle>
        </DialogHeader>

        {/* Sectioned layout */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
          {/* General Information */}
          <div className="space-y-3 py-2">
            <h3 className="text-[#7B1113] font-semibold mb-2">General Information</h3>
            <p><strong>Organization:</strong> {activity.organization?.org_name || "N/A"}</p>
            <p><strong>Title:</strong> {activity.activity_name}</p>
            <p><strong>Description:</strong> {activity.activity_description}</p>
            <p><strong>Activity Type:</strong> {formatLabel(activity.activity_type, activityTypeOptions)}</p>
            <p><strong>Charge Fee:</strong> {activity.charge_fee === "true" ? "Yes" : "No"}</p>
            <p><strong>University Partner:</strong> {activity.university_partner === "true" ? "Yes" : "No"}</p>
            <p><strong>Adviser Name:</strong> {activity.organization?.adviser_name || "N/A"}</p>
            <p><strong>Adviser Contact:</strong> {activity.organization?.adviser_email || "N/A"}</p>
            {/* University Partners collapsible */}
            {activity.university_partner === "true" && (
              <Collapsible className="border rounded-md">
                <CollapsibleTrigger className="group w-full bg-gray-100 px-4 py-2 flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    <span>University Partners</span>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="px-6 py-3 text-sm">
                  <p>{activity.partner_name || "None listed"}</p>
                </CollapsibleContent>
              </Collapsible>
            )}
            {/* Sustainable Development Goals collapsible */}
            <Collapsible className="border rounded-md">
              <CollapsibleTrigger className="group w-full bg-gray-100 px-4 py-2 flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  <span>SDG List</span>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="px-6 py-3 text-sm">
                {formatSDGLabels(activity.sdg_goals).join(", ") || "None listed"}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Schedule */}
          <div className="space-y-3 py-2">
            <h3 className="text-[#7B1113] font-semibold mb-2">Schedule</h3>
            <p><strong>Date Range:</strong> {formatDateRange(activity.schedule)}</p>
            <p><strong>Start Time:</strong> {formatTime(activity.schedule?.[0]?.start_time)}</p>
            <p><strong>End Time:</strong> {formatTime(activity.schedule?.[0]?.end_time)}</p>
            {activity.schedule?.[0]?.is_recurring !== "one-time" && (
              <p><strong>Recurring Days:</strong> {activity.schedule?.[0]?.recurring_days || "N/A"}</p>
            )}

            {/* Specifications */}
            <h3 className="text-[#7B1113] font-semibold mt-6 mb-2">Specifications</h3>
            <p><strong>Venue:</strong> {activity.venue}</p>
            <p><strong>Venue Approver:</strong> {activity.venue_approver}</p>
            <p><strong>Venue Contact:</strong> {activity.venue_approver_contact}</p>
            <p><strong>Green Monitor:</strong> {activity.green_monitor_name}</p>
            <p><strong>Monitor Contact:</strong> {activity.green_monitor_contact}</p>
            <p><strong>Off Campus:</strong> {activity.is_off_campus === "true" ? "Yes" : "No"}</p>

            {/* Submission */}
            <h3 className="text-[#7B1113] font-semibold mt-6 mb-2">Submission</h3>
            <p>
              <strong>Drive Link:</strong>{" "}
              <a
                className="text-blue-600 hover:underline break-all"
                href={activity.drive_folder_link || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {activity.drive_folder_link || "N/A"}
              </a>
            </p>
            <p><strong>Status:</strong> {activity.final_status || "Pending"}</p>
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold mb-4">My Activities</h1>

      <Dialog>
        {/* Requested Activities */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Requested Activities</h2>
          <Card className="w-full">
            <CardContent className="overflow-x-auto">
              <table className="w-full table-fixed text-sm text-left">
                <thead className="border-b">
                  <tr>
                    <th className="py-2 px-4">Organization</th>
                    <th className="py-2 px-4">Title</th>
                    <th className="py-2 px-4">Date Range</th>
                    <th className="py-2 px-4">Venue</th>
                    <th className="py-2 px-4">Status</th>
                    <th className="py-2 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requested.length > 0 ? (
                    requested.map((act) => (
                      <tr key={act.activity_id} className="border-b">
                        <td className="py-2 px-4">{act.organization?.org_name || "Unknown"}</td>
                        <td className="py-2 px-4">{act.activity_name}</td>
                        <td className="py-2 px-4">{formatDateRange(act.schedule)}</td>
                        <td className="py-2 px-4">{act.venue}</td>
                        <td className="py-2 px-4 text-[#7B1113] font-medium">
                          {act.final_status || "Pending"}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <DialogTrigger asChild>
                              <button
                                onClick={() => setSelectedActivity(act)}
                                className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            </DialogTrigger>
                            <button className="text-gray-600 hover:text-[#014421] transition-transform transform hover:scale-125">
                              <Pencil className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                        No requested activities found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        {/* Approved Activities */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Approved Activities</h2>
          <Card className="w-full">
            <CardContent className="overflow-x-auto">
              <table className="w-full table-fixed text-sm text-left">
                <thead className="border-b">
                  <tr>
                    <th className="py-2 px-4">Organization</th>
                    <th className="py-2 px-4">Title</th>
                    <th className="py-2 px-4">Date Range</th>
                    <th className="py-2 px-4">Venue</th>
                    <th className="py-2 px-4">Activity ID</th>
                    <th className="py-2 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.length > 0 ? (
                    approved.map((act) => (
                      <tr key={act.activity_id} className="border-b">
                        <td className="py-2 px-4">{act.organization?.org_name || "Unknown"}</td>
                        <td className="py-2 px-4">{act.activity_name}</td>
                        <td className="py-2 px-4">{formatDateRange(act.schedule)}</td>
                        <td className="py-2 px-4">{act.venue}</td>
                        <td className="py-2 px-4">{act.activity_id}</td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <DialogTrigger asChild>
                              <button
                                onClick={() => setSelectedActivity(act)}
                                className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            </DialogTrigger>
                            <button className="text-gray-600 hover:text-[#014421] transition-transform transform hover:scale-125">
                              <Pencil className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                        No approved activities found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        {selectedActivity && renderDialogContent(selectedActivity)}
      </Dialog>
    </div>
  );
};

export default Activities;
