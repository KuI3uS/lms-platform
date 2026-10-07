import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";

/* ===== USER PAGES ===== */

import CoursesPage from "./pages/CoursesPage";
import ModulePage from "./pages/ModulePage";
import LessonListPage from "./pages/LessonListPage";
import LessonPage from "./pages/LessonPage";
import TestPage from "./pages/TestPage";
import ResultsPage from "./pages/ResultsPage";
import DashboardPage from "./pages/DashboardPage";

/* ===== AUTH ===== */
import Login from "./Login";
import Register from "./Register";

/* ===== ADMIN ===== */
import AdminPage from "./pages/AdminPage";
import AddCoursePage from "./pages/AddCoursePage";
import AddQuestionPage from "./pages/AddQuestionPage";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLessonPage from "./pages/AdminLessonPage";


/* ===== ROUTE GUARDS ===== */
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
    return (
        <Routes>

            {/* ===== PUBLIC ===== */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ===== PRIVATE ===== */}
            <Route element={<ProtectedRoute />}>

                <Route element={<Layout />}>

                    {/* ===== MAIN ===== */}
                    <Route path="/" element={<CoursesPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* ===== COURSE FLOW ===== */}
                    <Route path="/modules/:courseId" element={<ModulePage />} />
                    <Route path="/lessons/:moduleId" element={<LessonListPage />} />
                    <Route path="/lesson/:lessonId" element={<LessonPage />} />

                    {/* ===== TEST ===== */}
                    <Route path="/test/:moduleId" element={<TestPage />} />
                    <Route path="/results" element={<ResultsPage />} />

                    {/* ===== ADMIN ===== */}
                    <Route path="/admin" element={
                        <AdminRoute><AdminPage /></AdminRoute>
                    } />

                    <Route path="/admin/users" element={
                        <AdminRoute><AdminUsers /></AdminRoute>
                    } />

                    <Route path="/admin/add-course" element={
                        <AdminRoute><AddCoursePage /></AdminRoute>
                    } />

                    <Route path="/admin/add-question" element={
                        <AdminRoute><AddQuestionPage /></AdminRoute>
                    } />

                    {/* ===== ADMIN LESSON SYSTEM ===== */}
                    <Route path="/admin/lessons/:moduleId" element={
                        <AdminRoute><AdminLessonPage /></AdminRoute>
                    } />

                    {/* ===== 404 ===== */}
                    <Route path="*" element={
                        <div className="text-white p-10">
                            404 - Strona nie istnieje
                        </div>
                    } />

                </Route>

            </Route>

        </Routes>
    );
}