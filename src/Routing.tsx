import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ErrorPage from "./pages/ErrorPage";
import { SharedDataType } from './SharedData';

interface RoutingProps {
    sharedData: SharedDataType;
}

const Routing: React.FC<RoutingProps> = ({ sharedData }) => {
    return (
        <div>
            <Routes>
                <Route path="/" element={<LandingPage sharedData = {sharedData}/>} />
                <Route path="*" element={<ErrorPage sharedData = {sharedData}/>} />
            </Routes>
        </div>
    )
}

export default Routing;