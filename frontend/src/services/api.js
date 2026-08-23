import axios from "axios";

const api = axios.create({
 baseURL: "https://expert-decision-replay-platform-group-2.onrender.com",
});

export default api;