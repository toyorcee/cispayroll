import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { router } from "./routes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          backgroundColor: "#ffffff",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
      />
    </AuthProvider>
  );
}

export default App;
