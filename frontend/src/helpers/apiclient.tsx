// How does my app talk to the backend in a way that is centralized, consistent, and change-proof?”
// it owns baseURL, credentials/ cookies, timeout, headers, interceptors
type RequestOptions = {
    method?: "GET"|"POST"|"PUT"|"PATCH"|"DELETE";
    body?: unknown;
    headers?: Record<string, string>;    
}


export class ApiClient {
    private baseURL: string;
    private token: string | null = null;
    private onAuthorized?: ()=>void;
    private refreshToken?: () => Promise<string | null>;
    private refreshing : Promise<string | null> | null = null;


    constructor(url: string){
        this.baseURL = url.replace(/\/+$/, "");
    }


    setToken(token : string){
        this.token = token;
    }

    onVoid(cb: ()=> void){this.onAuthorized = cb}

    setTokenrefresher(cb: ()=>Promise<string | null>) {this.refreshToken = cb }

    async request<T>(path:string, opts:RequestOptions={}):Promise<T> {
        //build the url
        const url = `${this.baseURL}${path.startsWith("/")?"":"/"}${path}`;

        //builds the header problematic
        const headers: Record<string, string> = {"Content-type": "appliation/json", ...(opts.headers ?? {})}
        if(this.token) headers.Authorization = `Bearer ${this.token}`;

        const doFetch = async (): Promise<Response> => fetch(url, {
            method: opts.method ?? "GET",
            headers,
            body: opts.body ? JSON.stringify(opts.body) : undefined,
        })

        let res = await doFetch()

        //token rejected 
        if(res.status == 401 && this.refreshToken){
            //if no refresh is happening
            if(!this.refreshing) {
                this.refreshing = this.refreshToken()
                    .finally(() => {
                        this.refreshing = null;
                    })
            }

            const newToken = await this.refreshToken()

            if(newToken) {
                this.setToken(newToken);
                headers.Authorization = `Bearer ${newToken}`;
                res = await doFetch();
            }else{
                this.onAuthorized?.()

            }
        }

        if(!res.ok){
            const text = await res.text().catch(() => "");
            throw new Error(text || `HTTP ${res.status}`);

        }

        const text = await res.text().catch(()=>"");
        const trimmed = text.trim()
        if(!trimmed){
            return undefined as T;

        }
        try{
            return JSON.parse(trimmed) as T
        }catch{
            return text as unknown as T
        }
    }

    get<T>(path:string) {return this.request<T>(path);}
    post<T>(path:string, body?:unknown){return this.request<T>(path, {method:"POST", body});}
    patch<T>(path:string, body?:unknown){return this.request<T>(path, {method:"PATCH", body});}
    delete<T>(path:string) { return this.request<T>(path, {method:"DELETE"})}
    
}

// Single source of truth for the API base; keeps login and other calls on the same host.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.88.23:5000";


export const api = new ApiClient(API_BASE_URL);