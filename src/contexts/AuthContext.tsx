import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, User } from '@/integrations/auth/api-client';
import { from } from '@/integrations/db/client';
import { getApiUrl } from '@/utils/apiUrl';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'member';
  department: string | null;
  phone: string | null;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: { token: string } | null;
  profile: Profile | null;
  branches: Branch[];
  activeBranchId: string | null;
  activeBranch: Branch | null;
  canViewAllBranches: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
  refreshPermissions: () => void;
  setActiveBranchId: (branchId: string) => void;
  reloadBranches: () => Promise<void>;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  type: 'matriz' | 'filial' | 'laboratorio' | 'deposito';
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  is_main: boolean;
  is_active: boolean;
  is_default_access?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchIdState, setActiveBranchIdState] = useState<string | null>(localStorage.getItem('active_branch_id'));
  const [canViewAllBranches, setCanViewAllBranches] = useState(false);
  const [loading, setLoading] = useState(true);

  const persistActiveBranch = (branchId: string | null, companyId?: string | null) => {
    if (branchId) {
      localStorage.setItem('active_branch_id', branchId);
      if (companyId) localStorage.setItem(`active_branch_id_${companyId}`, branchId);
    } else {
      localStorage.removeItem('active_branch_id');
    }
    setActiveBranchIdState(branchId);
    window.dispatchEvent(new CustomEvent('branch-changed', { detail: { branchId } }));
  };

  const loadBranches = async (currentUser?: User | null) => {
    const token = authAPI.getToken();
    const companyId = currentUser?.company_id || user?.company_id;
    if (!token || !companyId) {
      setBranches([]);
      setCanViewAllBranches(false);
      persistActiveBranch(null, companyId);
      return;
    }

    const storedBranchId = localStorage.getItem(`active_branch_id_${companyId}`) || localStorage.getItem('active_branch_id') || '';
    const response = await fetch(`${getApiUrl()}/branches/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(storedBranchId ? { 'X-Branch-Id': storedBranchId } : {}),
      },
    });

    if (!response.ok) {
      console.warn('[Branches] Não foi possível carregar unidades:', response.status);
      setBranches([]);
      setCanViewAllBranches(false);
      return;
    }

    const data = await response.json();
    const availableBranches = Array.isArray(data.branches) ? data.branches : [];
    setBranches(availableBranches);
    setCanViewAllBranches(!!data.can_view_all);

    const validStoredBranch = storedBranchId === 'all' && data.can_view_all
      ? 'all'
      : availableBranches.find((branch: Branch) => branch.id === storedBranchId)?.id;
    const nextBranchId = validStoredBranch || data.active_branch_id || availableBranches[0]?.id || null;
    persistActiveBranch(nextBranchId, companyId);
  };

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for user:', userId);
    try {
      const { data, error } = await from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      console.log('Profile fetched:', data);
      setProfile(data as Profile);
      
      // Disparar evento customizado para recarregar permissões
      window.dispatchEvent(new CustomEvent('permissions-changed'));
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const authData = response?.data;
      const err = response?.error;

      // Erro temporário (429, 5xx, rede): não limpar sessão se ainda temos token — evita "desconectar" à toa
      if (err?.code === 'RATE_LIMIT' || err?.code === 'SERVER_ERROR' || err?.code === 'NETWORK_ERROR') {
        if (authAPI.isAuthenticated()) {
          console.warn('[Auth] Erro temporário na verificação:', err.message);
          // Mantém user/session/profile como estão
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
        setLoading(false);
        return;
      }

      if (authData?.user) {
        setUser(authData.user);
        const token = authAPI.getToken();
        if (token) {
          setSession({ token });
        }
        if (authData.profile) {
          setProfile(authData.profile as Profile);
        } else if (authData.user?.id) {
          await fetchProfile(authData.user.id);
        }
        await loadBranches(authData.user);
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setBranches([]);
        setCanViewAllBranches(false);
        persistActiveBranch(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
      setSession(null);
      setProfile(null);
      setBranches([]);
      setCanViewAllBranches(false);
      persistActiveBranch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verificar autenticação ao montar o componente
    checkAuth();

    // Listener para mudanças no localStorage (logout de outras abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verificar autenticação a cada 30 min quando a aba está visível (não ao alternar aba/janela)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && authAPI.isAuthenticated()) {
        checkAuth();
      }
    }, 30 * 60 * 1000);

    // Atualizar sessão/permissões apenas ao trocar de página dentro do sistema (não ao voltar na aba do Chrome)
    const handleAuthCheckOnNavigate = () => {
      if (authAPI.isAuthenticated()) checkAuth();
    };
    window.addEventListener('auth-check-on-navigate', handleAuthCheckOnNavigate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-check-on-navigate', handleAuthCheckOnNavigate);
      clearInterval(interval);
    };
  }, []);

  // Listener para atualizar o profile em tempo real (sem reload de página)
  useEffect(() => {
    const handleProfileChanged = () => {
      if (user?.id) {
        fetchProfile(user.id);
      }
    };

    window.addEventListener('profile-changed', handleProfileChanged as EventListener);
    return () => window.removeEventListener('profile-changed', handleProfileChanged as EventListener);
  }, [user?.id]);

  const signOut = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('active_branch_id');
      try {
        sessionStorage.removeItem('ativafix_demo_session');
      } catch {}
      window.location.href = '/login';
    }
  };

  // Função para recarregar permissões (dispara evento que será ouvido pelo usePermissions)
  const refreshPermissions = () => {
    window.dispatchEvent(new CustomEvent('permissions-changed'));
  };

  // Verificar role do user_roles (aceita variações)
  const adminRoles = ['admin', 'administrador', 'administrator'];
  const isAdmin = profile?.role ? adminRoles.includes(profile.role.toLowerCase()) : false;
  const isApproved = profile?.approved === true;
  const activeBranch = activeBranchIdState && activeBranchIdState !== 'all'
    ? branches.find((branch) => branch.id === activeBranchIdState) || null
    : null;

  const setActiveBranchId = (branchId: string) => {
    if (branchId === 'all' && !canViewAllBranches) return;
    const isValid = branchId === 'all' || branches.some((branch) => branch.id === branchId);
    if (!isValid) return;
    const changed = branchId !== activeBranchIdState;
    persistActiveBranch(branchId, user?.company_id);
    if (changed) {
      window.setTimeout(() => window.location.reload(), 80);
    }
  };

  // Cache do status de admin no localStorage para acesso rápido
  useEffect(() => {
    if (profile?.role) {
      const adminStatus = adminRoles.includes(profile.role.toLowerCase());
      localStorage.setItem('user_is_admin', adminStatus.toString());
    }
    if (!user && !loading) {
      localStorage.removeItem('user_is_admin');
    }
  }, [profile?.role, user, loading]);

  const value = {
    user,
    session,
    profile,
    branches,
    activeBranchId: activeBranchIdState,
    activeBranch,
    canViewAllBranches,
    loading,
    signOut,
    isAdmin,
    isApproved,
    refreshPermissions,
    setActiveBranchId,
    reloadBranches: () => loadBranches(user)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};