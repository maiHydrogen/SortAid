import { createContext, useContext } from "react";

// Split out from the UserProvider component so this file only exports
// non-component values — keeps Fast Refresh happy (a file mixing a
// component export with other exports loses fast-refresh support).
export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);
