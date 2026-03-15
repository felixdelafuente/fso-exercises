import axios from "axios";

const baseUrl = "http://localhost:3001/persons";

// 🔹 Fetch all persons
const getAll = () => {
  return axios.get(baseUrl).then((response) => response.data);
};

// 🔹 Create new person
const create = (newPerson) => {
  return axios.post(baseUrl, newPerson).then((response) => response.data);
};

// 🔹 Update existing person (PUT replaces full object)
const update = (id, updatedPerson) => {
  return axios
    .put(`${baseUrl}/${id}`, updatedPerson)
    .then((response) => response.data);
};

// 🔹 Delete person
const remove = (id) => {
  return axios.delete(`${baseUrl}/${id}`);
};

export default { getAll, create, update, remove };
