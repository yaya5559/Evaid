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

const normalizeOrganization = (item: any): OrganizationListItem => ({
    id: String(item.id ?? item.org_id),
    name: item.name ?? item.companyName,
    email: item.email ?? item.companyEmail,
    phone_number: item.phone_number ?? item.companyPhoneNumber,
    status: item.status,
    region: item.region,
    seat_limit: item.seat_limit,
    primary_contact: item.primary_contact,
    notes: item.notes,
    updated_at: item.updated_at,
    open_cases: item.open_cases,
});

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

        if (Array.isArray(payload)) return payload.map(normalizeOrganization);
        if (Array.isArray(payload?.data)) return payload.data.map(normalizeOrganization);
        if (Array.isArray(payload?.organizations)) return payload.organizations.map(normalizeOrganization);

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
