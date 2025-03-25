import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';

const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({ nom: user?.nom || '', email: user?.email || '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Vérifier si le token existe, sinon rediriger vers la page de connexion
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté pour modifier votre profil.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      const response = await axios.put('http://localhost:5000/api/auth/update-profile', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update the user in AuthContext
      updateUser(response.data);
      setSuccess('Profil mis à jour avec succès !');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 1500);
      } else if (err.response?.data?.error) {
        setError(`${err.response.data.message}: ${err.response.data.error}`);
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8 transform transition-all duration-300 hover:shadow-pink-500/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Modifier le Profil</h2>

        {/* Messages d'erreur et de succès */}
        {error && (
          <p className="text-red-400 bg-red-900/30 border border-red-600 rounded-md p-3 mb-6 text-center animate-fade-in">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-400 bg-green-900/30 border border-green-600 rounded-md p-3 mb-6 text-center animate-fade-in">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Champ Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-300 uppercase tracking-wide mb-2">
              Nom
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 placeholder-gray-400"
              placeholder="Entrez votre nom"
              required
            />
          </div>

          {/* Champ Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 uppercase tracking-wide mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 placeholder-gray-400"
              placeholder="Entrez votre email"
              required
            />
          </div>

          {/* Bouton Enregistrer */}
          <button
            type="submit"
            className="w-full py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;