import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("edrp_token") || null);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem("edrp_token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("edrp_token");
    setToken(null);
  };

  if (token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  return showRegister ? (
    <Register onSwitch={() => setShowRegister(false)} />
  ) : (
    <Login onLoginSuccess={handleLoginSuccess} onSwitch={() => setShowRegister(true)} />
  );
}

export default App;