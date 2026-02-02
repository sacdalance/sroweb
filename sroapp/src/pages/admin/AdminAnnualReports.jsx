import { useEffect, useState, useMemo } from "react";
import supabase from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { ExternalLink, Database, FileText } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import DataTable from "@/components/ui/DataTable";

const AdminAnnualReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("org_annual_report")
          .select(`
            report_id,
            academic_year,
            submitted_at,
            drive_folder_link,
            submission_file_url,
            organization:organization ( org_name )
          `)
          .order('submitted_at', { ascending: false });

        if (error) throw error;

        const formatted = data.map((report) => ({
          ...report,
          id: report.report_id,
          org_name: report.organization?.org_name || "Unknown Org",
          files: report.submission_file_url ? JSON.parse(report.submission_file_url) : [],
        }));
        setReports(formatted);
      } catch (error) {
        console.error("Supabase fetch error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleRowClick = (report) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const columns = useMemo(() => [
    {
      key: "submitted_at",
      header: "Submission Date",
      sortable: true,
      width: "w-40",
      render: (row) => (
        <div className="text-xs text-gray-500">
          {new Date(row.submitted_at).toLocaleDateString("en-US", {
            year: 'numeric', month: 'short', day: 'numeric'
          })}
        </div>
      )
    },
    {
      key: "org_name",
      header: "Organization Name",
      sortable: true,
      render: (row) => (
        <div className="font-semibold text-sm text-gray-700">{row.org_name}</div>
      )
    },
    {
      key: "academic_year",
      header: "Academic Year",
      sortable: true,
      width: "w-32",
      filterable: true,
      filterLabel: "Years",
      filterOptions: [...new Set(reports.map(r => r.academic_year))].sort().reverse(),
      render: (row) => (
        <div className="text-xs font-semibold text-gray-600 text-center bg-gray-50 px-2 py-0.5 rounded border border-gray-100 w-fit mx-auto">{row.academic_year}</div>
      )
    },
    {
      key: "files_count",
      header: "Files",
      width: "w-24",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 w-fit mx-auto">
          <FileText className="h-3 w-3" />
          {row.files?.length || 0}
        </div>
      )
    }
  ], [reports]);

  if (loading) return <LoadingSpinner text="Loading annual reports..." variant="section" />;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-[1600px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b pb-6">
        <div>
          <h1 className="page-header text-sro-primary mb-0">Annual Reports</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            Archive of organization annual accomplishment reports and official submissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
        </div>
      </div>

      <DataTable
        columns={columns}
        data={reports}
        onRowClick={handleRowClick}
        emptyMessage="No annual reports submitted yet."
        defaultPageSize={10}
        defaultSort={{ key: "submitted_at", direction: "desc" }}
        viewMode="table"
        hideViewToggle={true}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sro-primary flex items-center gap-2">
              <Database className="h-5 w-5" />
              Annual Report Details
            </DialogTitle>
            <DialogDescription>
              Reviewing the annual report submission for <strong>{selectedReport?.org_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">Organization</p>
                  <p className="text-sm font-semibold">{selectedReport.org_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">Academic Year</p>
                  <p className="text-sm font-mono">{selectedReport.academic_year}</p>
                </div>
                <div className="col-span-2 pt-2 border-t flex justify-between items-center text-xs text-gray-500">
                  <p italic>Submitted on {new Date(selectedReport.submitted_at).toLocaleString()}</p>
                  {selectedReport.drive_folder_link && (
                    <Button variant="outline" size="sm" asChild className="gap-2 border-sro-secondary text-sro-secondary hover:bg-sro-secondary/10">
                      <a href={selectedReport.drive_folder_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Google Drive
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sro-primary" />
                  SUBMITTED FILES ({selectedReport.files.length})
                </h3>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {selectedReport.files.map((url, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      asChild
                      className="justify-start gap-3 h-11 border-gray-200 hover:border-sro-primary hover:bg-sro-primary/5 transition-all group"
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <div className="h-7 w-7 rounded bg-red-50 text-red-600 flex items-center justify-center font-bold text-[10px] group-hover:bg-red-100">
                          PDF
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-xs font-medium text-gray-700 truncate max-w-[300px]">Annual Report File {i + 1}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Official Document</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-sro-primary" />
                      </a>
                    </Button>
                  ))}
                  {selectedReport.files.length === 0 && (
                    <p className="text-sm text-gray-500 italic p-4 text-center border rounded">No individual files uploaded.</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnualReports;
