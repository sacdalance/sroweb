import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import supabase from "@/lib/supabase";
import { cn } from "@/lib/utils";

const statusStyles = {
  Approved: "bg-sro-secondary-50 text-sro-secondary-700",
  Pending: "bg-sro-accent-50 text-sro-accent-700",
  Rejected: "bg-sro-primary-50 text-sro-primary-700",
  "For Appeal": "bg-gray-100 text-gray-600",
  "ODSA Pending": "bg-sro-primary-50 text-sro-primary",
  default: "bg-gray-100 text-gray-600",
};

const StudentRecentRequests = ({ className }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: account } = await supabase
          .from("account")
          .select("account_id")
          .eq("email", user.email)
          .single();

        if (!account) return;

        const { data, error } = await supabase
          .from("activity")
          .select("activity_id, activity_name, final_status, created_at")
          .eq("account_id", account.account_id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!error) setRequests(data || []);
      } catch (err) {
        console.error("Error fetching recent requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <Card className={cn("shadow-sm h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-sro-primary">
            Recent Requests
          </CardTitle>
          <Link to="/requests">
            <Button variant="ghost" size="sm" className="text-xs text-sro-primary hover:text-sro-primary-800">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 bg-gray-50 rounded-full mb-3">
              <FileText className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No requests yet</p>
            <Link to="/activity-request">
              <Button variant="sro-primary" size="sm" className="mt-3 text-xs">
                Create your first request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => {
              const status = req.final_status || "Pending";
              const style = statusStyles[status] || statusStyles.default;

              return (
                <div
                  key={req.activity_id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {req.activity_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap", style)}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentRecentRequests;
