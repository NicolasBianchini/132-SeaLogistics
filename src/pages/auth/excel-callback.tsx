import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const ExcelCallback: React.FC = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        let hasProcessed = false;
        let isProcessing = false;

        const handleAuthCallback = async () => {
            if (hasProcessed || isProcessing) return;
            isProcessing = true;
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
                await exchangeCodeForToken(code);
            }

            isProcessing = false;
        };

        const exchangeCodeForToken = async (code: string) => {
            try {
                // Verifica se o código já foi usado
                const usedCode = sessionStorage.getItem('excel_used_code');
                if (usedCode === code) {
                    console.log('Código já foi usado, ignorando...');
                    return;
                }

                // Marca o código como usado
                sessionStorage.setItem('excel_used_code', code);

                // Obtém o code_verifier do sessionStorage (com fallback para localStorage)
                let codeVerifier = sessionStorage.getItem('excel_code_verifier');
                if (!codeVerifier) {
                    codeVerifier = localStorage.getItem('excel_code_verifier_backup');
                    console.log('Code verifier recuperado do localStorage backup');
                }

                if (!codeVerifier) {
                    console.error('Code verifier não encontrado em sessionStorage nem localStorage');
                    throw new Error('Code verifier não encontrado');
                }

                console.log('Code verifier encontrado:', codeVerifier.substring(0, 10) + '...');

                // Em produção, isso deve ser feito no backend por segurança
                const response = await fetch('http://localhost:3002/api/excel/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        code,
                        code_verifier: codeVerifier
                    })
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('Erro na resposta do servidor:', response.status, errorData);
                    throw new Error(`Erro ${response.status}: ${errorData}`);
                }

                const data = await response.json();
                console.log('Token recebido com sucesso:', data);

                // Limpa os dados de autenticação
                sessionStorage.removeItem('excel_code_verifier');
                sessionStorage.removeItem('excel_used_code');
                localStorage.removeItem('excel_code_verifier_backup');

                // Envia sucesso para a janela pai
                window.opener?.postMessage({
                    type: 'EXCEL_AUTH_SUCCESS',
                    token: data.access_token
                }, window.location.origin);

            } catch (error) {
                console.error('Erro na troca de código:', error);
                window.opener?.postMessage({
                    type: 'EXCEL_AUTH_ERROR',
                    error: error instanceof Error ? error.message : 'Erro na autenticação'
                }, window.location.origin);
            }
        };

        handleAuthCallback().catch(console.error);
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
