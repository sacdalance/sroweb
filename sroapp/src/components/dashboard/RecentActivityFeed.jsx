import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, User, Activity, FileText, Settings } from "lucide-react";
import supabase from "@/lib/supabase";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/loading-spinner";

const ActivityItem = ({ log }) => {
    // Determine icon and color based on action text
    let Icon = Activity;
    let colorClass = "bg-gray-100 text-gray-600";

    const actionLower = log.action?.toLowerCase() || "";

    if (actionLower.includes("login") || actionLower.includes("logout")) {
        Icon = User;
        colorClass = "bg-blue-100 text-blue-600";
    } else if (actionLower.includes("create") || actionLower.includes("submit")) {
        Icon = FileText;
        colorClass = "bg-green-100 text-green-600";
    } else if (actionLower.includes("update") || actionLower.includes("edit") || actionLower.includes("approve")) {
        Icon = Settings;
        colorClass = "bg-amber-100 text-amber-600";
    } else if (actionLower.includes("delete") || actionLower.includes("reject")) {
        Icon = Activity;
        colorClass = "bg-red-100 text-red-600";
    }

    // Format time relative
    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="flex gap-3 py-3 group">
            <div className={cn("mt-1 p-1.5 rounded-full h-fit", colorClass)}>
                <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium text-gray-800 leading-none">
                    {log.action}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-sro-secondary">
                        {log.account?.email || `User #${log.account_id}`}
                    </span>
                    <span>•</span>
                    <span>{timeAgo(log.timestamp)}</span>
                </div>
            </div>
        </div>
    );
};

const RecentActivityFeed = ({ className }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data, error } = await supabase
                    .from("logs")
                    .select(`
            *,
            account:account(email, account_name)
          `)
                    .order("timestamp", { ascending: false })
                    .limit(8);

                if (error) throw error;
                setLogs(data || []);
            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();

        // Optional: Realtime subscription could be added here
    }, []);

    return (
        <Card className={cn("flex flex-col h-full shadow-sm", className)}>
            <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-500" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                {loading ? (
                    <div className="p-4">
                        <LoadingSpinner text="Loading feed..." variant="inline" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No recent activity recorded.
                    </div>
                ) : (
                    <div className="divide-y px-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {logs.map((log) => (
                            <ActivityItem key={log.log_id} log={log} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default RecentActivityFeed;
