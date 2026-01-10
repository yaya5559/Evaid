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

}

type DecodedJwt = {
  sub: string;
  email?: string;
  name?: string;
  roles?: string[] | string;
  exp: number; // seconds since epoch
  [k: string]: unknown;
};


type AuthProviderValue = {
    user: User | null;
    login: (email:string, password:string) => Promise<void>;
    logout: () => Promise<void>;
    getAccessToken : ()=> string |null;
    api: AxiosInstance;

}

//chek token is expired
function isExpired(token : string, skewSeconds = 5): boolean {
    try{
        const {exp} = jwtDecode<DecodedJwt>(token);
         const nowSec = Math.floor(Date.now() / 1000);
        return exp <= nowSec + skewSeconds;
    }catch{
        return true;
    }
}

//Axios instance shared by the app.
const api: AxiosInstance = axios.create({
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
        if(!token) {
            setState({user: null, accessToken: null, loading: false})
            return
        };
        const user:User = jwtDecode(token);
        setState({user:user, accessToken: token, loading:false})

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
                const lock = refreshingRef.current;
                refreshingRef.current = null;
                //retry teh request if refresh succeed
                failedQueue.splice(0).forEach(({resolve, reject, config}) => {
                    if(accessTokenRef.current){
                        resolve(api(config));
                    }else{
                        reject(new Error("Unauthorized"));

                    }
                })
                //Prevent danglinh promise chains on callers of refresh().
                await lock?.catch(() => {});
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

    
    api.interceptors.request.use(async (config) => {
        const token = accessTokenRef.current;
        if(token && isExpired(token)){
            await refresh()
        }
        const nextToken = accessTokenRef.current;
        if(nextToken){
            //config.headers = {...(config.headers || {}), Authorization: `Bearer ${nextToken}`}
            config.headers?.set?.("Authorization", `Bearer ${nextToken}`);

        }
        return config;
    })
    
    /** Response: on 401, attempt one refresh and retry the original request. */
    api.interceptors.response.use(
        (res) => res,
        async (error: AxiosError) => {
        const original = error.config as AxiosRequestConfig & { _retry?: boolean };
        const status = error.response?.status;

        if (status === 401 && !original._retry) {
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

    const login = useCallback(
        async (email: string, password: string) => {
        const res = await api.post<{ accessToken: string }>("/auth/login", { email, password });
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


   