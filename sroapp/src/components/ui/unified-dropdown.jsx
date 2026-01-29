import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UnifiedDropdown - A unified dropdown component based on the Popover design
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of options. Can be strings or objects with {value, label} or custom objects
 * @param {string} props.value - Currently selected value
 * @param {function} props.onChange - Callback when value changes: (value) => void
 * @param {function} props.onSelect - Optional callback with full option object: (option) => void. If provided, use this for complex selection logic.
 * @param {string} props.placeholder - Placeholder text when no value selected
 * @param {boolean} props.searchable - Whether to show search input (default: false)
 * @param {string} props.searchPlaceholder - Placeholder for search input
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.error - Show error styling
 * @param {string} props.className - Additional classes for trigger
 * @param {string} props.contentClassName - Additional classes for content
 * @param {string} props.valueKey - Key to use for value in option objects (default: 'value')
 * @param {string} props.labelKey - Key to use for label in option objects (default: 'label')
 */
function UnifiedDropdown({
    options = [],
    value,
    onChange,
    onSelect,
    placeholder = "Select an option...",
    searchable = false,
    searchPlaceholder = "Search...",
    disabled = false,
    error = false,
    className,
    contentClassName,
    valueKey = "value",
    labelKey = "label",
}) {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    // Normalize options to always have value and label keys
    const normalizedOptions = React.useMemo(() => {
        return options.map((opt) => {
            if (typeof opt === "string") {
                return { [valueKey]: opt, [labelKey]: opt, _original: opt };
            }
            return { ...opt, _original: opt };
        });
    }, [options, valueKey, labelKey]);

    // Filter options based on search term
    const filteredOptions = React.useMemo(() => {
        if (!searchable || !searchTerm.trim()) {
            return normalizedOptions;
        }
        return normalizedOptions.filter((opt) =>
            String(opt[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [normalizedOptions, searchTerm, searchable, labelKey]);

    // Get display label for current value
    const displayLabel = React.useMemo(() => {
        const selected = normalizedOptions.find((opt) => opt[valueKey] === value);
        return selected?.[labelKey] || "";
    }, [normalizedOptions, value, valueKey, labelKey]);

    const handleSelect = (option) => {
        if (onSelect) {
            // Use onSelect for complex selection logic (e.g., setting multiple state values)
            onSelect(option._original);
        } else {
            onChange?.(option[valueKey]);
        }
        setSearchTerm("");
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={disabled}>
                <div
                    role="combobox"
                    aria-expanded={open}
                    aria-disabled={disabled}
                    className={cn(
                        "w-full flex items-center justify-between border border-input bg-transparent rounded-md px-3 py-2 text-sm shadow-sm transition-colors cursor-pointer",
                        "focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400",
                        disabled && "opacity-50 cursor-not-allowed",
                        error && "border-sro-primary bg-red-50",
                        className
                    )}
                >
                    <span className={cn(!displayLabel && "text-muted-foreground")}>
                        {displayLabel || placeholder}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
            </PopoverTrigger>

            <PopoverContent align="start" className={cn("w-full max-w-md p-0", contentClassName)}>
                {searchable && (
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                    />
                )}
                <div className="max-h-48 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <button
                                key={opt[valueKey]}
                                type="button"
                                onClick={() => handleSelect(opt)}
                                disabled={disabled}
                                className={cn(
                                    "w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors",
                                    value === opt[valueKey] && "bg-gray-100 font-medium"
                                )}
                            >
                                {opt[labelKey]}
                                {value === opt[valueKey] && (
                                    <Check className="ml-2 inline h-4 w-4 text-green-600" />
                                )}
                            </button>
                        ))
                    ) : (
                        <p className="px-4 py-2 text-sm text-muted-foreground">No results found</p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export { UnifiedDropdown };
