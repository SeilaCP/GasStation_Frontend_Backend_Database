import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

export const getcustomer = async () => {
  const response = await axios.get(`${API_BASE_URL}/customers`);
  return response.data;
};

export const getcustomerById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/customers/${id}`);
  return response.data;
};