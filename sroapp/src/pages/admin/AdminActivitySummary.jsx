import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Filter, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import { fetchSummaryActivities } from "@/api/adminActivityAPI";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Eye, ChevronDown } from "lucide-react";
import { ArrowRight, ChevronLeft, ChevronRight, FileText, Calendar, Clock, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const activityTypeOptions = [
  { id: "charitable", label: "Charitable" },
  { id: "serviceWithinUPB", label: "Service within UPB" },
  { id: "serviceOutsideUPB", label: "Service outside UPB" },
  { id: "contestWithinUPB", label: "Contest within UPB" },
  { id: "contestOutsideUPB", label: "Contest outside UPB" },
  { id: "educational", label: "Educational" },
  { id: "incomeGenerating", label: "IGP" },
  { id: "massOrientation", label: "Mass Orientation/GA" },
  { id: "booth", label: "Booth" },
  { id: "rehearsals", label: "Rehearsals/Preparation" },
  { id: "specialEvents", label: "Special Events" },
  { id: "others", label: "Others" },
];

const formatActivityTypeLabel = (id) => {
  return activityTypeOptions.find((opt) => opt.id === id)?.label || id;
};

const activityTypes = [
  { id: 'A', dbValue: 'charitable', label: 'A: Charitable', color: 'bg-[#7B1113]' },
  { id: 'B', dbValue: 'serviceWithinUPB', label: 'B: Service (within UPB)', color: 'bg-[#7B1113]' },
  { id: 'C', dbValue: 'serviceOutsideUPB', label: 'C: Service (outside UPB)', color: 'bg-[#7B1113]' },
  { id: 'D', dbValue: 'contestWithinUPB', label: 'D: Contest (within UPB)', color: 'bg-[#7B1113]' },
  { id: 'E', dbValue: 'contestOutsideUPB', label: 'E: Contest (outside UPB)', color: 'bg-[#7B1113]' },
  { id: 'F', dbValue: 'educational', label: 'F: Educational', color: 'bg-[#7B1113]' },
  { id: 'G', dbValue: 'incomeGenerating', label: 'G: Income Generating Project', color: 'bg-[#7B1113]' },
  { id: 'H', dbValue: 'massOrientation', label: 'H: Mass Orientation/GA', color: 'bg-[#7B1113]' },
  { id: 'I', dbValue: 'booth', label: 'I: Booth', color: 'bg-[#7B1113]' },
  { id: 'J', dbValue: 'rehearsals', label: 'J: Rehearsals/Preparation', color: 'bg-[#7B1113]' },
  { id: 'K', dbValue: 'specialEvents', label: 'K: Special Events', color: 'bg-[#7B1113]' },
  { id: 'L', dbValue: 'others', label: 'L: Others', color: 'bg-[#7B1113]' },
  { id: 'all', dbValue: 'all', label: 'Show All', color: 'bg-[#7B1113]' }
];


const organizations = [
  "All Organizations",
  "Computer Science Society",
  "UP Aguman",
  "Junior Blockchain Education Consortium of the Philippines",
  "Samahan ng Organisasyon UPB"
];

const months = [
  "All Months",
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const academicYears = [
  "All Academic Years",
  "2023-2024",
  "2022-2023",
  "2021-2022",
  "2020-2021"
];

const AdminActivitySummary = () => {
  const [selectedType, setSelectedType] = useState('A');
  const [filter, setFilter] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("All Organizations");
  const [selectedMonth, setSelectedMonth] = useState("All Months");
  const [selectedYear, setSelectedYear] = useState("All Academic Years");
  const [appliedFilters, setAppliedFilters] = useState({
    organization: "All Organizations",
    month: "All Months",
    year: "All Academic Years"
  });

  const [summaryActivities, setSummaryActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        const activities = await fetchSummaryActivities({
          activity_type: activityTypes.find(t => t.id === selectedType)?.dbValue || 'all',
          status: filter,
          organization: appliedFilters.organization,
          month: appliedFilters.month,
          year: appliedFilters.year
        });
        setSummaryActivities(activities);
      } catch (err) {
        console.error("Error loading summary:", err.message);
      } finally {
        setLoading(false);
      }
    };
  
    loadSummary();
  }, [selectedType, filter, appliedFilters]);

  // Function to check if an activity matches the applied filters
  const matchesFilters = (activity) => {
    // Organization filter
    if (appliedFilters.organization !== "All Organizations" && 
        activity.organization !== appliedFilters.organization) {
      return false;
    }

    // Month filter
    if (appliedFilters.month !== "All Months") {
      const activityDate = new Date(activity.activityDate);
      const activityMonth = months[activityDate.getMonth() + 1]; // +1 because "All Months" is at index 0
      if (activityMonth !== appliedFilters.month) {
        return false;
      }
    }

    // Academic year filter
    if (appliedFilters.year !== "All Academic Years") {
      const activityDate = new Date(activity.activityDate);
      const activityYear = activityDate.getFullYear();
      const [startYear, endYear] = appliedFilters.year.split('-').map(Number);
      if (activityYear < startYear || activityYear > endYear) {
        return false;
      }
    }

    return true;
  };

  // Get all activities of the selected type first
  const activitiesOfSelectedType = summaryActivities;

  // Get counts from all activities of selected type
  const approvedCount = activitiesOfSelectedType.filter(a => a.final_status === 'Approved').length;
  const pendingCount = activitiesOfSelectedType.filter(a => a.final_status === 'Pending').length;

  // Then apply status filter for display
  const filteredActivities = activitiesOfSelectedType.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'approved') return activity.final_status === 'Approved';
    if (filter === 'pending') return (
      activity.final_status === null || activity.final_status === 'For Appeal'
    );
    return true;
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      organization: selectedOrg,
      month: selectedMonth,
      year: selectedYear
    });
    setIsFilterModalOpen(false);
  };

  const handleRemoveFilter = (filterType) => {
    setAppliedFilters(prev => {
      const newFilters = { ...prev };
      if (filterType === 'organization') {
        newFilters.organization = "All Organizations";
        setSelectedOrg("All Organizations");
      } else if (filterType === 'month') {
        newFilters.month = "All Months";
        setSelectedMonth("All Months");
      } else if (filterType === 'year') {
        newFilters.year = "All Academic Years";
        setSelectedYear("All Academic Years");
      }
      return newFilters;
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#7B1113] mb-6">Summary of Activity Requests</h1>
      
      {/* Activity Type Pills using shadcn Button with variant ghost */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {activityTypes.map((type) => (
          <Button
            key={type.id}
            variant="ghost"
            onClick={() => setSelectedType(type.id)}
            className={`rounded-full text-sm ${
              selectedType === type.id 
                ? type.color + ' text-white hover:text-white hover:' + type.color
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </Button>
        ))}
      </div>

      {/* Filter Section using Tabs */}
      <Card className="mb-6">
        <div className="p-2 px-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">
              {selectedType === 'all' 
                ? 'All Activities'
                : activityTypes.find(t => t.id === selectedType)?.label.split(': ')[1]}
            </h2>
            <div className="flex items-center gap-2">
              {(appliedFilters.organization !== "All Organizations" || 
                appliedFilters.month !== "All Months" || 
                appliedFilters.year !== "All Academic Years") && (
                <div className="flex items-center gap-2">
                  {appliedFilters.organization !== "All Organizations" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {appliedFilters.organization}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveFilter('organization')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {appliedFilters.month !== "All Months" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {appliedFilters.month}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveFilter('month')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {appliedFilters.year !== "All Academic Years" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {appliedFilters.year}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveFilter('year')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
              </div>
              )}
              <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Filter Activities</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Organization</label>
                      <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org} value={org}>
                              {org}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
            </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Month</label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            ))}
              </SelectContent>
            </Select>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Academic Year</label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                            {academicYears.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
              </SelectContent>
            </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsFilterModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleApplyFilters}
                      className="bg-[#7B1113] hover:bg-[#5e0d0e] text-white"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex justify-center px-8">
            <Tabs value={filter} onValueChange={setFilter} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-3 h-8 p-0 bg-gray-100 rounded-4xl">
              <TabsTrigger 
                value="all"
                className="text-sm h-8 flex items-center justify-center data-[state=active]:bg-[#7B1113] data-[state=active]:text-white relative data-[state=active]:shadow-none rounded-l-4xl"
              >
                Show All
              </TabsTrigger>
              <TabsTrigger 
                value="approved"
                className="text-sm h-8 flex items-center justify-center data-[state=active]:bg-[#7B1113] data-[state=active]:text-white relative data-[state=active]:shadow-none"
              >
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger 
                value="pending"
                className="text-sm h-8 flex items-center justify-center data-[state=active]:bg-[#7B1113] data-[state=active]:text-white relative data-[state=active]:shadow-none rounded-r-4xl"
              >
                Pending ({pendingCount})
              </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      {/* Table Section */}
        <Table>
          <TableHeader>
            <TableRow className="border-b-0">
              <TableHead className="w-[150px] text-sm font-semibold text-center py-5">Activity ID</TableHead>
              <TableHead className="w-[180px] text-sm font-semibold text-center py-5">Submission Date</TableHead>
              <TableHead className="w-[250px] text-sm font-semibold text-center py-5">Organization</TableHead>
              <TableHead className="w-[250px] text-sm font-semibold text-center py-5">Activity Name</TableHead>
              <TableHead className="w-[250px] text-sm font-semibold text-center py-5">Activity Type</TableHead>
              <TableHead className="w-[180px] text-sm font-semibold text-center py-5">Activity Date</TableHead>
              <TableHead className="w-[200px] text-sm font-semibold text-center py-5">Venue</TableHead>
              <TableHead className="w-[150px] text-sm font-semibold text-center py-5">Adviser</TableHead>
              <TableHead className="w-[150px] text-sm font-semibold text-center py-5">Status</TableHead>  
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-gray-500">
                  No activities found.
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map((activity, index) => (
                <TableRow key={index} className="border-b border-gray-100">
                  <TableCell className="py-5 text-sm text-center">{activity.activity_id}</TableCell>
                  <TableCell className="py-5 text-sm text-center">
                    {new Date(activity.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </TableCell>
                  <TableCell className="py-5 text-sm text-center">{activity.organization?.org_name || "N/A"}</TableCell>
                  <TableCell className="py-5 text-sm text-center">
                    {activity.activity_name}
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col items-center gap-2 max-w-[220px] mx-auto">
                      {(activity.activity_type?.split(",") || []).slice(0, 3).map((typeId) => (
                        <Badge
                          key={typeId}
                          variant="secondary"
                          className={`${
                            typeId === selectedType
                              ? 'bg-[#7B1113] text-white hover:bg-[#7B1113]'
                              : ''
                          } w-full text-center text-sm px-6 py-1 flex items-center justify-center min-h-[28px] whitespace-nowrap`}
                        >
                          <span className="inline-block truncate max-w-[200px]">
                            {formatActivityTypeLabel(typeId)}
                          </span>
                        </Badge>
                      ))}
                      {(activity.activity_type?.split(",") || []).length > 3 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            +{activity.activity_type.split(",").length - 3}
                          </div>
                          more
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-sm text-center">
                    {new Date(activity.schedule?.[0]?.start_date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </TableCell>
                  <TableCell className="py-5 text-sm text-center">{activity.venue || "N/A"}</TableCell>
                  <TableCell className="py-5 text-sm text-center">
                    {activity.organization?.adviser_name || "N/A"}
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center justify-center">
                      <Badge
                        variant={activity.final_status === 'Approved' ? 'success' : 'warning'}
                        className="text-sm px-4 py-1"
                      >
                        {activity.final_status || "Pending"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-5">
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setSelectedActivity(activity);
                          setIsModalOpen(true);
                        }}
                        className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedActivity && (
          <ActivityDialogContent
            activity={selectedActivity}
            setActivity={setSelectedActivity}
            isModalOpen={isModalOpen}
            readOnly={true}
          />
        )}
      </Dialog>

      {/* See Activities Calendar Button */}
      <div className="flex justify-end mt-4">
        <Link to="/admin/activities-calendar">
          <Button className="bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-sm">
            See Activities Calendar <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
          </div>
    </div>
  );
};

export default AdminActivitySummary; 