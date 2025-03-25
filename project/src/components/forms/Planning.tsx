import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Trash2, Pencil, Search, Plus, X, User, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';

interface Station {
  _id: string;
  nomStation: string; // Matches backend schema
}

interface Employe {
  _id: string;
  nomEmploye: string; // Changed from 'nom' to 'nomEmploye' to match backend schema
  prenomEmploye: string;
  station: string;
}

interface Schedule {
  _id: string;
  employeeName: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  year: number;
  week: number;
  station?: Station;
}

interface DecodedToken {
  id: string;
  role: string;
  station?: string;
  iat: number;
  exp: number;
}

const API_URL = 'http://localhost:5000/api/plannings';
const STATIONS_API_URL = 'http://localhost:5000/api/stations';
const EMPLOYES_API_URL = 'http://localhost:5000/api/employes';

const Planning = () => {
  const navigate = useNavigate();

  // Utility functions for week calculation
  const getWeekNumber = (date: Date): number => {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    return Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const getWeeksInYear = (year: number): number => {
    const lastDayOfYear = new Date(year, 11, 31);
    return getWeekNumber(lastDayOfYear);
  };

  const getWeekDateRange = (year: number, week: number): string => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToFirstThursday = (4 - (firstDayOfYear.getDay() || 7) + 7) % 7;
    const firstThursday = new Date(year, 0, 1 + daysToFirstThursday);
    const startOfWeek = new Date(firstThursday.getTime());
    startOfWeek.setDate(firstThursday.getDate() - 3 + (week - 1) * 7);
    const endOfWeek = new Date(startOfWeek.getTime());
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
  };

  const currentDate = new Date();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeekNumber(currentDate));
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  const [formData, setFormData] = useState<Schedule>({
    _id: '',
    employeeName: '',
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
    year: currentDate.getFullYear(),
    week: getWeekNumber(currentDate),
    station: { _id: '', nomStation: '' }, 
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'employeeName' | 'totalHours' | 'station'; direction: 'asc' | 'desc' } | null>(null);

  const years = Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i);
  const weeks = Array.from({ length: getWeeksInYear(selectedYear) }, (_, i) => i + 1);

  // Fetch user role, stations, and employees on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        console.log('Decoded Token:', decoded);

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
          console.log('Token is expired');
          setError('Votre session a expirée. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        if (!decoded.role) {
          console.log('No role in token');
          setError('Rôle de l\'utilisateur non défini dans le token. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        setUserRole(decoded.role.toLowerCase());

        // Redirect non-admin users (e.g., "manager") if they don't have a station
        if (decoded.role.toLowerCase() !== 'admin' && !decoded.station) {
          console.log('No station for non-admin user');
          setError('Station de l\'utilisateur non définie dans le token. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
        setError('Token invalide. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
    } else {
      console.log('No token found');
      setError('Aucun token trouvé. Veuillez vous connecter.');
      navigate('/login');
      return;
    }
    fetchStations();
    fetchEmployes();
    fetchSchedules();
  }, [selectedYear, selectedWeek, selectedStationFilter, navigate]);

  // Fetch available stations
  const fetchStations = async () => {
    try {
      const response = await axios.get(STATIONS_API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStations(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des stations:', error);
      if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      setError('Impossible de charger les stations: ' + (error.response?.data?.message || error.message));
    }
  };

  // Fetch employees, filtered by station if selected
  const fetchEmployes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !userRole) return; // Wait until userRole is set

      const decoded: DecodedToken = jwtDecode(token);
      const params = userRole === 'admin' && formData.station?._id 
        ? { station: formData.station._id } 
        : userRole !== 'admin' && decoded.station 
          ? { station: decoded.station } 
          : {};

      console.log('Fetching employees with params:', params);
      const response = await axios.get(EMPLOYES_API_URL, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEmployes(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des employés:', error);
      if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      setError('Impossible de charger les employés: ' + (error.response?.data?.message || error.message));
    }
  };

  // Refetch employees when the station in the form changes (for admins)
  useEffect(() => {
    if (userRole) {
      fetchEmployes();
    }
  }, [formData.station?._id, userRole]);

  useEffect(() => {
    let filtered = [...schedules];
    if (selectedStationFilter) {
      filtered = filtered.filter(schedule => schedule.station?._id === selectedStationFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(schedule =>
        schedule.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (schedule.station?.nomStation || '').toLowerCase().includes(searchQuery.toLowerCase()) 
      );
    }
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: string | number = sortConfig.key === 'station' ? (a.station?.nomStation || '') : a[sortConfig.key as keyof Schedule]; 
        let bValue: string | number = sortConfig.key === 'station' ? (b.station?.nomStation || '') : b[sortConfig.key as keyof Schedule]; 

        if (sortConfig.key === 'totalHours') {
          aValue = calculateTotalHours(a);
          bValue = calculateTotalHours(b);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return sortConfig.direction === 'asc'
          ? aValue.toString().localeCompare(bValue.toString())
          : bValue.toString().localeCompare(aValue.toString());
      });
    }
    setFilteredSchedules(filtered);
  }, [schedules, searchQuery, sortConfig, selectedStationFilter]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}?year=${selectedYear}&week=${selectedWeek}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSchedules(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération:', error);
      if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      setError('Impossible de charger le planning: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeName) {
      setError("L'employé est requis.");
      return;
    }
    if (userRole === 'admin' && !formData.station?._id) {
      setError('La station est requise pour les administrateurs.');
      return;
    }
    const timeRegex = /^(\d{1,2}h)-(\d{1,2}h)$/;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    for (const day of days) {
      const time = formData[day];
      if (time && !timeRegex.test(time)) {
        setError(`Format invalide pour ${day.charAt(0).toUpperCase() + day.slice(1)}. Utilisez "8h-16h".`);
        return;
      }
    }

    try {
      const selectedEmploye = employes.find(emp => emp._id === formData.employeeName);
      if (!selectedEmploye) {
        setError("Aucun employé sélectionné ou employé introuvable.");
        return;
      }
      const dataToSend = {
        employeeName: selectedEmploye.nomEmploye + " " + selectedEmploye.prenomEmploye, 
        monday: formData.monday,
        tuesday: formData.tuesday,
        wednesday: formData.wednesday,
        thursday: formData.thursday,
        friday: formData.friday,
        saturday: formData.saturday,
        sunday: formData.sunday,
        year: selectedYear,
        week: selectedWeek,
        station: userRole === 'admin' ? formData.station?._id : undefined,
      };

      console.log('dataToSend:', dataToSend);

      if (isEditing) {
        await axios.put(`${API_URL}/${formData._id}`, dataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setSchedules(schedules.map(schedule => (schedule._id === formData._id ? { ...schedule, ...dataToSend, station: formData.station } : schedule)));
      } else {
        const response = await axios.post(API_URL, dataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setSchedules([...schedules, response.data]);
      }
      resetForm();
      await fetchSchedules();
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      setError('Erreur lors de l\'ajout/modification du planning: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce planning ?')) {
      try {
        await axios.delete(`${API_URL}/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setSchedules(schedules.filter(schedule => schedule._id !== id));
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        if (error.response?.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        setError('Erreur lors de la suppression du planning: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handlePreviousWeek = () => {
    setSelectedWeek((prev) => {
      if (prev > 1) return prev - 1;
      const prevYear = selectedYear - 1;
      setSelectedYear(prevYear);
      return getWeeksInYear(prevYear);
    });
  };

  const handleNextWeek = () => {
    setSelectedWeek((prev) => {
      const maxWeeks = getWeeksInYear(selectedYear);
      if (prev < maxWeeks) return prev + 1;
      setSelectedYear(selectedYear + 1);
      return 1;
    });
  };

  const startEditing = (schedule: Schedule) => {
    setFormData(schedule);
    setIsEditing(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      _id: '',
      employeeName: '',
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
      year: selectedYear,
      week: selectedWeek,
      station: { _id: '', nomStation: '' }, 
    });
    setShowForm(false);
    setIsEditing(false);
    setError(null);
  };

  const calculateTotalHours = (schedule: Schedule) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    let totalHours = 0;
    const timeRegex = /^(\d{1,2})h-(\d{1,2})h$/;

    days.forEach(day => {
      const time = schedule[day];
      if (time && timeRegex.test(time)) {
        const [, start, end] = time.match(timeRegex)!;
        const hours = parseInt(end) - parseInt(start);
        if (hours > 0) totalHours += hours;
      }
    });

    return totalHours;
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Station', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Total Hours'];
    const rows = filteredSchedules.map(schedule => [
      schedule.employeeName,
      schedule.station?.nomStation || 'Non défini', 
      schedule.monday || 'Non défini',
      schedule.tuesday || 'Non défini',
      schedule.wednesday || 'Non défini',
      schedule.thursday || 'Non défini',
      schedule.friday || 'Non défini',
      schedule.saturday || 'Non défini',
      schedule.sunday || 'Non défini',
      calculateTotalHours(schedule).toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `schedules_${selectedYear}_week${selectedWeek}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (key: 'employeeName' | 'totalHours' | 'station') => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Gestion des Plannings</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un employé ou une station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-200"
          >
            <Download className="h-5 w-5" />
            Exporter CSV
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
          >
            <Plus className="h-5 w-5" />
            Ajouter un Planning
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

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200"
          >
            {weeks.map((week) => (
              <option key={week} value={week}>
                Semaine {week} ({getWeekDateRange(selectedYear, week)})
              </option>
            ))}
          </select>
          {userRole === 'admin' && (
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200"
            >
              <option value="">Toutes les stations</option>
              {stations.map(station => (
                <option key={station._id} value={station._id}>
                  {station.nomStation} 
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => handleSort('employeeName')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
          >
            Trier par Nom {sortConfig?.key === 'employeeName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('totalHours')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
          >
            Trier par Heures {sortConfig?.key === 'totalHours' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousWeek}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center transition-all duration-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextWeek}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center transition-all duration-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm ? (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="mb-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700"
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Employé</label>
                <select
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                >
                  <option value="">Sélectionner un employé</option>
                  {employes.map(employe => (
                    <option key={employe._id} value={employe._id}>
                      {employe.nomEmploye + " " + employe.prenomEmploye} 
                    </option>
                  ))}
                </select>
              </div>
              {userRole === 'admin' && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Station</label>
                  <select
                    value={formData.station?._id || ''}
                    onChange={(e) => {
                      const selectedStation = stations.find(station => station._id === e.target.value);
                      setFormData({ ...formData, station: selectedStation || { _id: '', nomStation: '' } }); 
                    }}
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
                </div>
              )}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Lundi</label>
                <input
                  type="text"
                  value={formData.monday}
                  onChange={(e) => setFormData({ ...formData, monday: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  placeholder="ex: 8h-16h"
                />
                <span className="absolute right-2 top-10 text-gray-500 text-xs">Format: 8h-16h</span>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Mardi</label>
                <input
                  type="text"
                  value={formData.tuesday}
                  onChange={(e) => setFormData({ ...formData, tuesday: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  placeholder="ex: 8h-16h"
                />
                <span className="absolute right-2 top-10 text-gray-500 text-xs">Format: 8h-16h</span>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Mercredi</label>
                <input
                  type="text"
                  value={formData.wednesday}
                  onChange={(e) => setFormData({ ...formData, wednesday: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  placeholder="ex: 8h-16h"
                />
                <span className="absolute right-2 top-10 text-gray-500 text-xs">Format: 8h-16h</span>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Jeudi</label>
                <input
                  type="text"
                  value={formData.thursday}
                  onChange={(e) => setFormData({ ...formData, thursday: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  placeholder="ex: 8h-16h"
                />
                <span className="absolute right-2 top-10 text-gray-500 text-xs">Format: 8h-16h</span>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Vendredi</label>
                <input
                  type="text"
                  value={formData.friday}
                  onChange={(e) => setFormData({ ...formData, friday: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  placeholder="ex: 8h-16h"
                />
                <span className="absolute right-2 top-10 text-gray-500 text-xs">Format: 8h-16h</span>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Samedi</label>
                <input
                  type="text"
                  value={formData.saturday}
                  onChange={(e) => setFormData({ ...formData, saturday: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  placeholder="ex: 8h-16h"
                />
                <span className="absolute right-2 top-10 text-gray-500 text-xs">Format: 8h-16h</span>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Dimanche</label>
                <input
                  type="text"
                  value={formData.sunday}
                  onChange={(e) => setFormData({ ...formData, sunday: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  placeholder="ex: 8h-16h"
                />
                <span className="absolute right-2 top-10 text-gray-500 text-xs">Format: 8h-16h</span>
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
              >
                {isEditing ? 'Modifier le Planning' : 'Ajouter le Planning'}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredSchedules.length === 0 ? (
              <p className="text-gray-400 col-span-full text-center">Aucun planning trouvé pour cette semaine.</p>
            ) : (
              filteredSchedules.map((schedule) => (
                <motion.div
                  key={schedule._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-6 w-6 text-pink-500" />
                      <h3 className="text-lg font-semibold text-white">{schedule.employeeName}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(schedule)}
                        className="text-pink-500 hover:text-pink-400 transition-colors duration-200"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule._id)}
                        className="text-pink-500 hover:text-pink-400 transition-colors duration-200"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lundi</span>
                      <span className={`text-sm font-medium ${schedule.monday ? 'text-green-400' : 'text-gray-500'}`}>
                        {schedule.monday || 'Non défini'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mardi</span>
                      <span className={`text-sm font-medium ${schedule.tuesday ? 'text-green-400' : 'text-gray-500'}`}>
                        {schedule.tuesday || 'Non défini'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mercredi</span>
                      <span className={`text-sm font-medium ${schedule.wednesday ? 'text-green-400' : 'text-gray-500'}`}>
                        {schedule.wednesday || 'Non défini'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Jeudi</span>
                      <span className={`text-sm font-medium ${schedule.thursday ? 'text-green-400' : 'text-gray-500'}`}>
                        {schedule.thursday || 'Non défini'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vendredi</span>
                      <span className={`text-sm font-medium ${schedule.friday ? 'text-green-400' : 'text-gray-500'}`}>
                        {schedule.friday || 'Non défini'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Samedi</span>
                      <span className={`text-sm font-medium ${schedule.saturday ? 'text-green-400' : 'text-gray-500'}`}>
                        {schedule.saturday || 'Non défini'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dimanche</span>
                      <span className={`text-sm font-medium ${schedule.sunday ? 'text-green-400' : 'text-gray-500'}`}>
                        {schedule.sunday || 'Non défini'}
                      </span>
                    </div>
                    <div className="flex justify-between mt-4 pt-2 border-t border-gray-700">
                      <span className="text-gray-400 font-semibold">Total Heures</span>
                      <span className="text-white font-semibold">{calculateTotalHours(schedule)}h</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Planning;