import { createBrowserRouter } from "react-router-dom";
import MainLayOut from "../layout/MainLayOut";
import Home from "../home/Home";
import Login from "../auth/Login";
import Register from "../auth/Register";
import Onboarding from "../pages/Onboarding";
import Projects from "../projects/Projects";
import ProjectDetails from "../projects/ProjectDetails";
import CreateProject from "../projects/CreateProject";
import CreateTask from "../projects/CreateTask";
import MyTasks from "../projects/MyTasks";

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
      {
        path: "register",
        element: <Register></Register>,
      },
      {
        path: "login",
        element: <Login></Login>,
      },
      { path: "/onboarding", element: <Onboarding></Onboarding> },
      {
        path: "projects",
        element: <Projects></Projects>,
      },
      {
        path: "projects/:id",
        element: <ProjectDetails></ProjectDetails>,
      },
      {
        path: "projects/create",
        element: <CreateProject></CreateProject>,
      },
      {
        path: "projects/:id/tasks/create",
        element: <CreateTask></CreateTask>,
      },
      {
        path:"my-tasks",
        element:<MyTasks></MyTasks>
      }
    ],
  },
]);
export default router;
