import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const AdminOrganizations = () => {
  // Mock data for organization categories
  const categories = [
    { id: "category-1", name: "I. Category" },
    { id: "category-2", name: "II. Category" },
    // Add more categories as needed
  ];

  // Mock data for organizations by category
  const organizations = {
    "category-1": [
      {
        id: "org-1",
        name: "Organization Name",
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
      {
        id: "org-2",
        name: "Organization Name",
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
      {
        id: "org-3",
        name: "Organization Name",
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
      {
        id: "org-4",
        name: "Organization Name",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      }
    ],
    "category-2": [
      {
        id: "org-5",
        name: "Organization Name",
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
      {
        id: "org-6",
        name: "Organization Name",
        chairperson: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        adviser: {
          name: "First Name M. Last",
          email: "fmlast@up.edu.ph"
        },
        email: "organization@gmail.com"
      }
    ]
  };

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
      <h1 className="text-3xl font-bold text-[#7B1113] mb-8">Approved Organizations</h1>

      <Tabs defaultValue="category-1" className="w-full">
        <TabsList className="mb-6">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="data-[state=active]:bg-[#7B1113] data-[state=active]:text-white"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {organizations[category.id]?.map((org) => (
                <Card key={org.id} className="rounded-lg overflow-hidden shadow-md">
                  <CardHeader className="bg-[#7B1113]/10 py-4">
                    <CardTitle className="text-lg font-bold text-[#7B1113]">{org.name}</CardTitle>
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminOrganizations; 