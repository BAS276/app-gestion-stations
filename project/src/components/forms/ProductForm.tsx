import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Carburant {
  _id: string;
  name: string;
  category: string;
  price: string;
  stock: string;
  minStock: string;
  supplier: string;
}

const API_URL = 'http://localhost:5000/api/carburants';

const CarburantForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    minStock: '',
    supplier: '',
  });
  const [carburants, setCarburants] = useState<Carburant[]>([]);
  const [filteredCarburants, setFilteredCarburants] = useState<Carburant[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('name-asc');
  const [loading, setLoading] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});

  useEffect(() => {
    fetchCarburants();
  }, []);

  const fetchCarburants = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setCarburants(response.data);
      setFilteredCarburants(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des carburants:', error);
      setError('Impossible de charger les carburants. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.name) errors.name = 'Le nom du produit est requis';
    if (!formData.category) errors.category = 'La catégorie est requise';
    if (!formData.price) errors.price = 'Le prix est requis';
    else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.price = 'Le prix doit être un nombre positif';
    }
    if (!formData.stock) errors.stock = 'Le stock actuel est requis';
    else if (isNaN(parseInt(formData.stock, 10)) || parseInt(formData.stock, 10) < 0) {
      errors.stock = 'Le stock doit être un nombre positif ou zéro';
    }
    if (!formData.minStock) errors.minStock = 'Le stock minimum est requis';
    else if (isNaN(parseInt(formData.minStock, 10)) || parseInt(formData.minStock, 10) < 0) {
      errors.minStock = 'Le stock minimum doit être un nombre positif ou zéro';
    }
    if (!formData.supplier) errors.supplier = 'Le fournisseur est requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSend = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      minStock: parseInt(formData.minStock, 10),
      supplier: formData.supplier,
    };

    try {
      if (editingId) {
        const response = await axios.put(`${API_URL}/${editingId}`, dataToSend);
        setCarburants(carburants.map(carburant => (carburant._id === editingId ? response.data : carburant)));
        setEditingId(null);
      } else {
        const response = await axios.post(API_URL, dataToSend);
        setCarburants([...carburants, response.data]);
      }
      setFormData({
        name: '',
        category: '',
        price: '',
        stock: '',
        minStock: '',
        supplier: '',
      });
      setShowForm(false);
      setError(null);
      setFormErrors({});
      await fetchCarburants();
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'ajout/modification du carburant');
    }
  };

  const handleEdit = (carburant: Carburant) => {
    setFormData({
      name: carburant.name,
      category: carburant.category,
      price: carburant.price.toString(),
      stock: carburant.stock.toString(),
      minStock: carburant.minStock.toString(),
      supplier: carburant.supplier,
    });
    setEditingId(carburant._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce carburant ?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setCarburants(carburants.filter(carburant => carburant._id !== id));
        setError(null);
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression du carburant. Veuillez réessayer.');
      }
    }
  };

  useEffect(() => {
    let filtered = [...carburants];

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(carburant => carburant.category === categoryFilter);
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        carburant =>
          carburant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          carburant.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          carburant.supplier.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortOption) {
      const [key, direction] = sortOption.split('-') as [string, 'asc' | 'desc'];
      filtered.sort((a, b) => {
        let aValue: any = a[key as keyof Carburant];
        let bValue: any = b[key as keyof Carburant];

        if (key === 'price' || key === 'stock' || key === 'minStock') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }

    setFilteredCarburants(filtered);
  }, [carburants, searchQuery, categoryFilter, sortOption]);

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
          <h1 className="text-3xl font-bold text-white">
            Gestion des Produits
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, catégorie ou fournisseur..."
                className="px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white placeholder-gray-400"
                aria-label="Rechercher des carburants"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
              aria-label={showForm ? 'Fermer le formulaire' : 'Ajouter un nouveau Produit'}
            >
              {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              <span>{showForm ? 'Fermer' : 'Ajouter un Produit'}</span>
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
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 text-white"
                aria-label="Filtrer par catégorie"
              >
                <option value="all">Toutes les catégories</option>
                <option value="fuel">Carburant</option>
                <option value="oil">Huile</option>
                <option value="accessories">Accessoires</option>
                <option value="food">Alimentation</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">Trier par:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 text-white"
                aria-label="Trier les carburants"
              >
                <option value="name-asc">Nom (A-Z)</option>
                <option value="name-desc">Nom (Z-A)</option>
                <option value="category-asc">Catégorie (A-Z)</option>
                <option value="category-desc">Catégorie (Z-A)</option>
                <option value="price-asc">Prix (Croissant)</option>
                <option value="price-desc">Prix (Décroissant)</option>
                <option value="stock-asc">Stock (Croissant)</option>
                <option value="stock-desc">Stock (Décroissant)</option>
                <option value="minStock-asc">Stock Min. (Croissant)</option>
                <option value="minStock-desc">Stock Min. (Décroissant)</option>
                <option value="supplier-asc">Fournisseur (A-Z)</option>
                <option value="supplier-desc">Fournisseur (Z-A)</option>
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
                {editingId ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="name">
                      Nom du Produit
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.name ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white placeholder-gray-400`}
                      placeholder="Ex: Sans Plomb 95"
                      aria-invalid={!!formErrors.name}
                      aria-describedby={formErrors.name ? 'name-error' : undefined}
                    />
                    {formErrors.name && (
                      <p id="name-error" className="text-pink-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="category">
                      Catégorie
                    </label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.category ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white`}
                      aria-invalid={!!formErrors.category}
                      aria-describedby={formErrors.category ? 'category-error' : undefined}
                    >
                      <option value="">Sélectionner une catégorie</option>
                      <option value="fuel">Carburant</option>
                      <option value="oil">Huile</option>
                      <option value="accessories">Accessoires</option>
                      <option value="food">Alimentation</option>
                    </select>
                    {formErrors.category && (
                      <p id="category-error" className="text-pink-500 text-xs mt-1">{formErrors.category}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="price">
                      Prix (DH)
                    </label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.price ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white placeholder-gray-400`}
                      placeholder="Ex: 1.85"
                      aria-invalid={!!formErrors.price}
                      aria-describedby={formErrors.price ? 'price-error' : undefined}
                    />
                    {formErrors.price && (
                      <p id="price-error" className="text-pink-500 text-xs mt-1">{formErrors.price}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="stock">
                      Stock Actuel
                    </label>
                    <input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.stock ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white placeholder-gray-400`}
                      placeholder="Ex: 5000"
                      aria-invalid={!!formErrors.stock}
                      aria-describedby={formErrors.stock ? 'stock-error' : undefined}
                    />
                    {formErrors.stock && (
                      <p id="stock-error" className="text-pink-500 text-xs mt-1">{formErrors.stock}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="minStock">
                      Stock Minimum
                    </label>
                    <input
                      id="minStock"
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.minStock ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white placeholder-gray-400`}
                      placeholder="Ex: 1000"
                      aria-invalid={!!formErrors.minStock}
                      aria-describedby={formErrors.minStock ? 'minStock-error' : undefined}
                    />
                    {formErrors.minStock && (
                      <p id="minStock-error" className="text-pink-500 text-xs mt-1">{formErrors.minStock}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="supplier">
                      Fournisseur
                    </label>
                    <input
                      id="supplier"
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border ${formErrors.supplier ? 'border-pink-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 text-white placeholder-gray-400`}
                      placeholder="Ex: TotalEnergies"
                      aria-invalid={!!formErrors.supplier}
                      aria-describedby={formErrors.supplier ? 'supplier-error' : undefined}
                    />
                    {formErrors.supplier && (
                      <p id="supplier-error" className="text-pink-500 text-xs mt-1">{formErrors.supplier}</p>
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
                        name: '',
                        category: '',
                        price: '',
                        stock: '',
                        minStock: '',
                        supplier: '',
                      });
                      setFormErrors({});
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
                    aria-label="Annuler les modifications"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
                    aria-label={editingId ? 'Modifier le Produit' : 'Ajouter le Produit'}
                  >
                    {editingId ? 'Modifier le Produit' : 'Ajouter le Produit'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carburant Cards Section */}
        {!showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence>
              {filteredCarburants.map((carburant, index) => (
                <motion.div
                  key={carburant._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative bg-gray-800/95 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700/50 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient Accent */}
                  <div className="absolute top-0 left-0 w-full h-1" />
                  {/* Header */}
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-semibold text-white">{carburant.name}</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(carburant)}
                        className="group relative text-pink-500 hover:text-pink-400 transition-colors duration-200"
                        aria-label={`Modifier le Produit ${carburant.name}`}
                      >
                        <Pencil className="h-5 w-5" />
                        <span className="absolute hidden group-hover:block -top-8 right-0 bg-gray-700 text-xs text-white px-2 py-1 rounded shadow">Modifier</span>
                      </button>
                      <button
                        onClick={() => handleDelete(carburant._id)}
                        className="group relative text-pink-500 hover:text-pink-400 transition-colors duration-200"
                        aria-label={`Supprimer le carburant ${carburant.name}`}
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="absolute hidden group-hover:block -top-8 right-0 bg-gray-700 text-xs text-white px-2 py-1 rounded shadow">Supprimer</span>
                      </button>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-medium">Catégorie</span>
                      <span className="text-white font-medium">
                        {carburant.category === 'fuel' && 'Carburant'}
                        {carburant.category === 'oil' && 'Huile'}
                        {carburant.category === 'accessories' && 'Accessoires'}
                        {carburant.category === 'food' && 'Alimentation'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-medium">Prix</span>
                      <span className="text-white">{parseFloat(carburant.price).toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-medium">Stock</span>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          parseInt(carburant.stock, 10) <= parseInt(carburant.minStock, 10)
                            ? 'bg-pink-500/20 text-pink-500'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {carburant.stock}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-medium">Stock Minimum</span>
                      <span className="text-white">{carburant.minStock}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-medium">Fournisseur</span>
                      <span className="text-white">{carburant.supplier}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!showForm && filteredCarburants.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-400 p-8 bg-gray-800/50 rounded-xl"
          >
            Aucun carburant trouvé.
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CarburantForm;