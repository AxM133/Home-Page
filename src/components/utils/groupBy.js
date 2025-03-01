export default function groupBy(array, keyFn) {
    const result = {};
    array.forEach((item) => {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
    });
    return result;
  }
  