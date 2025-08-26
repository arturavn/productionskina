import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api, Product, Cart, User, Category, UserAddress, CreateAddressData, Slide } from '../services/api';

// === HOOKS PARA PRODUTOS ===
export const useProducts = (params?: {
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para buscar produtos no painel admin (incluindo inativos)
export const useAdminProducts = (params?: {
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const token = localStorage.getItem('auth_token');
  console.log('🔍 useAdminProducts - Token presente:', !!token);
  console.log('🔍 useAdminProducts - Params:', params);
  
  return useQuery({
    queryKey: ['admin-products', params],
    queryFn: async () => {
      console.log('🚀 Executando queryFn para admin-products');
      const result = await api.getAdminProducts(params);
      console.log('✅ Resultado da API admin-products:', result);
      return result;
    },
    enabled: !!token, // Só executa se houver token
    staleTime: 0, // Sem cache para garantir dados atualizados na paginação

  });
};

// === SHIPPING INDIVIDUAL ===
export const useCalculateIndividualShipping = () => {
  return useMutation({
    mutationFn: (params: {
      fromCep: string;
      toCep: string;
      product: {
        id: string;
        width: number;
        height: number;
        length: number;
        weight: number;
        insurance_value: number;
        quantity?: number;
      };
      token?: string;
    }) => api.calculateIndividualShipping(params),
  });
};

export const useTestIndividualShipping = () => {
  return useMutation({
    mutationFn: () => api.testIndividualShipping(),
  });
};

// Hook para calcular frete de um produto específico com dados do produto
export const useCalculateProductShipping = () => {
  return useMutation({
    mutationFn: async (params: {
      productId: string;
      width: number;
      height: number;
      length: number;
      weight: number;
      insurance_value: number;
      quantity?: number;
      fromCep: string;
      toCep: string;
    }) => {
      const response = await fetch('/api/shipping/calculate-individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromCep: params.fromCep,
          toCep: params.toCep,
          product: {
            id: params.productId,
            width: params.width,
            height: params.height,
            length: params.length,
            weight: params.weight,
            insurance_value: params.insurance_value,
            quantity: params.quantity || 1
          }
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao calcular frete');
      }
      
      return response.json();
    },
  });
};

// Hook para calcular frete baseado apenas no ID do produto (busca dimensões do banco)
export const useCalculateShippingByProductId = () => {
  return useMutation({
    mutationFn: async (params: {
      productId: string;
      fromCep: string;
      toCep: string;
      quantity?: number;
    }) => {
      const response = await fetch('/api/shipping/calculate-by-product-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: params.productId,
          fromCep: params.fromCep,
          toCep: params.toCep,
          quantity: params.quantity || 1
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao calcular frete do produto');
      }
      
      return response.json();
    },
  });
};

// Hook para validar produtos antes do checkout
export const useValidateProducts = () => {
  return useMutation({
    mutationFn: async (items: Array<{
      id: string;
      name: string;
      sku?: string;
    }>) => {
      const response = await fetch('/api/products/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao validar produtos');
      }
      
      return response.json();
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => api.getFeaturedProducts(),
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
};

export const useProductsByCategory = (category: string, params?: {
  page?: number;
  limit?: number;
  brand?: string;
}) => {
  return useQuery({
    queryKey: ['products', 'category', category, params],
    queryFn: () => api.getProductsByCategory(category, params),
    enabled: !!category,
    staleTime: 0, // Sem cache para garantir que a paginação funcione
  });
};

// === HOOKS PARA CARRINHO ===
export const useCart = (sessionId?: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['cart', sessionId],
    queryFn: async () => {
      try {
        const response = await api.getCart(sessionId);
        // A resposta da API vem como { success: true, data: cart }
        return response;
      } catch (error) {
        // Se a sessão for inválida, remover do localStorage
        if (sessionId && (error as Error).message.includes('400')) {
          localStorage.removeItem('cart_session_id');
          queryClient.invalidateQueries({ queryKey: ['cart'] });
        }
        throw error;
      }
    },
    staleTime: 0, // Sempre buscar dados frescos do carrinho
    refetchOnWindowFocus: true,
    enabled: !!sessionId, // Só executar se tiver sessionId
    retry: false, // Não tentar novamente em caso de erro
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity, sessionId }: {
      productId: string;
      quantity: number;
      sessionId?: string;
    }) => api.addToCart(productId, quantity, sessionId),
    onSuccess: (data) => {
      // Invalidar cache do carrinho
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Produto adicionado ao carrinho!');
      
      // A resposta da API vem como { success: true, data: cart }
      // O sessionId está dentro do cart retornado
      const cart = data;
      const sessionId = cart.sessionId;
      
      // Salvar sessionId no localStorage se não existir ou se for diferente
      const currentSessionId = localStorage.getItem('cart_session_id');
      if (!currentSessionId || currentSessionId !== sessionId) {
        localStorage.setItem('cart_session_id', sessionId);
      }
      
      // Atualizar contador do carrinho no localStorage
      const itemsCount = cart.item ? 1 : 0;
      localStorage.setItem('cart_items_count', itemsCount.toString());
      
      // Disparar evento para atualizar o Header
      window.dispatchEvent(new Event('storage'));
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao adicionar produto ao carrinho');
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, itemId, quantity }: {
      sessionId: string;
      itemId: string;
      quantity: number;
    }) => api.updateCartItem(sessionId, itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Quantidade atualizada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar item');
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, itemId }: {
      sessionId: string;
      itemId: string;
    }) => api.removeCartItem(sessionId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removido do carrinho!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover item');
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => api.clearCart(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Carrinho limpo!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao limpar carrinho');
    },
  });
};

