import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import UnProtectedRoute from "./UnProtectedRoute.config.js";
import { hasAccess } from "../utils/commonFun.js";
import { getSessionItem } from "../hooks/session.js";
import PrivateRoute from "./PrivateRoutes.js";
import NotFound from "../components/NotFound.jsx";

const Login = lazy(() => import("../pages/auth/Login"));

const KioskTerminal = lazy(() => import("../pages/Terminal/KioskTerminal.js"));

const AppRouter = () => {
  const userData = getSessionItem("UserSessionAgentConsole");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <UnProtectedRoute>
            <Login />
          </UnProtectedRoute>
        }
      />
      {hasAccess(userSession, ["hotel_admin", "hotel_staff"]) && (
        <>
          <Route
            path="/kiosk-terminal"
            element={
              <PrivateRoute roles={["hotel_admin", "hotel_staff"]}>
                <KioskTerminal />
              </PrivateRoute>
            }
          />
          <Route
            path="*"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <NotFound />
              </PrivateRoute>
            }
          />
        </>
      )}
    </Routes>
  );
};

export default AppRouter;
