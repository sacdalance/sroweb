import { Card, CardContent } from "@/components/ui/card";

const Dashboard = () => {
    return (
        <div className="ml-20 p-6">
        <Card className="shadow-sm px-6 py-4">
            <div className="space-y-1">
            <h2 className="text-2xl font-bold">
                Welcome to SRO All-in-One Web App
            </h2>
            <p className="text-sm text-muted-foreground">
                This portal allows you to manage your organization activities and requests. Use the sidebar to navigate through different sections.
            </p>
            </div>
        </Card>
        </div>
    );
};

export default Dashboard;
