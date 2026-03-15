import { Clock, CheckCircle, CalendarDays, Award } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/animated-container";
import { Skeleton } from "@/components/ui/skeleton";

const stats = [
  {
    key: "pending",
    label: "Pending Requests",
    icon: Clock,
    bgColor: "bg-sro-accent-50",
    iconColor: "text-sro-accent-500",
    countColor: "text-sro-accent-700",
  },
  {
    key: "approved",
    label: "Approved Activities",
    icon: CheckCircle,
    bgColor: "bg-sro-secondary-50",
    iconColor: "text-sro-secondary",
    countColor: "text-sro-secondary-700",
  },
  {
    key: "upcoming",
    label: "Upcoming Events",
    icon: CalendarDays,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-500",
    countColor: "text-blue-700",
  },
  {
    key: "applications",
    label: "Org Applications",
    icon: Award,
    bgColor: "bg-sro-primary-50",
    iconColor: "text-sro-primary",
    countColor: "text-sro-primary-700",
  },
];

const StudentStatCards = ({ counts, loading = false }) => {
  const hasData = counts !== null && counts !== undefined && Object.keys(counts).length > 0;

  return (
    <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StaggerItem
          key={stat.key}
          className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className={`p-2.5 rounded-lg shrink-0 ${stat.bgColor}`}>
            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
          </div>
          <div className="min-w-0">
            {loading || !hasData ? (
              <Skeleton className="h-7 w-10 mb-1" />
            ) : (
              <p className={`text-2xl font-bold ${stat.countColor} animate-[fadeIn_0.4s_ease-in-out]`}>
                {counts[stat.key] ?? 0}
              </p>
            )}
            <p className="text-xs text-gray-500 font-medium leading-tight">{stat.label}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
};

export default StudentStatCards;
