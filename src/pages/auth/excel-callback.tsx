import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const ExcelCallback: React.FC = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        let hasProcessed = false;
        
        const handleAuthCallback = () => {
            if (hasProcessed) return;
            hasProcessed = true;
            
            const code = searchParams.get('code');
            const error = searchParams.get('error');
            const state = searchParams.get('state');

            if (error) {
                // Envia erro para a janela pai
                window.opener?.postMessage({
                    type: 'EXCEL_AUTH_ERROR',
                    error: error
                }, window.location.origin);
                return;
            }

            if (code && state === 'excel_auth') {
                // Troca o código por token
                exchangeCodeForToken(code);
            }
        };

        const exchangeCodeForToken = async (code: string) => {
            try {
                // Em produção, isso deve ser feito no backend por segurança
                const response = await fetch('http://localhost:3001/api/excel/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code })
                });

                if (!response.ok) {
                    throw new Error('Erro ao trocar código por token');
                }

                const data = await response.json();

                // Envia sucesso para a janela pai
                window.opener?.postMessage({
                    type: 'EXCEL_AUTH_SUCCESS',
                    token: data.access_token
                }, window.location.origin);

            } catch (error) {
                console.error('Erro na troca de código:', error);
                window.opener?.postMessage({
                    type: 'EXCEL_AUTH_ERROR',
                    error: 'Erro na autenticação'
                }, window.location.origin);
            }
        };

        handleAuthCallback();
    }, [searchParams]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h2>Autenticando com Microsoft Excel...</h2>
                <p>Por favor, aguarde enquanto configuramos sua conexão.</p>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '20px auto'
                }} />
                <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        </div>
    );
};

export default ExcelCallback;
