import ActivityForm from "@/components/ActivityForm";

const ActivityRequest = () => {
return (
    <div className="min-h-screen px-4">
    <ActivityForm
        mode="create"
        showAppealReason={false}
        defaultValues={{
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
        venue: "",
        venueApprover: "",
        venueApproverContact: "",
        organizationAdviser: "",
        organizationAdviserContact: "",
        greenCampusMonitor: "",
        greenCampusMonitorContact: "",
        selectedFile: null,
        appealReason: "",
        }}
    />
    </div>
);
};

export default ActivityRequest;
