import axios from 'axios';

const api = axios.create({
  baseURL: 'https://rnplanner-api-ekc2hratcvgqhgc5.brazilsouth-01.azurewebsites.net', 
  timeout: 5000,
});

export default api;