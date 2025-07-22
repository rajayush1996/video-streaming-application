/* eslint-disable no-mixed-spaces-and-tabs */

const paginate = schema => {
    /**
   * @typedef {Object} QueryResult
   * @property {Document[]} results
   * @property {number|null} skip
   * @property {number|null} limit
   * @property {boolean} hasMore
   * @property {number} totalPages
   * @property {number} totalResults
   * @property {number} currentPage
   */

    schema.statics.paginate = async function(filter = {}, options = {}) {
        const defaultLimit = 10;
        const maxLimit     = 100;

        // 1) Build sort string (ignored when shuffle=true)
        let sort = 'createdAt';
        if (!options.shuffle && options.sortBy) {
            sort = options.sortBy
                .split(',')
                .map(pair => {
                    const [key, order] = pair.split(':');
                    return (order === 'desc' ? '-' : '') + key;
                })
                .join(' ');
        }

        // 2) Lean support
        if (options.lean === true) {
            options.lean = { getters: true };
        }
        const { projection = {}, lean = false, shuffle = false } = options;

        // 3) Page / limit / skip
        const page = Number(options.page) > 0 ? Number(options.page) : 1;
        let limit = Number(options.limit) || defaultLimit;
        if (limit < -1) limit = defaultLimit;
        if (limit > maxLimit) limit = maxLimit;
        const skip = limit > 0 ? (page - 1) * limit : null;
        if (limit === -1) {
            limit = null;
        }

        // 4) Total count
        const totalResults = await this.countDocuments(filter).exec();

        // 5) Fetch docs
        let results;
        if (shuffle) {
            // Use aggregation to randomize at the DB level
            const pipeline = [
                { $match: filter },
                // add random score
                { $addFields: { __rand: { $rand: {} } } },
                // sort by that random score
                { $sort: { __rand: 1 } }
            ];
            if (skip != null)    pipeline.push({ $skip: skip });
            if (limit != null)   pipeline.push({ $limit: limit });
            if (Object.keys(projection).length) {
                pipeline.push({ $project: projection });
            }
            // run it
            results = await this.aggregate(pipeline).exec();
            // clean up the temporary field
            results.forEach(doc => delete doc.__rand);

            // optional: perform Mongoose populate if requested
            if (options.populate) {
                const paths = options.populate.split(',');
                for (const path of paths) {
                    results = await this.populate(results, {
                        path: path.trim(),
                        select: options.populateProjection || {}
                    });
                }
            }
        } else {
            // normal find‑based pagination
            let query = this.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select(projection)
                .lean(lean);

            // populate if needed
            if (options.populate) {
                options.populate.split(',').forEach(p => {
                    query = query.populate({
                        path: p.trim().split('.').reverse().reduce((a,b) => ({ path: b, populate: a })),
                        select: options.populateProjection || {}
                    });
                });
            }

            results = await query.exec();
        }

        // 6) Build metadata
        const hasMore    = limit && skip + limit < totalResults;
        const totalPages = limit ? Math.ceil(totalResults / limit) : 1;

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
