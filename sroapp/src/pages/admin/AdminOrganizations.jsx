import { useState } from "react";
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

  // Mock data for organizations by category
  const organizations = {
    "academic": [
      {
        id: "org-1",
        name: "Organization Name",
        category: "Academic & Socio-Academic Student Organizations",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      },
      // More academic organizations...
    ],
    "socio-civic": [
      {
        id: "org-5",
        name: "Organization Name",
        category: "Socio-Civic/Cause-Oriented Organizations",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      },
      // More socio-civic organizations...
    ],
    "fraternity": [
      {
        id: "org-9",
        name: "Organization Name",
        category: "Fraternity/Sorority/Confraternity",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      },
      // More fraternity organizations...
    ],
    "performing": [
      {
        id: "org-13",
        name: "Organization Name",
        category: "Performing Groups",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      },
      // More performing organizations...
    ],
    "political": [
      {
        id: "org-17",
        name: "Organization Name",
        category: "Political Organizations",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      },
      // More political organizations...
    ],
    "regional": [
      {
        id: "org-21",
        name: "Organization Name",
        category: "Regional/Provincial and Socio-Cultural Organizations",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      },
      // More regional organizations...
    ],
    "special": [
      {
        id: "org-25",
        name: "Organization Name",
        category: "Special Interests Organizations",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      },
      // More special interest organizations...
    ],
    "sports": [
      {
        id: "org-29",
        name: "Organization Name",
        category: "Sports and Recreation Organizations",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      },
      // More sports organizations...
    ],
    "probation": [
      {
        id: "org-33",
        name: "Organization Name",
        category: "On Probation Organizations",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      },
      // More organizations on probation...
    ]
  };

  // Get all organizations in a flat array
  const allOrganizations = Object.values(organizations).flat();

  // Filter organizations based on search query and selected category
  const filteredOrganizations = allOrganizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      (organizations[selectedCategory] && organizations[selectedCategory].some(o => o.id === org.id));
    return matchesSearch && matchesCategory;
  });

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
    <div className="container mx-auto py-8 max-w-6xl">
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
          <Card key={org.id} className="rounded-lg overflow-hidden shadow-md">
            <CardHeader className="bg-[#7B1113]/10 py-4">
              <CardTitle className="text-lg font-bold text-[#7B1113]">{org.name}</CardTitle>
              <p className="text-xs text-gray-600 mt-1">{org.category}</p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[#014421]">Chairperson</p>
                  <div className="flex justify-between text-sm">
                    <span>{org.chairperson.name}</span>
                    <span className="text-gray-500">{org.chairperson.email}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#014421]">Adviser</p>
                  <div className="flex justify-between text-sm">
                    <span>{org.adviser.name}</span>
                    <span className="text-gray-500">{org.adviser.email}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#014421]">Email</p>
                  <p className="text-sm text-gray-500">{org.email}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button 
                    onClick={() => handleGenerateCertificate(org.id)}
                    className="px-3 py-1 h-8 bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs"
                  >
                    Generate Certificate
                  </Button>
                  <Button 
                    onClick={() => handleViewSummary(org.id)}
                    className="px-3 py-1 h-8 bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs"
                  >
                    Summary of Events
                  </Button>
                  <Button 
                    onClick={() => handleViewAnnualReport(org.id)}
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