import axios from "axios";

const basePath = `${import.meta.env.VITE_API_BASE_URL ?? ""}/Evaide`;

type OrganizationPayload = {
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
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

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await axios.post(
      `${basePath}/auth/login`,
      { email, password }, // request body
      {
        headers: { "Content-Type": "application/json" }, // sending JSON data
        withCredentials: true, // ensures cookies are sent and received
      }
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

export const addOrganization = async (organization: OrganizationPayload) => {
  try {
    const res = await axios.post(`${basePath}/Organization/Add_Organization`, organization, {
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
    const res = await axios.get(`${basePath}/Organization`, {
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
    const res = await axios.put(`${basePath}/Organization/${organizationId}`, organization, {
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
