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
import { CheckCircle, XCircle, Clock, Search } from "lucide-react";

const AdminActivitySummary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Mock data for activities
  const activities = Array.from({ length: 15 }, (_, i) => ({
    id: `act-${i + 1}`,
    name: `Activity ${i + 1}`,
    organization: `Organization ${(i % 5) + 1}`,
    category: ["Academic", "Cultural", "Sports", "Service", "Conference"][i % 5],
    date: "May 15, 2023",
    venue: "University Auditorium",
    status: ["approved", "pending", "rejected"][i % 3],
  }));

  // Filter activities based on search, status, and category
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || activity.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || activity.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleViewDetails = (id) => {
    console.log(`Viewing details for: ${id}`);
    // Logic to view details in modal or navigate to details page
  };

  // Get status counts
  const statusCounts = {
    approved: activities.filter((a) => a.status === "approved").length,
    pending: activities.filter((a) => a.status === "pending").length,
    rejected: activities.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-[#7B1113] mb-8">Activity Summary</h1>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="rounded-lg shadow-md border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <h2 className="text-3xl font-bold text-[#014421] mt-1">
                  {statusCounts.approved}
                </h2>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-md border-l-4 border-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <h2 className="text-3xl font-bold text-amber-500 mt-1">
                  {statusCounts.pending}
                </h2>
              </div>
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-md border-l-4 border-[#7B1113]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <h2 className="text-3xl font-bold text-[#7B1113] mt-1">
                  {statusCounts.rejected}
                </h2>
              </div>
              <XCircle className="h-10 w-10 text-[#7B1113]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="rounded-lg shadow-md mb-8">
        <CardHeader className="bg-[#7B1113]/10 py-4">
          <CardTitle className="text-xl font-bold text-[#7B1113]">
            Activity Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="search"
                placeholder="Search activities..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Cultural">Cultural</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="Conference">Conference</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card className="rounded-lg overflow-hidden shadow-md">
        <CardHeader className="bg-[#7B1113]/10 py-4">
          <CardTitle className="text-xl font-bold text-[#7B1113]">
            Activities List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">
                    Activity Name
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">
                    Organization
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">
                    Category
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">
                    Venue
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {activity.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {activity.organization}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {activity.category}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {activity.date}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {activity.venue}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === "approved"
                            ? "bg-green-100 text-[#014421]"
                            : activity.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-[#7B1113]"
                        }`}
                      >
                        {activity.status.charAt(0).toUpperCase() +
                          activity.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <Button
                        onClick={() => handleViewDetails(activity.id)}
                        className="px-3 py-1 rounded-md bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs"
                      >
                        Details
                      </Button>
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

export default AdminActivitySummary; 