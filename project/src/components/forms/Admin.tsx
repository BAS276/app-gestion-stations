import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { Pencil, Trash2, Plus, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  _id: string;
  nom: string;
  email: string;
  role: string;
  station?: string;
}

interface Station {
  _id: string;
  nomStation: string;
  employes?: any[];
  pompes?: any[];
  services?: any[];
}

const API_URL = 'http://localhost:5000/api/auth';
const STATIONS_API_URL = 'http://localhost:5000/api/stations';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    role: 'manager',
    station: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]); // New state for stations
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');

  if (!user || user.role !== 'admin') {
    navigate('/profile');
    return null;
  }

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour voir les utilisateurs.');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        setError(err.response?.data?.message || 'Erreur lors de la récupération des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    const fetchStations = async () => {
      try {
        const response = await axios.get(STATIONS_API_URL);
        if (Array.isArray(response.data)) {
          setStations(response.data);
        } else {
          throw new Error('Invalid API response: Expected an array of stations');
        }
      } catch (err: any) {
        console.error('Erreur lors de la récupération des stations:', err);
        setError(err.response?.data?.message || 'Erreur lors de la récupération des stations');
      }
    };

    fetchUsers();
    fetchStations();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté pour modifier un utilisateur.');
      setTimeout(() => navigate('/login'), 1500);
      setLoading(false);
      return;
    }

    try {
      if (editingUser) {
        await axios.put(
          `${API_URL}/users/${editingUser._id}`,
          {
            nom: formData.nom,
            email: formData.email,
            role: formData.role,
            station: formData.role === 'manager' ? formData.station : undefined,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSuccess('Utilisateur mis à jour avec succès !');
      } else {
        await axios.post(
          `${API_URL}/register`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSuccess('Utilisateur ajouté avec succès !');
      }

      setTimeout(async () => {
        setFormData({ nom: '', email: '', password: '', role: 'manager', station: '' });
        setEditingUser(null);
        setShowForm(false);
        try {
          const usersResponse = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsers(usersResponse.data);
        } catch (err: any) {
          console.error('Erreur lors de la récupération des utilisateurs après mise à jour:', err);
          setError(err.response?.data?.message || 'Erreur lors de la récupération des utilisateurs');
        }
      }, 1500);
    } catch (err: any) {
      console.error("Erreur lors de l'opération:", err);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 1500);
      } else if (err.response?.data?.error) {
        setError(`${err.response.data.message}: ${err.response.data.error}`);
      } else {
        setError(err.response?.data?.message || "Erreur lors de l'opération");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom,
      email: user.email,
      password: '',
      role: user.role,
      station: user.station || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (userId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté pour supprimer un utilisateur.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Utilisateur supprimé avec succès !');
      setUsers(users.filter(user => user._id !== userId));
    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur');
    }
  };

  // Filtrage des utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearchQuery =
      user.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole ? user.role === filterRole : true;

    return matchesSearchQuery && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Gestion des Utilisateurs</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white"
            >
              <option value="">Tous les rôles</option>
              <option value="manager">Manager</option>
              <option value="mainManager">Main Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
          >
            {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {showForm ? 'Fermer' : 'Ajouter un Utilisateur'}
          </button>
        </div>
      </div>

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

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="mb-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  placeholder="Entrez le nom"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  placeholder="Entrez l'email"
                  required
                  disabled={loading}
                />
              </div>
              {!editingUser && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mot de Passe</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                    placeholder="Entrez le mot de passe"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-10 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                  disabled={loading}
                >
                  <option value="manager">Manager</option>
                  <option value="mainManager">Main Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {formData.role === 'manager' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Station (optionnel)</label>
                  <select
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                    disabled={loading}
                  >
                    <option value="">Aucune station</option>
                    {stations.map(station => (
                      <option key={station._id} value={station._id}>
                        {station.nomStation}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({ nom: '', email: '', password: '', role: 'manager', station: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all duration-300 shadow-md"
              >
                Annuler
              </button>
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
                    {editingUser ? 'Mise à jour...' : 'Ajout...'}
                  </span>
                ) : (
                  editingUser ? 'Modifier l’Utilisateur' : 'Ajouter l’Utilisateur'
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden"
      >
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Rôle</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Station</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            <AnimatePresence>
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-700 transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{user.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-blue-500 text-white'
                          : user.role === 'mainManager'
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : user.role === 'mainManager' ? 'Main Manager' : 'Manager'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {user.station
                      ? stations.find(station => station._id === user.station)?.nomStation || 'Aucune station'
                      : 'Aucune station'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-pink-500 hover:text-pink-400 transition-colors duration-200 mr-4"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-pink-500 hover:text-pink-400 transition-colors duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-400 p-6">Aucun utilisateur trouvé.</div>
        )}
      </motion.div>
    </div>
  );
};

export default Admin;