import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, authFetch } from "@/lib/api-config";
import { TableSkeleton } from "@/components/ui/skeletons";
import DataTable from "@/components/ui/DataTable";

const AdminOrganizations = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const columns = useMemo(() => [
    {
      key: "org_name",
      header: "Organization Name",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-sm text-gray-800">{row.org_name}</span>
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
        <span className="text-sm text-gray-700">{row.chairperson_name}</span>
      )
    },
    {
      key: "adviser_name",
      header: "Adviser",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-700">{row.adviser_name}</span>
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
        onRowClick={(org) => navigate(`/admin/organizations/${org.org_id}`, { state: { breadcrumbLabel: org.org_name } })}
        emptyMessage="No recognized organizations found."
        defaultSort={{ key: "org_name", direction: "asc" }}
      />
    </div>
  );
};

export default AdminOrganizations;
