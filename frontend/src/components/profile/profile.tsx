import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getProfile, updateProfile, changePassword } from '../services/profile.ts';
import type { ProfileData, PasswordChangeData } from '../services/profile.ts';
import '../../styles/Admin/AdminLayout.css';

const Profile = () => {
  const {user} = useAuth();

  // 1. Initial Profile State
  const [profile, setProfile] = useState<ProfileData & { role?: string; org_name?: string }>({});

  // 2. Combined Form Data (Fixed duplicate identifier)
  const [formData, setFormData] = useState<ProfileData>({
    first_name: user?.name?.split(' ')[0] || '',
    last_name: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
  });

  // 3. Other UI States
  const [editMode, setEditMode] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await getProfile();
        if (!cancelled) {
          setProfile(data);
          setFormData({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);
  const handleProfileUpdate = async (e: React.SyntheticEvent) => {    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully');
      setEditMode(false);
      const updated = await getProfile();
      setProfile(updated);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };  // ✅ closes here

  const handlePasswordChange = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await changePassword(passwordData);
      setSuccess('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
      <div className="admin-page-header">
        <h1>Profile Settings</h1>
        <div className="admin-card" style={{ maxWidth: '600px', marginTop: '20px' }}>
          {(error || success) && (
              <div className={`admin-banner ${error ? 'error' : 'success'}`}>
                {error ?? success}
              </div>
          )}

          {/* Profile Info */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Personal Information</h2>
              {!editMode && (
                  <button className="admin-btn" onClick={() => setEditMode(true)}>
                    Edit
                  </button>
              )}
            </div>
            {!editMode ? (
                <div className="orgdash-org-meta">
                  <div><span>First Name</span><strong>{profile.first_name || '—'}</strong></div>
                  <div><span>Last Name</span><strong>{profile.last_name || '—'}</strong></div>
                  <div><span>Email</span><strong>{profile.email || '—'}</strong></div>
                  <div><span>Phone</span><strong>{profile.phone || '—'}</strong></div>
                  <div><span>Role</span><strong>{profile.role || '—'}</strong></div>
                  <div><span>Organization</span><strong>{profile.org_name || '—'}</strong></div>
                </div>
            ) : (
                <form onSubmit={handleProfileUpdate}>
                  <div className="edit-org-controls">
                    <label className="edit-org-control">
                      <span>First Name</span>
                      <input className="edit-org-input" type="text" value={formData.first_name || ''}
                             onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                    </label>
                    <label className="edit-org-control">
                      <span>Last Name</span>
                      <input className="edit-org-input" type="text" value={formData.last_name || ''}
                             onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                    </label>
                    <label className="edit-org-control">
                      <span>Email</span>
                      <input className="edit-org-input" type="email" value={formData.email || ''}
                             onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </label>
                    <label className="edit-org-control">
                      <span>Phone</span>
                      <input className="edit-org-input" type="tel" value={formData.phone || ''}
                             onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="submit" className="admin-btn primary" disabled={loading}>Save</button>
                    <button type="button" className="admin-btn" onClick={() => {
                      setEditMode(false);
                      setFormData({
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        email: profile.email,
                        phone: profile.phone,
                      });
                    }}>Cancel</button>
                  </div>
                </form>
            )}
          </div>

          {/* Change Password */}
          <div style={{ marginTop: '32px' }}>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="edit-org-controls">
                <label className="edit-org-control">
                  <span>Current Password</span>
                  <input className="edit-org-input" type="password" value={passwordData.current_password}
                         onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                         required />
                </label>
                <label className="edit-org-control">
                  <span>New Password</span>
                  <input className="edit-org-input" type="password" value={passwordData.new_password}
                         onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
                         required />
                </label>
                <label className="edit-org-control">
                  <span>Confirm New Password</span>
                  <input className="edit-org-input" type="password" value={passwordData.confirm_password}
                         onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                         required />
                </label>
              </div>
              <div style={{ marginTop: '12px' }}>
                <button type="submit" className="admin-btn primary" disabled={loading}>Change Password</button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
};

export default Profile;