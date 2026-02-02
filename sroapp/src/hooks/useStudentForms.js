import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api-config';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

// Define the hardcoded list of forms required by the system
export const REQUIRED_FORMS = [
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

export const useStudentForms = () => {
    const [loading, setLoading] = useState(false);
    const [publicForms, setPublicForms] = useState({ folderId: null, files: [] });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                const headers = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const res = await axios.get(`${API_BASE_URL}/api/documents/forms`, { headers });
                setPublicForms(res.data);
                setError(null);
            } catch (err) {
                console.error('Fetch error:', err);
                setError(err);
                // Toast logic can be handled by consumer or here. 
                // Opting to not toast here to avoid duplicates if multiple components mount.
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getFileForForm = (formDef) => {
        if (!publicForms.files) return null;
        return publicForms.files.find(f =>
            f.name.toLowerCase().includes(formDef.filename.toLowerCase())
        );
    };

    const getFormLink = (formId) => {
        const formDef = REQUIRED_FORMS.find(f => f.id === formId);
        if (!formDef) return null;
        const file = getFileForForm(formDef);
        return file ? (file.link || file.webViewLink || file.alternateLink) : null;
    };

    return {
        loading,
        publicForms,
        error,
        getFileForForm,
        getFormLink,
        REQUIRED_FORMS // Export it here as well for convenience
    };
};
