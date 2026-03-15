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

const StudentStatCards = ({ counts = {}, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
            <p className={`text-2xl font-bold ${stat.countColor}`}>
              {counts[stat.key] ?? 0}
            </p>
            <p className="text-xs text-gray-500 font-medium leading-tight">{stat.label}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
};

export default StudentStatCards;