// === HOOKS PARA AUTENTICAÇÃO ===
export const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      cpf?: string;
    }) => api.register(userData),
    onSuccess: (data) => {
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      // Redirecionar para a aba de login
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar conta');
    },
  });
};

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) => {
      return api.login(credentials.email, credentials.password);
    },
    onSuccess: (data: { user: User; token: string; expiresIn: string }) => {
      // Armazenar token no localStorage e atualizar ApiService
      console.log('🔍 Login response data:', data);
      // O método request já extrai o data, então acessamos diretamente
      const token = data.token;
      if (!token) {
        console.error('❌ Token não encontrado na resposta:', data);
        toast.error('Erro: Token não recebido do servidor');
        return;
      }
      localStorage.setItem('auth_token', token);
      api.setToken(token);
      
      // Invalidar query do perfil para atualizar estado de autenticação
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Exibir mensagem de sucesso
      toast.success('Login realizado com sucesso!');
      
      // Redirecionar baseado no role do usuário
      setTimeout(() => {
        const user = data.user;
        if (user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 1000);
    },
    onError: (error: Error) => {
      console.error('Erro no login:', error);
      
      // Verificar se é erro de conta desativada
      if (error.message.includes('Sua conta foi desativada') || error.message.includes('Entre em contato com o suporte')) {
        toast.error('Sua conta está inativa. Entre em contato com o suporte da empresa para reativação.');
      } else {
        toast.error('Erro ao fazer login. Verifique suas credenciais.');
      }
    },
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => api.getProfile(),
    enabled: !!localStorage.getItem('auth_token'),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: {
      name?: string;
      phone?: string;
      cpf?: string;
    }) => api.updateProfile(userData),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar perfil');
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: {
      currentPassword: string;
      newPassword: string;
    }) => api.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alterar senha');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      api.removeToken();
      queryClient.clear();
      localStorage.removeItem('cart_session_id');
      toast.success('Logout realizado com sucesso!');
    },
    onError: (error: Error) => {
      // Mesmo com erro, fazer logout local
      api.removeToken();
      queryClient.clear();
      localStorage.removeItem('cart_session_id');
      toast.error(error.message || 'Erro ao fazer logout');
    },
  });
};

// === HOOKS PARA CATEGORIAS ===
export const useCategories = (featured?: boolean) => {
  return useQuery({
    queryKey: ['categories', featured],
    queryFn: () => api.getCategories(featured),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
};

// === HOOKS PARA MARCAS ===
export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => api.getBrands(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => api.getCategory(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
  });
};

export const useCategoryProducts = (id: string, params?: {
  page?: number;
  limit?: number;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}) => {
  return useQuery({
    queryKey: ['categories', id, 'products', params],
    queryFn: () => api.getCategoryProducts(id, params),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// === HOOK PARA RESETAR VISITAS ===
export const useResetAllViewCounts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.resetAllViewCounts(),
    onSuccess: (data) => {
      // Invalidar cache dos produtos para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success(`${data.resetCount} produtos tiveram suas visitas resetadas!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao resetar visitas');
    },
  });
};

// === HOOK PARA HEALTH CHECK ===
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.healthCheck(),
    staleTime: 60 * 1000, // 1 minuto
    retry: 3,
    retryDelay: 1000,
  });
};

