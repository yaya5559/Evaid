import { api } from '../context/AuthContext.tsx'

export type ProfileData = {
    first_name?: string
    last_name?:  string
    email?:      string
    phone?:      string
    role?:       string
    org_name?:   string
    [key: string]: string | undefined
}

export type PasswordChangeData = {
    current_password: string
    new_password:     string
    confirm_password: string
}

export const getProfile = async (): Promise<ProfileData> => {
    const res = await api.get('/Evaide/auth/me')
    return res.data
}

export const updateProfile = async (data: ProfileData): Promise<void> => {
    await api.patch('/Evaide/auth/me', data)
}

export const changePassword = async (data: PasswordChangeData): Promise<void> => {
    await api.post('/Evaide/auth/change-password', data)
}