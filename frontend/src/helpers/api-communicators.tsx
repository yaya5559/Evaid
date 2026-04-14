import { api } from "../context/AuthContext";

export type CaseListItem = {
    id: number;
    description: string;
    status: string;
    created_at: string;
    organization_id?: number;
    assigned_agent_id?: string;
    evidence_count?: string;
};

type OrganizationPayload = {
    company_name: string;
    company_email: string;
    company_phone_number: string;
    owner_first_name: string;
    owner_last_name: string;
    owner_email: string;
    owner_phone_number: string;
    password: string;
}
type AgentPayload = {
    first_name: string
    last_name: string
    email: string
    phone_number: string
    password: string
    org_id: number
}

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

export const getCases = async () => {
    try {
        const res = await api.get("/cases/all", {
            withCredentials: true,
        });
        return res.data as CaseListItem[];
    } catch (err: any) {
        throw new Error(err.response?.data?.detail || "Could not load cases");
    }
};

export const getGraph =  async (case_id:string) => {
    try{
        const res = await api.get(`/graph/cases/${case_id}`)
        return res

    }catch(err: any){
        throw new Error(err.response?.data?.detail || "Could not load cases");
    }
}

type OrganizationUpdatePayload = {
  org_id: number;
  companyName: string;
  companyEmail: string;
  companyPhoneNumber: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhoneNumber: string;
  status: string;
  description?: string;
};

export const editOrganization = async(    
    organization: OrganizationUpdatePayload

) => {
    try {
        const organizationId = organization.org_id
        const res = await api.put(`/Organization/${organizationId}`, organization, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        });
        return res.data;
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Unable to edit organization";
        throw new Error(msg);
    }
};

export const uploadEvidence = async (caseId: number, file: File, description = '', title = file.name) => {
    try {
        const itemRes = await api.post("/evidence/EvidenceItem", {
            case_id: String(caseId),
            title,
            description,
        });
        const evidenceItemId: string = itemRes.data.evidenceItem_id;

        // Step 2 — upload the file as an attachment to that item
        const formData = new FormData();
        formData.append("attachement", file);
        const attachRes = await api.post(`/evidence/${evidenceItemId}/attachments`, formData);
        return { ...attachRes.data, evidenceItemId };
    } catch (err: any) {
        throw new Error(err.response?.data?.detail || "Upload failed");
    }
};