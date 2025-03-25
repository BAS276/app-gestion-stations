import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Settings {
  appName: string;
  defaultRole: 'manager' | 'mainManager' | 'admin';
  emailNotifications: boolean;
  theme: 'dark' | 'light';
}

const API_URL = 'http://localhost:5000/api/settings';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    appName: 'Gestion Stations',
    defaultRole: 'manager',
    emailNotifications: true,
    theme: 'dark',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== 'admin') {
    navigate('/profile');
    return null;
  }

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour voir les paramètres.');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSettings(response.data);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des paramètres:', err);
        setError(err.response?.data?.message || 'Erreur lors de la récupération des paramètres');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté pour modifier les paramètres.');
      setTimeout(() => navigate('/login'), 1500);
      setLoading(false);
      return;
    }

    try {
      await axios.put(API_URL, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Paramètres mis à jour avec succès !');
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour des paramètres:", err);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(err.response?.data?.message || "Erreur lors de la mise à jour des paramètres");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Paramètres de l'Application</h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-pink-800 text-pink-100 rounded-lg shadow-lg flex justify-between items-center"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-pink-200 hover:text-pink-100">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-800 text-green-100 rounded-lg shadow-lg flex justify-between items-center"
          >
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-200 hover:text-green-100">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700"
        >
          <div className="space-y-6">
            {/* Application Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom de l'Application</label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                placeholder="Entrez le nom de l'application"
                required
                disabled={loading}
              />
            </div>

            {/* Default Role for New Users */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rôle par défaut pour les nouveaux utilisateurs</label>
              <select
                value={settings.defaultRole}
                onChange={(e) =>
                  setSettings({ ...settings, defaultRole: e.target.value as 'manager' | 'mainManager' | 'admin' })
                }
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                disabled={loading}
              >
                <option value="manager">Manager</option>
                <option value="mainManager">Main Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-300">Notifications par email</label>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  settings.emailNotifications ? 'bg-pink-600' : 'bg-gray-600'
                }`}
                disabled={loading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Thème de l'Application</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'dark' | 'light' })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                disabled={loading}
              >
                <option value="dark">Sombre</option>
                <option value="light">Clair</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Enregistrer les Paramètres
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default Settings;