const express = require('express');
const { getCollections } = require('../config/database');
const { requireRoleAction } = require('../middlewares/auth');

const router = express.Router();

function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

function formatMonthKey(date) {
  return date.toISOString().slice(0, 7);
}

function buildDateRange(days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

function buildMonthRange(months) {
  const result = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - i);
    result.push(d);
  }
  return result;
}

function calcGrowth(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

router.get('/stats', requireRoleAction('admin', ['edit all', 'sales ctrl', 'view']), async (req, res) => {
  const { productCollection, orderCollection, userCollection, blogCollection, feedbackCollection } = getCollections();

  try {
    const totalProducts = await productCollection.countDocuments();
    const totalOrders = await orderCollection.countDocuments();
    const totalUsers = await userCollection.countDocuments();
    const totalBlogs = await blogCollection.countDocuments();
    const totalContacts = await feedbackCollection.countDocuments();
    const newContacts = await feedbackCollection.countDocuments({ status: 'new' });

    const pendingOrders = await orderCollection.countDocuments({ status: 'in_progress' });
    const completedOrders = await orderCollection.countDocuments({ status: 'completed' });
    const cancelledOrders = await orderCollection.countDocuments({ status: 'cancelled' });

    const revenueResult = await orderCollection.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]).toArray();
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    const recentOrders = await orderCollection.find().sort({ createdAt: -1 }).limit(5).toArray();
    const lowStockProducts = await productCollection.find({ stocked_quantity: { $lte: 10 } }).sort({ stocked_quantity: 1 }).limit(5).toArray();
    const topProducts = await orderCollection.aggregate([
      { $unwind: '$selectedItems' },
      {
        $group: {
          _id: '$selectedItems._id',
          productName: { $first: '$selectedItems.product_name' },
          totalQuantity: { $sum: '$selectedItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$selectedItems.quantity', '$selectedItems.unit_price'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]).toArray();

    const dailyAgg = await orderCollection.aggregate([
      {
        $project: {
          status: 1,
          totalPrice: 1,
          createdDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'Asia/Ho_Chi_Minh'
            }
          }
        }
      },
      {
        $group: {
          _id: '$createdDate',
          dailyOrders: { $sum: 1 },
          dailyRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalPrice', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    const monthlyAgg = await orderCollection.aggregate([
      {
        $project: {
          status: 1,
          totalPrice: 1,
          createdMonth: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt',
              timezone: 'Asia/Ho_Chi_Minh'
            }
          }
        }
      },
      {
        $group: {
          _id: '$createdMonth',
          monthlyOrders: { $sum: 1 },
          monthlyRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalPrice', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    const dailyMap = new Map(dailyAgg.map((d) => [d._id, d]));
    const monthlyMap = new Map(monthlyAgg.map((m) => [m._id, m]));

    const salesData = buildDateRange(30).map((d) => {
      const key = formatDateKey(d);
      const value = dailyMap.get(key);
      return {
        _id: key,
        dailyRevenue: value?.dailyRevenue || 0,
        dailyOrders: value?.dailyOrders || 0
      };
    });

    const weeklySalesData = buildDateRange(7).map((d) => {
      const key = formatDateKey(d);
      const value = dailyMap.get(key);
      return {
        _id: key,
        dailyRevenue: value?.dailyRevenue || 0,
        dailyOrders: value?.dailyOrders || 0
      };
    });

    const monthlySalesData = buildMonthRange(12).map((d) => {
      const key = formatMonthKey(d);
      const value = monthlyMap.get(key);
      return {
        _id: key,
        monthlyRevenue: value?.monthlyRevenue || 0,
        monthlyOrders: value?.monthlyOrders || 0
      };
    });

    const current7DaysRevenue = weeklySalesData.reduce((sum, item) => sum + item.dailyRevenue, 0);
    const current7DaysOrders = weeklySalesData.reduce((sum, item) => sum + item.dailyOrders, 0);

    const previous7DayKeys = buildDateRange(14).slice(0, 7).map((d) => formatDateKey(d));
    const previous7DaysRevenue = previous7DayKeys.reduce((sum, key) => sum + (dailyMap.get(key)?.dailyRevenue || 0), 0);
    const previous7DaysOrders = previous7DayKeys.reduce((sum, key) => sum + (dailyMap.get(key)?.dailyOrders || 0), 0);

    const revenueGrowth = Number(calcGrowth(current7DaysRevenue, previous7DaysRevenue).toFixed(1));
    const ordersGrowth = Number(calcGrowth(current7DaysOrders, previous7DaysOrders).toFixed(1));

    return res.status(200).json({
      overview: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalBlogs,
        totalContacts,
        newContacts,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        avgOrderValue,
        revenueGrowth,
        ordersGrowth
      },
      recentOrders,
      lowStockProducts,
      topProducts,
      salesData,
      weeklySalesData,
      monthlySalesData
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/activities', requireRoleAction('admin', ['edit all', 'sales ctrl', 'account ctrl', 'view']), async (req, res) => {
  const { productCollection, blogCollection, orderCollection, feedbackCollection } = getCollections();

  try {
    const [latestProducts, latestBlogs, latestOrders, latestFeedback] = await Promise.all([
      productCollection.find({}, { projection: { product_name: 1, updatedAt: 1, createdAt: 1 } }).sort({ updatedAt: -1, createdAt: -1, _id: -1 }).limit(5).toArray(),
      blogCollection.find({}, { projection: { title: 1, updatedAt: 1, createdAt: 1, published: 1 } }).sort({ updatedAt: -1, createdAt: -1, _id: -1 }).limit(5).toArray(),
      orderCollection.find({}, { projection: { status: 1, totalPrice: 1, updatedAt: 1, createdAt: 1 } }).sort({ updatedAt: -1, createdAt: -1, _id: -1 }).limit(5).toArray(),
      feedbackCollection.find({}, { projection: { fullName: 1, status: 1, message: 1, updatedAt: 1, submittedAt: 1 } }).sort({ updatedAt: -1, submittedAt: -1, _id: -1 }).limit(5).toArray()
    ]);

    const resolveTimestamp = (doc, extraFields = []) => {
      const candidates = [...extraFields, 'updatedAt', 'createdAt', 'submittedAt'];
      for (const field of candidates) {
        if (doc?.[field]) {
          const value = doc[field];
          const parsed = value instanceof Date ? value : new Date(value);
          if (!Number.isNaN(parsed.getTime())) return parsed;
        }
      }
      return doc?._id?.getTimestamp ? doc._id.getTimestamp() : new Date();
    };

    const formatCurrency = (amount) => {
      if (typeof amount !== 'number') return '';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
    };

    const orderStatusLabels = {
      in_progress: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };

    const activities = [
      ...latestProducts.map((product) => ({
        category: 'Chức năng',
        item: 'Sản phẩm',
        name: product?.product_name || `ID: ${product?._id?.toString() ?? ''}`,
        action: 'edit',
        timestamp: resolveTimestamp(product),
        meta: { type: 'product', id: product?._id?.toString() ?? null }
      })),
      ...latestBlogs.map((blog) => ({
        category: 'Chức năng',
        item: blog?.published === false ? 'Blog (nháp)' : 'Blog',
        name: blog?.title || `ID: ${blog?._id?.toString() ?? ''}`,
        action: 'edit',
        timestamp: resolveTimestamp(blog),
        meta: { type: 'blog', id: blog?._id?.toString() ?? null }
      })),
      ...latestOrders.map((order) => ({
        category: 'Đơn hàng',
        item: `#${order?._id?.toString().slice(-8) ?? ''}`,
        name: `${orderStatusLabels[order?.status] || 'Don hang'}${order?.totalPrice ? ` • ${formatCurrency(order.totalPrice)}` : ''}`,
        action: 'view',
        timestamp: resolveTimestamp(order),
        meta: { type: 'order', id: order?._id?.toString() ?? null, status: order?.status ?? null }
      })),
      ...latestFeedback.map((feedback) => ({
        category: 'Liên hệ',
        item: feedback?.status === 'new' ? 'Liên hệ mới' : 'Liên hệ',
        name: feedback?.fullName || 'Khách hàng ẩn danh',
        action: 'view',
        timestamp: resolveTimestamp(feedback, ['submittedAt']),
        meta: { type: 'feedback', id: feedback?._id?.toString() ?? null, status: feedback?.status ?? null }
      }))
    ]
      .filter((activity) => activity.name && activity.timestamp)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 12)
      .map((activity) => ({
        ...activity,
        timestamp: activity.timestamp instanceof Date ? activity.timestamp.toISOString() : activity.timestamp
      }));

    return res.status(200).json({ activities });
  } catch (err) {
    console.error('Error fetching recent dashboard activities:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
