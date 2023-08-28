export const getImgName = (imgName: string) => {
  // file: abc.png, abc.jpg, abc.jpeg, abc.gif, abc.webp
  // return abc
  const imgNameArr = imgName.split('.');
  imgNameArr.pop();
  return imgNameArr.join('');
};

/**
 * Create an object composed of the picked object properties.
 * @param {Object} obj The source object.
 * @param {...(string|string[])} props The property names to pick, specified
 * individually or in arrays.
 * @returns {Object} Returns the new object.
 * @example
 * const object = { 'a': 1, 'b': '2', 'c': 3 }
 * pick(object, ['a', 'c'])
 * => { 'a': 1, 'c': 3 }
 */
export const pick = (object = {}, keys: string[]): any => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};
