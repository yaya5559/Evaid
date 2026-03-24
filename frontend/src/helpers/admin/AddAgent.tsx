import { api } from "../../context/AuthContext";

type AgentPayload = {
    first_name: string
    last_name: string
    email: string
    phone_number: string
    password: string
    org_id: number
};

export const addAgent = async (agent: AgentPayload) => {
    try {
        const res = await api.post(`/Register`, agent)
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