export const isArray = value => {
  return !!value && value.constructor === Array;
}

export const isObject = value => {
  return !!value && value.constructor === Object;
}

export const formatToDecimal = (num, decimal) => {
  if (Number(num)) {
    return Number.isInteger(num) ? num : num.toFixed(decimal ? decimal : 2)
  } else {
    return 0
  }

}