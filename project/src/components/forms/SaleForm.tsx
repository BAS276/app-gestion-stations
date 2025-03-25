import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search, Download, Calendar } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { useAuth } from './AuthContext';

interface Employee {
  _id: string;
  nomEmploye: string;
  prenomEmploye: string;
  emailEmploye: string;
  position: string;
  station: { _id: string; nomStation: string } | null;
}

interface Sale {
  _id: string;
  idVente: string;
  pumpNumber?: string;
  fuelType?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  quantityPieces?: number;
  paymentMethod: string;
  customerType: string;
  employeeId: Employee;
  station: { _id: string; nomStation: string };
  date: string;
  category: string;
}

interface Station {
  _id: string;
  nomStation: string;
}

const API_URL = 'http://localhost:5000/api/ventes';
const STATIONS_API_URL = 'http://localhost:5000/api/stations';
const EMPLOYEES_API_URL = 'http://localhost:5000/api/employes';

const SaleForm = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    pumpNumber: '',
    fuelType: '',
    quantity: '',
    unitPrice: '',
    price: '',
    quantityPieces: '',
    paymentMethod: '',
    customerType: '',
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Carburant',
  });
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Sale | 'totalPrice'; direction: 'asc' | 'desc' } | null>(null);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['Carburant', 'Huile', 'Accessoires', 'Alimentation'];

  useEffect(() => {
    fetchSales();
    fetchStations();
    fetchEmployees();
  }, []);

  useEffect(() => {
    let filtered = [...sales];

    // For managers, only show sales from their own station
    if (user?.role === 'manager' || user?.role === 'mainManager') {
      if (user?.station) {
        filtered = filtered.filter(sale => {
          const saleStationId = sale.station?._id?.toString() || sale.station?.toString();
          const userStationId = user.station?._id?.toString() || user.station?.toString();
          return saleStationId === userStationId;
        });
      } else {
        filtered = [];
        setError('Aucune station assignée à cet utilisateur.');
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(
        sale =>
          (sale.pumpNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
          (sale.fuelType?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
          sale.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sale.customerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (sale.employeeId?.nomEmploye?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
          (sale.employeeId?.prenomEmploye?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
      );
    }

    if (dateRange[0].startDate && dateRange[0].endDate) {
      const start = new Date(dateRange[0].startDate);
      const end = new Date(dateRange[0].endDate);
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= start && saleDate <= end;
      });
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(sale => sale.category === categoryFilter);
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (sortConfig.key === 'totalPrice') {
          aValue = a.category === 'Carburant' ? (a.quantity || 0) * (a.unitPrice || 0) : (a.price || 0);
          bValue = b.category === 'Carburant' ? (b.quantity || 0) * (b.unitPrice || 0) : (b.price || 0);
        } else if (sortConfig.key === 'quantity' || sortConfig.key === 'unitPrice' || sortConfig.key === 'price' || sortConfig.key === 'quantityPieces') {
          aValue = a[sortConfig.key as keyof Sale] as number || 0;
          bValue = b[sortConfig.key as keyof Sale] as number || 0;
        } else if (sortConfig.key === 'date') {
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
        } else if (sortConfig.key === 'employeeId') {
          aValue = `${a.employeeId?.nomEmploye || ''} ${a.employeeId?.prenomEmploye || ''}`;
          bValue = `${b.employeeId?.nomEmploye || ''} ${b.employeeId?.prenomEmploye || ''}`;
        } else {
          aValue = a[sortConfig.key as keyof Sale] || '';
          bValue = b[sortConfig.key as keyof Sale] || '';
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return sortConfig.direction === 'asc'
          ? aValue.toString().localeCompare(bValue.toString())
          : bValue.toString().localeCompare(aValue.toString());
      });
    }

    setFilteredSales(filtered);
  }, [sales, searchQuery, sortConfig, dateRange, categoryFilter, user]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setSales(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des ventes:', error);
      setError('Impossible de charger les ventes. Veuillez réessayer.');
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

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(EMPLOYEES_API_URL);
      if (Array.isArray(response.data)) {
        setEmployees(response.data);
      } else {
        throw new Error('Invalid API response: Expected an array of employees');
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des employés:', error);
      setError('Impossible de charger les employés. Veuillez réessayer.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      setError('La date est requise.');
      return;
    }
    if (!formData.category) {
      setError('La catégorie est requise.');
      return;
    }
    if (formData.category === 'Carburant') {
      if (!formData.pumpNumber.trim()) {
        setError('Le numéro de pompe est requis.');
        return;
      }
      if (!formData.fuelType) {
        setError('Le type de carburant est requis.');
        return;
      }
      const quantity = Number(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        setError('La quantité doit être un nombre positif.');
        return;
      }
      const unitPrice = Number(formData.unitPrice);
      if (isNaN(unitPrice) || unitPrice <= 0) {
        setError('Le prix unitaire doit être un nombre positif.');
        return;
      }
    } else {
      const price = Number(formData.price);
      if (isNaN(price) || price <= 0) {
        setError('Le prix doit être un nombre positif.');
        return;
      }
      const quantityPieces = Number(formData.quantityPieces);
      if (isNaN(quantityPieces) || quantityPieces <= 0 || !Number.isInteger(quantityPieces)) {
        setError('La quantité de pièces doit être un nombre entier positif.');
        return;
      }
      if (!formData.customerType) {
        setError('Le type de client est requis pour les catégories non-Carburant.');
        return;
      }
    }
    if (!formData.paymentMethod) {
      setError('Le mode de paiement est requis.');
      return;
    }
    if (!formData.employeeId) {
      setError("L'employé est requis.");
      return;
    }

    try {
      const dataToSend: Partial<Sale> = {
        idVente: editingId ? undefined : Date.now().toString(),
        paymentMethod: formData.paymentMethod,
        customerType: formData.customerType,
        employeeId: formData.employeeId,
        date: new Date(formData.date).toISOString(),
        category: formData.category,
      };

      if (formData.category === 'Carburant') {
        dataToSend.pumpNumber = formData.pumpNumber.trim();
        dataToSend.fuelType = formData.fuelType;
        dataToSend.quantity = Number(formData.quantity);
        dataToSend.unitPrice = Number(formData.unitPrice);
      } else {
        dataToSend.price = Number(formData.price);
        dataToSend.quantityPieces = Number(formData.quantityPieces);
        dataToSend.customerType = formData.customerType;
      }

      if (editingId) {
        const response = await axios.put(`${API_URL}/${editingId}`, dataToSend);
        setSales(sales.map(sale => (sale._id === editingId ? response.data : sale)));
        setEditingId(null);
      } else {
        const response = await axios.post(API_URL, dataToSend);
        setSales([...sales, response.data]);
      }
      resetForm();
      setError(null);
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.response?.data?.message || "Erreur lors de l'ajout/modification de la vente");
    }
  };

  const handleEdit = (sale: Sale) => {
    setFormData({
      pumpNumber: sale.pumpNumber || '',
      fuelType: sale.fuelType || '',
      quantity: sale.quantity?.toString() || '',
      unitPrice: sale.unitPrice?.toString() || '',
      price: sale.price?.toString() || '',
      quantityPieces: sale.quantityPieces?.toString() || '',
      paymentMethod: sale.paymentMethod,
      customerType: sale.customerType || '',
      employeeId: sale.employeeId?._id || '',
      date: new Date(sale.date).toISOString().split('T')[0],
      category: sale.category,
    });
    setEditingId(sale._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette vente ?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSales(sales.filter(sale => sale._id !== id));
        setError(null);
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression de la vente. Veuillez réessayer.');
      }
    }
  };

  const handleSort = (key: keyof Sale | 'totalPrice') => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const calculateTotalPrice = (sale: Sale) => {
    if (sale.category === 'Carburant') {
      return ((sale.quantity || 0) * (sale.unitPrice || 0)).toFixed(2);
    }
    return (sale.price || 0).toFixed(2);
  };

  const resetForm = () => {
    setFormData({
      pumpNumber: '',
      fuelType: '',
      quantity: '',
      unitPrice: '',
      price: '',
      quantityPieces: '',
      paymentMethod: '',
      customerType: '',
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Carburant',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Catégorie',
      'Numéro de Pompe',
      'Type de Carburant',
      'Quantité (L)',
      'Prix Unitaire (DH/L)',
      'Prix (DH)',
      'Quantité de Pièces',
      'Total (DH)',
      'Mode de Paiement',
      'Type de Client',
      'Employé',
    ];
    const rows = filteredSales.map(sale => [
      new Date(sale.date).toLocaleDateString(),
      sale.category,
      sale.pumpNumber || '',
      sale.fuelType || '',
      sale.quantity || '',
      sale.unitPrice || '',
      sale.price || '',
      sale.quantityPieces || '',
      calculateTotalPrice(sale),
      sale.paymentMethod === 'card' ? 'Carte Bancaire' :
        sale.paymentMethod === 'cash' ? 'Espèces' :
        sale.paymentMethod === 'check' ? 'Chèque' :
        sale.paymentMethod === 'fleet' ? 'Carte Flotte' : sale.paymentMethod,
      sale.customerType,
      `${sale.employeeId?.nomEmploye || ''} ${sale.employeeId?.prenomEmploye || ''}`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `sales_${dateRange[0].startDate.toISOString().split('T')[0]}_to_${dateRange[0].endDate.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateCategorySummary = () => {
    const summary: { [key: string]: { totalSales: number; totalRevenue: number } } = {};
    categories.forEach(category => {
      const categorySales = filteredSales.filter(sale => sale.category === category);
      const totalSales = categorySales.length;
      const totalRevenue = categorySales.reduce((sum, sale) => sum + parseFloat(calculateTotalPrice(sale)), 0);
      summary[category] = { totalSales, totalRevenue };
    });
    return summary;
  };

  const summary = calculateCategorySummary();

  // Filter employees based on the user's station (for managers)
  const availableEmployees = (user?.role === 'manager' || user?.role === 'mainManager') && user?.station
    ? employees.filter(emp => {
        const empStationId = emp.station?._id?.toString() || emp.station?.toString();
        const userStationId = user.station?._id?.toString() || user.station?.toString();
        return empStationId === userStationId;
      })
    : employees;

  // Get the user's station name
  const userStation = stations.find(station => {
    const stationId = station._id?.toString();
    const userStationId = user?.station?._id?.toString() || user?.station?.toString();
    return stationId === userStationId;
  })?.nomStation || 'Station inconnue';

  if (loading) return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion des Ventes</h1>
          {(user?.role === 'manager' || user?.role === 'mainManager') && (
            <p className="text-gray-400 mt-2">Station: <span className="text-white font-semibold">{userStation}</span></p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par pompe, carburant, paiement, client ou employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
          >
            <Download className="h-5 w-5" />
            Exporter CSV
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
          >
            <Plus className="h-5 w-5" />
            Ajouter une Vente
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

      <div className="flex gap-4 mb-6">
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
          >
            <Calendar className="h-5 w-5" />
            Filtrer par Date
          </button>
          {showDatePicker && (
            <div className="absolute z-10 mt-2">
              <DateRangePicker
                onChange={(item: any) => {
                  setDateRange([item.selection]);
                }}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                direction="vertical"
                className="bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700"
              />
            </div>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200"
        >
          <option value="all">Toutes les Catégories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button
          onClick={() => handleSort('date')}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
        >
          Trier par Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('totalPrice')}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
        >
          Trier par Total {sortConfig?.key === 'totalPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      <div className="mb-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Résumé des Ventes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(category => (
            <div key={category} className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-white">{category}</h3>
              <p className="text-gray-400">Total Ventes: <span className="text-white font-semibold">{summary[category]?.totalSales || 0}</span></p>
              <p className="text-gray-400">Revenu Total: <span className="text-white font-semibold">{(summary[category]?.totalRevenue || 0).toFixed(2)} DH</span></p>
            </div>
          ))}
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, pumpNumber: '', fuelType: '', quantity: '', unitPrice: '', price: '', quantityPieces: '', customerType: '' })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              {formData.category === 'Carburant' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Numéro de Pompe</label>
                    <input
                      type="text"
                      value={formData.pumpNumber}
                      onChange={(e) => setFormData({ ...formData, pumpNumber: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantité (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prix Unitaire (DH/L)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prix (DH)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantité de Pièces</label>
                    <input
                      type="number"
                      step="1"
                      value={formData.quantityPieces}
                      onChange={(e) => setFormData({ ...formData, quantityPieces: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type de Client</label>
                <select
                  value={formData.customerType}
                  onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required={formData.category !== 'Carburant'}
                >
                  <option value="">Sélectionner un type</option>
                  <option value="individual">Particulier</option>
                  <option value="professional">Professionnel</option>
                  <option value="fleet">Flotte</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mode de Paiement</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                >
                  <option value="">Sélectionner un mode</option>
                  <option value="card">Carte Bancaire</option>
                  <option value="cash">Espèces</option>
                  <option value="check">Chèque</option>
                  <option value="fleet">Carte Flotte</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Employé</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                >
                  <option value="">Sélectionner un employé</option>
                  {availableEmployees.map(employee => (
                    <option key={employee._id} value={employee._id}>
                      {employee.nomEmploye} {employee.prenomEmploye} ({employee.position})
                    </option>
                  ))}
                </select>
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
                {editingId ? 'Modifier la Vente' : 'Ajouter la Vente'}
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
            {filteredSales.map((sale) => (
              <motion.div
                key={sale._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">
                      {sale.category === 'Carburant' ? `Pompe ${sale.pumpNumber}` : sale.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(sale)}
                      className="text-pink-400 hover:text-pink-300 transition-colors duration-200"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sale._id)}
                      className="text-pink-400 hover:text-pink-300 transition-colors duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span className="text-white">{new Date(sale.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Catégorie</span>
                    <span className="text-white">{sale.category}</span>
                  </div>
                  {sale.category === 'Carburant' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Carburant</span>
                        <span className="text-white">
                          {sale.fuelType === 'sp95' ? 'Sans Plomb 95' :
                            sale.fuelType === 'sp98' ? 'Sans Plomb 98' :
                            sale.fuelType === 'diesel' ? 'Diesel' :
                            sale.fuelType === 'e85' ? 'E85' : sale.fuelType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Quantité</span>
                        <span className="text-white">{sale.quantity} L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Prix Unitaire</span>
                        <span className="text-white">{sale.unitPrice} DH/L</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Prix</span>
                        <span className="text-white">{sale.price} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Quantité de Pièces</span>
                        <span className="text-white">{sale.quantityPieces}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Client</span>
                    <span className="text-white">
                      {sale.customerType === 'individual' ? 'Particulier' :
                        sale.customerType === 'professional' ? 'Professionnel' :
                        sale.customerType === 'fleet' ? 'Flotte' : sale.customerType || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white font-semibold">{calculateTotalPrice(sale)} DH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paiement</span>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        sale.paymentMethod === 'card'
                          ? 'bg-blue-500 text-white'
                          : sale.paymentMethod === 'cash'
                          ? 'bg-green-500 text-white'
                          : sale.paymentMethod === 'check'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}
                    >
                      {sale.paymentMethod === 'card' ? 'Carte Bancaire' :
                        sale.paymentMethod === 'cash' ? 'Espèces' :
                        sale.paymentMethod === 'check' ? 'Chèque' :
                        sale.paymentMethod === 'fleet' ? 'Carte Flotte' : sale.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Employé</span>
                    <span className="text-white">{sale.employeeId?.nomEmploye} {sale.employeeId?.prenomEmploye}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaleForm;