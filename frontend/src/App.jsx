import { useState } from "react";
import Landing from "./Landing";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import Dashboard from "./Dashboard";

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState("login"); // "login" | "register" | "forgot"
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setShowLanding(true);
    setView("login");
  };

  if (token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  if (showLanding) {
   return (
     <Landing
       onLogin={() => {
         setShowLanding(false);
         setView("login");
       }}
       onSignup={() => {
         setShowLanding(false);
         setView("register");
       }}
     />
    );
  }

  if (view === "register") {
    return <Register onSwitch={() => setView("login")} onBackToLanding={() => setShowLanding(true)} />;
  }

  if (view === "forgot") {
    return <ForgotPassword onSwitch={() => setView("login")} />;
  }

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onSwitch={() => setView("register")}
      onForgotPassword={() => setView("forgot")}
       onBackToLanding={() => setShowLanding(true)}
    />
  );
}

export default App;
