import { useNavigate } from "react-router-dom";
import { SharedDataType } from '../SharedData';

interface NavbarProps {
    sharedData: SharedDataType;
}

const Navbar: React.FC<NavbarProps> = ({ sharedData }) => {

    const navigate = useNavigate();

    function login() {
        sharedData.setUserID(1);
    }

    function logout() {
        sharedData.setUserID(null);
    }

    return (
        <div className="navbar">
            <div className="logoDiv" onClick={() => navigate("/")}>Sudoku</div>
            <div className="navOptionsDiv">
                {(sharedData.userID === null) && <div className="navOption" onClick={login}>Login</div>}
                <div className="navOption">Daily Challenge</div>
                <div className="navOption">Tournament</div>
                <div className="navOption">About</div>
                {(sharedData.userID !== null) && <div className="navOption" onClick={logout}>Account</div>}
            </div>
        </div>
    )
}

export default Navbar;