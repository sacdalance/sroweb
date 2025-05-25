import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const AdminOrganizations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [organizations, setOrganizations] = useState([]);
useEffect(() => {
  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/organization/list');
      const data = await res.json();
      setOrganizations(data);
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    }
  };

  fetchOrganizations();
}, []);


  // Mock data for organization categories
  const categories = [
    { id: "academic", name: "Academic & Socio-Academic Student Organizations" },
    { id: "socio-civic", name: "Socio-Civic/Cause-Oriented Organizations" },
    { id: "fraternity", name: "Fraternity/Sorority/Confraternity" },
    { id: "performing", name: "Performing Groups" },
    { id: "political", name: "Political Organizations" },
    { id: "regional", name: "Regional/Provincial and Socio-Cultural Organizations" },
    { id: "special", name: "Special Interests Organizations" },
    { id: "sports", name: "Sports and Recreation Organizations" },
    { id: "probation", name: "On Probation Organizations" }
  ];

  // Get all organizations in a flat array
  const allOrganizations = Object.values(organizations).flat();

  // Filter organizations based on search query and selected category
  // const filteredOrganizations = allOrganizations.filter(org => {
  //   const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
  //   const matchesCategory = selectedCategory === "all" || 
  //     (organizations[selectedCategory] && organizations[selectedCategory].some(o => o.id === org.id));
  //   return matchesSearch && matchesCategory;
  // });
  const filteredOrganizations = organizations.filter((org) =>
    org.org_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateCertificate = (orgId) => {
    console.log(`Generating certificate for: ${orgId}`);
    // Logic to generate certificate
  };

  const handleViewSummary = (orgId) => {
    console.log(`Viewing summary for: ${orgId}`);
    // Logic to view summary
  };

  const handleViewAnnualReport = (orgId) => {
    console.log(`Viewing annual report for: ${orgId}`);
    // Logic to view annual report
  };

  return (
    <div className="container mx-auto py-4 max-w-6xl">
      <h1 className="text-3xl font-bold text-[#7B1113] mb-8">Summary of Organizations</h1>

      {/* Search and Category Filter */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
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
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-80">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOrganizations.map((org) => (
          <Card key={org.org_id} className="rounded-lg overflow-hidden shadow-md">
            <CardHeader className="py-1">
              <CardTitle className="text-lg font-bold text-[#7B1113]">{org.org_name}</CardTitle>
              <p className="text-xs text-gray-600 mt-1">Org Category</p> {/* Placeholder category */}
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-[#014421]">Chairperson</p>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span>{org.chairperson_name}</span>
                    <span className="text-gray-500">{org.chairperson_email}</span>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-[#014421]">Adviser</p>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span>{org.adviser_name}</span>
                    <span className="text-gray-500">{org.adviser_email}</span>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-[#014421]">Email</p>
                  <p className="text-gray-500">{org.org_email}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button 
                    onClick={() => handleGenerateCertificate(org.org_id)}
                    className="px-3 py-1 h-8 bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs"
                  >
                    Generate Certificate
                  </Button>
                  <Button 
                    onClick={() => handleViewSummary(org.org_id)}
                    className="px-3 py-1 h-8 bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs"
                  >
                    Summary of Events
                  </Button>
                  <Button 
                    onClick={() => handleViewAnnualReport(org.org_id)}
                    className="px-3 py-1 h-8 bg-[#014421] hover:bg-[#013319] text-white text-xs"
                  >
                    View Annual Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminOrganizations; 