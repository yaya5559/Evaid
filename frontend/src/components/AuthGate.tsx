import { useAuth } from '../context/AuthContext'
import { Navigate, Outlet, useLocation } from 'react-router-dom'


const roleHome: Record<string, string> = {
    evaide_admin: "/Dashboard",
    org_admin:"/Org_Dashboard",
    agent: "/Org_Dashboard"
}

export default function AuthGate({roles}: {roles?:string[]}) {
    const {user, loading } = useAuth()
    const loc = useLocation();

    if(loading) return null;
    if(!user) return  <Navigate to="/Login" replace state={{ from: loc }} />;

    if(roles && !roles.includes(user.role)){
        return <Navigate to={roleHome[user.role] ?? "/"} replace />;
    }


    return <Outlet />
}
