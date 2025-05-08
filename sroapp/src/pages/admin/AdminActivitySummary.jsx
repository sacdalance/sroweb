import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchSummaryActivities, fetchOrganizationNames, fetchAcademicYears } from "@/api/adminActivityAPI";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import { Link } from "react-router-dom";
import {
  Filter,
  X,
  Eye,
  ChevronDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Clock,
  User,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const months = [
  "All Months",
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const AdminActivitySummary = () => {
  const [tabCooldown, setTabCooldown] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [filter, setFilter] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("All Organizations");
  const [selectedMonth, setSelectedMonth] = useState("All Months");
  const [selectedYear, setSelectedYear] = useState("All Academic Years");
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
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
          status: filter === 'approved' ? 'Approved' : filter,
          organization: appliedFilters.organization,
          month: appliedFilters.month,
          year: appliedFilters.year
        });
        setSummaryActivities(activities);
        console.log("Sample activity:", activities[0]);
      } catch (err) {
        console.error("Error loading summary:", err.message);
      } finally {
        setLoading(false);
      }
    };
  
    loadSummary();
  }, [selectedType, filter, appliedFilters]);

  const [organizationOptions, setOrganizationOptions] = useState(["All Organizations"]);
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const orgs = await fetchOrganizationNames();
        setOrganizationOptions(["All Organizations", ...orgs]);
      } catch (err) {
        console.error("Failed to load organizations:", err);
      }
    };
  
    loadOrgs();
  }, []);
  const filteredOrgOptions = organizationOptions.filter((org) =>
    org.toLowerCase().includes(orgSearchTerm.toLowerCase())
  );

  const [academicYears, setAcademicYears] = useState(["All Academic Years"]);
  useEffect(() => {
    const loadYears = async () => {
      try {
        const years = await fetchAcademicYears();
        setAcademicYears(years);
      } catch (err) {
        console.error("Failed to load academic years:", err);
      }
    };
  
    loadYears();
  }, []);

  // Then apply status filter for display
  const filteredActivities = summaryActivities.filter((activity) => {
    const startDateStr = activity.schedule?.[0]?.start_date;
    if (!startDateStr) return false;
  
    const startDate = new Date(startDateStr);
    const startYear = startDate.getFullYear();
    const activityMonth = startDate.toLocaleString("default", { month: "long" });
  
    //  Filter by academic year
    if (appliedFilters.year !== "All Academic Years") {
      const selectedStartYear = parseInt(appliedFilters.year.split("-")[0]);
      if (startYear !== selectedStartYear) return false;
    }
  
    //  Filter by month
    if (appliedFilters.month !== "All Months" && activityMonth !== appliedFilters.month) {
      return false;
    }
  
    //  Filter by organization
    if (
      appliedFilters.organization !== "All Organizations" &&
      activity.organization?.org_name !== appliedFilters.organization
    ) {
      return false;
    }
  
    //  Filter by status
    const isApproved = activity.final_status === "Approved";
    const isPending = activity.final_status === "For Appeal" || activity.final_status === null;
    if (filter === "approved" && !isApproved) return false;
    if (filter === "pending" && !isPending) return false;
  
    return true;
  });
  const approvedCount = filteredActivities.filter(a => a.final_status === "Approved").length;
  const pendingCount = filteredActivities.filter(a =>
    a.final_status === null || a.final_status === "For Appeal"
  ).length;

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
            disabled={loading || tabCooldown}
            onClick={() => {
              if (tabCooldown || loading) return;
              setSelectedType(type.id);
              setFilter("all");
              setTabCooldown(true);
              setTimeout(() => setTabCooldown(false), 800);
            }}
            className={`rounded-full text-sm transition-opacity ${
              selectedType === type.id
                ? type.color + ' text-white hover:text-white hover:' + type.color
                : 'bg-gray-100 hover:bg-gray-200'
            } ${loading || tabCooldown ? "opacity-50 pointer-events-none" : ""}`}
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
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Organization</label>
                        <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
                          <PopoverTrigger asChild>
                            <div
                              id="orgSelect"
                              role="combobox"
                              aria-expanded={orgPopoverOpen}
                              className="w-full flex items-center justify-between border border-input bg-transparent rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400"
                            >
                              <span className={cn(!selectedOrg && "text-muted-foreground")}>
                                {selectedOrg || "Type your org name or select from the list"}
                              </span>
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </div>
                          </PopoverTrigger>

                          <PopoverContent align="start" className="w-full max-w-md p-0">
                            <Input
                              placeholder="Search organization..."
                              value={orgSearchTerm}
                              onChange={(e) => setOrgSearchTerm(e.target.value)}
                              className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                            />
                            <div className="max-h-48 overflow-y-auto">
                              {filteredOrgOptions.length > 0 ? (
                                filteredOrgOptions.map((org) => (
                                  <button
                                    key={org}
                                    onClick={() => {
                                      setSelectedOrg(org);
                                      setOrgSearchTerm(org);
                                      setOrgPopoverOpen(false);
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-2 hover:bg-gray-100",
                                      selectedOrg === org && "bg-gray-100 font-medium"
                                    )}
                                  >
                                    {org}
                                    {selectedOrg === org && (
                                      <Check className="ml-2 inline h-4 w-4 text-green-600" />
                                    )}
                                  </button>
                                ))
                              ) : (
                                <p className="px-4 py-2 text-sm text-muted-foreground">No results found</p>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

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
          <Tabs
          value={filter}
          onValueChange={(val) => {
            if (tabCooldown || loading) return;

            setFilter(val);
            setTabCooldown(true);

            setTimeout(() => {
              setTabCooldown(false);
            }, 800); // cooldown in ms
          }}
          className="w-[400px]"
        >
          <TabsList className="grid w-full grid-cols-3 h-8 p-0 bg-gray-100 rounded-4xl">
            <TabsTrigger
              value="all"
              disabled={loading || tabCooldown}
              className={`text-sm h-8 flex items-center justify-center transition-opacity rounded-l-4xl ${
                loading || tabCooldown ? "opacity-50 pointer-events-none" : ""
              } data-[state=active]:bg-[#7B1113] data-[state=active]:text-white relative data-[state=active]:shadow-none`}
            >
              Show All
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              disabled={loading || tabCooldown}
              className={`text-sm h-8 flex items-center justify-center transition-opacity ${
                loading || tabCooldown ? "opacity-50 pointer-events-none" : ""
              } data-[state=active]:bg-[#7B1113] data-[state=active]:text-white relative data-[state=active]:shadow-none`}
            >
              Approved ({approvedCount})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              disabled={loading || tabCooldown}
              className={`text-sm h-8 flex items-center justify-center transition-opacity rounded-r-4xl ${
                loading || tabCooldown ? "opacity-50 pointer-events-none" : ""
              } data-[state=active]:bg-[#7B1113] data-[state=active]:text-white relative data-[state=active]:shadow-none`}
            >
              Pending ({pendingCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
          </div>
        </div>
      {/* Table Section */}
      {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 text-sm">
            <div className="h-6 w-6 mb-3 border-2 border-[#7B1113] border-t-transparent rounded-full animate-spin"></div>
            Loading submissions...
          </div>
        ) : (
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
                    {activity.schedule?.[0]?.start_date
                      ? new Date(activity.schedule[0]?.start_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })
                      : "TBD"}
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
      )}

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