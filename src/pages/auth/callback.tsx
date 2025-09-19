import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('Processando callback de autenticação...');

                // Extrai o código de autorização da URL
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const error = urlParams.get('error');
                const state = urlParams.get('state');

                console.log('Parâmetros da URL:', { code: !!code, error, state });

                if (error) {
                    console.error('Erro na autenticação:', error);
                    window.opener?.postMessage({
                        type: 'EXCEL_AUTH_ERROR',
                        error: error
                    }, window.location.origin);
                    window.close();
                    return;
                }

                if (!code) {
                    console.error('Código de autorização não encontrado');
                    window.opener?.postMessage({
                        type: 'EXCEL_AUTH_ERROR',
                        error: 'Código de autorização não encontrado'
                    }, window.location.origin);
                    window.close();
                    return;
                }

                if (state !== 'excel_auth') {
                    console.error('State inválido:', state);
                    window.opener?.postMessage({
                        type: 'EXCEL_AUTH_ERROR',
                        error: 'State inválido'
                    }, window.location.origin);
                    window.close();
                    return;
                }

                // Obtém o code_verifier do sessionStorage
                const codeVerifier = sessionStorage.getItem('excel_code_verifier');
                if (!codeVerifier) {
                    console.error('Code verifier não encontrado');
                    window.opener?.postMessage({
                        type: 'EXCEL_AUTH_ERROR',
                        error: 'Code verifier não encontrado'
                    }, window.location.origin);
                    window.close();
                    return;
                }

                console.log('Enviando código para o backend...');

                // Envia o código para o backend para trocar por token
                const response = await fetch('http://localhost:3002/api/excel/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code,
                        code_verifier: codeVerifier
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao trocar código por token');
                }

                const tokenData = await response.json();
                console.log('Token obtido com sucesso:', tokenData);

                // Envia o token para a janela pai
                window.opener?.postMessage({
                    type: 'EXCEL_AUTH_SUCCESS',
                    token: tokenData.access_token
                }, window.location.origin);

                // Limpa o code_verifier
                sessionStorage.removeItem('excel_code_verifier');

                // Fecha a janela
                window.close();

            } catch (error) {
                console.error('Erro no callback:', error);
                window.opener?.postMessage({
                    type: 'EXCEL_AUTH_ERROR',
                    error: (error as Error).message
                }, window.location.origin);
                window.close();
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h2>Processando autenticação...</h2>
                <p>Por favor, aguarde enquanto processamos sua autenticação com Microsoft Excel.</p>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '20px auto'
                }}></div>
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

export default AuthCallback;
