const Vente = require('../models/Vente');
const Citerne = require('../models/Citerne');
const Carburant = require('../models/Carburant');
const Employe = require('../models/Employe');

// Get sales data for the line chart (trends over time)
exports.getSalesData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let start = new Date();
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      start.setDate(end.getDate() - 6);
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ message: 'Invalid date range provided' });
    }

    const sales = await Vente.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$category', 'Carburant'] },
                {
                  $multiply: [
                    { $toDouble: { $ifNull: ['$quantity', 0] } },
                    { $toDouble: { $ifNull: ['$unitPrice', 0] } },
                  ],
                },
                {
                  $multiply: [
                    { $toDouble: { $ifNull: ['$quantityPieces', 0] } },
                    { $toDouble: { $ifNull: ['$price', 0] } },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const labels = [];
    const values = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const sale = sales.find(s => s._id === dateStr);
      labels.push(currentDate.toLocaleDateString('fr-FR', { weekday: 'short' }));
      values.push(sale ? sale.totalRevenue : 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ labels, values });
  } catch (err) {
    console.error('Erreur lors de la récupération des données de ventes:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des données de ventes: ' + err.message });
  }
};

// Get tank levels for the bar chart
exports.getTankData = async (req, res) => {
  try {
    const citernes = await Citerne.find();
    if (!citernes || citernes.length === 0) {
      return res.json({ labels: [], levels: [], capacities: [], currentLevels: [] });
    }

    const labels = citernes.map(c => c.fuelType || 'Unknown');
    const levels = citernes.map(c => {
      const currentLevel = parseFloat(c.currentLevel) || 0;
      const capacity = parseFloat(c.capacity) || 1; // Avoid division by zero
      return (currentLevel / capacity) * 100;
    });
    const capacities = citernes.map(c => parseFloat(c.capacity) || 1);
    const currentLevels = citernes.map(c => parseFloat(c.currentLevel) || 0);

    res.json({ labels, levels, capacities, currentLevels });
  } catch (err) {
    console.error('Erreur lors de la récupération des données des citernes:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des données des citernes: ' + err.message });
  }
};

// Get statistics for the stat cards
exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = { category: 'Carburant' };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return res.status(400).json({ message: 'Invalid date range provided' });
      }
      matchStage.date = { $gte: start, $lte: end };
    }

    const fuelSales = await Vente.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalLiters: { $sum: { $toDouble: { $ifNull: ['$quantity', 0] } } },
        },
      },
    ]);

    const revenueMatchStage = {};
    if (startDate && endDate) {
      revenueMatchStage.date = matchStage.date;
    }

    const revenue = await Vente.aggregate([
      { $match: revenueMatchStage },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$category', 'Carburant'] },
                {
                  $multiply: [
                    { $toDouble: { $ifNull: ['$quantity', 0] } },
                    { $toDouble: { $ifNull: ['$unitPrice', 0] } },
                  ],
                },
                {
                  $multiply: [
                    { $toDouble: { $ifNull: ['$quantityPieces', 0] } },
                    { $toDouble: { $ifNull: ['$price', 0] } },
                  ],
                },
              ],
            },
          },
        },
      },
    ]);

    const activeEmployees = await Employe.countDocuments({ isActive: true });

    const products = await Carburant.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: { $toDouble: { $ifNull: ['$stock', 0] } } },
          toReorder: {
            $sum: {
              $cond: [
                { $lt: [{ $toDouble: { $ifNull: ['$stock', 0] } }, { $toDouble: { $ifNull: ['$minStock', 0] } }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    res.json({
      fuelSales: fuelSales[0]?.totalLiters || 0,
      revenue: revenue[0]?.totalRevenue || 0,
      activeEmployees: activeEmployees || 0,
      productsInStock: products[0]?.totalStock || 0,
      productsToReorder: products[0]?.toReorder || 0,
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des statistiques:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques: ' + err.message });
  }
};

// Get recent activity
exports.getRecentActivity = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return res.status(400).json({ message: 'Invalid date range provided' });
      }
      matchStage.date = { $gte: start, $lte: end };
    }

    const recentSales = await Vente.find(matchStage)
      .sort({ date: -1 })
      .limit(4)
      .select('date category pumpNumber fuelType');

    if (!recentSales || recentSales.length === 0) {
      return res.json([]);
    }

    const activities = recentSales.map(sale => {
      const saleDate = sale.date && sale.date instanceof Date ? sale.date : new Date();
      return {
        time: saleDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        event: sale.category === 'Carburant' ? `Nouvelle vente - Pompe ${sale.pumpNumber || 'N/A'}` : 'Vente de produit',
      };
    });

    res.json(activities);
  } catch (err) {
    console.error('Erreur lors de la récupération des activités récentes:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des activités récentes: ' + err.message });
  }
};

// Get sales distribution by fuel type for the pie chart
exports.getSalesDistribution = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = { category: 'Carburant' };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return res.status(400).json({ message: 'Invalid date range provided' });
      }
      matchStage.date = { $gte: start, $lte: end };
    }

    const salesDistribution = await Vente.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$fuelType',
          totalQuantity: { $sum: { $toDouble: { $ifNull: ['$quantity', 0] } } },
        },
      },
      {
        $project: {
          fuelType: '$_id',
          totalQuantity: 1,
          _id: 0,
        },
      },
    ]);

    const labels = salesDistribution.map(item => item.fuelType || 'Unknown');
    const values = salesDistribution.map(item => item.totalQuantity);

    res.json({ labels, values });
  } catch (err) {
    console.error('Erreur lors de la récupération de la distribution des ventes:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération de la distribution des ventes: ' + err.message });
  }
};