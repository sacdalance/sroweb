import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Building2, Users, UserCircle, Mail, ExternalLink, Award, FileSpreadsheet, FileText, 
  Layout, Shield, Calendar 
} from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
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
        const res = await fetch(`${API_BASE_URL}/api/organization/list`);
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
        <title>Certificate of Recognition - ${orgName}</title>
        <style>
          @page { size: 297mm 210mm; margin: 0; }
          body { margin: 0; padding: 0; font-family: 'Palatino Linotype', serif; }
          .certificate-container {
            width: 297mm; height: 210mm; padding: 25mm; box-sizing: border-box;
            border: 15px double maroon; text-align: center; display: flex;
            flex-direction: column; justify-content: space-between;
          }
          .title { font-size: 3.5em; font-weight: bold; color: maroon; margin-top: 10px; }
          .content { font-size: 1.5em; line-height: 1.6; margin-top: 30px; }
          .org-name { font-size: 2em; font-weight: bold; color: maroon; text-decoration: underline; }
          .footer { display: flex; justify-content: space-around; margin-top: 50px; }
          .signatory { width: 40%; }
          .name { font-weight: bold; text-decoration: underline; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div style="font-size: 1.5em; font-weight: bold;">UNIVERSITY OF THE PHILIPPINES BAGUIO<br>Office of Student Affairs</div>
          <div class="title">Certificate of Recognition</div>
          <div class="content">
            This is to formally recognize the organization<br>
            <span class="org-name">${orgName}</span><br>
            for complying with the requirements for student organization recognition<br>
            and being acknowledged as a duly recognized student organization<br>
            for the Academic Year <strong>${acadYear || '____________'}</strong>.
          </div>
          <div class="footer">
            <div class="signatory"><div class="name">Mr. Friedrich Andres Aquino</div><div>Student Relations Officer</div></div>
            <div class="signatory"><div class="name">Ms. Liezel M. Magtoto, Ph.D.</div><div>Director, Office of Student Affairs</div></div>
          </div>
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
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
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-sro-primary/10 overflow-hidden flex items-center justify-center border border-sro-primary/20 shrink-0">
            <img 
              src={`https://www.google.com/s2/photos/profile/${row.org_email}?sz=64`}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<span class="text-sro-primary font-bold text-sm">${row.org_name.charAt(0)}</span>`;
              }}
              alt=""
            />
          </div>
          <div className="flex flex-col text-left">
            <div className="font-bold text-sm text-gray-800 truncate max-w-[220px]" title={row.org_name}>
              {row.org_name}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium lowercase truncate max-w-[200px]">
              {row.org_email}
            </div>
          </div>
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
      render: (row) => <div className="font-mono text-[11px] text-center text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 w-fit mx-auto">{row.academic_year}</div>
    },
    {
      key: "chairperson_name",
      header: "Chairperson",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
            {row.chairperson_name}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium truncate max-w-[140px]">
            {row.chairperson_email}
          </div>
        </div>
      )
    },
    {
      key: "adviser_name",
      header: "Adviser",
      sortable: true,
        render: (row) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              {row.adviser_name}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium truncate max-w-[140px]">
              {row.adviser_email}
            </div>
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
        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          {getCategoryName(row.org_type)}
        </div>
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

  if (loading) return <LoadingSpinner text="Loading recognized organizations..." variant="section" />;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-[1600px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b pb-6">
        <div>
          <h1 className="page-header text-sro-primary mb-0">Organization Summary</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            Official Directory of Recognized Student Organizations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-sro-primary/5 border border-sro-primary/10 rounded-full px-4 py-2 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-sro-primary" />
            <span className="text-sm font-bold text-sro-primary">{organizations.length} Organizations Total</span>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={organizations}
        onRowClick={handleRowClick}
        emptyMessage="No recognized organizations found."
        defaultSort={{ key: "org_name", direction: "asc" }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-sro-primary flex items-center gap-2">
              Organization Profile
            </DialogTitle>
            <DialogDescription>
              Detailed information and administrative actions for this recognized organization.
            </DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-6 pt-4">
              {/* Top Header Card */}
              <div className="bg-gradient-to-br from-sro-primary/5 to-white p-5 rounded-xl border border-sro-primary/10 flex items-start gap-4">
                <div className="h-14 w-14 rounded-lg bg-sro-primary overflow-hidden flex items-center justify-center shadow-lg shadow-sro-primary/20 shrink-0">
                  <img 
                    src={`https://www.google.com/s2/photos/profile/${selectedOrg.org_email}?sz=128`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span class="text-white text-2xl font-black">${selectedOrg.org_name.charAt(0)}</span>`;
                    }}
                    alt=""
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight break-words">{selectedOrg.org_name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-500">
                      ID: {selectedOrg.org_id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-sro-primary/10 text-sro-primary rounded border border-sro-primary/20">
                      {selectedOrg.academic_year || "Academic Year Not Set"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-sro-secondary/10 text-sro-secondary rounded border border-sro-secondary/20">
                      {getCategoryName(selectedOrg.org_type) || "Uncategorized"}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 bg-gray-100/80 text-gray-500 rounded flex items-center gap-1.5 lowercase">
                      {selectedOrg.org_email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg space-y-3 bg-white hover:border-sro-primary/30 transition-colors group">
                  <div className="flex items-center gap-2 text-sro-secondary font-bold text-xs uppercase tracking-tighter">
                    <Users className="h-3.5 w-3.5" />
                    CHAIRPERSON DETAILS
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-800">{selectedOrg.chairperson_name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-sro-primary transition-colors">
                      {selectedOrg.chairperson_email}
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-3 bg-white hover:border-sro-primary/30 transition-colors group">
                  <div className="flex items-center gap-2 text-sro-secondary font-bold text-xs uppercase tracking-tighter">
                    <UserCircle className="h-3.5 w-3.5" />
                    ADVISER DETAILS
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-800">{selectedOrg.adviser_name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-sro-primary transition-colors">
                      {selectedOrg.adviser_email}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 p-4 border rounded-lg bg-gray-50/50">
                  <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase mb-1">
                    Official Organization Email
                  </div>
                  <p className="text-sm font-medium text-gray-700">{selectedOrg.org_email}</p>
                </div>
              </div>

              {/* Actions Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrative Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleGenerateCertificate(selectedOrg.org_name, selectedOrg.academic_year)}
                    className="bg-sro-primary text-white hover:bg-sro-primary/90 shadow-md shadow-sro-primary/10 gap-2 h-10 text-xs"
                  >
                    <Award className="h-4 w-4" />
                    Recognition Cert
                  </Button>
                  <Button
                    onClick={() => window.open(selectedOrg.drive_folder_link, '_blank')}
                    variant="outline"
                    className="border-gray-200 hover:border-sro-secondary hover:text-sro-secondary gap-2 h-10 text-xs shadow-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Drive Folder
                  </Button>
                  <Button
                    onClick={() => window.open("https://docs.google.com/document/d/1HUt9Mz_sm2iDpvNkJqgPWoiXAA__QE099oxNLURTDyI", "_blank")}
                    variant="outline"
                    className="border-gray-200 hover:border-sro-primary hover:text-sro-primary gap-2 h-10 text-xs shadow-sm"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Events Summary
                  </Button>
                  <Button
                    onClick={() => window.open("https://docs.google.com/document/d/1HUt9Mz_sm2iDpvNkJqgPWoiXAA__QE099oxNLURTDyI", "_blank")}
                    variant="outline"
                    className="border-gray-200 hover:border-sro-primary hover:text-sro-primary gap-2 h-10 text-xs shadow-sm"
                  >
                    <FileText className="h-4 w-4" />
                    Annual Report
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto text-gray-500">
                  Close Profile
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrganizations;
 