function formatApiResult(data) {
    if (Array.isArray(data)) {
        return data.map(formatApiResult);
    }
  
    if (data && typeof data === 'object') {
        const { _id, ...rest } = data;
        return {
            id: _id ?? data.id, // fallback if already has `id`
            ...rest,
        };
    }
  
    return data;
}

module.exports = {
    formatApiResult
}