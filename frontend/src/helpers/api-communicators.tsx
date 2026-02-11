import axios from "axios"

const path = '';


type OrganizationT = {
    companyName:string,
    UserName: string,
    email: string,
    phone: string,
    password: string,
    
}

export const loginUser = async (email:string, password:string) => {
    try{
        const response = await axios.post(
            `${path}`,
            {email, password},//request body
            {
                headers: { "Content-Type": "application/json" },// sending JSON data
                withCredentials: true// ensures cookies are sent and received
            }
        );
        return  response.data.access_token;;
    }catch(err){

    }
}

export const addOrganization = async (Organization: OrganizationT) => {
    try{

        const res = 

    }catch(err: any){
        const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to Add Organization";
        console.log("Register Organization error:", err?.response?.status, err?.response?.data || err);
        throw new Error(msg);
    }

}