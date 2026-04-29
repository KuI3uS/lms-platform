import { Navigate } from "react-router-dom";
import { getPayload } from "../utils/auth";

export default function AdminRoute({ children }) {

    const payload = getPayload();

    if (!payload) return <Navigate to="/" />;

    if (payload.role !== "ADMIN") {
        return <Navigate to="/" />;
    }

    return children;
}