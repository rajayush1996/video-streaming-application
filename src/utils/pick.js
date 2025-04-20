/**
 * Picks specific properties from an object.
 * 
 * @param {Object} obj - The source object.
 * @param {Array<string>} keys - The keys to pick from the object.
 * @returns {Object} - A new object with only the picked properties.
 */
const pick = (obj, keys) => {
    if (!obj || typeof obj !== 'object') {
        return {};
    }

    return keys.reduce((result, key) => {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
};

module.exports = pick;