import { useState } from "react";
import "./status-picker.css";

export interface StatusOption {
    value: string;
    label: string;
    color: string;
    bgColor: string;
}

interface StatusPickerProps {
    title?: string;
    currentStatus?: string;
    onStatusChange: (newStatus: string) => void;
    showTitle?: boolean;
}

const statusOptions: StatusOption[] = [
    {
        value: "em-transito",
        label: "Em trânsito",
        color: "#333",
        bgColor: "#ffd166"
    },
    {
        value: "agendado",
        label: "Agendado",
        color: "white",
        bgColor: "#118ab2"
    },
    {
        value: "documentacao",
        label: "Documentação",
        color: "white",
        bgColor: "#073b4c"
    },
    {
        value: "concluido",
        label: "Concluído",
        color: "#333",
        bgColor: "#06d6a0"
    }
];

const StatusPicker = ({
    title = "Status",
    currentStatus = "",
    onStatusChange,
    showTitle = true
}: StatusPickerProps) => {
    const [selectedStatus, setSelectedStatus] = useState(currentStatus);

    const handleStatusClick = (statusValue: string) => {
        setSelectedStatus(statusValue);
        onStatusChange(statusValue);
    };

    return (
        <div className="status-picker">
            {showTitle && (
                <div className="status-picker-header">
                    <h3 className="status-picker-title">{title}</h3>
                </div>
            )}

            <div className="status-options-container">
                {statusOptions.map((option) => (
                    <button
                        key={option.value}
                        className={`status-option-button ${selectedStatus === option.value ? "selected" : ""
                            }`}
                        onClick={() => handleStatusClick(option.value)}
                        style={{
                            backgroundColor: option.bgColor,
                            color: option.color
                        }}
                    >
                        <span className="status-option-text">{option.label}</span>
                        {selectedStatus === option.value && (
                            <span className="status-selected-indicator">✓</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StatusPicker; 