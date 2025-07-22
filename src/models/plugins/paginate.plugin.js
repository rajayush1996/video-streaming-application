/* eslint-disable no-mixed-spaces-and-tabs */

const paginate = schema => {
    /**
   * @typedef {Object} QueryResult
   * @property {Document[]} results - Results found
   * @property {number} skip - Number of documents skipped
   * @property {number|null} limit - Max number of results per page (null = no limit)
   * @property {boolean} hasMore - True if there are more records
   * @property {number} totalPages - Total number of pages
   * @property {number} totalResults - Total number of documents
   * @property {number} currentPage - Current page number
   */
    /**
   * Query for documents with pagination (+ optional shuffle)
   * @param {Object} [filter] - Mongo filter
   * @param {Object} [options] - Query options
   * @param {string} [options.sortBy] - Field:(asc|desc), comma‑separated
   * @param {string} [options.populate] - Paths to populate, comma‑separated
   * @param {number} [options.limit=10] - Max results per page
   * @param {number} [options.page=1] - Page number
   * @param {boolean|Object} [options.lean=false] - lean mode
   * @param {Object} [options.projection={}] - fields to return
   * @param {Object} [options.populateProjection={}] - fields for populated docs
   * @param {boolean} [options.shuffle=false] - if true, randomly shuffle the page’s results
   * @returns {Promise<QueryResult>}
   */
    schema.statics.paginate = async function (filter = {}, options = {}) {
        const defaultLimit = 10;
        const maxLimit = 100;

        // 1) build sort string
        let sort = 'createdAt';
        if (options.sortBy) {
            sort = options.sortBy
                .split(',')
                .map(pair => {
                    const [key, order] = pair.split(':');
                    return (order === 'desc' ? '-' : '') + key;
                })
                .join(' ');
        }

        // 2) lean flag
        if (options.lean === true) {
            options.lean = { getters: true };
        }
        const { projection = {}, lean = false, shuffle = false } = options;

        // 3) page & limit
        const page = Number(options.page) > 0 ? Number(options.page) : 1;
        let limit = Number(options.limit) || defaultLimit;
        if (limit < -1) limit = defaultLimit;
        if (limit > maxLimit) limit = maxLimit;
        const skip = limit > 0 ? (page - 1) * limit : null;
        if (limit === -1) {
            limit = null;
        }

        // 4) count + docs queries
        const countPromise = this.countDocuments(filter).exec();
        let docsQuery = this.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select(projection)
            .lean(lean);

        // 5) populate if needed
        if (options.populate) {
            options.populate.split(',').forEach(path => {
                docsQuery = docsQuery.populate({
                    path: path.split('.').reverse().reduce((a, b) => ({ path: b, populate: a })),
                    select: options.populateProjection || {},
                });
            });
        }

        // 6) execute both
        const [ totalResults, results ] = await Promise.all([
            countPromise,
            docsQuery.exec()
        ]);

        // 7) optionally shuffle results in‑memory
        if (shuffle && Array.isArray(results)) {
            for (let i = results.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [results[i], results[j]] = [results[j], results[i]];
            }
        }

        // 8) build pagination meta
        const totalPages = limit ? Math.ceil(totalResults / limit) : 1;
        const hasMore = limit && skip + limit < totalResults;

        return {
            results,
            skip,
            limit,
            hasMore,
            totalPages,
            totalResults,
            currentPage: page
        };
    };
};

module.exports = paginate;
