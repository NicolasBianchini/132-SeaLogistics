import { createContext } from 'react';

interface NavbarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export const NavbarContext = createContext<NavbarContextType>({
    isCollapsed: false,
    setIsCollapsed: () => { },
}); 