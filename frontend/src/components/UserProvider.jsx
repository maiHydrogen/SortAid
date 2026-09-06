import { useState } from "react";
import { UserContext } from "../context/UserContext";

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};
