import { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useDropdown } from "./dropdown-context";
import "./status-selector.css";

export interface StatusOption {
    value: string;
    label: string;
    color: string;
    bgColor: string;
}

interface StatusSelectorProps {
    currentStatus: string;
    onStatusChange: (newStatus: string) => void;
    disabled?: boolean;
    instanceId: string;
}

const statusOptions: StatusOption[] = [
    {
        value: "Em trânsito",
        label: "Em trânsito",
        color: "#8b5a00",
        bgColor: "#ffd166"
    },
    {
        value: "Agendado",
        label: "Agendado",
        color: "white",
        bgColor: "#118ab2"
    },
    {
        value: "Documentação",
        label: "Documentação",
        color: "white",
        bgColor: "#073b4c"
    },
    {
        value: "Concluído",
        label: "Concluído",
        color: "#0d5d3e",
        bgColor: "#06d6a0"
    }
];

const StatusSelector = ({ currentStatus, onStatusChange, disabled = false, instanceId }: StatusSelectorProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { isDropdownOpen, openDropdown, closeDropdown, closeAllDropdowns } = useDropdown();

    const isOpen = isDropdownOpen(instanceId);
    const currentOption = statusOptions.find(option => option.value === currentStatus) || statusOptions[0];

    // Fechar dropdown com ESC
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                closeAllDropdowns();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    }, [isOpen, closeAllDropdowns]);

    const handleStatusSelect = (newStatus: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (newStatus !== currentStatus) {
            onStatusChange(newStatus);
        }
        closeDropdown(instanceId);
    };

    const handleToggle = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (disabled) return;

        if (isOpen) {
            closeDropdown(instanceId);
        } else {
            openDropdown(instanceId);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();

            if (isOpen) {
                closeDropdown(instanceId);
            } else {
                openDropdown(instanceId);
            }
        }
    };

    const handleOverlayClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        closeAllDropdowns();
    };

    return (
        <>
            {isOpen && <div className="dropdown-overlay" onClick={handleOverlayClick} />}

            <div className="status-selector" ref={dropdownRef}>
                <button
                    ref={triggerRef}
                    className={`status-selector-trigger ${disabled ? "disabled" : ""} ${isOpen ? "open" : ""}`}
                    onClick={handleToggle}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    style={{
                        backgroundColor: currentOption.bgColor,
                        color: currentOption.color
                    }}
                    type="button"
                >
                    <span className="status-label">{currentOption.label}</span>
                    {!disabled && (
                        <ChevronDown
                            size={14}
                            className={`chevron ${isOpen ? "rotated" : ""}`}
                        />
                    )}
                </button>

                {isOpen && !disabled && (
                    <div className="status-dropdown" role="listbox">
                        {statusOptions
                            .filter(option => option.value !== currentStatus)
                            .map((option) => (
                                <button
                                    key={option.value}
                                    className="status-option"
                                    onClick={(e) => handleStatusSelect(option.value, e)}
                                    style={{
                                        backgroundColor: option.bgColor,
                                        color: option.color
                                    }}
                                    role="option"
                                    aria-selected={false}
                                    type="button"
                                >
                                    <span className="status-option-label">{option.label}</span>
                                </button>
                            ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default StatusSelector; 