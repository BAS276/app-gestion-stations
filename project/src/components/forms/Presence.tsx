import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { ChevronLeft, ChevronRight, Search, Download, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify'; // Add toast for better user feedback

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
}

interface Employe {
  _id: string;
  nomEmploye: string;
  prenomEmploye: string;
  station: {
    _id: string;
    nomStation: string;
  };
}

interface Presence {
  _id: string;
  semaine: number;
  jour: string;
  hDebut: string;
  hFin: string;
  annee: number;
  employe: {
    _id: string;
    nomEmploye: string;
    prenomEmploye: string;
  };
  station: {
    _id: string;
    nomStation: string;
  };
  isPresent?: boolean;
}

interface SortConfig {
  key: 'employeeName' | 'totalHours';
  direction: 'asc' | 'desc';
}

interface DecodedToken {
  id: string;
  role: string;
  station?: string;
  iat: number;
  exp: number;
}

const PLANNINGS_API_URL = 'http://localhost:5000/api/plannings';
const PRESENCE_API_URL = 'http://localhost:5000/api/presences';
const EMPLOYES_API_URL = 'http://localhost:5000/api/employes';

const Presence: React.FC = () => {
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

    const startYear = startOfWeek.getFullYear();
    const endYear = endOfWeek.getFullYear();
    const startFormat = startYear !== year ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' };
    const endFormat = endYear !== year ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' };

    return `${startOfWeek.toLocaleDateString('fr-FR', startFormat)} - ${endOfWeek.toLocaleDateString('fr-FR', endFormat)}`;
  };

  const currentDate = new Date();
  const currentWeek = getWeekNumber(currentDate);
  const currentYear = currentDate.getFullYear();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const years = Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i);
  const weeks = useMemo(() => Array.from({ length: getWeeksInYear(selectedYear) }, (_, i) => i + 1), [selectedYear]);
  const totalWeeks = getWeeksInYear(selectedYear);
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const dayMapping: { [key: string]: keyof Schedule } = {
    Lundi: 'monday',
    Mardi: 'tuesday',
    Mercredi: 'wednesday',
    Jeudi: 'thursday',
    Vendredi: 'friday',
    Samedi: 'saturday',
    Dimanche: 'sunday',
  };

  const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;
    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return true;
    }
  };

  const fetchWithAuth = async (url: string) => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      setError('Votre session a expiré. Veuillez vous reconnecter.');
      setTimeout(() => navigate('/login'), 3000);
      throw new Error('Token invalide ou expiré');
    }
    return axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const updateWithAuth = async (url: string, data: any) => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      setError('Votre session a expiré. Veuillez vous reconnecter.');
      setTimeout(() => navigate('/login'), 3000);
      throw new Error('Token invalide ou expiré');
    }
    return axios.put(url, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const createWithAuth = async (url: string, data: any) => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      setError('Votre session a expiré. Veuillez vous reconnecter.');
      setTimeout(() => navigate('/login'), 3000);
      throw new Error('Token invalide ou expiré');
    }
    return axios.post(url, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetchWithAuth(`${PLANNINGS_API_URL}?year=${selectedYear}&week=${selectedWeek}`);
      console.log('Fetched schedules:', response.data);
      setSchedules(response.data);
    } catch (error) {
      handleApiError(error, 'Impossible de charger les plannings');
    }
  };

  const fetchPresences = async () => {
    try {
      const response = await fetchWithAuth(`${PRESENCE_API_URL}?year=${selectedYear}&week=${selectedWeek}`);
      console.log('Fetched presences:', response.data);
      setPresences(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        // No presences found for this year and week
        setPresences([]);
        toast.info('Aucune présence enregistrée pour cette période. Vous pouvez en ajouter une.');
      } else {
        handleApiError(error, 'Impossible de charger les présences');
      }
    }
  };

  const fetchEmployes = async () => {
    try {
      const response = await fetchWithAuth(EMPLOYES_API_URL);
      console.log('Fetched employes:', response.data);
      setEmployes(response.data);
    } catch (error) {
      handleApiError(error, 'Impossible de charger les employés');
    }
  };

  const handleApiError = (error: unknown, defaultMessage: string) => {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error(defaultMessage, axiosError);
    if (axiosError.response?.status === 401) {
      if (axiosError.response.data?.message.includes('expiré')) {
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError('Vous devez vous connecter pour accéder à cette page.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } else if (axiosError.response?.status === 403) {
      setError('Accès refusé : Vous n\'avez pas les permissions nécessaires pour effectuer cette action.');
    } else {
      setError(`${defaultMessage}: ${axiosError.response?.data?.message || axiosError.message}`);
    }
  };

  const handlePresenceToggle = async (
    employeeName: string,
    day: string,
    isPresent: boolean,
    existingPresence?: Presence
  ) => {
    try {
      const schedule = schedules.find(s => s.employeeName === employeeName);
      if (!schedule) {
        toast.error("Planning introuvable pour cet employé.");
        return;
      }

      const presence = presences.find(
        p =>
          `${p.employe.nomEmploye} ${p.employe.prenomEmploye}` === employeeName &&
          p.jour === day &&
          p.semaine === selectedWeek &&
          p.annee === selectedYear
      );

      const employee = employes.find(emp => `${emp.nomEmploye} ${emp.prenomEmploye}` === employeeName);
      if (!employee) {
        toast.error("Employé introuvable.");
        return;
      }

      if (existingPresence || presence) {
        const presenceId = existingPresence?._id || presence?._id;
        const updatedPresence = {
          semaine: selectedWeek,
          jour: day,
          hDebut: existingPresence?.hDebut || presence?.hDebut || '',
          hFin: existingPresence?.hFin || presence?.hFin || '',
          annee: selectedYear,
          employe: existingPresence?.employe._id || presence?.employe._id,
          station: existingPresence?.station._id || presence?.station._id,
          isPresent,
        };

        const response = await updateWithAuth(`${PRESENCE_API_URL}/${presenceId}`, updatedPresence);
        setPresences(presences.map(p => (p._id === presenceId ? response.data : p)));
        toast.success(`Présence mise à jour pour ${employeeName} le ${day}.`);
      } else {
        const token = localStorage.getItem('token');
        const decoded: DecodedToken = jwtDecode(token || '');
        const newPresence = {
          semaine: selectedWeek,
          jour: day,
          hDebut: '',
          hFin: '',
          annee: selectedYear,
          employe: employee._id,
          station: decoded.station || employee.station._id,
          isPresent,
        };

        if (!newPresence.station) {
          toast.error("Station de l'employé non définie.");
          return;
        }

        const response = await createWithAuth(PRESENCE_API_URL, newPresence);
        setPresences([...presences, response.data]);
        toast.success(`Présence ajoutée pour ${employeeName} le ${day}.`);
      }
    } catch (error) {
      handleApiError(error, 'Erreur lors de la mise à jour de la présence');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      setError('Vous devez vous connecter pour accéder à cette page.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchSchedules(), fetchPresences(), fetchEmployes()]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedWeek]);

  const combinedData = useMemo(() => {
    const grouped: {
      [key: string]: {
        employeeName: string;
        station?: string;
        days: { [key: string]: { schedule: string; presence: Presence | null } };
      };
    } = {};

    schedules.forEach(schedule => {
      grouped[schedule.employeeName] = {
        employeeName: schedule.employeeName,
        days: {},
      };
      days.forEach((day) => {
        const dayKey = dayMapping[day];
        grouped[schedule.employeeName].days[day] = {
          schedule: schedule[dayKey] || 'Non défini',
          presence: null,
        };
      });

      const employee = employes.find(emp => `${emp.nomEmploye} ${emp.prenomEmploye}` === schedule.employeeName);
      if (employee) {
        grouped[schedule.employeeName].station = employee.station?.nomStation || 'Non défini';
      }
    });

    presences.forEach(presence => {
      const employeeName = `${presence.employe.nomEmploye} ${presence.employe.prenomEmploye}`;
      if (!grouped[employeeName]) {
        grouped[employeeName] = {
          employeeName,
          station: presence.station.nomStation,
          days: {},
        };
        days.forEach(day => {
          grouped[employeeName].days[day] = {
            schedule: 'Non défini',
            presence: null,
          };
        });
      }
      grouped[employeeName].station = presence.station.nomStation || grouped[employeeName].station;
      grouped[employeeName].days[presence.jour].presence = presence;
    });

    return Object.values(grouped);
  }, [schedules, presences, employes]);

  const filteredData = useMemo(() => {
    let filtered = [...combinedData];
    if (searchQuery) {
      filtered = filtered.filter(employee =>
        employee.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: string | number = sortConfig.key === 'employeeName' ? a.employeeName : calculateTotalHours(a);
        let bValue: string | number = sortConfig.key === 'employeeName' ? b.employeeName : calculateTotalHours(b);

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return sortConfig.direction === 'asc'
          ? aValue.toString().localeCompare(bValue.toString())
          : bValue.toString().localeCompare(aValue.toString());
      });
    }
    return filtered;
  }, [combinedData, searchQuery, sortConfig]);

  const calculateTotalHours = (employee: { days: { [key: string]: { schedule: string; presence: Presence | null } } }): number => {
    let totalHours = 0;
    const timeRegex = /^(\d{1,2})h-(\d{1,2})h$/;

    days.forEach(day => {
      const { schedule } = employee.days[day];
      if (schedule && timeRegex.test(schedule)) {
        const [, start, end] = schedule.match(timeRegex)!;
        const hours = parseInt(end) - parseInt(start);
        if (hours > 0) totalHours += hours;
      }
    });

    return totalHours;
  };

  const exportToCSV = () => {
    const headers = [
      'Employee Name',
      'Station',
      'Monday',
      'Monday Presence',
      'Tuesday',
      'Tuesday Presence',
      'Wednesday',
      'Wednesday Presence',
      'Thursday',
      'Thursday Presence',
      'Friday',
      'Friday Presence',
      'Saturday',
      'Saturday Presence',
      'Sunday',
      'Sunday Presence',
      'Total Hours',
    ];
    const rows = filteredData.map(employee => [
      employee.employeeName,
      employee.station || 'Non défini',
      employee.days['Lundi'].schedule || 'Non défini',
      employee.days['Lundi'].presence?.isPresent === true ? 'Présent' : employee.days['Lundi'].presence?.isPresent === false ? 'Absent' : 'Non défini',
      employee.days['Mardi'].schedule || 'Non défini',
      employee.days['Mardi'].presence?.isPresent === true ? 'Présent' : employee.days['Mardi'].presence?.isPresent === false ? 'Absent' : 'Non défini',
      employee.days['Mercredi'].schedule || 'Non défini',
      employee.days['Mercredi'].presence?.isPresent === true ? 'Présent' : employee.days['Mercredi'].presence?.isPresent === false ? 'Absent' : 'Non défini',
      employee.days['Jeudi'].schedule || 'Non défini',
      employee.days['Jeudi'].presence?.isPresent === true ? 'Présent' : employee.days['Jeudi'].presence?.isPresent === false ? 'Absent' : 'Non défini',
      employee.days['Vendredi'].schedule || 'Non défini',
      employee.days['Vendredi'].presence?.isPresent === true ? 'Présent' : employee.days['Vendredi'].presence?.isPresent === false ? 'Absent' : 'Non défini',
      employee.days['Samedi'].schedule || 'Non défini',
      employee.days['Samedi'].presence?.isPresent === true ? 'Présent' : employee.days['Samedi'].presence?.isPresent === false ? 'Absent' : 'Non défini',
      employee.days['Dimanche'].schedule || 'Non défini',
      employee.days['Dimanche'].presence?.isPresent === true ? 'Présent' : employee.days['Dimanche'].presence?.isPresent === false ? 'Absent' : 'Non défini',
      calculateTotalHours(employee).toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `presence_${selectedYear}_week${selectedWeek}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (key: 'employeeName' | 'totalHours') => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
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
        <h1 className="text-3xl font-bold text-white">Liste des Présences</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <label htmlFor="search-employee" className="sr-only">Rechercher un employé</label>
            <input
              id="search-employee"
              type="text"
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-200"
            aria-label="Exporter les présences en CSV"
          >
            <Download className="h-5 w-5" />
            Exporter CSV
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
          <button onClick={() => setError(null)} className="text-pink-200 hover:text-pink-100" aria-label="Fermer l'erreur">
            <XCircle className="h-5 w-5" />
          </button>
        </motion.div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <select
              id="select-year"
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
          </div>
          <div>
            <select
              id="select-week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 w-80"
              style={{ maxHeight: '200px', overflowY: 'auto' }}
            >
              {weeks.map((week) => (
                <option
                  key={week}
                  value={week}
                  style={{
                    fontWeight: week === currentWeek && selectedYear === currentYear ? 'bold' : 'normal',
                  }}
                >
                  Semaine {week} ({getWeekDateRange(selectedYear, week)})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleSort('employeeName')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
            aria-label="Trier par nom d'employé"
          >
            Trier par Nom {sortConfig?.key === 'employeeName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('totalHours')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
            aria-label="Trier par total des heures"
          >
            Trier par Heures {sortConfig?.key === 'totalHours' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousWeek}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center transition-all duration-200"
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextWeek}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center transition-all duration-200"
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredData.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center">Aucune donnée trouvée pour cette semaine.</p>
          ) : (
            filteredData.map((employee) => (
              <motion.div
                key={employee.employeeName}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">{employee.employeeName}</h3>
                  <span className="text-sm text-gray-400">{employee.station || 'Non défini'}</span>
                </div>
                <div className="space-y-2">
                  {days.map((day) => {
                    const { schedule, presence } = employee.days[day];
                    return (
                      <div key={day} className="flex justify-between items-center">
                        <div className="flex justify-between w-1/2">
                          <span className="text-gray-400">{day}</span>
                          <span className={`text-sm font-medium ${schedule !== 'Non défini' ? 'text-green-400' : 'text-gray-500'}`}>
                            {schedule}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePresenceToggle(employee.employeeName, day, true, presence)}
                            className={`p-1 rounded-full ${presence?.isPresent === true ? 'bg-green-500' : 'bg-gray-600'} hover:bg-green-400 transition-all duration-200`}
                            aria-label={`Marquer ${employee.employeeName} comme présent le ${day}`}
                          >
                            <CheckCircle className="h-4 w-4 text-white" />
                          </button>
                          <button
                            onClick={() => handlePresenceToggle(employee.employeeName, day, false, presence)}
                            className={`p-1 rounded-full ${presence?.isPresent === false ? 'bg-red-500' : 'bg-gray-600'} hover:bg-red-400 transition-all duration-200`}
                            aria-label={`Marquer ${employee.employeeName} comme absent le ${day}`}
                          >
                            <XCircle className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between mt-4 pt-2 border-t border-gray-700">
                    <span className="text-gray-400 font-semibold">Total Heures</span>
                    <span className="text-white font-semibold">{calculateTotalHours(employee)}h</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Presence;