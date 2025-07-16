import React, { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { hasAccess } from "../utils/commonFun";
import { getSessionItem } from "../hooks/session";
// import { hotelUsers } from "../helpers/globalVariable";
import Loader from "../components/Loader/Loader";
// import LayoutApp from "../components/Layout/Layout";

const PrivateRoute = ({ children, roles }) => {
  // const navigate = useNavigate();
  const userData = getSessionItem("UserSessionAgentConsole");
  // const hotelId = getSessionItem("hotelId");
  const userSession = userData ? JSON.parse(atob(userData)) : null;
  const isAuthenticated = userSession && userSession?.is_active;
  const hasRole = roles ? hasAccess(userSession, roles) : true;
  // const hotelUser =
  //   isAuthenticated && hotelUsers?.includes(userSession?.user_type);

  // useEffect(() => {
  //   if (isAuthenticated && hotelUser) {
  //     if (!hotelId) {
  //       navigate(paths.hotel);
  //     }
  //   }
  // }, [isAuthenticated, hotelUser, hotelId, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!hasRole) {
    return (
      <Navigate to="/access-denied" />
    );
  }

  return (
    <Suspense fallback={<Loader />}>{children}</Suspense>
  );
};

export default PrivateRoute;
