/* eslint-disable no-mixed-spaces-and-tabs */

const paginate = schema => {
	/**
   * @typedef {Object} QueryResult
   * @property {Document[]} results - Results found
   * @property {number} page - Current page
   * @property {number} limit - Maximum number of results per page
   * @property {boolean} hasMore - True if we have more records
   * @property {number} totalPages - Total number of pages
   * @property {number} totalResults - Total number of documents
   */
	/**
   * Query for documents with pagination
   * @param {Object} [filter] - Mongo filter
   * @param {Object} [options] - Query options
   * @param {string} [options.sortBy] - Sorting criteria using the format: sortField:(desc|asc). Multiple sorting criteria should be separated by commas (,)
   * @param {string} [options.populate] - Populate data fields. Hierarchy of fields should be separated by (.). Multiple populating criteria should be separated by commas (,)
   * @param {number} [options.limit] - Maximum number of results per page (default = 10)
   * @param {number} [options.page] - Current page (default = 1)
   * @param {number} [options.lean] - true/false
   * @param {number} [options.projection] - fields to return
   * @param {number} [options.populateProjection] - fields to return for populated fields
   * @returns {Promise<QueryResult>}
   */
	schema.statics.paginate = async function (filter, options) {
		const defaultLimit = 10;
		const maxLimit = 100;
		let sort = '';
		if (options.sortBy) {
			const sortingCriteria = [];
			options.sortBy.split(',').forEach(sortOption => {
				const [key, order] = sortOption.split(':');
				sortingCriteria.push((order === 'desc' ? '-' : '') + key);
			});
			sort = sortingCriteria.join(' ');
		} else {
			sort = 'createdAt';
		}

		if (options.lean === true) {
			options.lean = {getters: true};
		}

		const {projection = {}, lean = false} = options;

		const page
      = options.page && parseInt(options.page, 10) > 0
      	? parseInt(options.page, 10)
      	: 1;

		let limit = parseInt(options.limit, 10) || defaultLimit;
		let skip = null;
		if (limit < -1) {
			limit = defaultLimit;
		} else if (limit > maxLimit) {
			limit = maxLimit;
		}

		if (limit === -1) {
			skip = null;
			limit = null;
		}

		if (limit > 0) {
			skip = (page - 1) * limit;
		}

		const countPromise = this.countDocuments(filter).exec();
		let docsPromise = this.find(filter)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.select(projection)
			.lean(lean);
		options.populateProjection = options.populateProjection || {};
		if (options.populate) {
			options.populate.split(',').forEach(populateOption => {
				docsPromise = docsPromise.populate({
					path: populateOption
						.split('.')
						.reverse()
						.reduce((a, b) => ({
							path: b,
							populate: a,
						})),
					select: options.populateProjection,
				});
			});
		}

		docsPromise = docsPromise.exec();

		return Promise.all([countPromise, docsPromise]).then(values => {
			const [totalResults, results] = values;
			limit = limit || -1;
			let totalPages = 1;
			if (limit) {
				totalPages = Math.ceil(totalResults / limit);
			}

			let hasMore = false;
			if (skip + limit < totalResults) {
				hasMore = true;
			}

			if (limit === -1) {
				hasMore = false;
				totalPages = 1;
				skip = 0;
			}

			const result = {
				results,
				skip,
				limit,
				hasMore,
				totalPages,
				totalResults,
			};
			return Promise.resolve(result);
		});
	};
};

module.exports = paginate;
