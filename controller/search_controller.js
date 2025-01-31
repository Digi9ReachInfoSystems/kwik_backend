const client = require('../utils/elasticsearch');
const SearchHistory = require('../models/searchHistory_model');
const User = require('../models/user_models');

exports.searchProducts = async (req, res) => {
    try {
        const { q, userId, filters, page = 1, size = 10 } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        

        // Build Elasticsearch query
        const esQuery = {
            index: 'products',
            body: {
                query: {
                    multi_match: {
                        query: q,
                        fields: ['product_name^1', 'product_des','Brand^2', 'category_ref^2', 'sub_category_ref^2'],
                        fuzziness: 'AUTO',
                    },
                },
                from: (page - 1) * size,
                size: parseInt(size, 10),
            },
        };

        // Apply filters if any
        if (filters) {
            try {
                const parsedFilters = JSON.parse(filters);
                esQuery.body.query = {
                    bool: {
                        must: esQuery.body.query,
                        filter: Object.keys(parsedFilters).map((key) => ({
                            term: { [key]: parsedFilters[key] },
                        })),
                    },
                };
            } catch (err) {
                return res.status(400).json({ error: 'Invalid filters format' });
            }
        }

        console.log('Elasticsearch query:', JSON.stringify(esQuery, null, 2));

        // Execute Elasticsearch query
        const esResponse = await client.search(esQuery);

        console.log('Elasticsearch raw response:', JSON.stringify(esResponse, null, 2));

        // Validate response structure
        // if (!esResponse.body || !esResponse.body.hits || !Array.isArray(esResponse.body.hits.hits)) {
        //     console.error('Unexpected Elasticsearch response format:', esResponse);
        //     return res.status(500).json({ error: 'Unexpected Elasticsearch response format' });
        // }

        // Format Elasticsearch response correctly
        const results = esResponse.hits.hits.map((hit) => ({
            id: hit._id,
            product_name: hit._source.product_name,
            product_image: hit._source.product_image,
            Brand: hit._source.Brand,
            category_ref: hit._source.category_ref,
            sub_category_ref: hit._source.sub_category_ref,
            sku: hit._source.sku,
            created_time: hit._source.created_time,
            score: hit._score,
        }));
        // Log search history
        if (userId) {
          const searchEntry = {
              user_id: userId,
              query: q,
              timestamp: new Date(),
              result: results,
          };
          console.log('Search entry:', searchEntry);
         const data= await  User.findOneAndUpdate({ UID: userId }, { $push: { search_history: searchEntry } });
         console.log("dd",data);
      }

        res.json({
            total: esResponse.hits.total.value,
            page: parseInt(page, 10),
            size: parseInt(size, 10),
            results,
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'An error occurred during the search' });
    }
};
