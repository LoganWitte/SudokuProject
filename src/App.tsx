import { BrowserRouter } from "react-router-dom";
import Routing from "./Routing";
import Navbar from "./modules/Navbar";
import useSharedData from './SharedData';

export default function App() {

  const sharedData = useSharedData();

  return (
    <div className="wholePageDiv">
      <BrowserRouter>
        <Navbar sharedData={sharedData} />
        <Routing sharedData={sharedData} />
      </BrowserRouter>
    </div>
  );
}