// === HOOKS UTILITÁRIOS ===

// Hook para verificar se o usuário está logado
export const useAuth = () => {
  const { data: profileData, isLoading, error } = useProfile();
  
  return {
    user: profileData?.user || null,
    isAuthenticated: !!profileData?.user,
    isLoading,
    error,
  };
};

// === HOOKS PARA ADMIN ===
export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.getAdminDashboard(),
    staleTime: 0, // Sem cache - sempre buscar dados frescos
    refetchOnWindowFocus: true, // Recarregar quando a janela ganhar foco
    refetchInterval: 30000, // Recarregar a cada 30 segundos
  });
};

export const useAdminUsers = (params?: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => api.getAdminUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useAdminUserById = (userId: string) => {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => api.getAdminUserById(userId),
    enabled: !!userId && userId !== '',
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, userData }: {
      userId: string;
      userData: {
        name?: string;
        email?: string;
        role?: string;
      };
    }) => api.updateUser(userId, userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(data.message || 'Usuário atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar usuário');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => api.deleteUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(data.message || 'Usuário deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao deletar usuário');
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário inativado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao inativar usuário');
    },
  });
};

export const useActivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário ativado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao ativar usuário');
    },
  });
};

export const usePromoteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => api.promoteUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(data.message || 'Usuário promovido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao promover usuário');
    },
  });
};

export const useDemoteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => api.demoteUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(data.message || 'Usuário rebaixado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao rebaixar usuário');
    },
  });
};

export const usePromoteToCollaborator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => api.promoteToCollaborator(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(data.message || 'Usuário promovido para colaborador com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao promover usuário para colaborador');
    },
  });
};

export const useDemoteFromCollaborator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => api.demoteFromCollaborator(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(data.message || 'Colaborador rebaixado para usuário com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao rebaixar colaborador');
    },
  });
};

export const useAdminOrders = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => api.getAdminOrders(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obter detalhes de um pedido específico
export const useAdminOrderById = (orderId: string) => {
  return useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => api.getAdminOrderById(orderId),
    enabled: !!orderId && orderId !== '',
    staleTime: 30000,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

// Hook para atualizar status do pedido
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, status, trackingCode }: { orderId: string; status: string; trackingCode?: string }) => 
      api.updateOrderStatus(orderId, status, trackingCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

// Hook para excluir pedido
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) => api.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

// Hook para criar pedido
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData: {
      items: Array<{
        productId: string;
        quantity: number;
      }>;
      shippingAddress: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
      };
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      cpf?: string;
      paymentMethod: string;
      shippingCost?: number;
    }) => api.createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

// Hook para listar pedidos do usuário
export const useOrders = (params?: {
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => api.getOrders(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obter detalhes de um pedido
export const useOrderById = (orderId: string) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.getOrderById(orderId),
    enabled: !!orderId && orderId !== '',
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para buscar a última compra de um produto específico pelo usuário logado
export const useLastPurchase = (productId: string) => {
  const token = localStorage.getItem('auth_token');
  
  return useQuery({
    queryKey: ['last-purchase', productId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/last-purchase/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Usuário não autenticado');
        }
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar última compra');
      }
      
      return response.json();
    },
    enabled: !!productId && !!token, // Só executa se tiver productId e token
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: false, // Não tentar novamente em caso de erro de autenticação
  });
};

// Hook para buscar qualquer pedido de um produto específico pelo usuário logado (independente do status)
export const useAnyPurchase = (productId: string) => {
  const token = localStorage.getItem('auth_token');
  
  return useQuery({
    queryKey: ['any-purchase', productId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/any-purchase/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Usuário não autenticado');
        }
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar pedido');
      }
      
      return response.json();
    },
    enabled: !!productId && !!token, // Só executa se tiver productId e token
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: false, // Não tentar novamente em caso de erro de autenticação
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productData: {
      name: string;
      originalPrice: number;
      discountPrice?: number;
      category: string;
      brand: string;
      stockQuantity: number;
      inStock: boolean;
      description?: string;
      specifications?: Record<string, string>;
      compatibility?: string[];
      sku?: string;
      weight?: number;
      dimensions?: string;
      featured?: boolean;
      useCategoryDimensions?: boolean;
      widthCm?: number;
      heightCm?: number;
      lengthCm?: number;
      weightKg?: number;
    }) => api.createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'admin-products' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar produto');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, productData }: {
      productId: string;
      productData: {
        name?: string;
        originalPrice?: number;
        discountPrice?: number;
        category?: string;
        brand?: string;
        stockQuantity?: number;
        inStock?: boolean;
        description?: string;
        specifications?: Record<string, string>;
        compatibility?: string[];
        sku?: string;
        weight?: number;
        dimensions?: string;
        featured?: boolean;
      };
    }) => api.updateProduct(productId, productData),
    onSuccess: () => {
      // Invalidar todas as queries de produtos com diferentes parâmetros
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'admin-products' });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      // Forçar refetch das queries específicas do AdminDashboard
      queryClient.refetchQueries({ queryKey: ['products', { limit: 3 }] });
      queryClient.refetchQueries({ queryKey: ['products', { limit: 50 }] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar produto');
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId: string) => api.deleteProduct(productId),
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a produtos
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'admin-products' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      
      // Forçar refetch imediato
      queryClient.refetchQueries({ queryKey: ['admin-products'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'dashboard'] });
      
      // Remover cache específico se existir
      queryClient.removeQueries({ queryKey: ['products'] });
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'admin-products' });
      
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir produto');
    },
  });
};

