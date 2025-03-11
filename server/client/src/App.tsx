import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { ToastContainer } from "react-toastify";
import { SkeletonProvider } from "./components/skeletons/SkeletonProvider";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <SkeletonProvider>
      <>
        <RouterProvider router={router} />
        <ToastContainer
          position="top-right"
          autoClose={5000}
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
      </>
    </SkeletonProvider>
  );
}

export default App;