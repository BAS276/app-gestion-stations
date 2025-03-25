import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext'; // Import useAuth to access user data

interface Pump {
  _id: string;
  number: string;
  fuelType: string;
  status: string;
  lastMaintenance: string;
  tank: { _id: string; number: string; fuelType: string } | null;
  station: { _id: string; nomStation: string } | null;
}

interface Station {
  _id: string;
  nomStation: string;
}

interface Tank {
  _id: string;
  number: string;
  fuelType: string;
  station: { _id: string; nomStation: string };
}

const API_URL = 'http://localhost:5000/api/pompes';
const STATIONS_API_URL = 'http://localhost:5000/api/stations';
const TANKS_API_URL = 'http://localhost:5000/api/citernes';

const PumpForm = () => {
  const { user } = useAuth(); // Get the logged-in user from AuthContext
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    fuelType: '',
    status: '',
    lastMaintenance: '',
    tank: '',
    station: user?.role !== 'admin' && user?.station ? user.station : '', // Pre-select station for non-admins
  });
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [filteredPumps, setFilteredPumps] = useState<Pump[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [filteredTanks, setFilteredTanks] = useState<Tank[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all'); // Station filter for admins
  const [sortOption, setSortOption] = useState<string>('number-asc');
  const [loading, setLoading] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});

  useEffect(() => {
    fetchPumps();
    fetchStations();
    fetchTanks();
  }, []);

  useEffect(() => {
    // Filter tanks based on the selected station in the form
    // For non-admins, the station is pre-selected to user.station
    if (formData.station) {
      const filtered = tanks.filter(tank => tank.station?._id === formData.station);
      setFilteredTanks(filtered);
      if (formData.tank && !filtered.some(tank => tank._id === formData.tank)) {
        setFormData(prev => ({ ...prev, tank: '' }));
      }
    } else {
      // For admins, if no station is selected, show all tanks (or filter by user.station for non-admins)
      setFilteredTanks(user?.role !== 'admin' && user?.station ? tanks.filter(tank => tank.station?._id === user.station) : tanks);
    }
  }, [formData.station, tanks, user]);

  const fetchPumps = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      console.log('Données des pompes:', response.data);
      setPumps(response.data);
      setFilteredPumps(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des pompes:', error);
      setError('Impossible de charger les pompes. Veuillez réessayer.');
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
      setError('Impossible de charger les stations. Veuillez réessayer.');
    }
  };

  const fetchTanks = async () => {
    try {
      const response = await axios.get(TANKS_API_URL);
      if (Array.isArray(response.data)) {
        setTanks(response.data);
        setFilteredTanks(user?.role !== 'admin' && user?.station ? response.data.filter((tank: Tank) => tank.station?._id === user.station) : response.data);
      } else {
        throw new Error('Invalid API response: Expected an array of tanks');
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des citernes:', error);
      setError('Impossible de charger les citernes. Veuillez réessayer.');
    }
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.number) errors.number = 'Le numéro de pompe est requis';
    if (!formData.fuelType) errors.fuelType = 'Le type de carburant est requis';
    if (!formData.status) errors.status = "L'état est requis";
    if (!formData.lastMaintenance) errors.lastMaintenance = 'La date de dernière maintenance est requise';
    if (!formData.tank) errors.tank = 'La citerne est requise';
    if (!formData.station) errors.station = 'La station est requise';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSend = {
      number: formData.number,
      fuelType: formData.fuelType,
      status: formData.status,
      lastMaintenance: formData.lastMaintenance,
      tank: formData.tank,
      station: formData.station,
    };

    try {
      if (editingId) {
        const response = await axios.put(`${API_URL}/${editingId}`, dataToSend);
        setPumps(pumps.map(pump => (pump._id === editingId ? response.data : pump)));
        setEditingId(null);
      } else {
        const response = await axios.post(API_URL, dataToSend);
        setPumps([...pumps, response.data]);
      }
      setFormData({
        number: '',
        fuelType: '',
        status: '',
        lastMaintenance: '',
        tank: '',
        station: user?.role !== 'admin' && user?.station ? user.station : '', // Reset to user's station for non-admins
      });
      setShowForm(false);
      setError(null);
      setFormErrors({});
      await fetchPumps();
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'ajout/modification de la pompe');
    }
  };

  const handleEdit = (pump: Pump) => {
    setFormData({
      number: pump.number,
      fuelType: pump.fuelType,
      status: pump.status,
      lastMaintenance: pump.lastMaintenance.split('T')[0],
      tank: pump.tank?._id || '',
      station: pump.station?._id || '',
    });
    setEditingId(pump._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette pompe ?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setPumps(pumps.filter(pump => pump._id !== id));
        setError(null);
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression de la pompe. Veuillez réessayer.');
      }
    }
  };

  useEffect(() => {
    let filtered = [...pumps];

    // Filter by user's station for non-admins
    if (user?.role !== 'admin' && user?.station) {
      filtered = filtered.filter(pump => pump.station?._id === user.station);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pump => pump.status === statusFilter);
    }

    // Apply station filter (only for admins)
    if (stationFilter !== 'all' && user?.role === 'admin') {
      filtered = filtered.filter(pump => pump.station?._id === stationFilter);
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        pump =>
          pump.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pump.fuelType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (pump.tank?.number?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
          (pump.station?.nomStation?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      );
    }

    // Apply sorting
    if (sortOption) {
      const [key, direction] = sortOption.split('-') as [string, 'asc' | 'desc'];
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (key === 'tank') {
          aValue = a.tank?.number || '';
          bValue = b.tank?.number || '';
        } else if (key === 'station') {
          aValue = a.station?.nomStation || '';
          bValue = b.station?.nomStation || '';
        } else {
          aValue = a[key as keyof Pump];
          bValue = b[key as keyof Pump];
        }

        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }

    setFilteredPumps(filtered);
  }, [pumps, searchQuery, statusFilter, stationFilter, sortOption, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-3xl font-bold text-white">Gestion des Pompes</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par numéro, type, citerne ou station..."
                className="px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white placeholder-gray-400"
                aria-label="Rechercher des pompes"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
              aria-label={showForm ? 'Fermer le formulaire' : 'Ajouter une nouvelle pompe'}
            >
              {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              <span>{showForm ? 'Fermer' : 'Ajouter une Pompe'}</span>
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
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 text-white"
                aria-label="Filtrer par état"
              >
                <option value="all">Tous les états</option>
                <option value="active">En Service</option>
                <option value="maintenance">En Maintenance</option>
                <option value="inactive">Hors Service</option>
              </select>
              {user?.role === 'admin' && (
                <select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 text-white"
                  aria-label="Filtrer par station"
                >
                  <option value="all">Toutes les stations</option>
                  {stations.map(station => (
                    <option key={station._id} value={station._id}>
                      {station.nomStation}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">Trier par:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 text-white"
                aria-label="Trier les pompes"
              >
                <option value="number-asc">Numéro (A-Z)</option>
                <option value="number-desc">Numéro (Z-A)</option>
                <option value="fuelType-asc">Type de Carburant (A-Z)</option>
                <option value="fuelType-desc">Type de Carburant (Z-A)</option>
                <option value="status-asc">État (A-Z)</option>
                <option value="status-desc">État (Z-A)</option>
                <option value="tank-asc">Citerne (A-Z)</option>
                <option value="tank-desc">Citerne (Z-A)</option>
                <option value="station-asc">Station (A-Z)</option>
                <option value="station-desc">Station (Z-A)</option>
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
                {editingId ? 'Modifier la Pompe' : 'Ajouter une Nouvelle Pompe'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="number">
                      Numéro de Pompe
                    </label>
                    <input
                      id="number"
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.number ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white placeholder-gray-400`}
                      placeholder="Ex: P001"
                      aria-invalid={!!formErrors.number}
                      aria-describedby={formErrors.number ? 'number-error' : undefined}
                    />
                    {formErrors.number && (
                      <p id="number-error" className="text-pink-500 text-xs mt-1">{formErrors.number}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="fuelType">
                      Type de Carburant
                    </label>
                    <select
                      id="fuelType"
                      value={formData.fuelType}
                      onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.fuelType ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white`}
                      aria-invalid={!!formErrors.fuelType}
                      aria-describedby={formErrors.fuelType ? 'fuelType-error' : undefined}
                    >
                      <option value="">Sélectionner un type</option>
                      <option value="sp95">Sans Plomb 95</option>
                      <option value="sp98">Sans Plomb 98</option>
                      <option value="diesel">Diesel</option>
                      <option value="e85">E85</option>
                    </select>
                    {formErrors.fuelType && (
                      <p id="fuelType-error" className="text-pink-500 text-xs mt-1">{formErrors.fuelType}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="status">
                      État
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.status ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white`}
                      aria-invalid={!!formErrors.status}
                      aria-describedby={formErrors.status ? 'status-error' : undefined}
                    >
                      <option value="">Sélectionner un état</option>
                      <option value="active">En Service</option>
                      <option value="maintenance">En Maintenance</option>
                      <option value="inactive">Hors Service</option>
                    </select>
                    {formErrors.status && (
                      <p id="status-error" className="text-pink-500 text-xs mt-1">{formErrors.status}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="lastMaintenance">
                      Dernière Maintenance
                    </label>
                    <input
                      id="lastMaintenance"
                      type="date"
                      value={formData.lastMaintenance}
                      onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.lastMaintenance ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white`}
                      aria-invalid={!!formErrors.lastMaintenance}
                      aria-describedby={formErrors.lastMaintenance ? 'lastMaintenance-error' : undefined}
                    />
                    {formErrors.lastMaintenance && (
                      <p id="lastMaintenance-error" className="text-pink-500 text-xs mt-1">{formErrors.lastMaintenance}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="station">
                      Station
                    </label>
                    {user?.role === 'admin' ? (
                      <select
                        id="station"
                        value={formData.station}
                        onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                        className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.station ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white`}
                        aria-invalid={!!formErrors.station}
                        aria-describedby={formErrors.station ? 'station-error' : undefined}
                      >
                        <option value="">Sélectionner une station</option>
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
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        disabled
                      />
                    )}
                    {formErrors.station && (
                      <p id="station-error" className="text-pink-500 text-xs mt-1">{formErrors.station}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="tank">
                      Citerne
                    </label>
                    <select
                      id="tank"
                      value={formData.tank}
                      onChange={(e) => setFormData({ ...formData, tank: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.tank ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white`}
                      aria-invalid={!!formErrors.tank}
                      aria-describedby={formErrors.tank ? 'tank-error' : undefined}
                      disabled={!formData.station}
                    >
                      <option value="">Sélectionner une citerne</option>
                      {filteredTanks.map(tank => (
                        <option key={tank._id} value={tank._id}>
                          {tank.number} ({tank.fuelType})
                        </option>
                      ))}
                    </select>
                    {formErrors.tank && (
                      <p id="tank-error" className="text-pink-500 text-xs mt-1">{formErrors.tank}</p>
                    )}
                  </div>
                </div>
                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({
                        number: '',
                        fuelType: '',
                        status: '',
                        lastMaintenance: '',
                        tank: '',
                        station: user?.role !== 'admin' && user?.station ? user.station : '',
                      });
                      setFormErrors({});
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all duration-300 shadow-md"
                    aria-label="Annuler les modifications"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
                    aria-label={editingId ? 'Modifier la pompe' : 'Ajouter la pompe'}
                  >
                    {editingId ? 'Modifier la Pompe' : 'Ajouter la Pompe'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pump Table Section */}
        {!showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 overflow-x-auto"
          >
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type de Carburant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    État
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Dernière Maintenance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Station
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Citerne
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <AnimatePresence>
                  {filteredPumps.map((pump, index) => (
                    <motion.tr
                      key={pump._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {pump.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {pump.fuelType === 'sp95' && 'Sans Plomb 95'}
                        {pump.fuelType === 'sp98' && 'Sans Plomb 98'}
                        {pump.fuelType === 'diesel' && 'Diesel'}
                        {pump.fuelType === 'e85' && 'E85'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            pump.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : pump.status === 'maintenance'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-pink-500/20 text-pink-500'
                          }`}
                        >
                          {pump.status === 'active' && 'En Service'}
                          {pump.status === 'maintenance' && 'En Maintenance'}
                          {pump.status === 'inactive' && 'Hors Service'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {pump.lastMaintenance.split('T')[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {pump.station?.nomStation || 'Aucune station'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {pump.tank ? `${pump.tank.number} (${pump.tank.fuelType})` : 'Aucune citerne'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEdit(pump)}
                            className="group relative text-pink-500 hover:text-pink-400 transition-colors duration-200"
                            aria-label={`Modifier la pompe ${pump.number}`}
                          >
                            <Pencil className="h-5 w-5" />
                            <span className="absolute hidden group-hover:block -top-8 left-1/2 transform -translate-x-1/2 bg-gray-700 text-xs text-white px-2 py-1 rounded shadow">
                              Modifier
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(pump._id)}
                            className="group relative text-pink-500 hover:text-pink-400 transition-colors duration-200"
                            aria-label={`Supprimer la pompe ${pump.number}`}
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
          </motion.div>
        )}

        {!showForm && filteredPumps.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-400 p-8 bg-gray-800/50 rounded-xl"
          >
            Aucune pompe trouvée.
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PumpForm;