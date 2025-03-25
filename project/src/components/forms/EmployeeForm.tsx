import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

interface Employee {
  _id: string;
  idEmploye?: number;
  nomEmploye: string;
  prenomEmploye: string;
  emailEmploye: string;
  telephoneEmploye: string;
  position: string;
  startDate: string;
  station?: { _id: string; nomStation: string };
  adresseEmploye: string;
  presences?: string[];
  plannings?: string[];
  image?: string;
}

interface Station {
  _id: string;
  nomStation: string;
}

const API_URL = 'http://localhost:5000/api/employes';
const STATIONS_API_URL = 'http://localhost:5000/api/stations';

const EmployeeForm = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    prenomEmploye: '',
    nomEmploye: '',
    emailEmploye: '',
    telephoneEmploye: '',
    position: 'manager',
    startDate: '',
    station: user?.role !== 'admin' && user?.station ? user.station : '', // Pre-select station for non-admins
    adresseEmploye: '',
    image: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
    fetchStations();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setEmployees(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération:', error);
      setError('Impossible de charger les employés');
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
    } catch (error: any) {
      console.error('Erreur lors de la récupération des stations:', error);
      setError('Impossible de charger les stations');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.nomEmploye ||
      !formData.prenomEmploye ||
      !formData.emailEmploye ||
      !formData.telephoneEmploye ||
      !formData.adresseEmploye ||
      !formData.position ||
      !formData.startDate
    ) {
      setError('Tous les champs obligatoires doivent être remplis.');
      return;
    }

    const normalizedEmail = formData.emailEmploye.trim().toLowerCase();

    const employeeData = {
      nomEmploye: formData.nomEmploye.trim(),
      prenomEmploye: formData.prenomEmploye.trim(),
      adresseEmploye: formData.adresseEmploye.trim(),
      telephoneEmploye: formData.telephoneEmploye.trim(),
      emailEmploye: normalizedEmail,
      position: formData.position,
      startDate: formData.startDate,
      station: formData.station || undefined,
    };

    try {
      let response;
      if (formData.image) {
        const dataToSend = new FormData();
        Object.entries(employeeData).forEach(([key, value]) => {
          if (value !== undefined) {
            dataToSend.append(key, value);
          }
        });
        dataToSend.append('image', formData.image);

        console.log('Données envoyées (avec image):');
        for (const [key, value] of dataToSend.entries()) {
          console.log(`${key}:`, value instanceof File ? value.name : value);
        }

        if (editingId) {
          response = await axios.put(`${API_URL}/${editingId}`, dataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          response = await axios.post(API_URL, dataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        console.log('Données envoyées (sans image):', employeeData);

        if (editingId) {
          response = await axios.put(`${API_URL}/${editingId}`, employeeData, {
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          response = await axios.post(API_URL, employeeData, {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      console.log('Réponse:', response.data);
      if (editingId) {
        setEmployees(employees.map(emp => emp._id === editingId ? response.data : emp));
        setEditingId(null);
      } else {
        setEmployees([...employees, response.data]);
      }

      setFormData({
        prenomEmploye: '',
        nomEmploye: '',
        emailEmploye: '',
        telephoneEmploye: '',
        position: 'manager',
        startDate: '',
        station: user?.role !== 'admin' && user?.station ? user.station : '', // Reset to user's station for non-admins
        adresseEmploye: '',
        image: null,
      });
      setImagePreview(null);
      setShowForm(false);
      fetchEmployees();
      setError(null);
    } catch (error: any) {
      console.error('Erreur détaillée:', error.response ? error.response.data : error.message);
      setError(error.response?.data?.message || 'Une erreur est survenue sur le serveur');
    }
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      prenomEmploye: employee.prenomEmploye,
      nomEmploye: employee.nomEmploye,
      emailEmploye: employee.emailEmploye,
      telephoneEmploye: employee.telephoneEmploye,
      position: employee.position,
      startDate: new Date(employee.startDate).toISOString().split('T')[0],
      station: employee.station?._id || '',
      adresseEmploye: employee.adresseEmploye,
      image: null,
    });
    setImagePreview(employee.image || null);
    setEditingId(employee._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet employé ?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setEmployees(employees.filter(emp => emp._id !== id));
        setError(null);
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        setError(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearchQuery =
      `${employee.prenomEmploye} ${employee.nomEmploye}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.emailEmploye.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.telephoneEmploye.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStationFilter = filterStation ? employee.station?._id === filterStation : true;

    const matchesUserStation =
      user?.role === 'admin' || !user?.station
        ? true
        : employee.station?._id === user.station;

    return matchesSearchQuery && matchesStationFilter && matchesUserStation;
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
        <h1 className="text-3xl font-bold text-white">Gestion des Employés</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, email ou téléphone..."
              className="px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {/* Ajout du filtrage par station (only for admins) */}
          {user?.role === 'admin' && (
            <div className="relative">
              <select
                value={filterStation}
                onChange={(e) => setFilterStation(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white"
              >
                <option value="">Toutes les stations</option>
                {stations.map(station => (
                  <option key={station._id} value={station._id}>
                    {station.nomStation}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => navigate('/planning')}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
          >
            Planning
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
          >
            {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {showForm ? 'Fermer' : 'Ajouter un Employé'}
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Prénom</label>
                <input
                  type="text"
                  value={formData.prenomEmploye}
                  onChange={(e) => setFormData({ ...formData, prenomEmploye: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.nomEmploye}
                  onChange={(e) => setFormData({ ...formData, nomEmploye: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.emailEmploye}
                  onChange={(e) => setFormData({ ...formData, emailEmploye: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephoneEmploye}
                  onChange={(e) => setFormData({ ...formData, telephoneEmploye: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Adresse</label>
                <input
                  type="text"
                  value={formData.adresseEmploye}
                  onChange={(e) => setFormData({ ...formData, adresseEmploye: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Poste</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                >
                  <option value="manager">Manager</option>
                  <option value="cashier">Caissier(ère)</option>
                  <option value="attendant">Pompiste</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date de début</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Station</label>
                {user?.role === 'admin' ? (
                  <select
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  >
                    <option value="">Aucune station</option>
                    {stations.map(station => (
                      <option key={station._id} value={station._id}>
                        {station.nomStation}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={
                      stations.find(station => station._id === formData.station)?.nomStation || 'Aucune station'
                    }
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
                    disabled
                  />
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    prenomEmploye: '',
                    nomEmploye: '',
                    emailEmploye: '',
                    telephoneEmploye: '',
                    position: 'manager',
                    startDate: '',
                    station: user?.role !== 'admin' && user?.station ? user.station : '',
                    adresseEmploye: '',
                    image: null,
                  });
                  setImagePreview(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
              >
                {editingId ? 'Modifier l’Employé' : 'Ajouter l’Employé'}
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Photo</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Téléphone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Poste</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Date de début</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Station</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            <AnimatePresence>
              {filteredEmployees.map((employee) => (
                <motion.tr
                  key={employee._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-700 transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.image ? (
                      <img
                        src={employee.image}
                        alt={`${employee.prenomEmploye} ${employee.nomEmploye}`}
                        className="w-12 h-12 object-cover rounded-full border-2 border-gray-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400">
                        <span>{employee.prenomEmploye[0]}{employee.nomEmploye[0]}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    {employee.prenomEmploye} {employee.nomEmploye}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{employee.emailEmploye}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{employee.telephoneEmploye}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.position === 'manager'
                          ? 'bg-blue-500 text-white'
                          : employee.position === 'cashier'
                          ? 'bg-green-500 text-white'
                          : employee.position === 'attendant'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}
                    >
                      {employee.position === 'manager'
                        ? 'Manager'
                        : employee.position === 'cashier'
                        ? 'Caissier(ère)'
                        : employee.position === 'attendant'
                        ? 'Pompiste'
                        : 'Maintenance'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {new Date(employee.startDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {employee.station ? employee.station.nomStation : 'Aucune station'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-pink-500 hover:text-pink-400 transition-colors duration-200 mr-4"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee._id)}
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
        {filteredEmployees.length === 0 && (
          <div className="text-center text-gray-400 p-6">Aucun employé trouvé.</div>
        )}
      </motion.div>
    </div>
  );
};

export default EmployeeForm;