import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, authFetch } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Users, UserCircle, ExternalLink, Award } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeletons";
import DataTable from "@/components/ui/DataTable";

const AdminOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const categoriesList = [
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

  const getCategoryName = (id) => categoriesList.find((cat) => cat.id === id)?.name || id;

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`${API_BASE_URL}/api/organization/list`);
        const data = await res.json();
        setOrganizations(Array.isArray(data) ? data.map(o => ({ ...o, id: o.org_id })) : []);
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleRowClick = (org) => {
    setSelectedOrg(org);
    setDialogOpen(true);
  };

  const handleGenerateCertificate = (orgName, acadYear) => {
    const certHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Recognition Certificate - ${orgName}</title>
        <style>
          @page { size: A3 landscape; margin: 0; }
          body { margin: 0; padding: 0; font-family: 'Palatino Linotype', serif; background: #fff; }
          .cert-border { width: 297mm; height: 210mm; box-sizing: border-box; border: 18px double maroon; padding: 30px 50px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
          .title { font-size: 2.2rem; color: maroon; font-weight: bold; letter-spacing: 6px; margin-bottom: 20px; text-transform: uppercase; }
          .subtitle { font-size: 1.1rem; color: #333; margin-bottom: 30px; line-height: 1.6; }
          .org-name { font-size: 2rem; font-weight: bold; color: maroon; margin: 20px 0; border-bottom: 2px solid maroon; padding-bottom: 8px; display: inline-block; }
          .year { font-size: 1rem; color: #555; margin: 10px 0 30px; }
          .signatories { display: flex; justify-content: center; gap: 100px; margin-top: 40px; }
          .sig-block { text-align: center; }
          .sig-block .name { font-weight: bold; font-size: 1rem; border-top: 1px solid #000; padding-top: 6px; margin-top: 40px; }
          .sig-block .pos { font-size: 0.85rem; color: #555; }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <div class="title">Certificate of Recognition</div>
          <div class="subtitle">This is to certify that the following student organization<br>has been officially recognized by the University of the Philippines Baguio</div>
          <div class="org-name">${orgName}</div>
          <div class="year">Academic Year ${acadYear || "____"}</div>
          <div class="signatories">
            <div class="sig-block">
              <div class="name">Mr. Friedrich Andres Aquino</div>
              <div class="pos">Student Relations Officer</div>
            </div>
            <div class="sig-block">
              <div class="name">Ms. Liezel M. Magtoto, Ph.D.</div>
              <div class="pos">Director, Office of Student Affairs</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    const win = window.open("", "_blank");
    win.document.write(certHtml);
    win.document.close();
    win.onload = () => win.print();
  };

  const columns = useMemo(() => [
    {
      key: "org_name",
      header: "Organization Name",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-medium text-sm text-gray-800">{row.org_name}</span>
          <p className="text-xs text-gray-400">{row.org_email}</p>
        </div>
      )
    },
    {
      key: "academic_year",
      header: "Academic Year",
      sortable: true,
      width: "w-32",
      filterable: true,
      filterLabel: "Years",
      filterOptions: [...new Set(organizations.map(o => o.academic_year))].sort().reverse(),
      render: (row) => <span className="text-sm text-gray-600">{row.academic_year}</span>
    },
    {
      key: "chairperson_name",
      header: "Chairperson",
      sortable: true,
      render: (row) => (
        <div>
          <span className="text-sm text-gray-700">{row.chairperson_name}</span>
          <p className="text-xs text-gray-400 truncate max-w-[160px]">{row.chairperson_email}</p>
        </div>
      )
    },
    {
      key: "adviser_name",
      header: "Adviser",
      sortable: true,
      render: (row) => (
        <div>
          <span className="text-sm text-gray-700">{row.adviser_name}</span>
          <p className="text-xs text-gray-400 truncate max-w-[160px]">{row.adviser_email}</p>
        </div>
      )
    },
    {
      key: "org_type",
      header: "Category",
      sortable: true,
      width: "w-48",
      filterable: true,
      filterLabel: "Categories",
      filterOptions: categoriesList.map(c => c.name),
      filterAccessor: (row) => getCategoryName(row.org_type),
      render: (row) => (
        <span className="text-xs text-gray-500">{getCategoryName(row.org_type)}</span>
      )
    },
    {
      key: "org_status",
      header: "Status",
      isStatus: true,
      width: "w-32",
      accessor: (row) => row.org_status || "Recognized"
    }
  ], [organizations]);

  if (loading) return <TableSkeleton />;

  return (
    <div className="max-w-[1350px] mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Organization Summary</h1>

      <DataTable
        columns={columns}
        data={organizations}
        onRowClick={handleRowClick}
        emptyMessage="No recognized organizations found."
        defaultSort={{ key: "org_name", direction: "asc" }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-sro-primary">
              {selectedOrg?.org_name}
            </DialogTitle>
            <DialogDescription>
              {selectedOrg?.org_email}
            </DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-4 pt-2">
              {/* Details */}
              <div className="border rounded-md divide-y text-sm">
                <div className="flex px-4 py-2.5">
                  <span className="font-medium text-gray-700 w-32 shrink-0">Academic Year</span>
                  <span className="text-gray-600">{selectedOrg.academic_year || "—"}</span>
                </div>
                <div className="flex px-4 py-2.5">
                  <span className="font-medium text-gray-700 w-32 shrink-0">Category</span>
                  <span className="text-gray-600">{getCategoryName(selectedOrg.org_type)}</span>
                </div>
                <div className="flex px-4 py-2.5">
                  <span className="font-medium text-gray-700 w-32 shrink-0">Status</span>
                  <span className="text-gray-600">{selectedOrg.org_status || "Recognized"}</span>
                </div>
              </div>

              {/* Officers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border rounded-md p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sro-secondary mb-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Chairperson
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedOrg.chairperson_name}</p>
                  <p className="text-xs text-gray-500">{selectedOrg.chairperson_email}</p>
                </div>
                <div className="border rounded-md p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sro-secondary mb-1.5">
                    <UserCircle className="h-3.5 w-3.5" />
                    Adviser
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedOrg.adviser_name}</p>
                  <p className="text-xs text-gray-500">{selectedOrg.adviser_email}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={() => handleGenerateCertificate(selectedOrg.org_name, selectedOrg.academic_year)}
                  size="sm"
                  className="bg-sro-primary text-white hover:bg-sro-primary/90 gap-1.5 text-xs"
                >
                  <Award className="h-3.5 w-3.5" />
                  Recognition Certificate
                </Button>
                {selectedOrg.drive_folder_link && (
                  <Button
                    onClick={() => window.open(selectedOrg.drive_folder_link, '_blank')}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Drive Folder
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrganizations;
