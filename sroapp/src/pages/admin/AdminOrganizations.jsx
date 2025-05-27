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

  const CERTIFICATE_TEMPLATE = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Certificate of Recognition</title>
    <style>
      @page {
        size: 297mm 210mm; /* A4 landscape */
        margin: 0;
      }

      html, body {
        width: 297mm;
        height: 210mm;
        margin: 0;
        padding: 0;
        background: white;
        font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
      }

      .certificate-container {
        width: 100%;
        height: 100%;
        padding: 30mm;
        box-sizing: border-box;
        border: 5px solid maroon;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: center;
      }

      .header {
        font-size: 1.5em;
        font-weight: bold;
        color: black;
      }

      .title {
        font-size: 2.5em;
        font-weight: bold;
        color: maroon;
        text-decoration: underline;
        margin-top: 20px;
      }

      .content {
        font-size: 1.4em;
        margin-top: 40px;
        line-height: 1.6;
      }

      .org-name {
        color: maroon;
        font-weight: bold;
        font-size: 1.6em;
      }

      .footer {
        display: flex;
        justify-content: space-around;
        margin-top: 60px;
        font-size: 1em;
      }

      .signatory {
        width: 40%;
        text-align: center;
      }

      .name {
        margin-top: 40px;
        font-weight: bold;
        text-decoration: underline;
      }

      .position {
        margin-top: 5px;
      }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <div class="header">
        University of the Philippines Baguio<br>
        Office of Student Affairs
      </div>

      <div class="title">Certificate of Recognition</div>

      <div class="content">
        This is to formally recognize the organization<br>
        <span class="org-name">[Name of Organization]</span><br>
        for complying with the requirements for student organization recognition<br>
        and being acknowledged as a duly recognized student organization<br>
        for the Academic Year <strong>[YYYY–YYYY]</strong>.
      </div>

      <div class="footer">
        <div class="signatory">
          <div class="name">Mr. Friedrich Andres Aquino</div>
          <div class="position">Student Relations Officer</div>
        </div>
        <div class="signatory">
          <div class="name">Ms. Liezel M. Magtoto, Ph.D.</div>
          <div class="position">Director, Office of Student Affairs</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `

  const handleGenerateCertificate = (orgName, acadYear) => {
  const certHtml = CERTIFICATE_TEMPLATE
    .replace('[Name of Organization]', orgName)
    .replace('[YYYY–YYYY]', acadYear || '____________');

  const certWindow = window.open('', '_blank');
  certWindow.document.open();
  certWindow.document.write(certHtml);
  certWindow.document.close();

  certWindow.onload = () => certWindow.print();
  };


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

  const handleViewSummary = (orgId) => {
    window.open("https://docs.google.com/document/d/1HUt9Mz_sm2iDpvNkJqgPWoiXAA__QE099oxNLURTDyI/edit?tab=t.0", "_blank");
  };

  const handleViewAnnualReport = (orgId) => {
    window.open("https://docs.google.com/document/d/1HUt9Mz_sm2iDpvNkJqgPWoiXAA__QE099oxNLURTDyI/edit?tab=t.0", "_blank");
  };

  return (
    <div className="container mx-auto py-4 max-w-6xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#7B1113] mb-8 text-center sm:text-left">Summary of Organizations</h1>

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
                    onClick={() => handleGenerateCertificate(org.org_name, org.academic_year)}
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