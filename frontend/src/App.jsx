import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

function App() {
  const [showRegister, setShowRegister] = useState(false);

  return showRegister ? (
    <Register onSwitch={() => setShowRegister(false)} />
  ) : (
    <Login onSwitch={() => setShowRegister(true)} />
  );
}

export default App;