import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Search, Download, Eye } from "lucide-react";

const AdminAnnualReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");

  // Mock data for annual reports
  const annualReports = Array.from({ length: 15 }, (_, i) => ({
    id: `report-${i + 1}`,
    organization: `Organization ${(i % 5) + 1}`,
    academicYear: [`2023-2024`, `2022-2023`, `2021-2022`][i % 3],
    submissionDate: "May 15, 2023",
  }));

  // Filter annual reports based on search and year
  const filteredReports = annualReports.filter((report) => {
    const matchesSearch =
      report.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear =
      yearFilter === "all" || report.academicYear === yearFilter;
    return matchesSearch && matchesYear;
  });

  const handleViewReport = (id) => {
    console.log(`Viewing report: ${id}`);
    // Logic to view report in modal or navigate to details page
  };

  const handleDownloadReport = (id) => {
    console.log(`Downloading report: ${id}`);
    // Logic to download report
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-[#7B1113] mb-8">Organization Annual Reports</h1>

      {/* Filters and Search */}
      <Card className="rounded-lg shadow-md mb-8">
        <CardHeader className="bg-[#7B1113]/10 py-4">
          <CardTitle className="text-xl font-bold text-[#7B1113]">
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="search"
                placeholder="Search organizations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by academic year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2023-2024">2023-2024</SelectItem>
                <SelectItem value="2022-2023">2022-2023</SelectItem>
                <SelectItem value="2021-2022">2021-2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Annual Reports Table */}
      <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-[#7B1113]/10 py-4">
          <CardTitle className="text-xl font-bold text-[#7B1113]">
            Submitted Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">
                    Organization
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">
                    Academic Year
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">
                    Submission Date
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {report.organization}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {report.academicYear}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {report.submissionDate}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleViewReport(report.id)}
                          className="px-3 py-1 rounded-md bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          onClick={() => handleDownloadReport(report.id)}
                          className="px-3 py-1 rounded-md bg-[#014421] hover:bg-[#013319] text-white text-xs flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnnualReports; 