import ActivityForm from "@/components/ActivityForm";

const DEFAULT_VALUES = {
  selectedValue: "",
  selectedOrgName: "",
  studentPosition: "",
  studentContact: "",
  activityName: "",
  activityDescription: "",
  selectedActivityType: "",
  otherActivityType: "",
  selectedSDGs: {},
  chargingFees1: "",
  partnering: "",
  selectedPublicAffairs: {},
  partnerDescription: "",
  recurring: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  recurringDays: {
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
  },
  isOffCampus: "",
  hasOutsideVisitors: false,
  venue: "",
  venueApprover: "",
  venueApproverContact: "",
  organizationAdviser: "",
  organizationAdviserContact: "",
  greenCampusMonitor: "",
  greenCampusMonitorContact: "",
  conceptPaperFile: null,
  form2bFile: null,
  appealReason: "",
};

const ActivityRequest = () => {
  return (
    <div className="max-w-[1350px] mx-auto">
      <ActivityForm
        mode="create"
        showAppealReason={false}
        defaultValues={DEFAULT_VALUES}
      />
    </div>
  );
};

export default ActivityRequest;
