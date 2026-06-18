import React, { useId, useState, useRef } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Unified drag and drop file uploader component
 * 
 * @param {Object} props
 * @param {File[]} props.files - Currently selected files
 * @param {(files: File[]) => void} props.onFilesChange - Callback when files change
 * @param {number} [props.maxFiles=1] - Maximum number of files allowed
 * @param {string} [props.accept=".pdf"] - Accepted file types (e.g., ".pdf", ".pdf,.docx")
 * @param {boolean} [props.disabled=false] - Disable all interactions
 * @param {boolean} [props.error=false] - Show error state styling
 * @param {string} [props.dropText] - Custom text when dragging over
 * @param {string} [props.idleText] - Custom text when idle
 * @param {string} [props.disabledText] - Custom text when disabled
 * @param {string} [props.className] - Additional CSS classes for the container
 */
const FileDropzone = ({
    files = [],
    onFilesChange,
    maxFiles = 1,
    accept = ".pdf",
    disabled = false,
    error = false,
    dropText,
    idleText,
    disabledText,
    className,
}) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const inputId = useId();

    // Determine if dropzone should be fully disabled
    const isAtMaxFiles = files.length >= maxFiles;
    const isDisabled = disabled || isAtMaxFiles;

    // Get accepted MIME types for validation
    const getAcceptedMimeTypes = () => {
        const mimeMap = {
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
        };
        return accept.split(",").map(ext => mimeMap[ext.trim()] || ext.trim());
    };

    // Validate file type
    const isValidFileType = (file) => {
        const acceptedMimeTypes = getAcceptedMimeTypes();
        return acceptedMimeTypes.some(mime =>
            file.type === mime || accept.includes(file.name.split('.').pop().toLowerCase())
        );
    };

    // Handle file selection (both drag-drop and click)
    const handleFiles = (incomingFiles) => {
        if (isDisabled) return;

        const fileArray = Array.from(incomingFiles);
        const validFiles = fileArray.filter(file => {
            if (!isValidFileType(file)) {
                toast.error(`Invalid file type: ${file.name}. Only ${accept} files are allowed.`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        // Check if adding files would exceed max
        const totalFiles = files.length + validFiles.length;
        if (totalFiles > maxFiles) {
            if (maxFiles === 1) {
                // Single file mode - replace the existing file
                onFilesChange([validFiles[0]]);
            } else {
                toast.error(`You can only upload up to ${maxFiles} files.`);
                // Only add files up to the limit
                const slotsAvailable = maxFiles - files.length;
                if (slotsAvailable > 0) {
                    onFilesChange([...files, ...validFiles.slice(0, slotsAvailable)]);
                }
            }
            return;
        }

        onFilesChange([...files, ...validFiles]);
    };

    // Handle file removal
    const handleRemoveFile = (index) => {
        if (disabled) return;
        const newFiles = files.filter((_, i) => i !== index);
        onFilesChange(newFiles);
        // Reset the file input so the same file can be re-selected
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };

    // Drag event handlers
    const handleDragOver = (e) => {
        if (isDisabled) return;
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        if (isDisabled) return;
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (e) => {
        if (isDisabled) return;
        e.preventDefault();
        setIsDragActive(false);
        handleFiles(e.dataTransfer.files);
    };

    // Click handler for file input
    const handleInputChange = (e) => {
        if (isDisabled) return;
        handleFiles(e.target.files);
    };

    // Generate display text
    const getDisplayText = () => {
        if (isDisabled) {
            return disabledText || "You cannot upload or drag files after completion.";
        }
        if (isDragActive) {
            return dropText || "Drop the file here";
        }
        const fileWord = maxFiles === 1 ? "File" : "Files";
        return idleText || `Drag and Drop or Click to Upload ${fileWord} (${maxFiles} required)`;
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Dropzone Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "border-2 border-dashed p-4 rounded-md text-center transition-colors",
                    isDisabled
                        ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                        : isDragActive
                            ? "border-green-600 bg-green-50"
                            : error
                                ? "border-sro-primary bg-red-50 hover:border-sro-primary"
                                : "border-gray-300 hover:border-gray-400 hover:bg-muted"
                )}
                style={{ pointerEvents: isDisabled ? "none" : "auto" }}
            >
                <label
                    htmlFor={inputId}
                    className={cn(
                        "cursor-pointer flex flex-col items-center",
                        isDisabled && "cursor-not-allowed opacity-70"
                    )}
                >
                    <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-center">{getDisplayText()}</p>
                    <input
                        ref={fileInputRef}
                        id={inputId}
                        type="file"
                        accept={accept}
                        multiple={maxFiles > 1}
                        onChange={handleInputChange}
                        className="hidden"
                        disabled={isDisabled}
                    />
                </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium mb-1">
                        {maxFiles === 1 ? "Selected File" : `Selected Files (${files.length}/${maxFiles})`}
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                        {files.map((file, idx) => (
                            <li
                                key={idx}
                                className="flex items-center justify-between bg-muted px-3 py-2 rounded-md"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                    <span className="truncate max-w-[240px]">{file.name}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(idx)}
                                    className={cn(
                                        "text-muted-foreground hover:text-red-600",
                                        disabled && "cursor-not-allowed opacity-50"
                                    )}
                                    disabled={disabled}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FileDropzone;
