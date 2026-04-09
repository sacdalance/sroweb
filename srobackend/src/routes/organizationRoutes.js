import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authMiddleware, verifyAdminRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/list', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('organization')
    .select(`
      org_id,
      org_name,
      org_email,
      adviser_name,
      adviser_email,
      chairperson_name,
      chairperson_email,
      academic_year,
      drive_folder_link,
      org_type,
      org_status
    `);

  if (error) {
    console.error('Error fetching organizations:', error);
    return res.status(500).json({ error: 'Failed to fetch organizations' });
  }

  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.json(data);
});

router.get('/:id/profile', authMiddleware, verifyAdminRoles, async (req, res) => {
  const { id } = req.params;

  try {
    const [orgResult, activitiesResult, reportsResult, recognitionsResult] = await Promise.all([
      supabase.from('organization').select('*').eq('org_id', id).single(),
      supabase.from('activity')
        .select('activity_id, activity_name, activity_type, final_status, created_at, schedule:activity_schedule(start_date, end_date)')
        .eq('org_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('org_annual_report')
        .select('report_id, academic_year, drive_folder_link, submitted_at')
        .eq('org_id', id)
        .order('submitted_at', { ascending: false }),
      supabase.from('org_recognition')
        .select('recognition_id, academic_year, org_status, submitted_at')
        .eq('organization_id', id)
        .order('submitted_at', { ascending: false }),
    ]);

    if (orgResult.error || !orgResult.data) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const activities = activitiesResult.data || [];
    const reports = reportsResult.data || [];
    const recognitions = recognitionsResult.data || [];

    res.json({
      org: orgResult.data,
      stats: {
        total: activities.length,
        approved: activities.filter(a => a.final_status === 'Approved').length,
        pending: activities.filter(a => !a.final_status || a.final_status === 'Pending' || a.final_status === 'For Appeal').length,
        rejected: activities.filter(a => a.final_status === 'Rejected').length,
      },
      recentActivities: activities.slice(0, 10),
      annualReports: reports,
      recognitions,
    });
  } catch (error) {
    console.error('Error fetching org profile:', error);
    res.status(500).json({ error: 'Failed to fetch organization profile' });
  }
});

export default router;
