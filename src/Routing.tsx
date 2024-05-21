import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ErrorPage from "./pages/ErrorPage";

export default function Routing() {
    return(
        <div>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<ErrorPage />} />
                </Routes>
            </Router>
        </div>
    )
}