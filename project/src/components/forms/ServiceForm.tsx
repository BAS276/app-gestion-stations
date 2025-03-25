import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search, Box, DollarSign, Clock, Calendar, User } from 'lucide-react';
import axios from 'axios';

interface Service {
  _id: string;
  nomService: string;
  description: string;
  price: string;
  duration: string;
  availability: string;
  technician: string;
  stations?: string[];
}

const API_URL = 'http://localhost:5000/api/services';

const ServiceForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nomService: '',
    description: '',
    price: '',
    duration: '',
    availability: '',
    technician: '',
    stations: [],
  });
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    let filtered = [...services];
    if (searchQuery) {
      filtered = filtered.filter(
        service =>
          service.nomService.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.technician.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredServices(filtered);
  }, [services, searchQuery]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(API_URL);
      setServices(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des services:', error);
      setError('Impossible de charger les services. Veuillez réessayer.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.nomService.trim()) {
      setError('Le nom du service est requis.');
      return;
    }
    if (!formData.description.trim()) {
      setError('La description est requise.');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Le prix doit être un nombre positif.');
      return;
    }
    if (!formData.duration || parseInt(formData.duration, 10) <= 0) {
      setError('La durée doit être un nombre positif.');
      return;
    }
    if (!formData.availability) {
      setError('La disponibilité est requise.');
      return;
    }
    if (!formData.technician.trim()) {
      setError('Le technicien est requis.');
      return;
    }

    try {
      const dataToSend = {
        nomService: formData.nomService.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration, 10),
        availability: formData.availability,
        technician: formData.technician.trim(),
        stations: formData.stations,
      };

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, dataToSend);
        setServices(services.map(service => service._id === editingId ? { ...dataToSend, _id: editingId } : service));
        setEditingId(null);
      } else {
        const response = await axios.post(API_URL, dataToSend);
        setServices([...services, response.data]);
      }
      setFormData({
        nomService: '',
        description: '',
        price: '',
        duration: '',
        availability: '',
        technician: '',
        stations: [],
      });
      setShowForm(false);
      setError(null);
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'ajout/modification du service');
    }
  };

  const handleEdit = (service: Service) => {
    setFormData({
      nomService: service.nomService,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      availability: service.availability,
      technician: service.technician,
      stations: service.stations || [],
    });
    setEditingId(service._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce service ?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setServices(services.filter(service => service._id !== id));
        setError(null);
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression du service. Veuillez réessayer.');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      nomService: '',
      description: '',
      price: '',
      duration: '',
      availability: '',
      technician: '',
      stations: [],
    });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Box className="h-8 w-8 text-pink-500" />
          Gestion des Services
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
          >
            {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {showForm ? 'Fermer' : 'Ajouter un Service'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-pink-900/50 border border-pink-700 text-pink-200 rounded-lg shadow-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-pink-300 hover:text-pink-100">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom du Service</label>
              <div className="relative">
                <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.nomService}
                  onChange={(e) => setFormData({ ...formData, nomService: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Prix (DH)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                rows={3}
                required
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Durée (minutes)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Disponibilité</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200 appearance-none"
                  required
                >
                  <option value="">Sélectionner la disponibilité</option>
                  <option value="always">Toujours disponible</option>
                  <option value="appointment">Sur rendez-vous</option>
                  <option value="limited">Disponibilité limitée</option>
                </select>
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Technicien Responsable</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.technician}
                  onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-700 text-white transition-all duration-200"
                  required
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-md"
            >
              {editingId ? 'Modifier' : 'Ajouter'} le Service
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all duration-300 shadow-md"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-8">
              Aucun service trouvé.
            </div>
          ) : (
            filteredServices.map((service, index) => (
              <div
                key={service._id}
                className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Box className="h-6 w-6 text-pink-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{service.nomService}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-pink-500 hover:text-pink-400 transition-colors duration-200"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(service._id)}
                      className="text-pink-500 hover:text-pink-400 transition-colors duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" /> Prix
                    </span>
                    <span className="text-sm text-white font-medium">{service.price} DH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Durée
                    </span>
                    <span className="text-sm text-white font-medium">{service.duration} minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Disponibilité
                    </span>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        service.availability === 'always'
                          ? 'bg-green-600 text-white'
                          : service.availability === 'appointment'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-pink-600 text-white'
                      }`}
                    >
                      {service.availability === 'always' && 'Toujours disponible'}
                      {service.availability === 'appointment' && 'Sur rendez-vous'}
                      {service.availability === 'limited' && 'Disponibilité limitée'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <User className="h-4 w-4" /> Technicien
                    </span>
                    <span className="text-sm text-white font-medium">{service.technician}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceForm;