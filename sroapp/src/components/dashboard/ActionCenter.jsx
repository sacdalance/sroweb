import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle, Clock, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ListSkeleton } from "@/components/ui/skeletons";

const ActionItem = ({ icon: Icon, title, count, link, description }) => (
    <Link
        to={link}
        className={cn(
            "flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-sro-primary/30 hover:bg-gray-50 transition-all group",
        )}
    >
        <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-full shrink-0 bg-gray-100 text-sro-primary")}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-sro-primary transition-colors">
                    {title}
                </h4>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {count > 0 && (
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full bg-sro-primary/10 text-sro-primary")}>
                    {count}
                </span>
            )}
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-sro-primary transition-colors" />
        </div>
    </Link>
);

const ActionCenter = ({ counts, loading = false, className }) => {
    const { pending = 0, forAppeal = 0, pendingApplications = 0 } = counts || {};
    const totalActionable = pending + forAppeal + pendingApplications;

    return (
        <Card className={cn("flex flex-col h-full shadow-sm border border-gray-200", className)}>
            <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-base font-bold text-sro-primary flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        Action Center
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 pt-4 space-y-3">
                {loading || !counts ? (
                    <ListSkeleton rows={3} />
                ) : totalActionable === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8 text-gray-400">
                        <FileCheck className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm">All caught up!</p>
                        <p className="text-xs max-w-[180px]">No pending requests or application at the moment.</p>
                    </div>
                ) : (
                    <>
                        {forAppeal > 0 && (
                            <ActionItem
                                icon={AlertCircle}
                                title="Appeals to Review"
                                count={forAppeal}
                                description="Rejected requests being appealed"
                                link="/admin/student-activities"
                            />
                        )}

                        {pending > 0 && (
                            <ActionItem
                                icon={Clock}
                                title="Activity Approvals"
                                count={pending}
                                description="New activity submissions"
                                link="/admin/student-activities"
                            />
                        )}

                        {pendingApplications > 0 && (
                            <ActionItem
                                icon={FileCheck}
                                title="Org Applications"
                                count={pendingApplications}
                                description="Recognition/Renewal requests"
                                link="/admin/org-applications"
                            />
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default ActionCenter;
