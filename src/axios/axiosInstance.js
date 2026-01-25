import axios from 'axios';
const baseURL = process.env.REACT_APP_BASE_URL;

const authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

export const axiosPrService = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${authTokens?.accessToken}`
  }
});

export const axiosPbService = axios.create({
  baseURL,
  timeout: 12000,
});


