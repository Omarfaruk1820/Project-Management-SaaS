import { Outlet } from "react-router-dom";
import Footer from "../home/Footer";
import Navbar from "../home/Navbar";

const MainLayOut = () => {
  return (
    <div>
      <Navbar></Navbar>
      <Outlet></Outlet>
      <Footer></Footer>
    </div>
  );
};

export default MainLayOut;
