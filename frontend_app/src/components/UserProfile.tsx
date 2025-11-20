'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '../store/sessionStore';
import {
  User,
  Mail,
  Globe,
  Award,
  Settings,
  Bell,
  Volume2,
  Moon,
  Sun,
  Monitor,
  Save,
  Download,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile as UserProfileType } from '../types';

interface UserProfileProps {
  onClose: () => void;
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const { theme, setTheme, voiceEnabled, setVoiceEnabled, transcriptionMode, setTranscriptionMode } = useSessionStore();

  const [profile, setProfile] = useState<Partial<UserProfileType>>({
    fullName: 'Alex Delegate',
    email: 'alex.delegate@mun.org',
    experienceLevel: 'intermediate',
    preferredCountry: 'United States',
    preferredCouncil: 'UNGA',
    preferredCommittee: 'General Assembly',
    notificationPreferences: {
      email: true,
      push: true,
      sessionReminders: true,
      deadlineAlerts: true,
    },
    voiceSettings: {
      language: 'en-US',
      accent: 'american',
      autoSend: true,
      pushToTalk: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Save to local storage for demo
      localStorage.setItem('mun-user-profile', JSON.stringify(profile));

      setSaveStatus('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mun-user-profile.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedProfile = JSON.parse(e.target?.result as string);
          setProfile(importedProfile);
        } catch (error) {
          alert('Invalid profile file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', description: 'New to MUN, learning the basics' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some MUN experience, familiar with procedures' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced delegate, expert in MUN procedures' },
  ];

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'high-contrast', icon: Monitor, label: 'High Contrast' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            User Profile
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 flex items-center space-x-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <User size={16} />
            <span>Basic Information</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email
              </label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Experience Level
              </label>
              <select
                value={profile.experienceLevel || 'intermediate'}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  experienceLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
              >
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* MUN Preferences */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 flex items-center space-x-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <Globe size={16} />
            <span>MUN Preferences</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Preferred Country
              </label>
              <input
                type="text"
                value={profile.preferredCountry || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, preferredCountry: e.target.value }))}
                placeholder="e.g., United States, France, Japan"
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Preferred Council
              </label>
              <input
                type="text"
                value={profile.preferredCouncil || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, preferredCouncil: e.target.value }))}
                placeholder="e.g., UNGA, UNSC, ECOSOC"
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Preferred Committee
              </label>
              <input
                type="text"
                value={profile.preferredCommittee || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, preferredCommittee: e.target.value }))}
                placeholder="e.g., General Assembly, Security Council"
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 flex items-center space-x-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <Bell size={16} />
            <span>Notifications</span>
          </h3>

          <div className="space-y-3">
            {Object.entries({
              email: 'Email notifications',
              push: 'Push notifications',
              sessionReminders: 'Session reminders',
              deadlineAlerts: 'Deadline alerts',
            }).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {label}
                </span>
                <input
                  type="checkbox"
                  checked={profile.notificationPreferences?.[key as keyof typeof profile.notificationPreferences] || false}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      [key]: e.target.checked,
                    },
                  }))}
                  className="w-4 h-4 text-un-blue bg-gray-100 border-gray-300 rounded focus:ring-un-blue"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Voice Settings */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 flex items-center space-x-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <Volume2 size={16} />
            <span>Voice Settings</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Language
              </label>
              <select
                value={profile.voiceSettings?.language || 'en-US'}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  voiceSettings: { ...prev.voiceSettings, language: e.target.value },
                }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="zh-CN">Chinese (Mandarin)</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Transcription Mode
              </label>
              <select
                value={transcriptionMode}
                onChange={(e) => setTranscriptionMode(e.target.value as 'push-to-talk' | 'continuous')}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
              >
                <option value="push-to-talk">Push to Talk</option>
                <option value="continuous">Continuous</option>
              </select>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Enable voice input
              </span>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-4 h-4 text-un-blue bg-gray-100 border-gray-300 rounded focus:ring-un-blue"
              />
            </label>
          </div>
        </div>

        {/* Theme Settings */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 flex items-center space-x-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <Settings size={16} />
            <span>Appearance</span>
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as 'light' | 'dark' | 'high-contrast')}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    theme === option.value
                      ? 'bg-un-blue text-white border-un-blue'
                      : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} className="mx-auto mb-1" />
                  <div className="text-xs">{option.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="space-y-3">
          {/* Save Status */}
          {saveStatus !== 'idle' && (
            <div className={`p-2 rounded-lg text-sm text-center ${
              saveStatus === 'success'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {saveStatus === 'success' ? (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle size={16} />
                  <span>Profile saved successfully!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <AlertTriangle size={16} />
                  <span>Failed to save profile</span>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-un-blue text-white hover:bg-un-blue-dark'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Profile</span>
                </>
              )}
            </button>

            <div className="flex space-x-2">
              <button
                onClick={handleExport}
                className={`p-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title="Export profile"
              >
                <Download size={16} />
              </button>

              <label className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
                title="Import profile"
              >
                <Upload size={16} />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}