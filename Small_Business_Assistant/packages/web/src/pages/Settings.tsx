import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  User,
  Building,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Database,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import { apiService } from '../services/apiService';

interface UserSettings {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
}

interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  taxId?: string;
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  jobUpdates: boolean;
  paymentReminders: boolean;
  weeklyReports: boolean;
  marketingEmails: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiryDays: number;
  loginAttempts: number;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // User Settings
  const [userSettings, setUserSettings] = useState<UserSettings>({
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    avatar: ''
  });

  // Business Settings
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    taxId: '',
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '09:00', close: '15:00', closed: true }
    }
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    jobUpdates: true,
    paymentReminders: true,
    weeklyReports: true,
    marketingEmails: false
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiryDays: 90,
    loginAttempts: 5
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD'
  });

  // Password Change
  const [passwordChange, setPasswordChange] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real app, these would be separate API calls
      const [userResponse, businessResponse, settingsResponse] = await Promise.all([
        apiService.get('/user/profile'),
        apiService.get('/business/settings'),
        apiService.get('/user/settings')
      ]);

      setUserSettings(userResponse.data);
      setBusinessSettings(businessResponse.data);
      
      // Merge settings from response
      const settings = settingsResponse.data;
      setNotificationSettings(settings.notifications || notificationSettings);
      setSecuritySettings(settings.security || securitySettings);
      setAppearanceSettings(settings.appearance || appearanceSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (section: string) => {
    try {
      setSaving(true);
      
      switch (section) {
        case 'profile':
          await apiService.put('/user/profile', userSettings);
          break;
        case 'business':
          await apiService.put('/business/settings', businessSettings);
          break;
        case 'notifications':
          await apiService.put('/user/settings/notifications', notificationSettings);
          break;
        case 'security':
          await apiService.put('/user/settings/security', securitySettings);
          break;
        case 'appearance':
          await apiService.put('/user/settings/appearance', appearanceSettings);
          break;
        case 'password':
          if (passwordChange.newPassword !== passwordChange.confirmPassword) {
            alert('New passwords do not match');
            return;
          }
          await apiService.put('/user/password', {
            currentPassword: passwordChange.currentPassword,
            newPassword: passwordChange.newPassword
          });
          setPasswordChange({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            showCurrentPassword: false,
            showNewPassword: false,
            showConfirmPassword: false
          });
          break;
      }
      
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await apiService.get('/data/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'business-data.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await apiService.post('/data/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Data imported successfully!');
      loadSettings(); // Reload settings after import
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data. Please try again.');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'business', name: 'Business', icon: Building },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'data', name: 'Data & Backup', icon: Database }
  ];

  const SettingSection: React.FC<{
    title: string;
    description: string;
    children: React.ReactNode;
    onSave?: () => void;
    saveLabel?: string;
  }> = ({ title, description, children, onSave, saveLabel = 'Save Changes' }) => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {onSave && (
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : saveLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account and business preferences</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div>
              <SettingSection
                title="Personal Information"
                description="Update your personal details and contact information"
                onSave={() => saveSettings('profile')}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={userSettings.firstName}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={userSettings.lastName}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={userSettings.email}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={userSettings.phone}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </SettingSection>

              <SettingSection
                title="Change Password"
                description="Update your account password"
                onSave={() => saveSettings('password')}
                saveLabel="Update Password"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={passwordChange.showCurrentPassword ? 'text' : 'password'}
                        value={passwordChange.currentPassword}
                        onChange={(e) => setPasswordChange(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordChange(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {passwordChange.showCurrentPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={passwordChange.showNewPassword ? 'text' : 'password'}
                        value={passwordChange.newPassword}
                        onChange={(e) => setPasswordChange(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordChange(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {passwordChange.showNewPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={passwordChange.showConfirmPassword ? 'text' : 'password'}
                        value={passwordChange.confirmPassword}
                        onChange={(e) => setPasswordChange(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordChange(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {passwordChange.showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              </SettingSection>
            </div>
          )}

          {/* Business Settings */}
          {activeTab === 'business' && (
            <div>
              <SettingSection
                title="Business Information"
                description="Update your business details and contact information"
                onSave={() => saveSettings('business')}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessSettings.name}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={businessSettings.email}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Phone
                    </label>
                    <input
                      type="tel"
                      value={businessSettings.phone}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={businessSettings.website}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Address
                    </label>
                    <textarea
                      value={businessSettings.address}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={businessSettings.taxId}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, taxId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </SettingSection>

              <SettingSection
                title="Business Hours"
                description="Set your business operating hours"
                onSave={() => saveSettings('business')}
              >
                <div className="space-y-4">
                  {Object.entries(businessSettings.businessHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-24">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {day}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!hours.closed}
                          onChange={(e) => setBusinessSettings(prev => ({
                            ...prev,
                            businessHours: {
                              ...prev.businessHours,
                              [day]: { ...hours, closed: !e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Open</span>
                      </div>
                      {!hours.closed && (
                        <>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => setBusinessSettings(prev => ({
                              ...prev,
                              businessHours: {
                                ...prev.businessHours,
                                [day]: { ...hours, open: e.target.value }
                              }
                            }))}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => setBusinessSettings(prev => ({
                              ...prev,
                              businessHours: {
                                ...prev.businessHours,
                                [day]: { ...hours, close: e.target.value }
                              }
                            }))}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </SettingSection>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <SettingSection
              title="Notification Preferences"
              description="Choose how and when you want to be notified"
              onSave={() => saveSettings('notifications')}
            >
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Email Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Job Updates</p>
                        <p className="text-sm text-gray-500">Get notified when job status changes</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, jobUpdates: !prev.jobUpdates }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.jobUpdates ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.jobUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Payment Reminders</p>
                        <p className="text-sm text-gray-500">Reminders for overdue invoices</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, paymentReminders: !prev.paymentReminders }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.paymentReminders ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.paymentReminders ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Weekly Reports</p>
                        <p className="text-sm text-gray-500">Receive weekly business summaries</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, weeklyReports: !prev.weeklyReports }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.weeklyReports ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">SMS Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via text message</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, smsNotifications: !prev.smsNotifications }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Marketing</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Marketing Emails</p>
                        <p className="text-sm text-gray-500">Receive promotional emails and updates</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, marketingEmails: !prev.marketingEmails }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.marketingEmails ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </SettingSection>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <SettingSection
              title="Security Settings"
              description="Manage your account security and privacy"
              onSave={() => saveSettings('security')}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    onClick={() => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <select
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={480}>8 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Expiry (days)
                  </label>
                  <select
                    value={securitySettings.passwordExpiryDays}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordExpiryDays: parseInt(e.target.value) }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                    <option value={365}>1 year</option>
                    <option value={0}>Never</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Login Attempts
                  </label>
                  <select
                    value={securitySettings.loginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginAttempts: parseInt(e.target.value) }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={3}>3 attempts</option>
                    <option value={5}>5 attempts</option>
                    <option value={10}>10 attempts</option>
                  </select>
                </div>
              </div>
            </SettingSection>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <SettingSection
              title="Appearance & Preferences"
              description="Customize your dashboard appearance and regional settings"
              onSave={() => saveSettings('appearance')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={appearanceSettings.theme}
                    onChange={(e) => setAppearanceSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={appearanceSettings.language}
                    onChange={(e) => setAppearanceSettings(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={appearanceSettings.timezone}
                    onChange={(e) => setAppearanceSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="America/Anchorage">Alaska Time</option>
                    <option value="Pacific/Honolulu">Hawaii Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Format
                  </label>
                  <select
                    value={appearanceSettings.dateFormat}
                    onChange={(e) => setAppearanceSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={appearanceSettings.currency}
                    onChange={(e) => setAppearanceSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                    <option value="CAD">Canadian Dollar (C$)</option>
                    <option value="AUD">Australian Dollar (A$)</option>
                  </select>
                </div>
              </div>
            </SettingSection>
          )}

          {/* Data & Backup */}
          {activeTab === 'data' && (
            <div>
              <SettingSection
                title="Data Export"
                description="Export your business data for backup or migration"
              >
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Download all your business data including jobs, customers, invoices, and photos.
                  </p>
                  <button
                    onClick={exportData}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </button>
                </div>
              </SettingSection>

              <SettingSection
                title="Data Import"
                description="Import business data from a backup file"
              >
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Import your business data from a previously exported backup file.
                  </p>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={importData}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Importing data will overwrite existing records. Make sure to backup your current data first.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingSection>

              <SettingSection
                title="Account Management"
                description="Manage your account and subscription"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Delete Account</h4>
                      <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                    </div>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                      Delete Account
                    </button>
                  </div>
                </div>
              </SettingSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 