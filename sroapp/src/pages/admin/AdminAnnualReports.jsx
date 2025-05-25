import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Eye } from "lucide-react";

const AdminAnnualReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("2024-2025");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("org_annual_report")
        .select(`
          report_id,
          academic_year,
          submitted_at,
          drive_folder_link,
          submission_file_url,
          organization:organization ( org_name )
        `);

      if (error) {
        console.error("Supabase fetch error:", error.message);
        setReports([]);
      } else {
        const formatted = data.map((report) => ({
          id: report.report_id,
          organization: report.organization?.org_name || "Unknown Org",
          academicYear: report.academic_year,
          submissionDate: new Date(report.submitted_at).toLocaleDateString(),
          viewLink: report.drive_folder_link,
          files: JSON.parse(report.submission_file_url) || [],
        }));
        setReports(formatted);
      }

      setLoading(false);
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = yearFilter === "all" || report.academicYear === yearFilter;
    return matchesSearch && matchesYear;
  });

  return (
    <div className="container mx-auto py-4 max-w-6xl">
      <h1 className="text-3xl font-bold text-[#7B1113] mb-8">Organization Annual Reports</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search organizations..."
              className="pl-10 h-9 text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full md:w-[200px]">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2025-2026">2025-2026</SelectItem>
                <SelectItem value="2026-2027">2026-2027</SelectItem>
                <SelectItem value="2027-2028">2027-2028</SelectItem>
                <SelectItem value="all">All years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>


      {/* Table */}
      <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4">
          <CardTitle className="text-xl font-bold text-[#7B1113]">Submitted Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading reports...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Organization</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Academic Year</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Submission Date</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-bold text-l text-gray-700">{report.organization}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{report.academicYear}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{report.submissionDate}</td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex flex-col space-y-2">
                          {report.files.map((url, i) => (
                            <Button
                              key={i}
                              asChild
                              className="px-3 py-1 h-8 bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs flex items-center gap-1"
                            >
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-3 w-3 inline mr-1" />
                                View File {i + 1}
                              </a>
                            </Button>
                          ))}

                          {report.viewLink && (
                            <Button
                              asChild
                              className="px-3 py-1 rounded-md bg-[#014421] hover:bg-[#013319] text-white text-xs flex items-center gap-1"
                            >
                              <a href={report.viewLink} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3" />
                                Drive Folder
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnnualReports;
