import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL, authFetch } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import { ArrowLeft, Users, UserCircle, Award, ExternalLink, FileText, Activity, CheckCircle2, Clock, XCircle } from "lucide-react";

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

const OrgProfile = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${API_BASE_URL}/api/organization/${orgId}/profile`);
        if (!res.ok) throw new Error("Organization not found");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [orgId]);

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

  const activityColumns = useMemo(() => [
    {
      key: "activity_name",
      header: "Activity",
      sortable: true,
      render: (row) => <span className="text-sm font-medium text-gray-800">{row.activity_name}</span>
    },
    {
      key: "start_date",
      header: "Date",
      sortable: true,
      sortAccessor: (row) => row.schedule?.[0]?.start_date,
      render: (row) => {
        const date = row.schedule?.[0]?.start_date;
        return <span className="text-sm text-gray-600">{date ? new Date(date).toLocaleDateString() : "—"}</span>;
      }
    },
    {
      key: "activity_type",
      header: "Type",
      sortable: true,
      render: (row) => <span className="text-xs text-gray-500 capitalize">{row.activity_type || "—"}</span>
    },
    {
      key: "final_status",
      header: "Status",
      isStatus: true,
      accessor: (row) => row.final_status || "Pending"
    },
  ], []);

  if (loading) {
    return (
      <div className="max-w-[1350px] mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[1350px] mx-auto text-center py-20">
        <p className="text-gray-500 mb-4">{error || "Organization not found"}</p>
        <Button variant="outline" onClick={() => navigate("/admin/organizations")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Organizations
        </Button>
      </div>
    );
  }

  const { org, stats, recentActivities, annualReports, recognitions } = data;

  return (
    <div className="max-w-[1350px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/admin/organizations")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Organizations
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{org.org_name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">{org.org_email}</span>
              {org.academic_year && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sro-primary/10 text-sro-primary">{org.academic_year}</span>
              )}
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sro-secondary/10 text-sro-secondary">
                {getCategoryName(org.org_type)}
              </span>
              <StatusPill status={org.org_status || "Recognized"} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleGenerateCertificate(org.org_name, org.academic_year)}
              size="sm"
              className="bg-sro-primary text-white hover:bg-sro-primary/90 gap-1.5 text-xs"
            >
              <Award className="h-3.5 w-3.5" /> Recognition Certificate
            </Button>
            {org.drive_folder_link && (
              <Button
                onClick={() => window.open(org.drive_folder_link, '_blank')}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Drive Folder
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Activities", value: stats.total, icon: Activity, color: "text-gray-700" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-sro-secondary" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-sro-primary" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Officers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sro-secondary mb-2">
            <Users className="h-3.5 w-3.5" /> Chairperson
          </div>
          <p className="text-sm font-medium text-gray-800">{org.chairperson_name || "—"}</p>
          <p className="text-xs text-gray-500">{org.chairperson_email || "—"}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sro-secondary mb-2">
            <UserCircle className="h-3.5 w-3.5" /> Adviser
          </div>
          <p className="text-sm font-medium text-gray-800">{org.adviser_name || "—"}</p>
          <p className="text-xs text-gray-500">{org.adviser_email || "—"}</p>
        </div>
      </div>

      {/* Tabs: Activities, Annual Reports, Recognition */}
      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="reports">Annual Reports</TabsTrigger>
          <TabsTrigger value="recognition">Recognition History</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <DataTable
            columns={activityColumns}
            data={recentActivities.map(a => ({ ...a, id: a.activity_id }))}
            emptyMessage="No activities found for this organization."
            defaultSort={{ key: "start_date", direction: "desc" }}
          />
        </TabsContent>

        <TabsContent value="reports">
          {annualReports.length > 0 ? (
            <div className="bg-white rounded-lg border divide-y">
              {annualReports.map((report) => (
                <div key={report.report_id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{report.academic_year}</p>
                    <p className="text-xs text-gray-500">
                      Submitted {new Date(report.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  {report.drive_folder_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(report.drive_folder_link, '_blank')}
                      className="gap-1.5 text-xs"
                    >
                      <FileText className="h-3.5 w-3.5" /> View
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-6 text-center text-sm text-gray-500">
              No annual reports submitted.
            </div>
          )}
        </TabsContent>

        <TabsContent value="recognition">
          {recognitions.length > 0 ? (
            <div className="bg-white rounded-lg border divide-y">
              {recognitions.map((rec) => (
                <div key={rec.recognition_id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{rec.academic_year}</p>
                    <p className="text-xs text-gray-500">
                      Submitted {new Date(rec.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusPill status={rec.org_status || "Pending"} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-6 text-center text-sm text-gray-500">
              No recognition applications found.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrgProfile;
