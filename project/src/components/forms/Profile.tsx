import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, LogOut, Settings, Edit2, Briefcase, MapPin } from 'lucide-react';
import { useAuth } from './AuthContext'; // Adjust the path to your AuthContext

// Define the User interface to match your AuthContext
interface User {
  _id: string;
  email: string;
  nom: string;
  role: 'manager' | 'mainManager';
  station?: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'activity'>('info');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If user is null, return null (the useEffect will handle redirection)
  if (!user) {
    return null;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      {/* Header Section with Cover Image */}
      <div className="relative">
        {/* Cover Image Placeholder */}
        <div className="h-40 bg-gradient-to-r from-pink-900 to-gray-800"></div>
        <div className="max-w-5xl mx-auto px-4 -mt-16">
          <div className="flex items-end gap-6">
            {/* Profile Picture */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-900 shadow-lg"
            >
              <User className="h-12 w-12 text-pink-500" />
            </motion.div>
            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{user.nom}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Briefcase className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-400">
                  {user.role}
                </p>
              </div>
              {user.role === 'manager' && user.station && (
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-400">{user.station}</p>
                </div>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile/edit')}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-all duration-200 shadow-md"
                aria-label="Modifier le profil"
              >
                <Edit2 className="h-4 w-4" />
                Modifier
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-400 rounded-md hover:bg-gray-600 hover:text-white transition-all duration-200 shadow-md"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-2 text-sm font-medium transition-all duration-200 ${
                activeTab === 'info'
                  ? 'text-pink-500 border-b-2 border-pink-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Informations
            </button>

          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Détails du Profil</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Nom Complet</p>
                <p className="text-base text-white mt-1">{user.nom}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Email</p>
                <p className="text-base text-white mt-1">{user.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Rôle</p>
                <p className="text-base text-white mt-1">
                  {user.role }
                </p>
              </div>
              {user.role === 'manager' && user.station && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Station</p>
                  <p className="text-base text-white mt-1">{user.station}</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Activité Récente</h2>
            <div className="space-y-4">
              {/* Placeholder for activity (you can fetch real data from an API) */}
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-md">
                <Briefcase className="h-5 w-5 text-pink-500" />
                <div>
                  <p className="text-sm text-white">Mise à jour du profil</p>
                  <p className="text-xs text-gray-400">Il y a 2 jours</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-md">
                <MapPin className="h-5 w-5 text-pink-500" />
                <div>
                  <p className="text-sm text-white">Changement de station</p>
                  <p className="text-xs text-gray-400">Il y a 5 jours</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;