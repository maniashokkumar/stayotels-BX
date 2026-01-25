export const horizontalBarChartColors = [
  "#67dc98",
  "#7ddd67",
  "#c4dd67",
  "#dc67ce",
  "#a367dc",
  "#a0dd68",
  "#67dd76",
  "#fffff",
];

export const pincodeBarChartColors = [
  "#D8DC67",
  "#67DC7C",
  "#67C0DC",
  "#AA67DC",
  "#DA67DC",
  "#DC679E",
  "#B567DC",
  "#BEDC67",
];

export const monthNames = {
  short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ],
  default: ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
}

export const chartColor = {
  green: (opacity) => {
    return `rgba(104, 179, 0, ${opacity ? opacity : 0.5})`
  },
  lightGreen: (opacity) => `rgba(214, 246, 211, ${opacity ? opacity : 1})`,
  yellow: (opacity) => `rgba(213, 199, 44, ${opacity ? opacity : 1})`,
  lightYellow: (opacity) => `rgba(243, 239, 196, ${opacity ? opacity : 1})`,
  red: (opacity) => `rgba(210, 32, 47, ${opacity ? opacity : 1})`,
  cyan: (opacity) => `rgba(122,228,220, ${opacity ? opacity : 1})`,
}
