import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [token, setToken] = useState(null);

  const handleLogout = () => {
    setToken(null);
  };

  if (token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  return showRegister ? (
    <Register onSwitch={() => setShowRegister(false)} />
  ) : (
    <Login onLoginSuccess={setToken} onSwitch={() => setShowRegister(true)} />
  );
}

export default App;