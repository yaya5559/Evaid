import { api } from '../context/AuthContext';

export type ProfileData = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
};

export type PasswordChangeData = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export const getProfile = async () => {
  const res = await api.get('/users/me');
  return res.data;
};

export const updateProfile = async (data: ProfileData) => {
  const res = await api.put('/users/me', data);
  return res.data;
};

export const changePassword = async (data: PasswordChangeData) => {
  const res = await api.post('/users/change-password', data);
  return res.data;
};
