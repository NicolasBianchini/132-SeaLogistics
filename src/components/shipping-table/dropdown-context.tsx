import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface DropdownContextType {
    openDropdownId: string | null;
    setOpenDropdownId: (id: string | null) => void;
    isDropdownOpen: (id: string) => boolean;
    openDropdown: (id: string) => void;
    closeDropdown: (id: string) => void;
    closeAllDropdowns: () => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export const useDropdown = () => {
    const context = useContext(DropdownContext);
    if (!context) {
        throw new Error('useDropdown must be used within a DropdownProvider');
    }
    return context;
};

interface DropdownProviderProps {
    children: ReactNode;
}

export const DropdownProvider: React.FC<DropdownProviderProps> = ({ children }) => {
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const isDropdownOpen = useCallback((id: string) => {
        const isOpen = openDropdownId === id;
        return isOpen;
    }, [openDropdownId]);

    const openDropdown = useCallback((id: string) => {
        setOpenDropdownId(id);
    }, [openDropdownId]);

    const closeDropdown = useCallback((id: string) => {
        if (openDropdownId === id) {
            setOpenDropdownId(null);
        }
    }, [openDropdownId]);

    const closeAllDropdowns = useCallback(() => {
        setOpenDropdownId(null);
    }, [openDropdownId]);

    return (
        <DropdownContext.Provider
            value={{
                openDropdownId,
                setOpenDropdownId,
                isDropdownOpen,
                openDropdown,
                closeDropdown,
                closeAllDropdowns,
            }}
        >
            {children}
        </DropdownContext.Provider>
    );
}; 