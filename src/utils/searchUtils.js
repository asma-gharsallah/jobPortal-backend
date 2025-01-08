/**
 * Build MongoDB filter object based on search parameters
 * @param {Object} params - Search parameters
 * @returns {Object} MongoDB filter object
 */
exports.buildJobFilter = (params) => {
  const filter = { status: 'active' };
  
  if (params.search) {
    filter.$or = [
      { title: { $regex: params.search, $options: 'i' } },
      { company: { $regex: params.search, $options: 'i' } },
      { description: { $regex: params.search, $options: 'i' } },
      { skills: { $in: [new RegExp(params.search, 'i')] } }
    ];
  }

  if (params.category) {
    filter.category = params.category;
  }

  if (params.location) {
    filter.location = { $regex: params.location, $options: 'i' };
  }

  if (params.type) {
    filter.type = params.type;
  }

  if (params.minSalary) {
    filter['salary.min'] = { $gte: parseInt(params.minSalary) };
  }

  if (params.maxSalary) {
    filter['salary.max'] = { $lte: parseInt(params.maxSalary) };
  }

  if (params.experience) {
    filter['experience.min'] = { $lte: parseInt(params.experience) };
    filter['experience.max'] = { $gte: parseInt(params.experience) };
  }

  if (params.skills && Array.isArray(params.skills)) {
    filter.skills = { $all: params.skills };
  }

  return filter;
};

/**
 * Build MongoDB sort object based on sort parameters
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Object} MongoDB sort object
 */
exports.buildSortObject = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
  return sortObj;
};

/**
 * Build pagination object
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination object with skip and limit
 */
exports.buildPaginationObject = (page = 1, limit = 10) => {
  return {
    skip: (page - 1) * limit,
    limit: parseInt(limit)
  };
};

/**
 * Format pagination response
 * @param {Array} data - Results array
 * @param {number} total - Total number of documents
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Formatted response with pagination info
 */
exports.formatPaginatedResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      perPage: limit,
      hasMore: page * limit < total
    }
  };
};