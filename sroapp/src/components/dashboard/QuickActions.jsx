import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusCircle,
  CalendarCheck,
  Calendar,
  Award,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "New Activity Request",
    path: "/activity-request",
    icon: PlusCircle,
    description: "Submit a new activity",
  },
  {
    label: "Book Appointment",
    path: "/appointment-booking",
    icon: CalendarCheck,
    description: "Schedule a consultation",
  },
  {
    label: "View Calendar",
    path: "/activities-calendar",
    icon: Calendar,
    description: "See all activities",
  },
  {
    label: "Apply for Recognition",
    path: "/org-application",
    icon: Award,
    description: "Org recognition form",
  },
  {
    label: "Annual Report",
    path: "/annual-report",
    icon: BookOpen,
    description: "Submit your report",
  },
];

const QuickActions = ({ className }) => {
  return (
    <Card className={cn("shadow-sm h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-sro-primary">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-all group"
          >
            <div className="p-2 rounded-lg bg-sro-primary-50 text-sro-primary group-hover:bg-sro-primary group-hover:text-white transition-colors">
              <action.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover:text-sro-primary transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-gray-400">{action.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-sro-primary transition-colors" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
