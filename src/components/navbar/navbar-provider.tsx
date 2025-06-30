import React, { useState, ReactNode } from 'react';
import { NavbarContext } from './navbar-context';

interface NavbarProviderProps {
    children: ReactNode;
}

export const NavbarProvider: React.FC<NavbarProviderProps> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <NavbarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
            {children}
        </NavbarContext.Provider>
    );
}; 