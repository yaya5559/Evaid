import { api } from "../context/AuthContext";

// payload types used by API helpers
export type AgentPayload = {
    id?: string;
    name: string;
    email: string;
    role?: string;
    org_id?: number;
    password?: string;
};

export type OrganizationPayload = {
    name: string;
    email?: string;
    phone_number?: string;
    region?: string;
    status?: string;
    seat_limit?: number;
    primary_contact?: string;
    notes?: string;
};

export type OrganizationListItem = {
    id: string;
    name: string;
    email?: string;
    phone_number?: string;
    status?: string;
    region?: string;
    seat_limit?: number;
    primary_contact?: string;
    notes?: string;
    updated_at?: string;
    open_cases?: number;
};

// shape returned by GET /evidence/cases
// used by the case-selection table on the upload page
export type CaseListItem = {
    id: string;
    title: string;
    status: string;
    assigned_agent: string | null;
    opened_on: string | null;
    last_update: string | null;
    evidence_count: number;
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

export const addAgent = async (agent: AgentPayload) => {
    try {
        const res = await api.post(`/RegisterAgent`, agent)
        return res.data
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to register agent";
        throw new Error(msg);
    }
}

export const addOrganization = async (organization: OrganizationPayload) => {
    try {
        const res = await api.post(`/Organization/Add`, organization, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        });
        return res.data;
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to add organization";
        throw new Error(msg);
    }
};

export const getOrganizations = async () => {
    try {
        const res = await api.get(`/Organization`, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        });
        const payload = res.data as
            | OrganizationListItem[]
            | { data?: OrganizationListItem[]; organizations?: OrganizationListItem[] };

        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.organizations)) return payload.organizations;

        throw new Error("Organization list response has an invalid format.");
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to load organizations";
        throw new Error(msg);
    }
};

type OrganizationUpdatePayload = {
    name: string;
    email: string;
    phone_number: string;
    region: string;
    status: string;
    seat_limit: number;
    primary_contact: string;
    notes: string;
};

export const editOrganization = async (
    organizationId: string,
    organization: OrganizationUpdatePayload
) => {
    try {
        const res = await api.put(`/Organization/${organizationId}`, organization, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        });
        return res.data;
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to edit organization";
        throw new Error(msg);
    }
};

// fetches real cases from GET /evidence/cases so the upload page can show
// a table of valid cases instead of hardcoded dummy data
// pass orgId to filter by org (org admins / agents), omit for admin view-all
export const getCases = async (orgId?: string): Promise<CaseListItem[]> => {
    try {
        const res = await api.get(`/evidence/cases`, {
            params: orgId ? { org_id: orgId } : {},
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        });
        const payload = res.data;
        if (Array.isArray(payload)) return payload;
        throw new Error("Cases response has an invalid format.");
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to load cases";
        throw new Error(msg);
    }
};

export const uploadEvidence = async (caseId: string, file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('case_id', caseId); // Ensure this is lowercase to match backend

        // don't set Content-Type manually � axios needs to set it so the
        // multipart boundary gets included correctly
        const res = await api.post(`/evidence/upload`, formData, {
            withCredentials: true,
        });

        return res.data;
    } catch (err: unknown) { // Change 'any' to 'unknown'
        // We cast it to a generic object locally to access the message
        // FastAPI returns errors in 'detail' not 'message' so check both
        const error = err as { response?: { data?: { detail?: string; message?: string } } };
        const msg = error.response?.data?.detail || error.response?.data?.message || "Upload failed";
        throw new Error(msg);
    }
};
