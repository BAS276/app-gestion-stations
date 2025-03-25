import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search } from 'lucide-react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext'; // Import useAuth to access user data

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Tank {
  _id: string;
  number: string;
  fuelType: string;
  capacity: string;
  currentLevel: string;
  lastRefill: string;
  minLevel: string;
  station?: { _id: string; nomStation: string };
}

interface Station {
  _id: string;
  nomStation: string;
}

const API_URL = 'http://localhost:5000/api/citernes';
const STATIONS_API_URL = 'http://localhost:5000/api/stations';

const TankForm = () => {
  const { user } = useAuth(); // Get the logged-in user from AuthContext
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    fuelType: '',
    capacity: '',
    currentLevel: '',
    lastRefill: '',
    minLevel: '',
    station: user?.role !== 'admin' && user?.station ? user.station : '', // Pre-select station for non-admins
  });
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [filteredTanks, setFilteredTanks] = useState<Tank[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStation, setFilterStation] = useState(''); // For manual station filter
  const [sortConfig, setSortConfig] = useState<{ key: keyof Tank; direction: 'asc' | 'desc' } | null>(null);
  const [selectedTank, setSelectedTank] = useState<string | null>(null);

  useEffect(() => {
    fetchTanks();
    fetchStations();
  }, []);

  useEffect(() => {
    let filtered = [...tanks];

    // Filter by user's station for non-admins
    if (user?.role !== 'admin' && user?.station) {
      filtered = filtered.filter(tank => tank.station?._id === user.station);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        tank =>
          tank.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tank.fuelType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tank.station?.nomStation.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by station (manual filter, only for admins)
    if (filterStation && user?.role === 'admin') {
      filtered = filtered.filter(tank => tank.station?._id === filterStation);
    }

    // Filter by selected tank (from chart click)
    if (selectedTank) {
      filtered = filtered.filter(tank => `Citerne ${tank.number} (${tank.fuelType})` === selectedTank);
    }

    // Sort the filtered tanks
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (sortConfig.key === 'capacity' || sortConfig.key === 'currentLevel' || sortConfig.key === 'minLevel') {
          const aNum = parseFloat(aValue);
          const bNum = parseFloat(bValue);
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        if (sortConfig.key === 'station') {
          const aStation = a.station?.nomStation || '';
          const bStation = b.station?.nomStation || '';
          return sortConfig.direction === 'asc'
            ? aStation.localeCompare(bStation)
            : bStation.localeCompare(aStation);
        }
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }

    setFilteredTanks(filtered);
  }, [tanks, searchQuery, filterStation, sortConfig, selectedTank, user]);

  const fetchTanks = async () => {
    try {
      const response = await axios.get(API_URL);
      setTanks(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des citernes:', error);
      setError('Impossible de charger les données. Veuillez réessayer.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        number: formData.number,
        fuelType: formData.fuelType,
        capacity: parseFloat(formData.capacity),
        currentLevel: parseFloat(formData.currentLevel),
        lastRefill: formData.lastRefill,
        minLevel: parseFloat(formData.minLevel),
        station: formData.station,
      };

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, dataToSend);
        setTanks(tanks.map(tank => (tank._id === editingId ? { ...dataToSend, _id: editingId, station: stations.find(s => s._id === formData.station) } : tank)));
        setEditingId(null);
      } else {
        const response = await axios.post(API_URL, dataToSend);
        setTanks([...tanks, response.data]);
      }
      setFormData({
        number: '',
        fuelType: '',
        capacity: '',
        currentLevel: '',
        lastRefill: '',
        minLevel: '',
        station: user?.role !== 'admin' && user?.station ? user.station : '', // Reset to user's station for non-admins
      });
      setShowForm(false);
      setError(null);
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.response?.data?.message || 'Une erreur est survenue lors de la sauvegarde.');
    }
  };

  const handleEdit = (tank: Tank) => {
    setFormData({
      number: tank.number,
      fuelType: tank.fuelType,
      capacity: tank.capacity.toString(),
      currentLevel: tank.currentLevel.toString(),
      lastRefill: tank.lastRefill,
      minLevel: tank.minLevel.toString(),
      station: tank.station?._id || '',
    });
    setEditingId(tank._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette citerne ?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setTanks(tanks.filter(tank => tank._id !== id));
        setError(null);
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression. Veuillez réessayer.');
      }
    }
  };

  const handleSort = (key: keyof Tank) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Fuel type color mapping for professionalism
  const fuelColors: { [key: string]: string } = {
    sp95: 'rgba(75, 192, 192, 0.6)',  // Teal
    sp98: 'rgba(255, 159, 64, 0.6)',  // Orange
    diesel: 'rgba(153, 102, 255, 0.6)', // Purple
    e85: 'rgba(54, 162, 235, 0.6)',    // Blue
  };

  // Chart.js Data Configuration (only show tanks visible to the user)
  const visibleTanks = user?.role === 'admin' || !user?.station ? tanks : tanks.filter(tank => tank.station?._id === user.station);

  const chartData = {
    labels: visibleTanks.map(tank => `Citerne ${tank.number} (${tank.fuelType}) - ${tank.station?.nomStation || 'Sans station'}`),
    datasets: [
      {
        label: 'Capacité (L)',
        data: visibleTanks.map(tank => parseFloat(tank.capacity)),
        backgroundColor: visibleTanks.map(tank => fuelColors[tank.fuelType] || 'rgba(54, 162, 235, 0.6)'),
        borderColor: visibleTanks.map(tank => fuelColors[tank.fuelType]?.replace('0.6', '1') || 'rgba(54, 162, 235, 1)'),
        borderWidth: 1,
      },
      {
        label: 'Niveau Actuel (L)',
        data: visibleTanks.map(tank => parseFloat(tank.currentLevel)),
        backgroundColor: visibleTanks.map(tank => fuelColors[tank.fuelType]?.replace('0.6', '0.3') || 'rgba(54, 162, 235, 0.3)'),
        borderColor: visibleTanks.map(tank => fuelColors[tank.fuelType]?.replace('0.6', '1') || 'rgba(54, 162, 235, 1)'),
        borderWidth: 1,
      },
    ],
  };

  // Chart.js Options for a Professional Look
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 14,
            family: 'Inter, sans-serif',
          },
        },
      },
      title: {
        display: true,
        text: 'Capacité et Niveau Actuel des Citernes',
        color: '#ffffff',
        font: {
          size: 18,
          weight: 'bold' as const,
          family: 'Inter, sans-serif',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} L`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#d1d5db',
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#d1d5db',
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          callback: (value: number) => `${value} L`,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        title: {
          display: true,
          text: 'Volume (Litres)',
          color: '#ffffff',
          font: {
            size: 14,
            weight: 'bold' as const,
            family: 'Inter, sans-serif',
          },
        },
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const label = chartData.labels[index];
        setSelectedTank(selectedTank === label ? null : label);
      }
    },
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Gestion des Citernes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
        >
          {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {showForm ? 'Fermer' : 'Ajouter une Citerne'}
        </button>
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
        {showForm ? (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="mb-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Numéro de Citerne</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type de Carburant</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                >
                  <option value="">Sélectionner un type</option>
                  <option value="sp95">Sans Plomb 95</option>
                  <option value="sp98">Sans Plomb 98</option>
                  <option value="diesel">Diesel</option>
                  <option value="e85">E85</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Capacité (L)</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Niveau Actuel (L)</label>
                <input
                  type="number"
                  value={formData.currentLevel}
                  onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Dernier Remplissage</label>
                <input
                  type="date"
                  value={formData.lastRefill}
                  onChange={(e) => setFormData({ ...formData, lastRefill: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Niveau Minimum (L)</label>
                <input
                  type="number"
                  value={formData.minLevel}
                  onChange={(e) => setFormData({ ...formData, minLevel: e.target.value })}
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
                    required
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
                    number: '',
                    fuelType: '',
                    capacity: '',
                    currentLevel: '',
                    lastRefill: '',
                    minLevel: '',
                    station: user?.role !== 'admin' && user?.station ? user.station : '',
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all duration-300 shadow-md"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
              >
                {editingId ? 'Modifier la Citerne' : 'Ajouter la Citerne'}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
              <div className="h-96">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par numéro, type de carburant ou station..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 placeholder-gray-400"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
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
              {selectedTank && (
                <button
                  onClick={() => setSelectedTank(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all duration-200 shadow-md"
                >
                  Réinitialiser le Filtre
                </button>
              )}
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-700 text-gray-300 uppercase text-sm tracking-wider">
                  <tr>
                    <th
                      className="px-6 py-4 font-semibold cursor-pointer hover:text-pink-500 transition-colors duration-200"
                      onClick={() => handleSort('number')}
                    >
                      Numéro {sortConfig?.key === 'number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-4 font-semibold cursor-pointer hover:text-pink-500 transition-colors duration-200"
                      onClick={() => handleSort('fuelType')}
                    >
                      Type de Carburant {sortConfig?.key === 'fuelType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-4 font-semibold cursor-pointer hover:text-pink-500 transition-colors duration-200"
                      onClick={() => handleSort('capacity')}
                    >
                      Capacité (L) {sortConfig?.key === 'capacity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-4 font-semibold cursor-pointer hover:text-pink-500 transition-colors duration-200"
                      onClick={() => handleSort('currentLevel')}
                    >
                      Niveau Actuel (L) {sortConfig?.key === 'currentLevel' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-4 font-semibold cursor-pointer hover:text-pink-500 transition-colors duration-200"
                      onClick={() => handleSort('lastRefill')}
                    >
                      Dernier Remplissage {sortConfig?.key === 'lastRefill' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-4 font-semibold cursor-pointer hover:text-pink-500 transition-colors duration-200"
                      onClick={() => handleSort('minLevel')}
                    >
                      Niveau Minimum (L) {sortConfig?.key === 'minLevel' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-4 font-semibold cursor-pointer hover:text-pink-500 transition-colors duration-200"
                      onClick={() => handleSort('station')}
                    >
                      Station {sortConfig?.key === 'station' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <AnimatePresence>
                    {filteredTanks.map((tank) => (
                      <motion.tr
                        key={tank._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-700 transition-all duration-200"
                      >
                        <td className="px-6 py-4 text-white font-medium">{tank.number}</td>
                        <td className="px-6 py-4 text-white">
                          {tank.fuelType === 'sp95' && 'Sans Plomb 95'}
                          {tank.fuelType === 'sp98' && 'Sans Plomb 98'}
                          {tank.fuelType === 'diesel' && 'Diesel'}
                          {tank.fuelType === 'e85' && 'E85'}
                        </td>
                        <td className="px-6 py-4 text-white">{tank.capacity} L</td>
                        <td className="px-6 py-4 text-white">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              parseFloat(tank.currentLevel) <= parseFloat(tank.minLevel)
                                ? 'bg-pink-500 text-white'
                                : 'bg-green-500 text-white'
                            }`}
                          >
                            {tank.currentLevel} L
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white">{tank.lastRefill}</td>
                        <td className="px-6 py-4 text-white">{tank.minLevel} L</td>
                        <td className="px-6 py-4 text-white">{tank.station?.nomStation || 'Aucune station'}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(tank)}
                            className="text-pink-500 hover:text-pink-400 transition-colors duration-200 mr-4"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tank._id)}
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
              {filteredTanks.length === 0 && (
                <div className="text-center text-gray-400 p-6">Aucune citerne trouvée.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TankForm;