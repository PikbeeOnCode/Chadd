import { ToastContainer } from "react-toastify";
import { Routes, Route, Navigate } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <ToastContainer />
    </>
  );
};

export default App;
