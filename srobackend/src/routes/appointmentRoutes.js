import express from 'express';
import { supabase } from '../supabaseClient.js';
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const router = express.Router();

// Get appointment settings
router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointment_settings')
      .select(`
        *,
        created_by:account!created_by(account_name),
        updated_by:account!updated_by(account_name)
      `)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    
    return res.status(200).json(data[0] || {});
  } catch (error) {
    console.error('Error fetching appointment settings:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update or insert appointment settings
router.post('/settings', async (req, res) => {
  try {
    const { 
      allowed_days, 
      start_time, 
      end_time, 
      appointment_duration, 
      max_appointments_per_day,
      account_id 
    } = req.body;

    if (!account_id) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Validate required fields
    if (!allowed_days || !start_time || !end_time || !appointment_duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('appointment_settings')
      .upsert({
        allowed_days,
        start_time,
        end_time,
        appointment_duration,
        max_appointments_per_day,
        updated_by: account_id,
        created_by: account_id, // Only set on insert
        updated_at: new Date()
      })
      .select(`
        *,
        created_by:account!created_by(account_name),
        updated_by:account!updated_by(account_name)
      `);

    if (error) throw error;
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error updating appointment settings:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get all blocked slots
router.get('/blocked-slots', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blocked_slots')
      .select(`
        *,
        created_by:account!created_by(account_name),
        updated_by:account!updated_by(account_name)
      `)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching blocked slots:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Block a date or time slot
router.post('/blocked-slots', async (req, res) => {
  try {
    const { block_date, block_time, reason, account_id } = req.body;

    if (!block_date && !block_time) {
      return res.status(400).json({ error: 'Either date or time must be provided' });
    }

    if (!account_id) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    const { data, error } = await supabase
      .from('blocked_slots')
      .insert({ 
        block_date, 
        block_time, 
        reason,
        created_by: account_id 
      })
      .select(`
        *,
        created_by:account!created_by(account_name)
      `);

    if (error) throw error;
    
    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error adding blocked slot:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Remove a blocked slot
router.delete('/blocked-slots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { account_id } = req.body;

    if (!account_id) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // First update the record to track who deleted it
    await supabase
      .from('blocked_slots')
      .update({ updated_by: account_id })
      .eq('id', id);

    // Then delete it
    const { error } = await supabase
      .from('blocked_slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return res.status(200).json({ message: 'Blocked slot removed successfully' });
  } catch (error) {
    console.error('Error removing blocked slot:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get available time slots for a specific date
router.get('/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Get appointment settings
    const { data: settings, error: settingsError } = await supabase
      .from('appointment_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError) throw settingsError;
    
    if (!settings) {
      return res.status(400).json({ error: 'Appointment settings not configured' });
    }
    
    // Check if date is in allowed days
    const dayOfWeek = new Date(date).getDay();
    const allowedDays = settings.allowed_days || [];

    if (!allowedDays.includes(dayOfWeek)) {
      return res.status(400).json({ error: 'Appointments are not available on this day' });
    }
    
    // Check if date is blocked
    const { data: blockedSlot, error: blockedSlotError } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('block_date', date)
      .single();

    if (blockedSlotError && blockedSlotError.code !== 'PGRST116') {
      throw blockedSlotError;
    }

    if (blockedSlot) {
      return res.status(400).json({ 
        error: 'This date is blocked for appointments',
        reason: blockedSlot.reason
      });
    }
    
    // Generate all possible time slots based on settings
    const { start_time, end_time, appointment_duration } = settings;
    
    const startHour = parseInt(start_time.split(':')[0]);
    const startMinute = parseInt(start_time.split(':')[1]);
    const endHour = parseInt(end_time.split(':')[0]);
    const endMinute = parseInt(end_time.split(':')[1]);
    
    let allSlots = [];
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      allSlots.push(timeString);
      
      // Add duration to current time
      currentMinute += appointment_duration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    // Get all confirmed appointments for this date
    const { data: bookedAppointments, error: bookedError } = await supabase
      .from('appointments')
      .select('time_slot')
      .eq('date', date)
      .in('status', ['confirmed', 'pending']);
      
    if (bookedError) throw bookedError;
    
    const bookedSlots = bookedAppointments.map(app => app.time_slot);
    
    // Get all blocked time slots for this date
    const { data: blockedTimes, error: blockedTimesError } = await supabase
      .from('blocked_slots')
      .select('block_time')
      .not('block_time', 'is', null);
      
    if (blockedTimesError) throw blockedTimesError;
    
    // Filter out booked and blocked slots
    const availableSlots = allSlots.filter(slot => {
      // Check if slot is already booked
      if (bookedSlots.includes(slot)) return false;
      
      // Check if slot falls within any blocked time range
      for (const blockedTime of blockedTimes) {
        if (slot === blockedTime.block_time) {
          return false;
        }
      }
      
      return true;
    });
    
    // Count total confirmed appointments for the day
    const { count, error: countError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('date', date)
      .eq('status', 'confirmed');
      
    if (countError) throw countError;
    
    // Check if max appointments for the day is reached
    const maxReached = settings.max_appointments_per_day && count >= settings.max_appointments_per_day;
    
    return res.status(200).json({
      availableSlots,
      bookedSlots,
      blockedSlots: blockedTimes.map(b => ({ time: b.block_time })),
      maxAppointmentsReached: maxReached
    });
    
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get appointments (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { date, status, user_id } = req.query;
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `);
    
    if (date) {
      query = query.eq('date', date);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get a specific appointment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Create a new appointment
router.post('/', async (req, res) => {
  try {
    const { 
      account_id,
      appointment_date, 
      appointment_time, 
      reason,
      notes,
      meeting_mode,
      contact_number,
      email 
    } = req.body;

    // Validate required fields
    if (!account_id || !appointment_date || !appointment_time || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if date or time is blocked
    const { data: blockedSlots, error: blockedError } = await supabase
      .from('blocked_slots')
      .select('*')
      .or(`block_date.eq.${appointment_date},block_time.eq.${appointment_time}`);

    if (blockedError) throw blockedError;

    if (blockedSlots && blockedSlots.length > 0) {
      return res.status(400).json({ 
        error: blockedSlots.some(slot => slot.block_date) 
          ? 'This date is blocked for appointments'
          : 'This time slot is blocked',
        reason: blockedSlots[0].reason
      });
    }

    // Check for existing appointments at the same time
    const { data: existingAppointment, error: existingError } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .in('status', ['scheduled', 'confirmed'])
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    // Get settings for max appointments check
    const { data: settings, error: settingsError } = await supabase
      .from('appointment_settings')
      .select('max_appointments_per_day')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError) throw settingsError;

    if (settings?.max_appointments_per_day) {
      const { count, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', appointment_date)
        .in('status', ['scheduled', 'confirmed']);

      if (countError) throw countError;

      if (count >= settings.max_appointments_per_day) {
        return res.status(400).json({ error: 'Maximum number of appointments for this day has been reached' });
      }
    }

    // Create the appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        account_id,
        appointment_date,
        appointment_time,
        reason,
        notes,
        meeting_mode,
        contact_number,
        email,
        status: 'scheduled'
      })
      .select();

    if (error) throw error;

    // Send confirmation emails
    try {
      // Send to user
      if (email) {
        const userEmailData = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your Appointment Request Confirmation',
          text: `
            Thank you for scheduling an appointment.
            
            Date: ${appointment_date}
            Time: ${appointment_time}
            Purpose: ${reason}
            
            Your appointment is currently pending approval. You will receive another email once it has been confirmed.
          `,
          html: `
            <h2>Your Appointment Request Confirmation</h2>
            <p>Thank you for scheduling an appointment.</p>
            <p><strong>Date:</strong> ${appointment_date}</p>
            <p><strong>Time:</strong> ${appointment_time}</p>
            <p><strong>Purpose:</strong> ${reason}</p>
            <p>Your appointment is currently pending approval. You will receive another email once it has been confirmed.</p>
          `
        };
        
        await transporter.sendMail(userEmailData);
      }

      // Send to admin
      const adminEmailData = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'New Appointment Request',
        text: `
          A new appointment request has been submitted.
          
          Date: ${appointment_date}
          Time: ${appointment_time}
          Purpose: ${reason}
          
          Please review this request in the admin dashboard.
        `,
        html: `
          <h2>New Appointment Request</h2>
          <p>A new appointment request has been submitted.</p>
          <p><strong>Date:</strong> ${appointment_date}</p>
          <p><strong>Time:</strong> ${appointment_time}</p>
          <p><strong>Purpose:</strong> ${reason}</p>
          <p>Please review this request in the admin dashboard.</p>
        `
      };
      
      await transporter.sendMail(adminEmailData);
    } catch (emailError) {
      console.error('Error sending confirmation emails:', emailError);
    }

    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed', 'no-show'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status provided' });
    }

    // Get current appointment data for notification
    const { data: currentAppointment, error: currentAppError } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (currentAppError) throw currentAppError;
    
    if (!currentAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updateData = { 
      status, 
      updated_at: new Date() 
    };

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Send notification email to user on status change
    if (currentAppointment.users && currentAppointment.users.email) {
      let subject, message;
      
      switch(status) {
        case 'confirmed':
          subject = 'Your Appointment Has Been Confirmed';
          message = `
            <h2>Your Appointment Has Been Confirmed</h2>
            <p>Your appointment has been confirmed for:</p>
            <p><strong>Date:</strong> ${currentAppointment.date}</p>
            <p><strong>Time:</strong> ${currentAppointment.time_slot}</p>
            ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
          `;
          break;
        case 'cancelled':
          subject = 'Your Appointment Has Been Cancelled';
          message = `
            <h2>Your Appointment Has Been Cancelled</h2>
            <p>Your appointment for the following date and time has been cancelled:</p>
            <p><strong>Date:</strong> ${currentAppointment.date}</p>
            <p><strong>Time:</strong> ${currentAppointment.time_slot}</p>
            ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
          `;
          break;
        case 'completed':
          subject = 'Your Appointment Has Been Completed';
          message = `
            <h2>Your Appointment Has Been Completed</h2>
            <p>Thank you for attending your appointment.</p>
            <p><strong>Date:</strong> ${currentAppointment.date}</p>
            <p><strong>Time:</strong> ${currentAppointment.time_slot}</p>
            ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
          `;
          break;
        case 'no-show':
          subject = 'Missed Appointment Notice';
          message = `
            <h2>Missed Appointment Notice</h2>
            <p>Our records indicate that you missed your scheduled appointment:</p>
            <p><strong>Date:</strong> ${currentAppointment.date}</p>
            <p><strong>Time:</strong> ${currentAppointment.time_slot}</p>
            <p>If you need to reschedule, please make a new appointment through the system.</p>
            ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
          `;
          break;
        default:
          // No email for other status changes
          break;
      }
      
      if (subject && message) {
        const userEmailData = {
          from: process.env.EMAIL_USER,
          to: currentAppointment.users.email,
          subject: subject,
          html: message,
          text: message.replace(/<[^>]*>/g, '') // Strip HTML for text version
        };
        
        try {
          await transporter.sendMail(userEmailData);
        } catch (emailError) {
          console.error('Error sending status update email:', emailError);
        }
      }
    }

    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Request to reschedule an appointment
router.post('/:id/reschedule-request', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_date, new_time, reason } = req.body;
    
    if (!new_date || !new_time) {
      return res.status(400).json({ error: 'New date and time are required' });
    }

    // Check if the appointment exists and can be rescheduled
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        account:account(*)
      `)
      .eq('id', id)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check if appointment is in a state that allows rescheduling
    if (['cancelled', 'completed', 'no-show'].includes(appointment.status)) {
      return res.status(400).json({ 
        error: `Cannot reschedule an appointment with status: ${appointment.status}` 
      });
    }

    // Check if new date/time is blocked
    const { data: blockedSlots, error: blockedError } = await supabase
      .from('blocked_slots')
      .select('*')
      .or(`block_date.eq.${new_date},block_time.eq.${new_time}`);

    if (blockedError) throw blockedError;

    if (blockedSlots && blockedSlots.length > 0) {
      return res.status(400).json({ 
        error: blockedSlots.some(slot => slot.block_date) 
          ? 'The requested date is blocked for appointments'
          : 'The requested time slot is blocked',
        reason: blockedSlots[0].reason
      });
    }
    
    // Check if there's already an appointment at this time
    const { data: existingAppointment, error: existingError } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', new_date)
      .eq('appointment_time', new_time)
      .in('status', ['scheduled', 'confirmed'])
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }
    
    // Update the appointment with the reschedule request
    const { data, error } = await supabase
      .from('appointments')
      .update({
        requested_date: new_date,
        requested_time: new_time,
        reschedule_reason: reason,
        status: 'reschedule-pending',
        updated_at: new Date()
      })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    // Send email notifications
    try {
      // Notify admin
      const adminEmailData = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'Appointment Reschedule Request',
        html: `
          <h2>Appointment Reschedule Request</h2>
          <p><strong>User:</strong> ${appointment.account.account_name}</p>
          <p><strong>Original Date:</strong> ${appointment.appointment_date}</p>
          <p><strong>Original Time:</strong> ${appointment.appointment_time}</p>
          <p><strong>Requested Date:</strong> ${new_date}</p>
          <p><strong>Requested Time:</strong> ${new_time}</p>
          <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
          <p>Please review this request in the admin dashboard.</p>
        `
      };
      
      await transporter.sendMail(adminEmailData);

      // Notify user
      if (appointment.email) {
        const userEmailData = {
          from: process.env.EMAIL_USER,
          to: appointment.email,
          subject: 'Your Appointment Reschedule Request',
          html: `
            <h2>Your Appointment Reschedule Request</h2>
            <p>Your request to reschedule your appointment has been submitted.</p>
            <p><strong>Original Date:</strong> ${appointment.appointment_date}</p>
            <p><strong>Original Time:</strong> ${appointment.appointment_time}</p>
            <p><strong>Requested Date:</strong> ${new_date}</p>
            <p><strong>Requested Time:</strong> ${new_time}</p>
            <p>You will receive another email once your request has been processed.</p>
          `
        };
        
        await transporter.sendMail(userEmailData);
      }
    } catch (emailError) {
      console.error('Error sending notifications:', emailError);
    }

    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error processing reschedule request:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Admin approve/reject reschedule request
router.patch('/:id/reschedule-decision', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, admin_notes } = req.body;
    
    // Get the appointment with reschedule request
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (!appointment.reschedule_requested) {
      return res.status(400).json({ error: 'This appointment has no reschedule request' });
    }
    
    let updateData = {
      reschedule_requested: false,
      admin_notes: admin_notes || appointment.admin_notes,
      updated_at: new Date()
    };
    
    if (approved) {
      // If approved, update with the requested date and time
      updateData = {
        ...updateData,
        date: appointment.requested_date,
        time_slot: appointment.requested_time_slot,
        requested_date: null,
        requested_time_slot: null,
        reschedule_reason: null,
        status: 'confirmed'
      };
    } else {
      // If rejected, revert to original status
      updateData = {
        ...updateData,
        requested_date: null,
        requested_time_slot: null,
        reschedule_reason: null,
        status: 'confirmed' // back to confirmed status
      };
    }
    
    // Update the appointment
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    // Send email notification to user
    if (appointment.users && appointment.users.email) {
      const decision = approved ? 'approved' : 'rejected';
      const userEmailData = {
        from: process.env.EMAIL_USER,
        to: appointment.users.email,
        subject: `Your Appointment Reschedule Request has been ${approved ? 'Approved' : 'Rejected'}`,
        text: `
          Your appointment reschedule request has been ${decision}.
          
          ${approved ? `
          Your appointment has been rescheduled to:
          Date: ${appointment.requested_date}
          Time: ${appointment.requested_time_slot}
          ` : `
          Your appointment remains as originally scheduled:
          Date: ${appointment.date}
          Time: ${appointment.time_slot}
          `}
          
          ${admin_notes ? `Notes: ${admin_notes}` : ''}
        `,
        html: `
          <h2>Your Appointment Reschedule Request</h2>
          <p>Your appointment reschedule request has been <strong>${decision}</strong>.</p>
          
          ${approved ? `
          <p>Your appointment has been rescheduled to:</p>
          <p><strong>Date:</strong> ${appointment.requested_date}</p>
          <p><strong>Time:</strong> ${appointment.requested_time_slot}</p>
          ` : `
          <p>Your appointment remains as originally scheduled:</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time_slot}</p>
          `}
          
          ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
        `
      };
      
      try {
        await transporter.sendMail(userEmailData);
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error processing reschedule decision:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Request to cancel an appointment
router.post('/:id/cancellation-request', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }
    
    // Check if the appointment exists
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check if appointment is already cancelled or completed
    if (['cancelled', 'completed', 'no-show'].includes(appointment.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel an appointment with status: ${appointment.status}` 
      });
    }
    
    // Update the appointment with the cancellation request
    const { data, error } = await supabase
      .from('appointments')
      .update({
        cancellation_requested: true,
        cancellation_reason: reason,
        status: 'cancellation-pending',
        updated_at: new Date()
      })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    // Send email notification to admin
    const adminEmailData = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'Appointment Cancellation Request',
      text: `
        An appointment cancellation has been requested.
        
        User: ${appointment.users.first_name} ${appointment.users.last_name} (${appointment.users.email})
        Date: ${appointment.date}
        Time: ${appointment.time_slot}
        Reason: ${reason}
        
        Please review this request in the admin dashboard.
      `,
      html: `
        <h2>Appointment Cancellation Request</h2>
        <p><strong>User:</strong> ${appointment.users.first_name} ${appointment.users.last_name} (${appointment.users.email})</p>
        <p><strong>Date:</strong> ${appointment.date}</p>
        <p><strong>Time:</strong> ${appointment.time_slot}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please review this request in the admin dashboard.</p>
      `
    };
    
    try {
      await transporter.sendMail(adminEmailData);
    } catch (emailError) {
      console.error('Error sending admin email notification:', emailError);
      // Continue with the response even if email fails
    }
    
    // Send confirmation email to user
    if (appointment.users && appointment.users.email) {
      const userEmailData = {
        from: process.env.EMAIL_USER,
        to: appointment.users.email,
        subject: 'Your Appointment Cancellation Request',
        text: `
          Your appointment cancellation request has been received and is pending approval.
          
          Date: ${appointment.date}
          Time: ${appointment.time_slot}
          
          You will receive another email once your request has been processed.
        `,
        html: `
          <h2>Your Appointment Cancellation Request</h2>
          <p>Your appointment cancellation request has been received and is pending approval.</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time_slot}</p>
          <p>You will receive another email once your request has been processed.</p>
        `
      };
      
      try {
        await transporter.sendMail(userEmailData);
      } catch (emailError) {
        console.error('Error sending user email notification:', emailError);
        // Continue with the response even if email fails
      }
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error requesting appointment cancellation:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Admin approve/reject cancellation request
router.patch('/:id/cancellation-decision', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, admin_notes } = req.body;
    
    // Get the appointment with cancellation request
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (!appointment.cancellation_requested) {
      return res.status(400).json({ error: 'This appointment has no cancellation request' });
    }
    
    let updateData = {
      cancellation_requested: false,
      admin_notes: admin_notes || appointment.admin_notes,
      updated_at: new Date()
    };
    
    if (approved) {
      // If approved, mark as cancelled
      updateData = {
        ...updateData,
        cancellation_reason: appointment.cancellation_reason, // Keep the reason
        status: 'cancelled'
      };
    } else {
      // If rejected, revert to original status
      updateData = {
        ...updateData,
        cancellation_reason: null,
        status: 'confirmed' // back to confirmed status
      };
    }
    
    // Update the appointment
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    // Send email notification to user
    if (appointment.users && appointment.users.email) {
      const decision = approved ? 'approved' : 'rejected';
      const userEmailData = {
        from: process.env.EMAIL_USER,
        to: appointment.users.email,
        subject: `Your Appointment Cancellation Request has been ${approved ? 'Approved' : 'Rejected'}`,
        text: `
          Your appointment cancellation request has been ${decision}.
          
          ${approved ? `
          Your appointment for the following date and time has been cancelled:
          Date: ${appointment.date}
          Time: ${appointment.time_slot}
          ` : `
          Your appointment remains as scheduled:
          Date: ${appointment.date}
          Time: ${appointment.time_slot}
          `}
          
          ${admin_notes ? `Notes: ${admin_notes}` : ''}
        `,
        html: `
          <h2>Your Appointment Cancellation Request</h2>
          <p>Your appointment cancellation request has been <strong>${decision}</strong>.</p>
          
          ${approved ? `
          <p>Your appointment for the following date and time has been cancelled:</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time_slot}</p>
          ` : `
          <p>Your appointment remains as scheduled:</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time_slot}</p>
          `}
          
          ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
        `
      };
      
      try {
        await transporter.sendMail(userEmailData);
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error processing cancellation decision:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Send confirmation email for appointment
router.post('/:id/send-confirmation', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, status } = req.body;
    
    // Get appointment details with account information
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        account:account(account_id, account_name, email)
      `)
      .eq('id', id)
      .single();
    
    if (appointmentError) throw appointmentError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Format the date for display
    const appointmentDate = new Date(appointment.appointment_date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
    
    // Format the time for display
    const timeParts = appointment.appointment_time.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    
    const formattedTime = new Date(0, 0, 0, hours, minutes).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Update appointment status if provided
    if (status) {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status,
          admin_notes: notes || null,
          updated_at: new Date()
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
    }
    
    // Check if we have an email to send to
    if (!appointment.account?.email) {
      return res.status(400).json({ 
        error: 'No email available for this appointment',
        appointment
      });
    }
    
    // Prepare email content
    const userEmailData = {
      from: process.env.EMAIL_USER,
      to: appointment.account.email,
      subject: 'Your Appointment Has Been Confirmed',
      text: `
Dear ${appointment.account.account_name || 'Student'},

Your appointment has been confirmed for the following date and time:

Date: ${formattedDate}
Time: ${formattedTime}
Purpose: ${appointment.reason}
Meeting Mode: ${appointment.meeting_mode || 'Face-to-face'}

${notes ? `Notes from admin: ${notes}` : ''}

Please be on time for your appointment. If you need to reschedule or cancel, please do so at least 24 hours in advance.

Thank you,
The Student Relations Office
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007749;">Your Appointment Has Been Confirmed</h2>
          <p>Dear ${appointment.account.account_name || 'Student'},</p>
          <p>Your appointment has been confirmed for the following date and time:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Purpose:</strong> ${appointment.reason}</p>
            <p><strong>Meeting Mode:</strong> ${appointment.meeting_mode || 'Face-to-face'}</p>
          </div>
          ${notes ? `<p><strong>Notes from admin:</strong> ${notes}</p>` : ''}
          <p>Please be on time for your appointment. If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
          <p>Thank you,<br>The Student Relations Office</p>
        </div>
      `
    };
    
    // Send the email
    await transporter.sendMail(userEmailData);
    
    return res.status(200).json({ 
      message: 'Confirmation email sent successfully',
      recipient: appointment.account.email 
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;