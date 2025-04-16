import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import axios from "axios";

const Activities = () => {
  const [requested, setRequested] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDateRange = (schedule) => {
    if (!Array.isArray(schedule) || schedule.length === 0) return "TBD";
    const { start_date, end_date } = schedule[0];
    try {
      const start = new Date(start_date).toLocaleDateString();
      const endFormatted = end_date ? new Date(end_date).toLocaleDateString() : "";
      return start === endFormatted || !endFormatted ? start : `${start} - ${endFormatted}`;
    } catch {
      return "TBD";
    }
  };

  useEffect(() => {
    const fetchActivities = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: account } = await supabase
        .from("account")
        .select("account_id")
        .eq("email", user.email)
        .single();

      if (!account) return;

      const res = await axios.get(`/activities/user/${account.account_id}`);
      const all = res.data;

      const requestedActivities = all.filter((a) => a.final_status !== "Approved");
      const approvedActivities = all.filter((a) => a.final_status === "Approved");

      setRequested(requestedActivities);
      setApproved(approvedActivities);
      setLoading(false);
    };

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <p className="text-gray-600">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold mb-4">My Activities</h1>

      {/* Requested Activities */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Requested Activities</h2>
        <Card className="w-full">
          <CardContent className="overflow-x-auto">
            <table className="w-full table-fixed text-sm text-left">
              <thead className="border-b">
                <tr>
                  <th className="py-2 px-4">Organization</th>
                  <th className="py-2 px-4">Title</th>
                  <th className="py-2 px-4">Date Range</th>
                  <th className="py-2 px-4">Venue</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="w-0 p-0 m-0" /> {/* For alignment */}
                </tr>
              </thead>
              <tbody>
                {requested.length > 0 ? (
                  requested.map((act) => (
                    <tr key={act.activity_id} className="border-b">
                      <td className="py-2 px-4">{act.organization?.org_name || "Unknown"}</td>
                      <td className="py-2 px-4">{act.activity_name}</td>
                      <td className="py-2 px-4">{formatDateRange(act.schedule)}</td>
                      <td className="py-2 px-4">{act.venue}</td>
                      <td className="py-2 px-4 text-[#7B1113] font-medium">
                        {act.final_status || "Pending"}
                      </td>
                      <td className="w-0 p-0 m-0" /> {/* Align with Approved */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                      No requested activities found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Approved Activities */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Approved Activities</h2>
        <Card className="w-full">
          <CardContent className="overflow-x-auto">
            <table className="w-full table-fixed text-sm text-left">
              <thead className="border-b">
                <tr>
                  <th className="py-2 px-4">Organization</th>
                  <th className="py-2 px-4">Title</th>
                  <th className="py-2 px-4">Date Range</th>
                  <th className="py-2 px-4">Venue</th>
                  <th className="py-2 px-4">Contact</th>
                </tr>
              </thead>
              <tbody>
                {approved.length > 0 ? (
                  approved.map((act) => (
                    <tr key={act.activity_id} className="border-b">
                      <td className="py-2 px-4">{act.organization?.org_name || "Unknown"}</td>
                      <td className="py-2 px-4">{act.activity_name}</td>
                      <td className="py-2 px-4">{formatDateRange(act.schedule)}</td>
                      <td className="py-2 px-4">{act.venue}</td>
                      <td className="py-2 px-4">{act.venue_approver}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                      No approved activities found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Activities;
