import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/language-context';
import { useShipments } from '../../context/shipments-context';
import Navbar from '../../components/navbar/navbar';
import ChatAssistant from '../../components/chat-assistant/chat-assistant';
import ExcelIntegration from '../../components/excel-integration/excel-integration';
import './excel-integration-page.css';

const ExcelIntegrationPage: React.FC = () => {
    const { translations } = useLanguage();
    const { shipments, setShipments } = useShipments();
    const navigate = useNavigate();

    const handleShipmentsUpdate = (updatedShipments: any[]) => {
        setShipments(updatedShipments);
    };

    return (
        <main className="excel-integration-page">
            <Navbar />
            <div className="excel-integration-page-content">
                <div className="page-header">
                    <button
                        className="back-button"
                        onClick={() => navigate('/admin-dashboard')}
                    >
                        ← Voltar ao Dashboard
                    </button>
                    <h1>{translations.excelIntegration}</h1>
                    <p>{translations.useExcelAsDatabase}</p>
                </div>

                <div className="excel-integration-container">
                    <ExcelIntegration
                        shipments={shipments}
                        onShipmentsUpdate={handleShipmentsUpdate}
                    />
                </div>
            </div>
            <ChatAssistant />
        </main>
    );
};

export default ExcelIntegrationPage;
