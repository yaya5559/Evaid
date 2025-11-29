import axios from "axios"

const path = '';

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