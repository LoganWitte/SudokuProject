import SudokuBoard from '../modules/SudokuBoard';
import { SharedDataType } from '../SharedData';

interface RoutingProps {
    sharedData: SharedDataType;
}

const LandingPage: React.FC<RoutingProps> = ({ sharedData }) => {
    return(
        <div className="landingDiv">
            <SudokuBoard />
        </div>
    )
}

export default LandingPage;