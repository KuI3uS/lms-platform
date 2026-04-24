import { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

export default function App() {
  const [logged, setLogged] = useState(
      localStorage.getItem("token") !== null
  );

  return (
      <div>
        {!logged ? (
            <Login onLogin={() => setLogged(true)} />
        ) : (
            <Dashboard />
        )}
      </div>
  );
}