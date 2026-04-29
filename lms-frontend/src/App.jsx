import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import CoursesPage from "./pages/CoursesPage";
import ModulePage from "./pages/ModulePage";
import TestPage from "./pages/TestPage";
import ResultsPage from "./pages/ResultsPage";
import Login from "./Login";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import AddCoursePage from "./pages/AddCoursePage";
import AddQuestionPage from "./pages/AddQuestionPage";
import AdminRoute from "./components/AdminRoute";
import AdminUsers from "./pages/admin/AdminUsers";

export default function App() {

    const token = localStorage.getItem("token");

    if (!token) {
        return <Login />;
    }

    return (
        <Layout>
            <Routes>
                <Route path="/admin" element={
                    <AdminRoute><AdminPage /></AdminRoute>
                } />
                <Route path="/admin/add-course" element={
                    <AdminRoute><AddCoursePage /></AdminRoute>
                } />
                <Route path="/admin/add-question" element={
                    <AdminRoute><AddQuestionPage /></AdminRoute>
                } />
                <Route path="/admin/users" element={
                    <AdminRoute><AdminUsers /></AdminRoute>
                } />

                <Route path="/" element={<CoursesPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/modules/:courseId" element={<ModulePage />} />
                <Route path="/test/:moduleId" element={<TestPage />} />
                <Route path="/results" element={<ResultsPage />} />
            </Routes>
        </Layout>
    );
}