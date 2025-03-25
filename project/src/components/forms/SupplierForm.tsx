import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Supplier {
  _id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  products: string;
  contractNumber: string;
}

const API_URL = 'http://localhost:5000/api/fournisseurs';

const SupplierForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    products: '',
    contractNumber: '',
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setSuppliers(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des fournisseurs:', error);
      setError('Impossible de charger les fournisseurs. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        name: formData.name,
        contact: formData.contact,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        products: formData.products,
        contractNumber: formData.contractNumber,
      };

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, dataToSend);
        setSuppliers(suppliers.map(supplier => supplier._id === editingId ? { ...dataToSend, _id: editingId } : supplier));
        setEditingId(null);
      } else {
        const response = await axios.post(API_URL, dataToSend);
        setSuppliers([...suppliers, response.data]);
      }
      setFormData({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
        products: '',
        contractNumber: '',
      });
      setShowForm(false);
      setError(null);
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'ajout/modification du fournisseur');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      products: supplier.products,
      contractNumber: supplier.contractNumber,
    });
    setEditingId(supplier._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSuppliers(suppliers.filter(supplier => supplier._id !== id));
        setError(null);
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression du fournisseur. Veuillez réessayer.');
      }
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.products.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Gestion des Fournisseurs</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, contact, email, produits ou contrat..."
              className="px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 w-64 text-white placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
          >
            {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {showForm ? 'Fermer' : 'Ajouter un Fournisseur'}
          </button>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Form Section */}
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom de l'Entreprise</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Principal</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Adresse</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Produits Fournis</label>
                <input
                  type="text"
                  value={formData.products}
                  onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Numéro de Contrat</label>
                <input
                  type="text"
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    name: '',
                    contact: '',
                    email: '',
                    phone: '',
                    address: '',
                    products: '',
                    contractNumber: '',
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
              >
                {editingId ? 'Modifier le Fournisseur' : 'Ajouter le Fournisseur'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden"
      >
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Téléphone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Adresse</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Produits</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Contrat</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            <AnimatePresence>
              {filteredSuppliers.map((supplier) => (
                <motion.tr
                  key={supplier._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-700 transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{supplier.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{supplier.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{supplier.phone}</td>
                  <td className="px-6 py-4 text-white">{supplier.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{supplier.products}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{supplier.contractNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="text-pink-500 hover:text-pink-400 transition-colors duration-200 mr-4"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier._id)}
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
        {filteredSuppliers.length === 0 && (
          <div className="text-center text-gray-400 p-6">Aucun fournisseur trouvé.</div>
        )}
      </motion.div>
    </div>
  );
};

export default SupplierForm;