// Hook para gerenciar sessão do carrinho
export const useCartSession = () => {
  const [sessionId, setSessionIdState] = useState<string | undefined>(() => {
    return localStorage.getItem('cart_session_id') || undefined;
  });
  
  const setSessionId = (newSessionId: string) => {
    localStorage.setItem('cart_session_id', newSessionId);
    setSessionIdState(newSessionId);
  };
  
  const clearSessionId = () => {
    localStorage.removeItem('cart_session_id');
    setSessionIdState(undefined);
  };
  
  // Gerar um sessionId se não existir
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, [sessionId]);
  
  return {
    sessionId,
    setSessionId,
    clearSessionId,
  };
};

// === HOOKS PARA GERENCIAMENTO DE IMAGENS ===

// Hook para buscar imagens de um produto
export const useProductImages = (productId: string) => {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: () => api.getProductImages(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para upload de imagens
export const useUploadProductImages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, images }: { productId: string; images: File[] }) => 
      api.uploadProductImages(productId, images),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'admin-products' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      
      toast.success(`${variables.images.length} imagem(ns) adicionada(s) com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao fazer upload das imagens:', error);
      toast.error('Erro ao fazer upload das imagens');
    },
  });
};

// Hook para definir imagem principal
export const useSetPrimaryImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) => 
      api.setPrimaryImage(productId, imageId),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'admin-products' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      
      toast.success('Imagem principal definida com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao definir imagem principal:', error);
      toast.error('Erro ao definir imagem principal');
    },
  });
};

// Hook para deletar imagem
export const useDeleteImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (imageId: string) => api.deleteImage(imageId),
    onSuccess: () => {
      // Invalidar todas as queries de imagens e produtos
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'admin-products' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      
      toast.success('Imagem removida com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar imagem:', error);
      toast.error('Erro ao deletar imagem');
    },
  });
};

// === HOOKS PARA ENDEREÇOS ===
export const useAddresses = () => {
  const token = localStorage.getItem('auth_token');
  
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.getAddresses(),
    enabled: !!token, // Só executa se houver token de autenticação
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useAddress = (addressId: string) => {
  return useQuery({
    queryKey: ['address', addressId],
    queryFn: () => api.getAddress(addressId),
    enabled: !!addressId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (addressData: CreateAddressData) => api.createAddress(addressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Endereço criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar endereço:', error);
      toast.error(error.message || 'Erro ao criar endereço');
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ addressId, addressData }: { addressId: string; addressData: CreateAddressData }) => 
      api.updateAddress(addressId, addressData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['address', variables.addressId] });
      toast.success('Endereço atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar endereço:', error);
      toast.error(error.message || 'Erro ao atualizar endereço');
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (addressId: string) => api.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Endereço removido com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao remover endereço:', error);
      toast.error(error.message || 'Erro ao remover endereço');
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (addressId: string) => api.setDefaultAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Endereço padrão definido com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao definir endereço padrão:', error);
      toast.error(error.message || 'Erro ao definir endereço padrão');
    },
  });
};

// Hook para busca de produtos com debounce
export const useProductSearch = (searchQuery = '', delay = 500) => {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [searchQuery, delay]);
  
  const shouldFetch = debouncedQuery.length > 0;
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', { search: debouncedQuery, limit: 20 }],
    queryFn: () => api.getProducts({ search: debouncedQuery, limit: 20 }),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
  });
  
  return {
    results: data?.products || [],
    isLoading: isLoading && shouldFetch,
    error,
    hasResults: (data?.products?.length || 0) > 0,
  };
};

// === HOOKS PARA SLIDES ===
export const useSlides = () => {
  return useQuery({
    queryKey: ['slides'],
    queryFn: () => api.getSlides(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useAdminSlides = () => {
  return useQuery({
    queryKey: ['admin', 'slides'],
    queryFn: () => api.getAdminSlides(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCreateSlide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (slideData: {
      title: string;
      subtitle: string;
      ctaText: string;
      ctaLink: string;
      backgroundImage: File;
    }) => api.createSlide(slideData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'slides'] });
      toast.success('Slide criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar slide');
    },
  });
};

export const useUpdateSlide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ slideId, slideData }: {
      slideId: string;
      slideData: {
        title?: string;
        subtitle?: string;
        ctaText?: string;
        ctaLink?: string;
        backgroundImage?: File;
        isActive?: boolean;
      };
    }) => api.updateSlide(slideId, slideData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'slides'] });
      toast.success('Slide atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar slide');
    },
  });
};

export const useDeleteSlide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (slideId: string) => api.deleteSlide(slideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'slides'] });
      toast.success('Slide removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover slide');
    },
  });
};

export const useReorderSlides = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (slideIds: string[]) => api.reorderSlides(slideIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'slides'] });
      toast.success('Ordem dos slides atualizada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao reordenar slides');
    },
  });
};

// === SHIPPING HOOKS ===
export const useCalculateShipping = () => {
  return useMutation({
    mutationFn: (params: {
      sessionId: string;
      fromCep: string;
      toCep: string;
      token?: string;
    }) => api.calculateShipping(params),
    onError: (error: Error) => {
      console.error('Erro ao calcular frete:', error);
      toast.error('Erro ao calcular frete. Tente novamente.');
    },
  });
};

export const useCalculateShippingDirect = () => {
  return useMutation({
    mutationFn: (params: {
      fromCep: string;
      toCep: string;
      products: Array<{
        id: string;
        width: number;
        height: number;
        length: number;
        weight: number;
        insurance_value: number;
        quantity: number;
      }>;
      token?: string;
    }) => api.calculateShippingDirect(params),
    onError: (error: Error) => {
      console.error('Erro ao calcular frete direto:', error);
      toast.error('Erro ao calcular frete. Tente novamente.');
    },
  });
};

export const useTestShippingService = () => {
  return useQuery({
    queryKey: ['shipping-test'],
    queryFn: () => api.testShippingService(),
    enabled: false, // Só executa quando chamado manualmente
    retry: false,
  });
};

// === HOOKS PARA MERCADO LIVRE ===
export const useMercadoLivreStatus = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Token não encontrado');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/mercado_livre/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Mercado Livre status');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStatus();
  }, []);
  
  return { data, isLoading, error, refetch: fetchStatus };
};

// Hook para sincronizar status do Mercado Livre entre telas
export const useMercadoLivreStatusSync = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Token não encontrado');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/mercado_livre/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Mercado Livre status');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStatus();
    
    // Escutar eventos de mudança de status
    const handleStatusChange = () => {
      fetchStatus();
    };
    
    // Escutar eventos personalizados
    window.addEventListener('mercado-livre-status-changed', handleStatusChange);
    
    // Escutar mudanças no localStorage (fallback)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mercado_livre_status') {
        fetchStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('mercado-livre-status-changed', handleStatusChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return { data, isLoading, error, refetch: fetchStatus };
};

// Função para notificar mudanças de status
export const notifyMercadoLivreStatusChange = () => {
  // Disparar evento personalizado
  window.dispatchEvent(new CustomEvent('mercado-livre-status-changed'));
  
  // Atualizar localStorage como fallback
  localStorage.setItem('mercado_livre_status', Date.now().toString());
};