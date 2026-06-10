import Request from '../models/Request.js';

// GET /api/history
export const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';
    const filter = req.query.filter || ''; // success | failed | slow
    const method = req.query.method || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    const query = {};

    // Search by URL
    if (search) {
      query.url = { $regex: search, $options: 'i' };
    }

    // Filter by Method
    if (method && method.toUpperCase() !== 'ALL') {
      query.method = method.toUpperCase();
    }

    // Filter by Status / Latency
    if (filter === 'success') {
      query.status = { $gte: 200, $lt: 300 };
    } else if (filter === 'failed') {
      query.$or = [
        { status: { $gte: 400 } },
        { status: { $lt: 200 } },
        { status: null },
        { status: { $exists: false } }
      ];
    } else if (filter === 'slow') {
      query.responseTime = { $gt: 1000 };
    }

    // Set sorting configuration
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skipIndex = (page - 1) * limit;

    const totalCount = await Request.countDocuments(query);
    const requests = await Request.find(query)
      .sort(sortObj)
      .skip(skipIndex)
      .limit(limit);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      requests,
      pagination: {
        currentPage: page,
        totalPages: totalPages || 1,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error in getHistory:', error);
    return res.status(500).json({ error: 'Server error retrieving history.' });
  }
};

// GET /api/history/:id
export const getRequestById = async (req, res) => {
  try {
    const requestItem = await Request.findById(req.params.id);
    if (!requestItem) {
      return res.status(404).json({ error: 'Request log not found.' });
    }
    return res.status(200).json(requestItem);
  } catch (error) {
    console.error('Error in getRequestById:', error);
    return res.status(500).json({ error: 'Server error retrieving request details.' });
  }
};

// DELETE /api/history/:id
export const deleteRequest = async (req, res) => {
  try {
    const deleted = await Request.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Request log not found.' });
    }
    return res.status(200).json({ success: true, message: 'Request log deleted.' });
  } catch (error) {
    console.error('Error in deleteRequest:', error);
    return res.status(500).json({ error: 'Server error deleting request.' });
  }
};

// DELETE /api/history (Clear all)
export const clearAllHistory = async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== true) {
      return res.status(400).json({ error: 'Confirmation is required to delete all history.' });
    }

    const result = await Request.deleteMany({});
    return res.status(200).json({ deleted: result.deletedCount, message: 'All request history cleared.' });
  } catch (error) {
    console.error('Error in clearAllHistory:', error);
    return res.status(500).json({ error: 'Server error clearing history.' });
  }
};
