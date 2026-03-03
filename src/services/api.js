import axios from 'axios';

const api = axios.create({
  baseURL: 'https://rnplanner-api.azurewebsites.net', 
  timeout: 5000,
});

export default api;