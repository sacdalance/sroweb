import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api-config";
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
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import DataTable from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";
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
import LoadingSpinner from "@/components/ui/loading-spinner";




const activityTypes = [
  { id: 'A', dbValue: 'charitable', label: 'Charitable' },
  { id: 'B', dbValue: 'serviceWithinUPB', label: 'Service (within UPB)' },
  { id: 'C', dbValue: 'serviceOutsideUPB', label: 'Service (outside UPB)' },
  { id: 'D', dbValue: 'contestWithinUPB', label: 'Contest (within UPB)' },
  { id: 'E', dbValue: 'contestOutsideUPB', label: 'Contest (outside UPB)' },
  { id: 'F', dbValue: 'educational', label: 'Educational' },
  { id: 'G', dbValue: 'incomeGenerating', label: 'IGP' },
  { id: 'H', dbValue: 'massOrientation', label: 'Mass Orientation/GA' },
  { id: 'I', dbValue: 'booth', label: 'Booth' },
  { id: 'J', dbValue: 'rehearsals', label: 'Rehearsals/Preparation' },
  { id: 'K', dbValue: 'specialEvents', label: 'Special Events' },
  { id: 'L', dbValue: 'others', label: 'Others' }
];

const formatActivityTypeLabel = (idOrCode) => {
  if (!idOrCode) return "N/A";
  const type = activityTypes.find(t => t.id === idOrCode || t.dbValue === idOrCode);
  return type ? type.label : idOrCode;
};

