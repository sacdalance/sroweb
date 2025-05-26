import ActivityForm from "@/components/ActivityForm";

const AdminCreateActivity = () => {
return (
    <ActivityForm
    mode="admin"
    showAppealReason={false}
    autoApprove={true}
    />
);
};

export default AdminCreateActivity;