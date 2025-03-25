import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search, MapPin, Fuel, Phone, Mail, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Station {
  _id: string;
  nomStation: string;
  adresseStation: string;
  villeStation: string;
  telephoneStation: string;
  emailStation: string;
  capacity: number; // Rétabli
  nombrePompes: number;
  employes?: string[];
}

const API_URL = 'http://localhost:5000/api/stations';

const StationForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nomStation: '',
    adresseStation: '',
    villeStation: '',
    telephoneStation: '',
    emailStation: '',
    capacity: 0, // Rétabli
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('nomStation-asc');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await axios.get(API_URL);
      console.log('Raw response data:', response.data);
      if (Array.isArray(response.data)) {
        const validStations = response.data
          .filter(
            (station): station is Station =>
              station &&
              typeof station === 'object' &&
              typeof station._id === 'string' &&
              typeof station.nomStation === 'string' &&
              typeof station.adresseStation === 'string' &&
              typeof station.villeStation === 'string' &&
              typeof station.telephoneStation === 'string' &&
              typeof station.emailStation === 'string'
          )
          .map(station => ({
            ...station,
            capacity: typeof station.capacity === 'number' ? station.capacity : 0, // Rétabli
            nombrePompes: typeof station.nombrePompes === 'number' ? station.nombrePompes : 0,
          }));
        console.log('Filtered stations:', validStations);
        setStations(validStations);
        setFilteredStations(validStations);
      } else {
        throw new Error('Invalid API response: Expected an array');
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération:', error);
      setError('Impossible de charger les stations');
      setStations([]);
      setFilteredStations([]);
    }
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.nomStation) errors.nomStation = 'Le nom de la station est requis';
    if (!formData.adresseStation) errors.adresseStation = "L'adresse est requise";
    if (!formData.villeStation) errors.villeStation = 'La ville est requise';
    if (!formData.telephoneStation) errors.telephoneStation = 'Le téléphone est requis';
    else if (!/^\+?\d{10,}$/.test(formData.telephoneStation)) {
      errors.telephoneStation = 'Le numéro de téléphone doit contenir au moins 10 chiffres';
    }
    if (!formData.emailStation) errors.emailStation = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailStation)) {
      errors.emailStation = 'Veuillez entrer une adresse email valide';
    }
    if (formData.capacity <= 0) errors.capacity = 'La capacité doit être supérieure à 0'; // Rétabli
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSend = {
      nomStation: formData.nomStation,
      adresseStation: formData.adresseStation,
      villeStation: formData.villeStation,
      telephoneStation: formData.telephoneStation,
      emailStation: formData.emailStation,
      capacity: formData.capacity, // Rétabli
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, dataToSend);
        setStations(stations.map(station => (station._id === editingId ? { ...dataToSend, _id: editingId, nombrePompes: station.nombrePompes } : station)));
        setEditingId(null);
      } else {
        const response = await axios.post(API_URL, dataToSend);
        setStations([...stations, { ...response.data, nombrePompes: response.data.nombrePompes || 0 }]);
      }
      setFormData({
        nomStation: '',
        adresseStation: '',
        villeStation: '',
        telephoneStation: '',
        emailStation: '',
        capacity: 0, // Rétabli
      });
      setShowForm(false);
      fetchStations();
      setError(null);
      setFormErrors({});
    } catch (error: any) {
      console.error('Erreur détaillée:', error.response ? error.response.data : error.message);
      setError(error.response?.data?.message || 'Erreur lors de la soumission');
    }
  };

  const handleEdit = (station: Station) => {
    setFormData({
      nomStation: station.nomStation,
      adresseStation: station.adresseStation,
      villeStation: station.villeStation,
      telephoneStation: station.telephoneStation,
      emailStation: station.emailStation,
      capacity: station.capacity, // Rétabli
    });
    setEditingId(station._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette station ?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setStations(stations.filter(station => station._id !== id));
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      nomStation: '',
      adresseStation: '',
      villeStation: '',
      telephoneStation: '',
      emailStation: '',
      capacity: 0, // Rétabli
    });
    setEditingId(null);
    setShowForm(false);
    setError(null);
    setFormErrors({});
  };

  useEffect(() => {
    let filtered = [...stations];

    // Apply city filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(station => station.villeStation.toLowerCase() === cityFilter.toLowerCase());
    }

    // Apply search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        station =>
          (station.nomStation ?? '').toLowerCase().includes(searchLower) ||
          (station.adresseStation ?? '').toLowerCase().includes(searchLower) ||
          (station.villeStation ?? '').toLowerCase().includes(searchLower) ||
          (station.telephoneStation ?? '').toLowerCase().includes(searchLower) ||
          (station.emailStation ?? '').toLowerCase().includes(searchLower) ||
          (station.capacity?.toString() ?? '').includes(searchQuery) // Rétabli
      );
    }

    // Apply sorting
    if (sortOption) {
      const [key, direction] = sortOption.split('-') as [string, 'asc' | 'desc'];
      filtered.sort((a, b) => {
        let aValue: any = a[key as keyof Station];
        let bValue: any = b[key as keyof Station];

        if (key === 'capacity') { // Rétabli
          aValue = a.capacity;
          bValue = b.capacity;
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }

    setFilteredStations(filtered);
  }, [stations, searchQuery, cityFilter, sortOption]);

  // Get unique cities for the filter
  const uniqueCities = Array.from(new Set(stations.map(station => station.villeStation.toLowerCase()))).sort();

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-gray-200">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <MapPin className="h-8 w-8 text-pink-500" />
          Gestion des Stations
        </h1>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, localisation, ville, téléphone, email ou capacité..."
              className="px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => navigate('/employees')}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
          >
            Employés
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
          >
            {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {showForm ? 'Fermer' : 'Ajouter une Station'}
          </button>
        </div>
      </div>

      {/* Filters and Sorting */}
      {!showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
        >
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 text-white"
              aria-label="Filtrer par ville"
            >
              <option value="all">Toutes les villes</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400">Trier par:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 text-white"
              aria-label="Trier les stations"
            >
              <option value="nomStation-asc">Nom (A-Z)</option>
              <option value="nomStation-desc">Nom (Z-A)</option>
              <option value="adresseStation-asc">Adresse (A-Z)</option>
              <option value="adresseStation-desc">Adresse (Z-A)</option>
              <option value="villeStation-asc">Ville (A-Z)</option>
              <option value="villeStation-desc">Ville (Z-A)</option>
              <option value="telephoneStation-asc">Téléphone (A-Z)</option>
              <option value="telephoneStation-desc">Téléphone (Z-A)</option>
              <option value="emailStation-asc">Email (A-Z)</option>
              <option value="emailStation-desc">Email (Z-A)</option>
              <option value="capacity-asc">Capacité (Croissant)</option> {/* Rétabli */}
              <option value="capacity-desc">Capacité (Décroissant)</option> {/* Rétabli */}
            </select>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-8 p-4 bg-pink-900/80 backdrop-blur-sm text-pink-100 rounded-lg shadow-lg flex justify-between items-center"
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-pink-200 hover:text-pink-100" aria-label="Fermer l'erreur">
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}

      {/* Form Section */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="mb-10 bg-gray-800/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-gray-700/50"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">
              {editingId ? 'Modifier la Station' : 'Ajouter une Nouvelle Station'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="nomStation">
                    Nom de la Station
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="nomStation"
                      type="text"
                      value={formData.nomStation}
                      onChange={(e) => setFormData({ ...formData, nomStation: e.target.value })}
                      className={`w-full pl-10 pr-4 py-2 border ${formErrors.nomStation ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200`}
                      aria-invalid={!!formErrors.nomStation}
                      aria-describedby={formErrors.nomStation ? 'nomStation-error' : undefined}
                    />
                  </div>
                  {formErrors.nomStation && (
                    <p id="nomStation-error" className="text-pink-500 text-xs mt-1">{formErrors.nomStation}</p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="adresseStation">
                    Adresse
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="adresseStation"
                      type="text"
                      value={formData.adresseStation}
                      onChange={(e) => setFormData({ ...formData, adresseStation: e.target.value })}
                      className={`w-full pl-10 pr-4 py-2 border ${formErrors.adresseStation ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200`}
                      aria-invalid={!!formErrors.adresseStation}
                      aria-describedby={formErrors.adresseStation ? 'adresseStation-error' : undefined}
                    />
                  </div>
                  {formErrors.adresseStation && (
                    <p id="adresseStation-error" className="text-pink-500 text-xs mt-1">{formErrors.adresseStation}</p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="villeStation">
                    Ville
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="villeStation"
                      type="text"
                      value={formData.villeStation}
                      onChange={(e) => setFormData({ ...formData, villeStation: e.target.value })}
                      className={`w-full pl-10 pr-4 py-2 border ${formErrors.villeStation ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200`}
                      aria-invalid={!!formErrors.villeStation}
                      aria-describedby={formErrors.villeStation ? 'villeStation-error' : undefined}
                    />
                  </div>
                  {formErrors.villeStation && (
                    <p id="villeStation-error" className="text-pink-500 text-xs mt-1">{formErrors.villeStation}</p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="telephoneStation">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="telephoneStation"
                      type="tel"
                      value={formData.telephoneStation}
                      onChange={(e) => setFormData({ ...formData, telephoneStation: e.target.value })}
                      className={`w-full pl-10 pr-4 py-2 border ${formErrors.telephoneStation ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200`}
                      aria-invalid={!!formErrors.telephoneStation}
                      aria-describedby={formErrors.telephoneStation ? 'telephoneStation-error' : undefined}
                    />
                  </div>
                  {formErrors.telephoneStation && (
                    <p id="telephoneStation-error" className="text-pink-500 text-xs mt-1">{formErrors.telephoneStation}</p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="emailStation">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="emailStation"
                      type="email"
                      value={formData.emailStation}
                      onChange={(e) => setFormData({ ...formData, emailStation: e.target.value })}
                      className={`w-full pl-10 pr-4 py-2 border ${formErrors.emailStation ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200`}
                      aria-invalid={!!formErrors.emailStation}
                      aria-describedby={formErrors.emailStation ? 'emailStation-error' : undefined}
                    />
                  </div>
                  {formErrors.emailStation && (
                    <p id="emailStation-error" className="text-pink-500 text-xs mt-1">{formErrors.emailStation}</p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="capacity">
                    Nombre de pompes
                  </label>
                  <div className="relative">
                    <Fuel className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                      className={`w-full pl-10 pr-4 py-2 border ${formErrors.capacity ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200`}
                      min="0"
                      aria-invalid={!!formErrors.capacity}
                      aria-describedby={formErrors.capacity ? 'capacity-error' : undefined}
                    />
                  </div>
                  {formErrors.capacity && (
                    <p id="capacity-error" className="text-pink-500 text-xs mt-1">{formErrors.capacity}</p>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all duration-300 shadow-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
                >
                  {editingId ? 'Modifier la Station' : 'Ajouter la Station'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Section */}
      {!showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 overflow-x-auto"
        >
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ville
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Nombre de pompes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <AnimatePresence>
                {filteredStations.map((station, index) => (
                  <motion.tr
                    key={station._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{station.nomStation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{station.adresseStation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{station.villeStation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{station.telephoneStation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{station.emailStation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{station.capacity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => handleEdit(station)}
                          className="group relative text-pink-500 hover:text-pink-400 transition-colors duration-200"
                          aria-label={`Modifier la station ${station.nomStation}`}
                        >
                          <Pencil className="h-5 w-5" />
                          <span className="absolute hidden group-hover:block -top-8 left-1/2 transform -translate-x-1/2 bg-gray-700 text-xs text-white px-2 py-1 rounded shadow">
                            Modifier
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(station._id)}
                          className="group relative text-pink-500 hover:text-pink-400 transition-colors duration-200"
                          aria-label={`Supprimer la station ${station.nomStation}`}
                        >
                          <Trash2 className="h-5 w-5" />
                          <span className="absolute hidden group-hover:block -top-8 left-1/2 transform -translate-x-1/2 bg-gray-700 text-xs text-white px-2 py-1 rounded shadow">
                            Supprimer
                          </span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredStations.length === 0 && (
            <div className="text-center text-gray-400 p-8">Aucune station trouvée.</div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default StationForm;