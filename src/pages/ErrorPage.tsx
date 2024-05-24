import { SharedDataType } from "../SharedData";

interface RoutingProps {
    sharedData: SharedDataType;
}

const ErrorPage: React.FC<RoutingProps> = ({ sharedData }) => {
    return(
        <div>
            ErrorPage
        </div>
    )
}

export default ErrorPage;