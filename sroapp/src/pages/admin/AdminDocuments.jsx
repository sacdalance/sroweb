import React, { useState, useEffect } from 'react';
import ActionButtons from "@/components/ui/ActionButtons";
import { Button } from "@/components/ui/button";
import { FolderOpen, RefreshCw, FileText, AlertCircle, AlertTriangle, UserPlus, Trash2, Shield, Mail, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DataTable from "@/components/ui/DataTable";
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api-config';
import LoadingSpinner from '@/components/ui/loading-spinner';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import { useStudentForms, REQUIRED_FORMS } from '@/hooks/useStudentForms';

const AdminDocuments = () => {
    const { loading, publicForms, getFileForForm } = useStudentForms();
    const [permissions, setPermissions] = useState([]);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [activeTab, setActiveTab] = useState("forms");

    useEffect(() => {
        if (activeTab === 'settings') {
            fetchPermissions();
        }
    }, [activeTab]);

    const fetchPermissions = async () => {
        try {
            setLoadingPermissions(true);
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            const res = await axios.get(`${API_BASE_URL}/api/documents/permissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPermissions(res.data.permissions || []);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error("Failed to load permissions");
        } finally {
            setLoadingPermissions(false);
        }
    };

    const handleAddPermission = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            throw new Error("Please enter a valid email");
        }

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        await axios.post(`${API_BASE_URL}/api/documents/permissions`, { email: newEmail }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    };

    const handleRemovePermission = async (permissionId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            await axios.delete(`${API_BASE_URL}/api/documents/permissions/${permissionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Access revoked");
            fetchPermissions();
        } catch (error) {
            console.error('Error removing permission:', error);
            toast.error("Failed to remove editor");
        }
    };

    const openDrive = (url) => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            toast.error("File link not available");
        }
    };

    const columns = [
        {
            key: 'avatar',
            header: <div className="text-center">Profile</div>,
            width: 'w-[50px]',
            render: (row) => (
                <div className="flex items-center justify-center">
                    {row.photoLink ? (
                        <img src={row.photoLink} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-sro-primary/10 text-sro-primary flex items-center justify-center text-xs font-bold ring-2 ring-white">
                            {row.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'username',
            header: <div className="w-full text-center">Username</div>,
            width: 'w-[30%]',
            render: (row) => (
                <div className="flex justify-center w-full">
                    <span
                        className="font-medium text-gray-900 truncate block max-w-[200px] text-center"
                        title={row.displayName || 'None'}
                    >
                        {row.displayName || 'None'}
                    </span>
                </div>
            )
        },
        {
            key: 'emailAddress',
            header: <div className="w-full text-center">Email Address</div>,
            width: 'w-[40%]',
            render: (row) => (
                <div className="flex justify-center w-full">
                    <span
                        className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200 truncate block max-w-[300px] text-center"
                        title={row.emailAddress || 'None'}
                    >
                        {row.emailAddress || 'None'}
                    </span>
                </div>
            )
        },
        {
            key: 'actions',
            header: <div className="text-center">Actions</div>,
            width: 'w-[10%]',
            render: (row) => {
                const isServiceAccount = row.emailAddress?.includes('gserviceaccount.com');
                const isPublic = row.type === 'anyone' || !row.emailAddress;
                const isOwner = row.role === 'owner';
                const isProtectedUser = row.emailAddress === 'srotest128@gmail.com';

                if (isOwner || isServiceAccount || isPublic || isProtectedUser) return null;

                return (
                    <div className="flex justify-center">
                        <button
                            onClick={() => handleRemovePermission(row.id)}
                            className="p-1.5 text-gray-500 hover:text-sro-primary transition-colors rounded hover:bg-gray-100"
                            title="Revoke Access"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            }
        }
    ];

    if (loading && !publicForms.files?.length && activeTab === 'forms') {
        return <LoadingSpinner text="Loading forms..." variant="section" />;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-[1700px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="forms">Forms List</TabsTrigger>
                    <TabsTrigger value="settings">Access Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="forms">
                    {/* Grid Content */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {REQUIRED_FORMS.map(form => {
                            const file = getFileForForm(form);
                            const isMissing = !file;
                            const isWordDoc = file && (file.mimeType?.includes('word') || file.mimeType?.includes('officedocument'));

                            return (
                                <div key={form.id} className={`group bg-white rounded-xl border shadow-sm transition-all duration-300 overflow-hidden flex flex-col h-full ${isMissing ? 'border-red-100' : 'border-gray-200 hover:shadow-md hover:border-sro-primary/30'}`}>
                                    <div className={`relative h-48 flex items-center justify-center overflow-hidden border-b transition-colors ${isMissing ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-100 group-hover:bg-gray-100'}`}>
                                        {file && file.thumbnail ? (
                                            <img src={file.thumbnail} alt={form.title} className="object-contain h-full w-full p-6 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                {isMissing ? <AlertCircle className="w-12 h-12 text-sro-primary/50" /> : <FileText className="w-16 h-16 group-hover:text-sro-primary transition-colors" />}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex flex-col flex-grow relative">
                                        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-sro-primary transition-colors h-[2.5rem]" title={form.title}>{form.title}</h3>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-mono text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded">{form.filename}</p>
                                                {isWordDoc && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium" title="Convert to Google Doc"><AlertTriangle className="w-3 h-3" /> WORD DOC</span>}
                                            </div>
                                            <p className="text-xs text-gray-400 font-medium">Used in: <span className="text-gray-600">{form.category}</span></p>
                                        </div>
                                        <div className="mt-auto flex items-center justify-end pt-4 border-t border-gray-50">
                                            {isMissing ? <span className="text-[10px] font-bold px-2 py-1 rounded bg-sro-primary text-white tracking-wide uppercase">Missing</span> : <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 tracking-wide uppercase">Uploaded</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Folder Access Control</CardTitle>
                            <CardDescription>Manage who has write access to the Public Forms folder. By default, this folder is view-only for everyone.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Add User Section */}
                            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex-1 space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <UserPlus className="w-4 h-4 text-sro-primary" />
                                        Add Editor
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="example@gmail.com"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className="bg-white"
                                        />
                                        <ActionButtons
                                            confirmLabel="Grant Access"
                                            confirmVariant="primary"
                                            onConfirm={handleAddPermission}
                                            onSuccess={() => {
                                                setNewEmail("");
                                                fetchPermissions();
                                            }}
                                            confirmSuccessMessage="Editor added successfully"
                                            disabled={!newEmail}
                                            className="justify-start"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">This user will be able to edit files in the generic forms folder.</p>
                                </div>
                            </div>

                            {/* List Permissions */}
                            <div className="mt-4">
                                <DataTable
                                    columns={columns}
                                    data={permissions}
                                    loading={loadingPermissions}
                                    emptyMessage="No editors found. The folder is View Only."
                                    hidePagination={true}
                                    viewMode="table"
                                    hideViewToggle={true}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminDocuments;
