import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, Company } from '../types/user';
import { db } from '../lib/firebaseConfig';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
    currentUser: User | null;
    currentCompany: Company | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAdmin: () => boolean;
    isCompanyUser: () => boolean;
    canAccessAdminFeatures: () => boolean;
    canManageShipments: () => boolean;
    loading: boolean;
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar se há usuário salvo no localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                console.log('Carregando dados do localStorage:', userData);
                if (userData.id) {
                    loadUserData(userData.id);
                } else {
                    console.warn('ID do usuário não encontrado no localStorage');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('currentUser');
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const loadUserData = async (userId: string) => {
        try {
            console.log('Carregando dados do usuário do Firestore:', userId);
            const userDoc = await getDoc(doc(db, 'users', userId));

            if (userDoc.exists()) {
                const userData = { ...userDoc.data(), uid: userDoc.id } as User;
                console.log('Dados do usuário carregados:', userData);
                setCurrentUser(userData);

                // Atualizar localStorage com dados mais recentes
                localStorage.setItem('currentUser', JSON.stringify({
                    email: userData.email,
                    name: userData.displayName,
                    id: userData.uid,
                    role: userData.role
                }));

                // Se for usuário de empresa, carregar dados da empresa
                if (userData.role === UserRole.COMPANY_USER && userData.companyId) {
                    const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
                    if (companyDoc.exists()) {
                        const companyData = { ...companyDoc.data(), id: companyDoc.id } as Company;
                        setCurrentCompany(companyData);
                    }
                }
            } else {
                console.warn('Usuário não encontrado no Firestore:', userId);
                localStorage.removeItem('currentUser');
                setCurrentUser(null);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            localStorage.removeItem('currentUser');
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshUserData = async () => {
        if (currentUser?.uid) {
            console.log('Atualizando dados do usuário...');
            await loadUserData(currentUser.uid);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            // Simular autenticação (em produção usar Firebase Auth)
            // TODO: Implementar validação de senha quando usar Firebase Auth
            console.log('Attempting login with password:', password ? '***' : 'no password');

            const usersQuery = query(
                collection(db, 'users'),
                where('email', '==', email)
            );

            const querySnapshot = await getDocs(usersQuery);

            if (querySnapshot.empty) {
                throw new Error('Usuário não encontrado');
            }

            const userDoc = querySnapshot.docs[0];
            const userData = { ...userDoc.data(), uid: userDoc.id } as User;

            console.log('Usuário encontrado:', userData);

            if (!userData.isActive) {
                throw new Error('Usuário inativo. Contacte o administrador.');
            }

            // Atualizar último login
            await setDoc(doc(db, 'users', userDoc.id), {
                ...userData,
                lastLogin: new Date()
            }, { merge: true });

            setCurrentUser(userData);

            // Carregar empresa se necessário
            if (userData.role === UserRole.COMPANY_USER && userData.companyId) {
                const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
                if (companyDoc.exists()) {
                    const companyData = { ...companyDoc.data(), id: companyDoc.id } as Company;
                    setCurrentCompany(companyData);
                }
            }

            // Salvar no localStorage
            const userDataForStorage = {
                email: userData.email,
                name: userData.displayName,
                id: userDoc.id,
                role: userData.role
            };

            console.log('Salvando no localStorage:', userDataForStorage);
            localStorage.setItem('currentUser', JSON.stringify(userDataForStorage));

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log('Fazendo logout...');
        setCurrentUser(null);
        setCurrentCompany(null);
        localStorage.removeItem('currentUser');
    };

    const isAdmin = () => {
        const result = currentUser?.role === UserRole.ADMIN;
        console.log('isAdmin check:', result, 'currentUser:', currentUser);
        return result;
    };

    const isCompanyUser = () => {
        return currentUser?.role === UserRole.COMPANY_USER;
    };

    const canAccessAdminFeatures = () => {
        return isAdmin();
    };

    const canManageShipments = () => {
        // Admins podem gerenciar todos os shipments
        // Usuários de empresa só podem gerenciar os próprios
        return currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.COMPANY_USER;
    };

    const value: AuthContextType = {
        currentUser,
        currentCompany,
        login,
        logout,
        isAdmin,
        isCompanyUser,
        canAccessAdminFeatures,
        canManageShipments,
        loading,
        refreshUserData,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 