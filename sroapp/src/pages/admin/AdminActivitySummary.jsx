import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { fetchSummaryActivities, fetchOrganizationNames, fetchAcademicYears, generateApprovalSlips } from "@/api/adminActivityAPI";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import {
  Filter,
  X,
  ArrowRight,
  FileText,
} from "lucide-react";
import { toast, Toaster } from "sonner";




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
  { id: 'all', dbValue: 'all', label: 'Show All', color: 'bg-[#7B1113]' },
  { id: 'A', dbValue: 'charitable', label: 'Charitable', color: 'bg-[#7B1113]' },
  { id: 'B', dbValue: 'serviceWithinUPB', label: 'Service (within UPB)', color: 'bg-[#7B1113]' },
  { id: 'C', dbValue: 'serviceOutsideUPB', label: 'Service (outside UPB)', color: 'bg-[#7B1113]' },
  { id: 'D', dbValue: 'contestWithinUPB', label: 'Contest (within UPB)', color: 'bg-[#7B1113]' },
  { id: 'E', dbValue: 'contestOutsideUPB', label: 'Contest (outside UPB)', color: 'bg-[#7B1113]' },
  { id: 'F', dbValue: 'educational', label: 'Educational', color: 'bg-[#7B1113]' },
  { id: 'G', dbValue: 'incomeGenerating', label: 'Income Generating Project', color: 'bg-[#7B1113]' },
  { id: 'H', dbValue: 'massOrientation', label: 'Mass Orientation/GA', color: 'bg-[#7B1113]' },
  { id: 'I', dbValue: 'booth', label: 'Booth', color: 'bg-[#7B1113]' },
  { id: 'J', dbValue: 'rehearsals', label: 'Rehearsals/Preparation', color: 'bg-[#7B1113]' },
  { id: 'K', dbValue: 'specialEvents', label: 'Special Events', color: 'bg-[#7B1113]' },
  { id: 'L', dbValue: 'others', label: 'Others', color: 'bg-[#7B1113]' }
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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);  const [selectedOrg, setSelectedOrg] = useState("All Organizations");
  const [selectedMonth, setSelectedMonth] = useState("All Months");
  const [selectedYear, setSelectedYear] = useState("All Academic Years");
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [appliedFilters, setAppliedFilters] = useState({
    organization: "All Organizations",
    month: "All Months",
    year: "All Academic Years"
  });
  const [summaryActivities, setSummaryActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // PDF generation state
  const [generatingPDFs, setGeneratingPDFs] = useState(false);
  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        const activities = await fetchSummaryActivities({
          activity_type: activityTypes.find(t => t.id === selectedType)?.dbValue || 'all',
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
    setCurrentPage(1);
  }, [selectedType, appliedFilters]);

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
  const filteredOrgOptions = orgSearchTerm.trim() === ""
    ? organizationOptions
    : organizationOptions.filter((org) =>
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

  // 1. Filter activities based on all filters EXCEPT the status tab
  const filteredByOtherFilters = summaryActivities.filter((activity) => {
    const startDateStr = activity.schedule?.[0]?.start_date;
    if (!startDateStr) return false;
  
    const startDate = new Date(startDateStr);
    const startYear = startDate.getFullYear();
    const activityMonth = startDate.toLocaleString("default", { month: "long" });
  
    // Academic year filter
    if (appliedFilters.year !== "All Academic Years") {
      const selectedStartYear = parseInt(appliedFilters.year.split("-")[0]);
      if (startYear !== selectedStartYear) return false;
    }

  
    // Month filter
    if (appliedFilters.month !== "All Months" && activityMonth !== appliedFilters.month) {
      return false;
    }
  
    // Organization filter
    if (
      appliedFilters.organization !== "All Organizations" &&
      activity.organization?.org_name !== appliedFilters.organization
    ) {
      return false;
    }
  
    return true;
  });
    // 2. Calculate counts from this filtered list
  const approvedCount = filteredByOtherFilters.filter(a => 
    a.final_status === "Approved" && !a.pdf_generated
  ).length;
  const pendingCount = filteredByOtherFilters.filter(a =>
    a.final_status === null || a.final_status === "For Appeal"
  ).length;

  // 3. Now filter by the status tab for display
  const filteredActivities = filteredByOtherFilters.filter((activity) => {
    const isApproved = activity.final_status === "Approved";
    const isPending = activity.final_status === "For Appeal" || activity.final_status === null;
    if (filter === "approved" && !isApproved) return false;
    if (filter === "pending" && !isPending) return false;
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
  // PDF generation handler
  const handleGenerateApprovalSlips = async () => {
    try {
      setGeneratingPDFs(true);
      
      const result = await generateApprovalSlips();

      toast.success(`Successfully generated ${result.pdfCount} approval slip PDFs!`);
      
      // Refresh the summary to update the UI
      const activities = await fetchSummaryActivities({
        activity_type: activityTypes.find(t => t.id === selectedType)?.dbValue || 'all',
        organization: appliedFilters.organization,
        month: appliedFilters.month,
        year: appliedFilters.year
      });
      setSummaryActivities(activities);

    } catch (error) {
      console.error('Error generating approval slips:', error);
      toast.error(`Failed to generate approval slips: ${error.message}`);
    } finally {
      setGeneratingPDFs(false);
    }
  };  // Google Drive handler
  const handleViewPDFsInDrive = async () => {
    try {
      // Get the folder URL from backend
      const response = await fetch("/api/approval-slips-folder-url", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get folder URL');
      }
      
      const { folderUrl } = await response.json();
      
      window.open(folderUrl, '_blank');
      toast.success('Opening Google Drive folder in new tab...');
    } catch (error) {
      console.error('Error opening Google Drive:', error);
      toast.error('Failed to open Google Drive folder. Please contact the administrator.');
    }
  };

  const startIdx = (currentPage - 1) * rowsPerPage;
  const paginatedActivities = filteredActivities.slice(startIdx, startIdx + rowsPerPage);
  const totalPages = Math.ceil(filteredActivities.length / rowsPerPage);
  return (
    <div
      className="max-w-[1550px] mx-auto sm:p-4 md:p-6"
      style={{ transform: "scale(0.9)", transformOrigin: "top center" }}
    >
      <Toaster />      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#7B1113] text-center sm:text-left">Summary of Activity Requests</h1>
        <div className="flex flex-col sm:flex-row gap-2">          <Button 
            onClick={handleViewPDFsInDrive}
            variant="outline"
            className="border-[#014421] text-[#014421] hover:bg-[#014421] hover:text-white flex items-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.5 2C4.57 2 3 3.57 3 5.5S4.57 9 6.5 9H10l3-5.5H6.5zm7.5 5.5L11 13h9.5c1.93 0 3.5-1.57 3.5-3.5S22.43 6 20.5 6H14zM7 14l-3 5.5h7L14 14H7z"/>
            </svg>
            View PDFs in Drive
          </Button>
          <Button 
            onClick={handleGenerateApprovalSlips}
            disabled={generatingPDFs || approvedCount === 0}
            className="bg-[#014421] hover:bg-[#013319] text-white flex items-center gap-2"
          >
            {generatingPDFs ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating PDFs...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate Approval Slips ({approvedCount})
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Filter Section using Tabs */}
      <Card className="mb-6">
        <div className="p-2 sm:px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div className="flex flex-row items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl px-3 font-semibold">
                {selectedType === 'all'
                  ? 'All Activities'
                  : activityTypes.find(t => t.id === selectedType)?.label}
              </h2>
              {/* Filter Button: visible on mobile, hidden on sm+ (shown again in badges area) */}
              <div className="sm:hidden px-3 ml-2">
                <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Filter Activities</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Organization</label>
                        <Select
                          value={selectedOrg}
                          onValueChange={(val) => {
                            setSelectedOrg(val);
                            setOrgSearchTerm(""); // reset search term on select
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredOrgOptions.length > 0 ? (
                              filteredOrgOptions.map((org) => (
                                <SelectItem
                                  key={org}
                                  value={org}
                                  className="hover:bg-gray-100 cursor-pointer"
                                >
                                  {org}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-muted-foreground">No results found</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Activity Category</label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {activityTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.label}
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
                          <label className="text-sm font-medium">Rows per Page</label>
                          <Select value={String(rowsPerPage)} onValueChange={(val) => {
                            setRowsPerPage(Number(val));
                            setCurrentPage(1);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Rows per page" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
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
            <div className="flex flex-wrap items-center gap-2">
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
                  {selectedType !== "all" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {activityTypes.find((t) => t.id === selectedType)?.label}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSelectedType("all")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
              </div>
              )}
              {/* Filter Button: hidden on mobile, visible on sm+ */}
              <div className="hidden sm:block">
                <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Filter Activities</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Organization</label>
                        <Select
                          value={selectedOrg}
                          onValueChange={(val) => {
                            setSelectedOrg(val);
                            setOrgSearchTerm(""); // reset search term on select
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredOrgOptions.length > 0 ? (
                              filteredOrgOptions.map((org) => (
                                <SelectItem
                                  key={org}
                                  value={org}
                                  className="hover:bg-gray-100 cursor-pointer"
                                >
                                  {org}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-muted-foreground">No results found</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Activity Category</label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {activityTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.label}
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
                          <label className="text-sm font-medium">Rows per Page</label>
                          <Select value={String(rowsPerPage)} onValueChange={(val) => {
                            setRowsPerPage(Number(val));
                            setCurrentPage(1);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Rows per page" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
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
          </div>

          <div className="flex justify-center px-0 sm:px-8">
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
          className="w-full max-w-[400px]"
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
        <div className="overflow-x-auto">
          <Table>            <TableHeader>
              <TableRow className="border-b-0">
                <TableHead className="w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Status</TableHead> 
                <TableHead className="min-w-[120px] w-[180px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Submission Date</TableHead>
                <TableHead className="min-w-[180px] w-[250px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Organization</TableHead>
                <TableHead className="min-w-[180px] w-[250px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Activity Name</TableHead>
                <TableHead className="min-w-[180px] w-[250px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Activity Type</TableHead>
                <TableHead className="min-w-[120px] w-[180px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Activity Date</TableHead>
                <TableHead className="min-w-[140px] w-[200px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Venue</TableHead>
                <TableHead className="w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Adviser</TableHead>
                <TableHead className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Activity ID</TableHead>
                <TableHead className="min-w-[100px] w-[120px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">PDF Status</TableHead>
              </TableRow>
            </TableHeader>            <TableBody>
              {paginatedActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-sm text-gray-500">
                    No activities found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedActivities.map((activity, index) => (
                  <TableRow
                    key={index}
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedActivity(activity);
                      setIsModalOpen(true);
                    }}
                  >
                    <TableCell className="py-5">
                      <div className="flex items-center justify-center">
                        <Badge
                          className={
                            (activity.final_status === "Approved"
                              ? "bg-[#014421] text-white"
                              : "bg-[#FFF7D6] text-[#A05A00]")
                            + " text-sm px-4 py-1 pointer-events-none" // Prevents hover/focus/active styles
                          }
                        >
                          {activity.final_status === "Approved"
                            ? "Approved"
                            : "Pending"}
                        </Badge>
                      </div>
                    </TableCell>
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
                    </TableCell>                    <TableCell className="py-5 text-sm text-center">{activity.activity_id}</TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center justify-center">
                        {activity.final_status === "Approved" && (
                          <Badge
                            className={
                              activity.pdf_generated
                                ? "bg-green-600 text-white"
                                : "bg-amber-600 text-white"
                            }
                          >
                            {activity.pdf_generated ? "PDF Generated" : "Needs PDF"}
                          </Badge>
                        )}
                        {activity.final_status !== "Approved" && (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center mt-4 px-4">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
        </div>
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