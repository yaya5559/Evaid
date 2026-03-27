import { api } from "../context/AuthContext";

export type CaseListItem = {
    case_id: number
    CaseNumber: string
    title: string
    description: string
    created_at: string
    org_id: string
    created_by_user_id: number
    status: string
    priority: string
    severity_level: string
    due_date: string
    closed_at: string
    resolution: string
    closed_by_user_id: number
};



export const loginUser = async (email: string, password: string) => {
    try {
        const response = await api.post(
            `/auth/login`,
            { email, password }, // request body
        );
        return response.data.accessToken ?? response.data.access_token;
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to login";
        throw new Error(msg);
    }
};


export const getCases = async () => {
    try {
        const res = await api.get(`/admin/cases`, {
            headers: { "Content-Type": "application/json"},
            withCredentials: true,
        });
        const payload =  res.data as 
            | CaseListItem[]
            | { data?: CaseListItem; cases?: CaseListItem};

        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.cases)) return payload.cases;

        throw new Error("Case list response has an invalid format.");
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Unable to load cases";
        throw new Error(msg);
    }
};

// accept caseId + File separately and build FormData here
export const uploadEvidence = async (caseId: number, file: File, description:string, title:string, evidence_type:string) => {
    try {
        const formData = new FormData();
        // case_id must match the Form(...) field name in evidence.py
        formData.append("case_id", String(caseId));
        formData.append("description", description)
        formData.append("title", title)
        formData.append("evidence_type", evidence_type)
        // file must match the File(...) field name in evidence.py
        formData.append("file", file);

        // let the browser set the content-type automatically
        // so the multipart boundary is included correctly in the header.
        const res = await api.post("/evidence/upload", formData);
        return res.data;
    } catch (err: any) {
        throw new Error(err.response?.data?.detail || "Upload failed");
    }
};
