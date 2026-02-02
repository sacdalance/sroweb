import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FolderOpen, ExternalLink, RefreshCw, FileText, Download } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api-config';
import LoadingSpinner from '@/components/ui/loading-spinner';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

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

            // Filter specific files as requested: exclude Constitution and Bylaws (case insensitive)
            const filteredFiles = (res.data.files || []).filter(file => {
                const name = file.name.toLowerCase();
                return !name.includes('constitution') && !name.includes('bylaws');
            });

            setPublicForms({ ...res.data, files: filteredFiles });

        } catch (error) {
            console.error('Fetch error:', error);
            toast.error("Failed to load forms");
        } finally {
            setLoading(false);
        }
    };

    const openDrive = (url) => {
        if (url) window.open(url, '_blank');
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
                    <p className="text-sm text-gray-500">Manage downloadable resources available to students.</p>
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
            {publicForms.files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                    <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-900">No Forms Found</p>
                    <p className="max-w-sm mt-1 mb-6 text-sm">
                        Upload PDF files to the "Public Forms" folder in Google Drive to make them available here.
                    </p>
                    {publicForms.folderId && (
                        <Button variant="outline" onClick={() => openDrive(`https://drive.google.com/drive/u/0/folders/${publicForms.folderId}`)}>
                            Open Drive Folder
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {publicForms.files.map(file => (
                        <div
                            key={file.id}
                            className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-sro-secondary/30 transition-all duration-300 overflow-hidden flex flex-col h-full"
                        >
                            {/* Card Image Area */}
                            <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100 group-hover:bg-gray-100 transition-colors">
                                {file.thumbnail ? (
                                    <img
                                        src={file.thumbnail}
                                        alt={file.name}
                                        className="object-contain h-full w-full p-6 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <FileText className="w-16 h-16 text-gray-400 group-hover:text-sro-primary transition-colors" />
                                )}

                                {/* Overlay Button */}
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                    <Button
                                        size="sm"
                                        className="bg-white text-sro-primary hover:bg-sro-primary hover:text-white shadow-sm font-semibold rounded-full px-6"
                                        onClick={() => openDrive(file.webViewLink)}
                                    >
                                        View File
                                    </Button>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-5 flex flex-col flex-grow">
                                <h3
                                    className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-sro-primary transition-colors h-[2.5rem]"
                                    title={file.name}
                                >
                                    {file.name.replace(/\.[^/.]+$/, "")}
                                </h3>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        {file.mimeType?.includes('pdf') ? 'PDF Document' : 'File'}
                                    </span>

                                    <button
                                        onClick={() => openDrive(file.webContentLink)}
                                        className="text-xs font-semibold text-sro-secondary hover:text-sro-secondary/80 flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminDocuments;
