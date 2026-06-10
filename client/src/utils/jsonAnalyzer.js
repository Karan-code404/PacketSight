/**
 * Returns response summary stats for root node
 * @param {*} data - Parsed JSON object/array
 * @returns {Object} { type, topLevelKeyCount, arrayLength }
 */
export function getResponseSummary(data) {
  if (data === null || typeof data !== 'object') {
    return {
      type: 'Primitive',
      topLevelKeyCount: 0,
      arrayLength: 'N/A'
    };
  }

  if (Array.isArray(data)) {
    return {
      type: 'JSON Array',
      topLevelKeyCount: 0,
      arrayLength: data.length
    };
  }

  return {
    type: 'JSON Object',
    topLevelKeyCount: Object.keys(data).length,
    arrayLength: 'N/A'
  };
}

/**
 * Recursively counts all keys across nested elements
 * @param {*} data 
 * @returns {Number} Total key count
 */
export function countAllKeys(data) {
  if (data === null || typeof data !== 'object') {
    return 0;
  }
  let count = 0;
  if (Array.isArray(data)) {
    data.forEach(item => {
      count += countAllKeys(item);
    });
  } else {
    const keys = Object.keys(data);
    count += keys.length;
    keys.forEach(key => {
      count += countAllKeys(data[key]);
    });
  }
  return count;
}

/**
 * Computes maximum nesting depth
 * @param {*} data 
 * @returns {Number} Maximum depth
 */
export function getMaxDepth(data) {
  if (data === null || typeof data !== 'object') {
    return 0;
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return 1;
    return 1 + Math.max(...data.map(item => getMaxDepth(item)));
  }
  const keys = Object.keys(data);
  if (keys.length === 0) return 1;
  return 1 + Math.max(...keys.map(key => getMaxDepth(data[key])));
}

/**
 * Parses and returns nested items, arrays, depth, and total count keys
 * @param {*} data - JSON data
 * @returns {Object} { nestedObjects: [], arrays: [], maxDepth: N, totalKeys: N }
 */
export function analyzeStructure(data) {
  const result = {
    nestedObjects: [],
    arrays: [],
    maxDepth: getMaxDepth(data),
    totalKeys: countAllKeys(data)
  };

  const traverse = (obj) => {
    if (obj === null || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach(item => traverse(item));
    } else {
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        
        if (val !== null && typeof val === 'object') {
          if (Array.isArray(val)) {
            result.arrays.push(key);
            traverse(val);
          } else {
            result.nestedObjects.push(key);
            traverse(val);
          }
        }
      });
    }
  };

  traverse(data);

  // De-duplicate lists
  result.nestedObjects = [...new Set(result.nestedObjects)];
  result.arrays = [...new Set(result.arrays)];

  return result;
}
