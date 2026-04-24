import { useState } from "react";

export default function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const login = async () => {
        const res = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            alert("Błędny login lub hasło");
            return;
        }

        const token = (await res.text()).trim();

        console.log("TOKEN:", token);

        localStorage.setItem("token", token);

        window.location.reload();
    };

    return (
        <div>
            <h2>Login</h2>

            <input
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                placeholder="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={login}>Login</button>
        </div>
    );
}