const months = [
  "All Months",
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const AdminActivitySummary = () => {
  const [tabCooldown, setTabCooldown] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summaryActivities, setSummaryActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  // PDF generation state
  const [generatingPDFs, setGeneratingPDFs] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        const activities = await fetchSummaryActivities({
          activity_type: 'all',
          organization: 'All Organizations',
          month: 'All Months',
          year: 'All Academic Years'
        });
        setSummaryActivities(activities);
      } catch (err) {
        console.error("Error loading summary:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  // Filter activities based on the status tab for display
  const filteredActivities = summaryActivities.filter((activity) => {
    const isApproved = activity.final_status === "Approved";
    const isApprovedNoSlip = activity.final_status === "Approved" && !activity.pdf_generated;
    
    // Status is pending if it's falsy, "For Appeal", or contains "Pending" (e.g., Pending SRO, Pending ODSA)
    const statusText = (activity.final_status || "").toLowerCase();
    const isPending = !activity.final_status || 
                      statusText.includes("pending") || 
                      statusText === "for appeal";
    
    if (filter === "approved" && !isApproved) return false;
    if (filter === "approved-no-slip" && !isApprovedNoSlip) return false;
    if (filter === "pending" && !isPending) return false;
    return true;
  });

  // Calculate counts for tabs (always consistent regardless of filters applied to the table later)
  const approvedCount = summaryActivities.filter(a => a.final_status === "Approved").length;
  const approvedNoSlipCount = summaryActivities.filter(a => a.final_status === "Approved" && !a.pdf_generated).length;
  const pendingCount = summaryActivities.filter(a => {
    const statusText = (a.final_status || "").toLowerCase();
    return !a.final_status || statusText.includes("pending") || statusText === "for appeal";
  }).length;

  const handleGenerateApprovalSlips = async () => {
    try {
      setGeneratingPDFs(true);
      const result = await generateApprovalSlips();
      toast.success(`Successfully generated ${result.pdfCount} approval slip PDFs!`);
      
      // Refresh
      const activities = await fetchSummaryActivities({
        activity_type: 'all',
        organization: 'All Organizations',
        month: 'All Months',
        year: 'All Academic Years'
      });
      setSummaryActivities(activities);
    } catch (error) {
      console.error('Error generating approval slips:', error);
      toast.error(`Failed to generate approval slips: ${error.message}`);
    } finally {
      setGeneratingPDFs(false);
    }
  };

  const handleViewPDFsInDrive = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/approval-slips-folder-url`, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to get folder URL');
      const { folderUrl } = await response.json();
      window.open(folderUrl, '_blank');
      toast.success('Opening Google Drive folder...');
    } catch (error) {
      toast.error('Failed to open Google Drive folder.');
    }
  };

  const columns = [
    {
      key: "final_status",
      header: "Status",
      isStatus: true,
      width: "w-[110px]",
      accessor: (row) => row.final_status || "Pending",
    },
    {
      key: "created_at",
      header: "Submission",
      sortable: true,
      width: "w-[120px]",
      render: (row) => (
        <div className="text-[11px] text-gray-500 text-center">
          {new Date(row.created_at).toLocaleDateString("en-US", {
            month: 'short', day: 'numeric', year: 'numeric'
          })}
        </div>
      )
    },
    {
      key: "org_name",
      header: "Organization",
      sortable: true,
      filterable: true,
      filterLabel: "Orgs",
      filterOptions: [...new Set(summaryActivities.map(a => a.organization?.org_name))].filter(Boolean).sort(),
      filterAccessor: (row) => row.organization?.org_name,
      render: (row) => (
        <div className="font-semibold text-[13px] text-gray-700 truncate max-w-[180px]" title={row.organization?.org_name}>
          {row.organization?.org_name}
        </div>
      )
    },
    {
      key: "activity_name",
      header: "Activity Name",
      sortable: true,
      render: (row) => (
        <div className="font-medium text-[13px] text-gray-800 line-clamp-1" title={row.activity_name}>
          {row.activity_name}
        </div>
      )
    },
    {
      key: "activity_type",
      header: "Type",
      sortable: true,
      filterable: true,
      filterLabel: "Categories",
      filterOptions: activityTypes.map(opt => opt.label),
      filterAccessor: (row) => {
          const codes = row.activity_type?.split(',') || [];
          // Since DataTable only does strict equality, we return the label of the first code
          // for the accessor, but we'll improve this if DataTable logic allows more complex matching.
          return formatActivityTypeLabel(codes[0]);
      },
      render: (row) => {
        const typeIds = row.activity_type?.split(',') || [];
        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {typeIds.slice(0, 1).map(id => (
              <Badge key={id} variant="secondary" className="text-[10px] px-2 py-0 h-5">
                {formatActivityTypeLabel(id)}
              </Badge>
            ))}
            {typeIds.length > 1 && (
              <span className="text-[10px] text-gray-400">+{typeIds.length - 1}</span>
            )}
          </div>
        );
      }
    },
    {
      key: "academic_year",
      header: "A.Y.",
      width: "w-[100px]",
      sortable: true,
      filterable: true,
      filterLabel: "Years",
      filterOptions: [...new Set(summaryActivities.map(a => {
          const date = a.schedule?.[0]?.start_date;
          if (!date) return null;
          const year = new Date(date).getFullYear();
          // Assuming AY starts in August (common for UPB)
          const month = new Date(date).getMonth(); // 0-indexed
          const startYear = month >= 7 ? year : year - 1;
          return `${startYear}-${startYear + 1}`;
      }))].filter(Boolean).sort().reverse(),
      filterAccessor: (row) => {
          const date = row.schedule?.[0]?.start_date;
          if (!date) return "N/A";
          const d = new Date(date);
          const year = d.getFullYear();
          const month = d.getMonth();
          const startYear = month >= 7 ? year : year - 1;
          return `${startYear}-${startYear + 1}`;
      },
      render: (row) => {
          const date = row.schedule?.[0]?.start_date;
          if (!date) return <span className="text-gray-300">—</span>;
          const d = new Date(date);
          const year = d.getFullYear();
          const month = d.getMonth();
          const startYear = month >= 7 ? year : year - 1;
          return <span className="text-[10px] bg-gray-50 px-1.5 py-0.5 rounded border font-medium text-gray-600">{startYear}-{startYear+1}</span>;
      }
    },
    {
      key: "month",
      header: "Month",
      width: "w-[100px]",
      sortable: true,
      filterable: true,
      filterLabel: "Months",
      filterOptions: months.slice(1),
      filterAccessor: (row) => {
          const date = row.schedule?.[0]?.start_date;
          if (!date) return "Other";
          return new Date(date).toLocaleString("default", { month: "long" });
      },
      render: (row) => {
          const date = row.schedule?.[0]?.start_date;
          if (!date) return <span className="text-gray-300">—</span>;
          return <span className="text-[11px] font-medium text-gray-600">{new Date(date).toLocaleString("default", { month: "short" })}</span>;
      }
    },
    {
      key: "activity_id",
      header: "ID",
      width: "w-[80px]",
      sortable: true,
      render: (row) => (
        <span className="text-gray-500 font-mono text-[10px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
          {row.activity_id}
        </span>
      ),
    },
    {
      key: "recognized",
      header: "Recognized",
      width: "w-[110px]",
      isStatus: true,
      filterLabel: "Recognition",
      filterable: true,
      filterOptions: ["Recognized", "Not Recognized"],
      accessor: (row) => (row.organization?.org_status === "Recognized" || row.organization?.is_recognized) ? "Recognized" : "Not Recognized",
      render: (row) => {
        const isRecognized = row.organization?.org_status === "Recognized" || row.organization?.is_recognized;
        return (
          <div className="flex items-center justify-center">
            <Badge
              className={cn(
                "text-[10px] px-2 py-0 shadow-none border font-semibold",
                isRecognized
                  ? "bg-blue-50 text-blue-700 border-blue-100"
                  : "bg-gray-50 text-gray-500 border-gray-100"
              )}
            >
              {isRecognized ? "Recognized" : "Not Recognized"}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "pdf_status",
      header: "PDF",
      width: "w-[110px]",
      render: (row) => (
        <div className="flex items-center justify-center">
          {row.final_status === "Approved" ? (
            <Badge
              className={cn(
                "text-[10px] px-2 py-0 shadow-none border font-semibold",
                row.pdf_generated
                  ? "bg-green-50 text-green-700 border-green-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
              )}
            >
              {row.pdf_generated ? "Generated" : "Needed"}
            </Badge>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 md:p-6 max-w-[1700px] mx-auto min-h-screen">
      <Toaster position="top-center" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-header text-sro-primary mb-1">Activity Summary</h1>
          <p className="text-sm text-gray-500">Overview and management of all student activity submissions</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Drive Button */}
          <Button
            onClick={handleViewPDFsInDrive}
            variant="outline"
            className="h-10 border-gray-200 hover:bg-gray-50 text-gray-700 gap-2 font-medium"
          >
            <svg className="h-4 w-4 text-sro-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.5 2C4.57 2 3 3.57 3 5.5S4.57 9 6.5 9H10l3-5.5H6.5zm7.5 5.5L11 13h9.5c1.93 0 3.5-1.57 3.5-3.5S22.43 6 20.5 6H14zM7 14l-3 5.5h7L14 14H7z" />
            </svg>
            <span>Drive Folder</span>
          </Button>

          {/* Generate Slips Button */}
          <Button
            onClick={handleGenerateApprovalSlips}
            disabled={generatingPDFs || approvedNoSlipCount === 0}
            className="h-10 bg-sro-primary hover:bg-sro-primary/90 text-white gap-2 shadow-sm font-medium px-4"
          >
            {generatingPDFs ? (
              <LoadingSpinner variant="inline" className="text-white" />
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Generate Slips ({approvedNoSlipCount})</span>
              </>
            )}
          </Button>

          {/* Calendar Link */}
          <Link to="/admin/student-activities">
             <Button variant="outline" className="h-10 border-gray-200 hover:bg-gray-50 gap-2 font-medium">
                <ArrowRight className="h-4 w-4" />
                <span>Calendar View</span>
             </Button>
          </Link>
        </div>
      </div>


      {/* Main Content: DataTable with integrated tabs and filters */}
      {loading ? (
        <div className="bg-white rounded-xl border shadow-sm p-12">
          <LoadingSpinner text="Loading activities..." variant="section" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden p-1 sm:p-0">
          {/* Tabs Header */}
          <div className="flex flex-col lg:flex-row lg:items-center p-4 border-b bg-gray-50/50">
            <Tabs
              value={filter}
              onValueChange={(val) => {
                if (tabCooldown || loading) return;
                setFilter(val);
                setTabCooldown(true);
                setTimeout(() => setTabCooldown(false), 300);
              }}
              className="w-full lg:w-auto"
            >
              <TabsList className="bg-white p-1 h-10 rounded-lg border shadow-sm w-full lg:w-auto flex md:inline-flex overflow-x-auto whitespace-nowrap">
                <TabsTrigger value="all" className="px-6 text-xs font-semibold data-[state=active]:bg-sro-primary data-[state=active]:text-white">All Submissions</TabsTrigger>
                <TabsTrigger value="approved" className="px-6 text-xs font-semibold data-[state=active]:bg-sro-primary data-[state=active]:text-white">Approved ({approvedCount})</TabsTrigger>
                <TabsTrigger value="approved-no-slip" className="px-6 text-xs font-semibold data-[state=active]:bg-sro-primary data-[state=active]:text-white text-sro-secondary">No Slip ({approvedNoSlipCount})</TabsTrigger>
                <TabsTrigger value="pending" className="px-6 text-xs font-semibold data-[state=active]:bg-sro-primary data-[state=active]:text-white">Pending ({pendingCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={filteredActivities.map(a => ({ ...a, id: a.activity_id }))}
            onRowClick={(row) => {
              setSelectedActivity(row);
              setIsModalOpen(true);
            }}
            emptyMessage="No activity submissions found matching your filters."
            defaultSort={{ key: 'created_at', direction: 'desc' }}
            className="border-0 shadow-none"
            defaultPageSize={10}
            fixedHeight={true}
          />
        </div>
      )}

      {/* Activity Details Modal */}
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
    </div>
  );
};

export default AdminActivitySummary;