import { api } from "../../context/AuthContext";

type OrganizationPayload = {
    company_name: string;
    company_email: string;
    company_phone_number: string;
    owner_first_name: string;
    owner_last_name: string;
    owner_email: string;
    owner_phone_number: string;
    password: string;
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


export type OrganizationListItem = {
    org_id: string | number;
    companyName: string;
    companyEmail?: string;
    companyPhoneNumber?: string;
    status?: string;
    description?: string;
    updatedAt?: string;
    user_count?: number;
    case_count?: number;
    // legacy aliases kept for compatibility
    id?: string;
    name?: string;
    // camelCase owner fields
    ownerFirstName?: string;
    ownerLastName?: string;
    ownerEmail?: string;
    ownerPhoneNumber?: string;
    // snake_case aliases from older API responses
    company_name?: string;
    company_email?: string;
    company_phone_number?: string;
    owner_first_name?: string;
    owner_last_name?: string;
    owner_email?: string;
    owner_phone_number?: string;
    updated_at?: string;
};

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

export const editOrganization = async (
    organizationId: string,
    organization: OrganizationUpdatePayload | Record<string, unknown>
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

export const disableOrganization = async (orgName: string) => {
    try {
        const res = await api.patch(`/Organization/${encodeURIComponent(orgName)}/disable`, null, {
            withCredentials: true,
        });
        return res.data;
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? "Unable to disable organization");
    }
};

export const enableOrganization = async (orgName: string) => {
    try {
        const res = await api.patch(`/Organization/${encodeURIComponent(orgName)}/enable`, null, {
            withCredentials: true,
        });
        return res.data;
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? "Unable to enable organization");
    }
};

export const deleteOrganization = async (orgName: string) => {
    try {
        const res = await api.delete(`/Organization/${encodeURIComponent(orgName)}`, {
            withCredentials: true,
        });
        return res.data;
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? "Unable to delete organization");
    }
};
