export const businessCurrencies = [
  {
    currency: 'inr',
    country: 'India',
    symbol: '₹'
  },
  {
    currency: 'usd',
    country: 'USA',
    symbol: '$'
  },
  {
    currency: 'ps',
    country: 'England',
    symbol: '₤'
  }
]
export const languages = [
  {
    code: 'en',
    name: 'English',
  },
  {
    code: 'fr',
    name: 'Français',
  },
  {
    code: 'Tam',
    name: 'தமிழ்',
  }
]

export const alertMessages = {
  unableToLoad: "unableToLoad",
  noDataFound: "noDataFound"
}


export const FLOW_TYPE = {
  NEW: "NEW",
  EDIT: "EDIT"
}

export const CRUD_ACTION = {
  DELETE: "DELETE",
  EDIT: "EDIT",
  CREATE: "CREATE",
  VIEW: "VIEW"
}

export let AMENITIES_ID = [];

export const setAmenitiesId = (ids) => {
  AMENITIES_ID = ids;
};

export let LOCATION_ID = [];

export const setLocationId = (ids) => {
  LOCATION_ID = ids;
};

export let HOTEL_ID = [];

export const setHotelId = (ids) => {
  HOTEL_ID = ids;
};

export const typeOfRooms = {
  type: [
    { label: "Villa", value: "villa" },
    { label: "Cottage", value: "cottage" },
    { label: "Rooms", value: "rooms" },
    { label: "Resort", value: "resort" },
  ]
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const DEACTIVATE_ACTIVATE_USER = "DEACTIVATE_ACTIVATE";

export const AWS_URL = "https://www.stayotels.com/images";
export const TECHNICIAN_ROLE_ID = "ROL00002";


