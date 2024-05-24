import { useState } from "react";

interface SharedDataType {
  userID: number | null;
  setUserID: React.Dispatch<React.SetStateAction<number | null>>;
}

const useSharedData = (): SharedDataType => {
  const [userID, setUserID] = useState<number | null>(null);
  return { userID, setUserID };
};

export default useSharedData;
export type { SharedDataType };
