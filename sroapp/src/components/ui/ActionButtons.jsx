import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast } from "sonner";

/**
 * ActionButtons - A unified component for Confirm/Reject actions with loading states and toast handling.
 * 
 * @param {string} confirmLabel - Label for the confirm button (default: "Confirm")
 * @param {string} rejectLabel - Label for the reject button (default: "Reject")
 * @param {string} confirmVariant - Variant for confirm button (default: "default")
 * @param {string} rejectVariant - Variant for reject button (default: "destructive")
 * @param {function} onConfirm - Async function to execute on confirm
 * @param {function} onReject - Async function to execute on reject
 * @param {string} confirmSuccessMessage - Toast message on successful confirm
 * @param {string} rejectSuccessMessage - Toast message on successful reject
 * @param {function} onSuccess - Callback function triggered after successful action and toast
 * @param {string} className - Additional classes
 */
const ActionButtons = ({
    confirmLabel = "Confirm",
    rejectLabel = "Reject",
    confirmVariant = "secondary", // Defaulting to secondary (often green/blue in this app context) or default
    rejectVariant = "primary",  // Defaulting to primary (often red/destructive in this app context)
    onConfirm,
    onReject,
    confirmSuccessMessage = "Action completed successfully",
    rejectSuccessMessage = "Action rejected successfully",
    onSuccess,
    className = "",
    keepDialogOpen = false, // If true, onSuccess won't be called immediately? No, onSuccess handles closing.
    disabled = false
}) => {
    const [loadingAction, setLoadingAction] = useState(null); // 'confirm' | 'reject' | null

    const handleAction = async (actionType) => {
        const isConfirm = actionType === 'confirm';
        const actionFn = isConfirm ? onConfirm : onReject;
        const successMessage = isConfirm ? confirmSuccessMessage : rejectSuccessMessage;

        if (!actionFn) return;

        try {
            setLoadingAction(actionType);

            // Execute the async action
            await actionFn();

            // Show success toast if message is provided
            if (successMessage) {
                toast.success(successMessage);
            }

            // Trigger success callback (e.g., close dialog, refresh list)
            if (onSuccess) {
                onSuccess();
            }

        } catch (error) {
            console.error(`Error during ${actionType} action:`, error);
            toast.error(error.message || `Failed to ${actionType} action`);
        } finally {
            // Small delay to ensure UI doesn't flash if dialog closes immediately
            if (!onSuccess) { // If we aren't closing, reset loading
                setLoadingAction(null);
            }
            // If we ARE closing (onSuccess called), the component might unmount, so updating state is fine or ignored.
            // But purely, we should reset.
            setLoadingAction(null);
        }
    };

    return (
        <div className={`flex justify-end gap-3 ${className}`}>
            {onReject && (
                <Button
                    variant={rejectVariant === 'primary' ? 'default' : rejectVariant} // Mapping 'primary' string to default/destructive if needed, but assuming shadcn variants
                    className={rejectVariant === 'primary' ? 'bg-sro-primary text-white hover:bg-sro-primary/90' : ''} // Custom styling for SRO primary
                    onClick={() => handleAction('reject')}
                    disabled={loadingAction !== null || disabled}
                >
                    {loadingAction === 'reject' ? (
                        <div className="flex items-center">
                            <LoadingSpinner className="h-4 w-4 mr-2" variant="inline" text="" />
                            <span>Processing...</span>
                        </div>
                    ) : (
                        rejectLabel
                    )}
                </Button>
            )}

            {onConfirm && (
                <Button
                    variant={confirmVariant === 'secondary' ? 'secondary' : confirmVariant === 'primary' ? 'default' : confirmVariant}
                    className={
                        confirmVariant === 'secondary' ? 'bg-sro-secondary text-white hover:bg-sro-secondary/90' :
                            confirmVariant === 'primary' ? 'bg-sro-primary text-white hover:bg-sro-primary/90' : ''
                    } // Custom styling for SRO secondary
                    onClick={() => handleAction('confirm')}
                    disabled={loadingAction !== null || disabled}
                >
                    {loadingAction === 'confirm' ? (
                        <div className="flex items-center">
                            <LoadingSpinner className="h-4 w-4 mr-2" variant="inline" text="" />
                            <span>Processing...</span>
                        </div>
                    ) : (
                        confirmLabel
                    )}
                </Button>
            )}
        </div>
    );
};

export default ActionButtons;
