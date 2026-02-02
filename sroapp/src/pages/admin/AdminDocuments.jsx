import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FolderOpen, ExternalLink, RefreshCw, FileText, AlertCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api-config';
import LoadingSpinner from '@/components/ui/loading-spinner';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

// Define the hardcoded list of forms required by the system
const REQUIRED_FORMS = [
    {
        id: 'form_a',
        filename: 'Form_A',
        title: 'Form A: Application for Student Organization Recognition',
        category: 'Recognition Application'
    },
    {
        id: 'form_b1',
        filename: 'Form_B1',
        title: 'Form B1: Officer Roster',
        category: 'Recognition Application'
    },
    {
        id: 'form_b2',
        filename: 'Form_B2',
        title: 'Form B2: Member Roster',
        category: 'Recognition Application'
    },
    {
        id: 'form_c',
        filename: 'Form_C',
        title: 'Form C: Officer Data',
        category: 'Recognition Application'
    },
    {
        id: 'form_e',
        filename: 'Form_E',
        title: 'Form E: Proposed Activities',
        category: 'Recognition Application'
    },
    {
        id: 'form_d',
        filename: 'Form_D',
        title: 'Form D: Report on Past Activities',
        category: 'Annual Report'
    },
    {
        id: 'form_f',
        filename: 'Form_F',
        title: 'Form F: Financial Report',
        category: 'Annual Report'
    },
    {
        id: 'form_1b',
        filename: 'Form_1B',
        title: 'Form 1B: Student Activity Approval Slip',
        category: 'Student Activities'
    }
];

const AdminDocuments = () => {
    const [loading, setLoading] = useState(false);
    const [publicForms, setPublicForms] = useState({ folderId: null, files: [] });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_BASE_URL}/api/documents/forms`, { headers });
            setPublicForms(res.data);

        } catch (error) {
            console.error('Fetch error:', error);
            toast.error("Failed to load forms");
        } finally {
            setLoading(false);
        }
    };

    const openDrive = (url) => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            toast.error("File link not available");
        }
    };

    // Helper to find the matching file in the fetched list
    const getFileForForm = (formDef) => {
        return publicForms.files.find(f =>
            f.name.toLowerCase().includes(formDef.filename.toLowerCase())
        );
    };

    if (loading && !publicForms.files.length) {
        return <LoadingSpinner text="Loading forms..." variant="section" />;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-[1700px]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="page-header text-sro-primary mb-1">Student Forms</h1>
                </div>

                <div className="flex items-center gap-2">
                    {publicForms.folderId && (
                        <Button
                            onClick={() => openDrive(`https://drive.google.com/drive/u/0/folders/${publicForms.folderId}`)}
                            variant="outline"
                            className="h-10 border-gray-200 hover:bg-gray-50 text-gray-700 gap-2 font-medium"
                        >
                            <FolderOpen className="w-4 h-4 text-sro-primary" />
                            <span>Manage in Drive</span>
                        </Button>
                    )}

                    <Button
                        onClick={fetchData}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-gray-500 hover:text-sro-primary"
                        title="Refresh List"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {REQUIRED_FORMS.map(form => {
                    const file = getFileForForm(form);
                    const isMissing = !file;

                    // Check if file is NOT a Google Doc (e.g., is a Word doc)
                    const isWordDoc = file && (
                        file.mimeType?.includes('word') ||
                        file.mimeType?.includes('officedocument')
                    );

                    return (
                        <div
                            key={form.id}
                            className={`group bg-white rounded-xl border shadow-sm transition-all duration-300 overflow-hidden flex flex-col h-full ${isMissing ? 'border-red-100' : 'border-gray-200 hover:shadow-md hover:border-sro-primary/30'
                                }`}
                        >
                            {/* Card Image Area */}
                            <div className={`relative h-48 flex items-center justify-center overflow-hidden border-b transition-colors ${isMissing ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-100 group-hover:bg-gray-100'
                                }`}>
                                {file && file.thumbnail ? (
                                    <img
                                        src={file.thumbnail}
                                        alt={form.title}
                                        className="object-contain h-full w-full p-6 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        {isMissing ? (
                                            <AlertCircle className="w-12 h-12 text-sro-primary/50" />
                                        ) : (
                                            <FileText className="w-16 h-16 group-hover:text-sro-primary transition-colors" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className="p-5 flex flex-col flex-grow relative">
                                {/* Title */}
                                <h3
                                    className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-sro-primary transition-colors h-[2.5rem]"
                                    title={form.title}
                                >
                                    {form.title}
                                </h3>

                                {/* Filename & Metadata */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-mono text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded">
                                            {form.filename}
                                        </p>
                                        {isWordDoc && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium" title="Convert to Google Doc for best compatibility">
                                                <AlertTriangle className="w-3 h-3" />
                                                WORD DOC
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">
                                        Used in: <span className="text-gray-600">{form.category}</span>
                                    </p>
                                </div>

                                {/* Footer Action */}
                                <div className="mt-auto flex items-center justify-end pt-4 border-t border-gray-50">
                                    {isMissing ? (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-sro-primary text-white tracking-wide uppercase">
                                            Missing
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 tracking-wide uppercase">
                                            Uploaded
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminDocuments;
