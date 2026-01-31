import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, LayoutGrid, Table as TableIcon } from "lucide-react";
import PropTypes from "prop-types";
import StatusPill from "@/components/ui/StatusPill";

/**
 * A reusable data table component with sorting, filtering, pagination, truncation support, and toggleable Card/Table view.
 *
 * @param {Object} props
 * @param {Array} columns - Column definitions
 * @param {Array} data - Array of row objects
 * @param {Function} onRowClick - Optional callback when a row is clicked
 * @param {string} emptyMessage - Message to display when no data
 * @param {string} className - Additional className for the card wrapper
 * @param {number} defaultPageSize - Default number of rows per page (default: 10)
 * @param {Array} pageSizeOptions - Options for rows per page dropdown (default: [10, 25, 50])
 */
const DataTable = ({
    columns = [],
    data = [],
    onRowClick,
    emptyMessage = "No data found.",
    className = "",
    defaultPageSize = 10,
    pageSizeOptions = [10, 25, 50],
}) => {
    // View Mode State (card vs table)
    const [viewMode, setViewMode] = useState("table");

    // Initialize view mode based on screen size
    useEffect(() => {
        const handleResize = () => {
            // Only auto-switch if user hasn't manually toggled?
            // Ideally we just check if it matches mobile break point on load.
            // For simplicity, let's just default to card on mobile, table on desktop initially.
            if (window.innerWidth < 768) {
                setViewMode("card");
            } else {
                setViewMode("table");
            }
        };

        // Run once on mount
        handleResize();

        // Optional: Listen to resize if we want auto-switching when resizing browser
        // window.addEventListener('resize', handleResize);
        // return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

    // Filter state
    const [filters, setFilters] = useState({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    // Handle sort click
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key) {
            if (sortConfig.direction === "asc") {
                direction = "desc";
            } else if (sortConfig.direction === "desc") {
                direction = null;
            }
        }
        setSortConfig({ key: direction ? key : null, direction });
        setCurrentPage(1); // Reset to first page on sort
    };

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
        setCurrentPage(1); // Reset to first page on filter
    };

    // Handle page size change
    const handlePageSizeChange = (newSize) => {
        setPageSize(Number(newSize));
        setCurrentPage(1); // Reset to first page
    };

    // Get sort icon for a column
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ChevronsUpDown className="h-3 w-3 opacity-50" />;
        }
        if (sortConfig.direction === "asc") {
            return <ChevronUp className="h-3 w-3 text-sro-primary" />;
        }
        return <ChevronDown className="h-3 w-3 text-sro-primary" />;
    };

    // Get "All X" label for a filter
    const getAllLabel = (column) => {
        if (column.filterLabel) {
            return `All ${column.filterLabel}`;
        }
        return `All ${column.header}`;
    };

    // Filter and sort data
    const filteredAndSortedData = useMemo(() => {
        let result = [...data];

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            const column = columns.find((col) => col.key === key);

            if (value && !value.startsWith("All")) {
                result = result.filter((row) => {
                    if (column?.filterAccessor) {
                        return column.filterAccessor(row) === value;
                    }
                    return row[key] === value;
                });
            }
        });

        // Apply sorting
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                const column = columns.find((col) => col.key === sortConfig.key);
                let aVal = column?.sortAccessor ? column.sortAccessor(a) : a[sortConfig.key];
                let bVal = column?.sortAccessor ? column.sortAccessor(b) : b[sortConfig.key];

                if (aVal == null) aVal = "";
                if (bVal == null) bVal = "";

                if (typeof aVal === "string" && typeof bVal === "string") {
                    return sortConfig.direction === "asc"
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                }

                if (sortConfig.direction === "asc") {
                    return aVal > bVal ? 1 : -1;
                }
                return aVal < bVal ? 1 : -1;
            });
        }

        return result;
    }, [data, filters, sortConfig, columns]);

    // Pagination calculations
    const totalItems = filteredAndSortedData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    // Get current page data
    const paginatedData = useMemo(() => {
        return filteredAndSortedData.slice(startIndex, endIndex);
    }, [filteredAndSortedData, startIndex, endIndex]);

    // Determine if pagination is needed
    const showPagination = totalItems > defaultPageSize;
    const showPageSizeDropdown = showPagination;

    // Check if any column has filters
    const hasFilters = columns.some((col) => col.filterable);

    // Render cell content
    const renderCell = (row, col) => {
        if (col.render) {
            return col.render(row);
        }

        if (col.isStatus) {
            const value = col.accessor ? col.accessor(row) : row[col.key];
            if (viewMode === "table") {
                return (
                    <div className="flex justify-center w-full">
                        <StatusPill status={value || "Unknown"} />
                    </div>
                );
            }
            return <StatusPill status={value || "Unknown"} />;
        }

        const value = row[col.key];
        return (
            <span className="truncate block" title={value}>
                {value}
            </span>
        );
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className={className}>
            {/* Controls Row: Filters + View Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                {/* Filters */}
                {hasFilters ? (
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start flex-1">
                        {columns
                            .filter((col) => col.filterable && col.filterOptions)
                            .map((col) => {
                                const allLabel = getAllLabel(col);
                                return (
                                    <UnifiedDropdown
                                        key={col.key}
                                        options={[allLabel, ...col.filterOptions]}
                                        value={filters[col.key] || allLabel}
                                        onChange={(value) => handleFilterChange(col.key, value)}
                                        placeholder={allLabel}
                                        searchable={col.filterOptions?.length > 5}
                                        searchPlaceholder={`Search ${(col.filterLabel || col.header).toLowerCase()}...`}
                                        className="w-full sm:w-48"
                                    />
                                );
                            })}
                    </div>
                ) : <div className="flex-1"></div>}

                {/* View Mode Toggle */}
                <div className="flex justify-center md:justify-end">
                    <div className="inline-flex rounded-md shadow-sm border bg-white p-1">
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-1.5 rounded flex items-center gap-1.5 text-sm font-medium transition-colors ${viewMode === "table"
                                ? "bg-gray-100 text-sro-primary"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                            title="Table View"
                        >
                            <TableIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Table</span>
                        </button>
                        <button
                            onClick={() => setViewMode("card")}
                            className={`p-1.5 rounded flex items-center gap-1.5 text-sm font-medium transition-colors ${viewMode === "card"
                                ? "bg-gray-100 text-sro-primary"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                            title="Card View"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            <span className="hidden sm:inline">Cards</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table View */}
            {viewMode === "table" && (
                <Card className="w-full shadow-sm border">
                    <CardContent className="p-0">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-sm table-fixed min-w-[1000px]">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        {columns.map((col) => (
                                            <th
                                                key={col.key}
                                                className={`px-4 py-3 text-xs font-semibold text-gray-600 text-center ${col.width || ""}`}
                                            >
                                                {col.sortable ? (
                                                    <button
                                                        onClick={() => handleSort(col.key)}
                                                        className="inline-flex items-center justify-center gap-1 hover:text-sro-primary transition-colors w-full"
                                                    >
                                                        <span>{col.header}</span>
                                                        {getSortIcon(col.key)}
                                                    </button>
                                                ) : (
                                                    <div className="w-full text-center">
                                                        {col.header}
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((row, rowIndex) => (
                                            <tr
                                                key={row.id || rowIndex}
                                                onClick={() => onRowClick?.(row)}
                                                className={`hover:bg-gray-50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                                            >
                                                {columns.map((col) => (
                                                    <td
                                                        key={col.key}
                                                        className={`px-4 py-3 text-sm text-center ${col.cellClassName || ""}`}
                                                    >
                                                        {renderCell(row, col)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={columns.length} className="py-8 text-center text-gray-500">
                                                {emptyMessage}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Card View */}
            {viewMode === "card" && (
                <div className="space-y-4">
                    {paginatedData.length > 0 ? (
                        paginatedData.map((row, rowIndex) => {
                            const actionCol = columns.find(col => col.key === 'actions');
                            const dataCols = columns.filter(col => col.key !== 'actions');

                            return (
                                <Card
                                    key={row.id || rowIndex}
                                    className={`shadow-sm border ${onRowClick ? "active:bg-gray-50" : ""}`}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    <CardContent className="p-4 space-y-3">
                                        {dataCols.map((col) => (
                                            <div key={col.key} className="flex justify-between items-start gap-4">
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[30%] shrink-0 pt-0.5">
                                                    {col.header}
                                                </span>
                                                <div className="text-sm text-right flex-1 text-gray-700 break-words min-w-0" title={row[col.key]}>
                                                    {renderCell(row, col)}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Actions Footer */}
                                        {actionCol && (
                                            <div className="pt-3 mt-3 border-t flex justify-end">
                                                {renderCell(row, actionCol)}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                            {emptyMessage}
                        </div>
                    )}
                </div>
            )}


            {/* Pagination Controls */}
            {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                    {/* Results count */}
                    <div className="text-sm text-gray-600">
                        Showing {startIndex + 1}-{endIndex} of {totalItems} {totalItems === 1 ? "item" : "items"}
                    </div>

                    {/* Pagination buttons */}
                    {showPagination && (
                        <div className="flex items-center gap-2">
                            {/* Rows per page dropdown */}
                            {showPageSizeDropdown && (
                                <div className="flex items-center gap-2 mr-4">
                                    <span className="text-sm text-gray-600">Rows:</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => handlePageSizeChange(e.target.value)}
                                        className="border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sro-primary/20"
                                    >
                                        {pageSizeOptions.map((size) => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Previous button */}
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {/* Page numbers */}
                            <div className="flex items-center gap-1">
                                {getPageNumbers().map((page, index) => (
                                    page === '...' ? (
                                        <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`min-w-[32px] h-8 px-2 rounded text-sm font-medium transition-colors ${currentPage === page
                                                ? "bg-sro-primary text-white"
                                                : "bg-white border hover:bg-gray-50"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                            </div>

                            {/* Next button */}
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

DataTable.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            header: PropTypes.string.isRequired,
            width: PropTypes.string,
            sortable: PropTypes.bool,
            filterable: PropTypes.bool,
            filterOptions: PropTypes.array,
            filterLabel: PropTypes.string,
            filterAccessor: PropTypes.func,
            sortAccessor: PropTypes.func,
            accessor: PropTypes.func,
            render: PropTypes.func,
            cellClassName: PropTypes.string,
            isStatus: PropTypes.bool,
        })
    ).isRequired,
    data: PropTypes.array.isRequired,
    onRowClick: PropTypes.func,
    emptyMessage: PropTypes.string,
    className: PropTypes.string,
    defaultPageSize: PropTypes.number,
    pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
};

export default DataTable;
