import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Filter, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const activityTypes = [
  { id: 'A', label: 'A: Charitable', color: 'bg-[#014421]' },
  { id: 'B', label: 'B: Service (within UPB)', color: 'bg-[#014421]' },
  { id: 'C', label: 'C: Service (outside UPB)', color: 'bg-[#014421]' },
  { id: 'D', label: 'D: Contest (within UPB)', color: 'bg-[#014421]' },
  { id: 'E', label: 'E: Contest (outside UPB)', color: 'bg-[#014421]' },
  { id: 'F', label: 'F: Educational', color: 'bg-[#014421]' },
  { id: 'G', label: 'G: Income Generating Project', color: 'bg-[#014421]' },
  { id: 'H', label: 'H: Mass Orientation/GA', color: 'bg-[#014421]' },
  { id: 'I', label: 'I: Booth', color: 'bg-[#014421]' },
  { id: 'J', label: 'J: Rehearsals/Preparation', color: 'bg-[#014421]' },
  { id: 'K', label: 'K: Special Events', color: 'bg-[#014421]' },
  { id: 'L', label: 'L: Others', color: 'bg-[#014421]' },
  { id: 'all', label: 'Show All', color: 'bg-[#014421]' }
];

// Mock data for the table with multiple categories per activity
const mockActivities = [
  {
    activityID: "0424-2421", 
    submissionDate: "2024-03-15",
    organization: "Organization Name",
    activityName: "Community Outreach Program",
    activityDescription: "Step into the ultimate coding showdown where developers go head-to-head in a high-intensity coding competition! Participants will tackle real-world problems, optimize code, and flex their debugging skills in a battle of speed and creativity. With thrilling challenges, live leaderboards, and surprise twists, only the most adaptable coders will rise to the top.",
    activityTypes: ["A", "B"], // Can be both Charitable and Service (within UPB)
    activityDate: "2024-04-01",
    venue: "UP Baguio Grounds",
    adviser: "Steve Magalong",
    status: "Pending"
  },
  {
    activityID: "0424-2321", 
    submissionDate: "2024-03-16",
    organization: "Student Council",
    activityName: "Leadership Training Workshop",
    activityDescription: "An intensive workshop designed to develop leadership skills among student organizations through interactive sessions and practical exercises.",
    activityTypes: ["F", "H"], // Educational and Mass Orientation
    activityDate: "2024-04-05",
    venue: "AVR 1",
    adviser: "Biogesic",
    status: "Approved"
  },
  {   
    activityID: "0424-1241", 
    submissionDate: "2024-03-17",
    organization: "Theater Guild",
    activityName: "Annual Theater Production",
    activityDescription: "A showcase of theatrical talent featuring original plays and performances by the Theater Guild members.",
    activityTypes: ["J", "K"], // Rehearsals and Special Events
    activityDate: "2024-04-10",
    venue: "Theater Hall",
    adviser: "Tung Tung Tung Sahur",
    status: "Pending"
  }
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
  const activitiesOfSelectedType = mockActivities.filter(activity => 
    selectedType === 'all' || activity.activityTypes.includes(selectedType)
  ).filter(activity => matchesFilters(activity));

  // Get counts from all activities of selected type
  const approvedCount = activitiesOfSelectedType.filter(a => a.status === 'Approved').length;
  const pendingCount = activitiesOfSelectedType.filter(a => a.status === 'Pending').length;

  // Then apply status filter for display
  const filteredActivities = activitiesOfSelectedType.filter(activity => 
    filter === 'all' || 
    (filter === 'approved' && activity.status === 'Approved') ||
    (filter === 'pending' && activity.status === 'Pending')
  );

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
                  className="text-sm h-8 flex items-center justify-center data-[state=active]:bg-black data-[state=active]:text-white relative data-[state=active]:shadow-none rounded-l-4xl"
                >
                  Show All
                </TabsTrigger>
                <TabsTrigger 
                  value="approved"
                  className="text-sm h-8 flex items-center justify-center data-[state=active]:bg-black data-[state=active]:text-white relative data-[state=active]:shadow-none"
                >
                  Approved ({approvedCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="pending"
                  className="text-sm h-8 flex items-center justify-center data-[state=active]:bg-black data-[state=active]:text-white relative data-[state=active]:shadow-none rounded-r-4xl"
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
            {filteredActivities.map((activity, index) => (
              <TableRow key={index} className="border-b border-gray-100">
                <TableCell className="py-5 text-sm text-center">{activity.activityID}</TableCell>
                <TableCell className="py-5 text-sm text-center">{activity.submissionDate}</TableCell>
                <TableCell className="py-5 text-sm text-center">{activity.organization}</TableCell>
                <TableCell className="py-5 text-sm text-center">{activity.activityName}</TableCell>
                <TableCell className="py-5">
                  <div className="flex flex-col items-center gap-2 max-w-[220px] mx-auto">
                    {activity.activityTypes.slice(0, 3).map(typeId => (
                      <Badge 
                        key={typeId}
                        variant="secondary"
                        className={`${
                          typeId === selectedType 
                            ? 'bg-[#014421] text-white hover:bg-[#014421]' 
                            : ''
                        } w-full text-center text-sm px-6 py-1 flex items-center justify-center min-h-[28px] whitespace-nowrap`}
                      >
                        <span className="inline-block truncate max-w-[200px]">
                          {activityTypes.find(t => t.id === typeId)?.label.split(': ')[1]}
                      </span>
                      </Badge>
                    ))}
                    {activity.activityTypes.length > 3 && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          +{activity.activityTypes.length - 3}
                        </div>
                        more
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-5 text-sm text-center">{activity.activityDate}</TableCell>
                <TableCell className="py-5 text-sm text-center">{activity.venue}</TableCell>
                <TableCell className="py-5 text-sm text-center">{activity.adviser}</TableCell>
                <TableCell className="py-5">
                  <div className="flex items-center justify-center">
                    <Badge 
                      variant={activity.status === 'Approved' ? 'success' : 'warning'}
                      className="text-sm px-4 py-1"
                    >
                      {activity.status}
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
            ))}
          </TableBody>
        </Table>

      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[1000px] w-[90vw] sm:w-[85vw] mx-auto">
          <DialogHeader className="px-2">
            <DialogTitle className="text-xl font-bold text-[#7B1113]">Activity Details</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-6 px-2">
              {/* Activity Title, Description and Organization */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{selectedActivity.activityName}</h2>
                <p className="text-sm text-gray-600">{selectedActivity.organization}</p>
                <p className="text-sm text-gray-700 mt-2">{selectedActivity.activityDescription}</p>
              </div>

              {/* General Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">General Information</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Activity Type:</span>
                    <span>{selectedActivity.activityType}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Adviser Name:</span>
                    <span>{selectedActivity.adviser}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Charge Fee:</span>
                    <span>No</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Adviser Contact:</span>
                    <span>{selectedActivity.adviserContact || "09123456789"}</span>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">Specifications</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Venue:</span>
                    <span>{selectedActivity.venue}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Green Monitor:</span>
                    <span>Monitor</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Venue Approver:</span>
                    <span>Approver</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Monitor Contact:</span>
                    <span>Contact</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Venue Contact:</span>
                    <span>Contact</span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">Schedule</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Date:</span>
                    <span>{selectedActivity.activityDate}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Time:</span>
                    <span>10:00 AM - 2:00 PM</span>
                  </div>
                </div>
              </div>

              {/* University Partners */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">University Partners</h3>
                <div className="text-sm">
                  <p>Department of Mathematics and Computer Science</p>
                </div>
              </div>

              {/* List of Sustainable Development Goals */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">List of Sustainable Development Goals</h3>
                <div className="flex gap-2">
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">No Poverty</span>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">Good Health and Well-being</span>
                </div>
              </div>

              {/* Bottom Section with Status and View Form Button */}
              <div className="flex justify-between items-center">
                <Button 
                  className="text-sm bg-[#014421] hover:bg-[#013319] text-white"
                >
                  View Scanned Form
                </Button>
                <Badge 
                  variant={selectedActivity.status === 'Approved' ? 'success' : 'warning'}
                  className="text-sm px-4 py-1"
                >
                  {selectedActivity.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* See Activities Calendar Button */}
      <div className="flex justify-end mt-4">
        <Link to="/admin/activities-calendar">
          <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm">
            See Activities Calendar <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
          </div>
    </div>
  );
};

export default AdminActivitySummary; 