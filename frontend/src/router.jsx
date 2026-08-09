import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";

// =======================
// Public Pages
// =======================
import LandingPage from "./pages/LandingPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import SubjectsPage from "./pages/SubjectsPage.jsx";
import UnitPage from "./pages/UnitPage.jsx";
import UnitQuestionsPage from "./pages/UnitQuestionsPage.jsx";
import QuestionDetailsPage from "./pages/QuestionDetailsPage.jsx";

// =======================
// Admin Pages
// =======================
import Login from "./admin/pages/Login.jsx";
import Dashboard from "./admin/pages/Dashboard.jsx";
import Subjects from "./admin/pages/Subjects.jsx";
import Units from "./admin/pages/Units.jsx";
import Questions from "./admin/pages/Questions.jsx";
import PdfImport from "./admin/pages/PdfImport.jsx";

// =======================
// Admin Layout & Protection
// =======================
import AdminLayout from "./admin/layouts/AdminLayout.jsx";
import AdminProtectedRoute from "./admin/routes/AdminProtectedRoute.jsx";

const router = createBrowserRouter([
  // =======================
  // Public Website
  // =======================
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },

      { path: "search", element: <SearchPage /> },
      { path: "results", element: <ResultsPage /> },
      { path: "subjects", element: <SubjectsPage /> },
      { path: "subjects/:subjectSlug", element: <UnitPage /> },
      {
        path: "subjects/:subjectSlug/:unitSlug",
        element: <UnitQuestionsPage />,
      },
      {
        path: "question/:questionId",
        element: <QuestionDetailsPage />,
      },
    ],
  },

  // =======================
  // Admin Login
  // =======================
  {
    path: "/admin/login",
    element: <Login />,
  },

  // =======================
  // Protected Admin Panel
  // =======================
  {
    path: "/admin",
    element: (
      <AdminProtectedRoute>
        <AdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "subjects",
        element: <Subjects />,
      },
      {
        path: "units",
        element: <Units />,
      },
      {
        path: "questions",
        element: <Questions />,
      },
      {
        path: "pdf-import",
        element: <PdfImport />,
      },
    ],
  },
]);

export default router;
