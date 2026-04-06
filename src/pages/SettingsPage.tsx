import React, { useState, useEffect, useRef } from 'react';
import { UserIcon, LockIcon, PaletteIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';

const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || user?.username || '',
    business_email: user?.business_email || user?.email || '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const [theme, setTheme] = useState<string>(localStorage.getItem('appTheme') || 'system');
  const [prefSuccess, setPrefSuccess] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    setForm({ 
      name: user?.name || user?.username || '', 
      business_email: user?.business_email || user?.email || '' 
    });
    setAvatarUrl(user?.avatar_url || '');
  }, [user]);

  // Fetch staff data on component mount
  useEffect(() => {
    fetchUser();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      // Update staff table with name and business_email
      const res = await fetch(API_CONFIG.getUrl(`/staff/${user?.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: form.name,
          business_email: form.business_email,
          // Keep existing values for other fields
          photo_url: user?.avatar_url || '',
          empl_no: user?.empl_no || '',
          id_no: user?.id_no || '',
          role: user?.role || '',
          phone_number: user?.phone_number || '',
          department: user?.department || '',
          department_email: user?.department_email || '',
          salary: user?.salary || '',
          employment_type: user?.employment_type || '',
          gender: user?.gender || ''
        }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      setSuccess('Profile updated successfully!');
      
      // Refresh user data to get updated information
      await fetchUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess('');
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordSaving(false);
      return;
    }
    try {
      const res = await fetch(API_CONFIG.getUrl(`/users/${user?.id}/password`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (!res.ok) throw new Error('Failed to change password');
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    }
    setPasswordSaving(false);
  };

  const fetchUser = async () => {
    if (!user) return;
    try {
      const res = await fetch(API_CONFIG.getUrl(`/users/${user.id}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (setUser) setUser(data);
      
      // Update form with staff data (name and business_email from staff table)
      setForm({
        name: data.name || data.username || '',
        business_email: data.business_email || data.email || '',
      });
    } catch {}
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setAvatarUploading(true);
    setAvatarSuccess('');
    setAvatarError('');
    const formData = new FormData();
    formData.append('avatar', e.target.files[0]);
    try {
      const res = await fetch(API_CONFIG.getUrl(`/staff/${user?.id}/avatar`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Upload failed with status: ${res.status}`;
        throw new Error(errorMessage);
      }
      const data = await res.json();
      setAvatarUrl(data.url);
      setAvatarSuccess('Profile picture updated!');
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.avatar_url = data.url;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch {}
      await fetchUser();
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to upload avatar');
    }
    setAvatarUploading(false);
  };

  const imgRef = useRef<HTMLImageElement>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('appTheme', theme);
    setPrefSuccess('Preferences saved');
    setTimeout(() => setPrefSuccess(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'security', label: 'Security' },
            { key: 'preferences', label: 'Preferences' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <img
                    ref={imgRef}
                    src={user?.avatar_url || avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=2563eb&color=fff&size=128`}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-200 cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => setShowAvatarModal(true)}
                  />
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full px-2 py-1 cursor-pointer hover:bg-blue-700 transition text-xs">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading}
                    />
                    Edit
                  </label>
                </div>
                {avatarUploading && <span className="text-blue-600 text-sm mt-2">Uploading...</span>}
                {avatarSuccess && <span className="text-green-600 text-sm mt-2">{avatarSuccess}</span>}
                {avatarError && <span className="text-red-600 text-sm mt-2">{avatarError}</span>}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Email</label>
                  <input
                    type="email"
                    name="business_email"
                    value={form.business_email}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {success && <span className="text-green-600 text-sm">{success}</span>}
                {error && <span className="text-red-600 text-sm">{error}</span>}
              </div>
            </form>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <LockIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handlePasswordSave} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? 'Saving...' : 'Change Password'}
                  </button>
                  {passwordSuccess && <span className="text-green-600 text-sm">{passwordSuccess}</span>}
                  {passwordError && <span className="text-red-600 text-sm">{passwordError}</span>}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preferences */}
        {activeTab === 'preferences' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <PaletteIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
            </div>
            <form onSubmit={handleSavePreferences} className="p-6 max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Preferences
                </button>
                {prefSuccess && <span className="text-green-600 text-sm">{prefSuccess}</span>}
              </div>
            </form>
          </div>
        )}

        {/* Avatar Modal */}
        {showAvatarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 flex justify-center">
                <img
                  src={user?.avatar_url || avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=2563eb&color=fff&size=400`}
                  alt="Profile"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SettingsPage;