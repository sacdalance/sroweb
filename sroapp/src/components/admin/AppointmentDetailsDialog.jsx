import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ActionButtons from '@/components/ui/ActionButtons';
import { StatusPill } from '@/components/ui/StatusPill';

/**
 * Reusable dialog for viewing and managing appointment details.
 * Supports viewing details and performing actions (Confirm, Reject, Cancel, Reschedule) if handlers are provided.
 */
const AppointmentDetailsDialog = ({
    appointment,
    isOpen,
    onClose,
    onConfirm,
    onReject,
    onCancel,
    onRescheduleApprove,
    onRescheduleReject,
    isProcessing = false
}) => {
    const [rejectReason, setRejectReason] = useState("");
    const [adminComment, setAdminComment] = useState("");
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [actionType, setActionType] = useState(null); // 'reject' or 'cancel'

    if (!appointment) return null;

    const handleRejectClick = (type) => {
        setActionType(type);
        setShowRejectDialog(true);
    };

    const handleRejectConfirm = async () => {
        if (actionType === 'cancel' && onCancel) {
            await onCancel(appointment.id, rejectReason);
        } else if (actionType === 'reject' && onReject) {
            await onReject(appointment.id, rejectReason);
        }
        setShowRejectDialog(false);
        setRejectReason("");
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (isProcessing) e.preventDefault(); }}>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-sro-primary">Appointment Details</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Student Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-sro-primary">Student Information</h3>
                                <div className="mt-1">
                                    <p className="text-sm">{appointment.formattedName || appointment.account?.account_name || 'Unknown'}</p>
                                    <p className="text-sm text-gray-500">{appointment.email || appointment.account?.email}</p>
                                    <p className="text-sm text-gray-400">{appointment.contact_number}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-sro-primary">Appointment Status</h3>
                                <div className="mt-1">
                                    <StatusPill status={appointment.status} />
                                </div>
                            </div>
                        </div>

                        {/* Appointment Details */}
                        <div>
                            <h3 className="text-sm font-semibold text-sro-primary">Meeting Details</h3>
                            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm">
                                        <span className="font-medium">Type:</span> {(() => {
                                            switch (appointment.reason) {
                                                case 'consultation': return 'General Consultation';
                                                case 'document': return 'Document Processing';
                                                case 'inquiry': return 'General Inquiry';
                                                case 'other': return 'Other';
                                                default: return appointment.reason;
                                            }
                                        })()}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Reason:</span> {appointment.specified_reason}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Mode:</span> {appointment.meeting_mode === 'face-to-face' ? 'Face-to-face' : 'Online'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm">
                                        <span className="font-medium">Date:</span> {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Time:</span> {appointment.timeRange || (appointment.appointment_time ? `${appointment.appointment_time.slice(0, 5)}` : 'TBD')}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Requested:</span> {new Date(appointment.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                            {appointment.notes && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-sm font-medium text-sro-primary mb-1">Additional Notes</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-100">
                                        {appointment.notes}
                                    </p>
                                </div>
                            )}
                            {appointment.admin_notes && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Admin Notes (SRO Response)</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-red-50 p-3 rounded-md border border-red-100">
                                        {appointment.admin_notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {appointment.status === 'reschedule-pending' && (
                            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                                <h3 className="text-sm font-semibold text-amber-800 mb-2">Reschedule Request Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Original Schedule</span>
                                        <p className="text-sm font-medium">
                                            {new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                        <p className="text-sm text-gray-600">{appointment.timeRange}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Proposed Schedule</span>
                                        <p className="text-sm font-medium text-amber-900">
                                            {new Date(appointment.requestedDate || appointment.reschedule_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                        <p className="text-sm text-amber-800">
                                            {appointment.requestedTime || appointment.reschedule_time}
                                        </p>
                                    </div>
                                </div>
                                {appointment.reschedule_reason && (
                                    <div className="mt-2 text-sm text-amber-900">
                                        <span className="font-medium">Reason:</span> {appointment.reschedule_reason}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Admin Input for Confirmation (only if needed/enabled) */}
                        {appointment.status === 'scheduled' && onConfirm && (
                            <div>
                                <h3 className="text-sm font-semibold text-sro-primary mb-1">Admin Notes</h3>
                                <Textarea
                                    value={adminComment}
                                    onChange={(e) => setAdminComment(e.target.value)}
                                    placeholder="Add any comments or instructions for the student..."
                                    className="min-h-[80px] text-sm"
                                />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={onClose} disabled={isProcessing}>Close</Button>

                            {appointment.status === 'scheduled' && onConfirm && onReject && (
                                <ActionButtons
                                    confirmLabel="Confirm"
                                    rejectLabel="Reject"
                                    confirmVariant="secondary"
                                    rejectVariant="primary"
                                    onConfirm={() => onConfirm(appointment.id, adminComment)}
                                    onReject={() => Promise.resolve(handleRejectClick('reject'))}
                                    disabled={isProcessing}
                                />
                            )}

                            {appointment.status === 'reschedule-pending' && onRescheduleApprove && onRescheduleReject && (
                                <ActionButtons
                                    confirmLabel="Approve Reschedule"
                                    rejectLabel="Reject Reschedule"
                                    confirmVariant="secondary"
                                    rejectVariant="primary"
                                    onConfirm={() => onRescheduleApprove(appointment.id)}
                                    onReject={() => onRescheduleReject(appointment.id)}
                                    disabled={isProcessing}
                                />
                            )}

                            {/* Only showing Cancel if onCancel is provided */}
                            {appointment.status === 'confirmed' && onCancel && (
                                <Button
                                    variant="destructive"
                                    className="bg-sro-primary text-white hover:bg-sro-primary/90"
                                    onClick={() => handleRejectClick('cancel')}
                                    disabled={isProcessing}
                                >
                                    Cancel Appointment
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reject/Cancel Reason Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (isProcessing) e.preventDefault(); }}>
                    <DialogHeader>
                        <DialogTitle>{actionType === 'cancel' ? 'Cancel Appointment' : 'Reject Appointment'}</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for {actionType === 'cancel' ? 'cancelling' : 'rejecting'} this appointment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={`Reason for ${actionType === 'cancel' ? 'cancellation' : 'rejection'}...`}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <div className="flex justify-end gap-2 w-full">
                            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isProcessing}>
                                Close
                            </Button>
                            <Button
                                variant={actionType === 'cancel' ? 'destructive' : 'default'} // Destructive for cancel (red), Default (Primary) for reject
                                className={actionType === 'cancel' ? '' : 'bg-red-600 hover:bg-red-700 text-white'}
                                onClick={handleRejectConfirm}
                                disabled={isProcessing}
                            >
                                {actionType === 'cancel' ? 'Cancel Appointment' : 'Reject Appointment'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AppointmentDetailsDialog;
