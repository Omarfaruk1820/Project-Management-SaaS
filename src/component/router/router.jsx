import { createBrowserRouter } from "react-router-dom";
import MainLayOut from "../layout/MainLayOut";
import Home from "../home/Home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayOut />,
    errorElement: <div>404 Not Found</div>,
    children: [
      // Define child routes here
      {
        path: "/",
        element: <Home></Home>,
      },
    ],
  },
]);
export default router;
