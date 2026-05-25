/*
    a centralized way to manage user auth state 
    across React, React Native app.
*/

import React, { createContext, useCallback, useState, useRef, useEffect, useMemo, useContext } from "react"
import {jwtDecode} from "jwt-decode";
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";

type AuthState = {
    user: User | null,
    accessToken: string | null,
    loading: boolean,
}

type User = {
    name: string,
    email: string,
    company:string;
    role:string;
    org_id?: string | number;
    user_id?: string | number;
    sub?: string;
    [k: string]: unknown;
}

type DecodedJwt = {
  sub: string;
  email?: string;
  name?: string;
  roles?: string[] | string;
  role?: string;
  exp: number; // seconds since epoch
  [k: string]: unknown;
};


type AuthProviderValue = {
    user: User | null;
    loading: boolean
    login: (email:string, password:string) => Promise<void>;
    logout: () => Promise<void>;
    getAccessToken : ()=> string |null;
    api: AxiosInstance;

}

//check token is expired
function isExpired(token : string, skewSeconds = 5): boolean {
    try{
        const {exp} = jwtDecode<DecodedJwt>(token);
        const nowSec = Math.floor(Date.now() / 1000);
        return exp <= nowSec + skewSeconds;
    }catch{
        return true;
    }
}

//Axios instance shared by the app, 
//A preconfigured API messenger that already knows 
//where your server lives and how authentification works
export const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
    withCredentials: true, //send and receives token 
})


const AuthContext = createContext<AuthProviderValue | undefined>(undefined);

export const AuthProvider : React.FC<{children: React.ReactNode}> = ({children}) => {
    const [state, setState] = useState<AuthState>({user:null, accessToken: null, loading: true})
    const refreshingRef =  useRef<Promise<string | null> | null>(null);
    const failedQueue: {
        resolve: (v?: unknown) => void;
        reject: (e: unknown) => void;
        config: AxiosRequestConfig;

    }[] = [];

    const accessTokenRef = useRef<string | null>(null);
    useEffect(() => {
        accessTokenRef.current = state.accessToken;

    }, [state.accessToken])
    


    const setAccessToken = useCallback((token: string | null) => {
        accessTokenRef.current = token;
        if(!token) {
            setState({user: null, accessToken: null, loading: false})
            return
        };
        const decoded = jwtDecode<DecodedJwt>(token);
        const role =
            typeof decoded.role === "string"
                ? decoded.role.trim().toLowerCase()
                : "";
        const user: User = { ...(decoded as unknown as User), role };
        setState({user: user, accessToken: token, loading:false})

    }, []);



    /**
     * refresh JWT access token
     * ensure only one token refresh call happens at a time
     * logs out of the user if the refresh fails
     * 
     */
    const refresh = useCallback(async (): Promise<string | null> => {
        //prevents parallel refresh calls
        if(refreshingRef.current) return refreshingRef.current;

        //start a new refresh op and store the promise inside refreshingRef.current
        refreshingRef.current = (async () => {
            try{
                //send a post request to refresh the token
                const res = await api.post<{accessToken:string}>("/auth/refresh");
                const newToken = res.data.accessToken;
                setAccessToken(newToken);
                return newToken;

            }catch(err) { 
                //logout the user if the refresh fail
                setAccessToken(null);
                return null;

            } finally{
                //after the refresh clear the in-progress => future refreshes can proceed
                refreshingRef.current = null;
                //retry the request if refresh succeeded
                failedQueue.splice(0).forEach(({resolve, reject, config}) => {
                    if(accessTokenRef.current){
                        resolve(api(config));
                    }else{
                        reject(new Error("Unauthorized"));

                    }
                })
            }
        })()
        return refreshingRef.current;

    }, [setAccessToken])

    useEffect(() => {
        (async () => {
            try{
                await refresh()

            }finally{
                //set loading to false
                setState(s => ({ ...s, loading: false }));
            }
        })()
    }, [refresh])

    useEffect(() => {
        //before sending any request run this:   
        const requestId = api.interceptors.request.use(async (config) => {
            const token = accessTokenRef.current;//Reading token from ref

            //expiration check
            if(token && isExpired(token)){
                await refresh()
            }
            const nextToken = accessTokenRef.current;
            if (nextToken) {
                if (config.headers instanceof Headers) {
                    config.headers.set("Authorization", `Bearer ${nextToken}`);
                } else {
                    const headers = config.headers || {};
                    (config.headers as any) = {
                        ...(headers as Record<string, string>),
                        Authorization: `Bearer ${nextToken}`,
                    };
                }
            }
            return config;
        });
        
        /** Response: on 401, attempt one refresh and retry the original request. */
        const responseId = api.interceptors.response.use(
            (res) => res,
            async (error: AxiosError) => {
                const original = error.config as AxiosRequestConfig & { _retry?: boolean };
                const status = error.response?.status;

                // Never intercept auth endpoints — a 401 from login/refresh/logout
                // is the server's definitive answer, not a token expiry signal.
                const url = original.url ?? "";
                const isAuthEndpoint = url.includes("/auth/");

                if (status === 401 && !original._retry && !isAuthEndpoint) {
                    original._retry = true;

                    // Queue this request until refresh completes to avoid token races.
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject, config: original });
                        refresh().catch(() => {
                            // If refresh fails, queue will reject below when lock releases.
                        });
                    });
                }

                // Any other error or already retried: bubble up.
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.request.eject(requestId);
            api.interceptors.response.eject(responseId);
        };
    }, [refresh]);

    const login = useCallback(
        async (email: string, password: string) => {
            const res = await api.post<{accessToken: string }>("/auth/login", { email, password });
            setAccessToken(res.data.accessToken); // refresh cookie is set by server via Set-Cookie
        },
        [setAccessToken]
    );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout"); // server clears refresh cookie
    } finally {
      setAccessToken(null);
    }
  }, [setAccessToken]);

  const value = useMemo<AuthProviderValue>(
    () => ({
      user: state.user,
      loading: state.loading,
      login,
      logout,
      getAccessToken: () => accessTokenRef.current,
      api,
    }),
    [state.user, state.loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthProviderValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}
