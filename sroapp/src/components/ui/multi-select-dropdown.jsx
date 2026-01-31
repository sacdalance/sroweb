import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronDown, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MultiSelectDropdown - A dropdown for selecting multiple options
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of options {value, label}
 * @param {Array} props.selected - Array of selected values
 * @param {function} props.onChange - Callback with new array of selected values
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional classes
 */
export function MultiSelectDropdown({
    options = [],
    selected = [],
    onChange,
    placeholder = "Select items...",
    className,
}) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (value) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const selectedLabels = selected.map(
        (val) => options.find((opt) => opt.value === val)?.label || val
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full flex items-center justify-between border border-input bg-transparent rounded-md px-3 py-2 text-sm shadow-sm transition-colors cursor-pointer min-h-[2.5rem]",
                        "focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400",
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1 mr-2 overflow-hidden">
                        {selected.length === 0 && (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        {selected.length > 0 && selected.length <= 2 && (
                            selectedLabels.map((label, i) => (
                                <Badge key={i} variant="secondary" className="mr-1 mb-0.5 px-1.5 py-0 h-5 text-[10px] sm:text-xs font-normal">
                                    {label}
                                </Badge>
                            ))
                        )}
                        {selected.length > 2 && (
                            <Badge variant="secondary" className="mr-1 mb-0.5 px-1.5 py-0 h-5 text-[10px] sm:text-xs">
                                {selected.length} selected
                            </Badge>
                        )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandGroup className="max-h-64 overflow-auto">
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                onSelect={() => handleSelect(option.value)}
                                className="cursor-pointer"
                            >
                                <div
                                    className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        selected.includes(option.value)
                                            ? "bg-primary text-primary-foreground"
                                            : "opacity-50 [&_svg]:invisible"
                                    )}
                                >
                                    <Check className={cn("h-3 w-3")} />
                                </div>
                                <span>{option.label}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
