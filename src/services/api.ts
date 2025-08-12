// Configuração da API para conectar com o backend
// Em desenvolvimento, usar proxy do Vite (/api)
// Em produção, usar a URL completa do ambiente
const API_BASE_URL = import.meta.env.MODE === 'development' ? '/api' : (import.meta.env.VITE_API_URL || '/api');

// Tipos TypeScript
export interface Product {
  id: string;
  name: string;
  originalPrice: number;
  discountPrice: number;
  image: string;
  inStock: number;
  brand: string;
  category: string;
  description?: string;
  specifications?: Record<string, string>;
  compatibility?: string[];
  sku?: string;
  featured?: boolean;
  stockQuantity?: number;
  viewCount?: number;
  widthCm?: number;
  heightCm?: number;
  lengthCm?: number;
  weightKg?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  brand: string;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  summary: {
    subtotal: number;
    shipping: number;
    total: number;
    totalItems: number;
    freeShipping: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  cpf?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
  widthCm?: number;
  heightCm?: number;
  lengthCm?: number;
  weightKg?: number;
}

export interface UserAddress {
  id: string;
  userId: string;
  title: string;
  recipientName: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressData {
  title: string;
  recipientName: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface ShippingProduct {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}

export interface ShippingOption {
  id: string;
  name: string;
  company: string;
  price: number;
  discount: number;
  currency: string;
  delivery_time: number;
  delivery_range: {
    min?: number;
    max?: number;
  };
  packages: unknown[];
  additional_services: Record<string, unknown>;
  company_id: string;
  error?: string | null;
}

export interface ShippingCalculationResult {
  success: boolean;
  options: ShippingOption[];
  error?: string;
  raw?: unknown;
}

export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Classe para gerenciar a API
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  // Configurar token de autenticação
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Remover token
  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Método genérico para fazer requisições
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Sempre verificar o token mais recente do localStorage
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken && currentToken !== this.token) {
      this.token = currentToken;
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro de rede',
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        // Se há erros de validação, usar a primeira mensagem de erro
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          throw new Error(errorData.errors[0].msg || errorData.errors[0].message || 'Erro de validação');
        }
        
        throw new Error(errorData.message || errorData.error || 'Erro na requisição');
      }

      const response_data = await response.json();
      // Se a resposta tem success e data, extrair apenas o data
      if (response_data.success && response_data.data) {
        return response_data.data;
      }
      return response_data;
    } catch (error) {
      console.error('Erro na API:', error);
      throw error;
    }
  }

  // Método para requisições públicas (sem autenticação)
  private async publicRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro de rede',
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        // Se há erros de validação, usar a primeira mensagem de erro
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          throw new Error(errorData.errors[0].msg || errorData.errors[0].message || 'Erro de validação');
        }
        
        throw new Error(errorData.message || errorData.error || 'Erro na requisição');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro na API:', error);
      throw error;
    }
  }

  // === PRODUTOS ===
  async getProducts(params?: {
    category?: string;
    brand?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.publicRequest<{
      products: Product[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalProducts: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string) {
    const response = await this.publicRequest<{ success: boolean; data: Product }>(`/products/${id}`);
    // A API retorna { success: true, data: {...} }, então vamos extrair o data
    return {
      product: response.data,
      relatedProducts: [] // Por enquanto vazio, pode ser implementado depois
    };
  }

  async getFeaturedProducts() {
    return this.publicRequest<{
      products: Product[];
      total: number;
    }>('/products/featured');
  }

  async getProductsByCategory(category: string, params?: {
    page?: number;
    limit?: number;
    brand?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    const response = await this.publicRequest<{ success: boolean; data: {
      category: string;
      products: Product[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalProducts: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    } }>(`/products/category/${category}${query ? `?${query}` : ''}`);
    
    // A API retorna { success: true, data: {...} }, então vamos extrair o data
    return response.data || response;
  }

  // Buscar produtos para admin (incluindo inativos)
  async getAdminProducts(params?: {
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
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<{
      products: Product[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalProducts: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/admin/products${query ? `?${query}` : ''}`);
  }

  // === CARRINHO ===
  async getCart(sessionId?: string) {
    const endpoint = sessionId ? `/cart/${sessionId}` : '/cart';
    return this.request<{
      sessionId: string;
      cart: Cart;
    }>(endpoint);
  }

  async addToCart(productId: string, quantity: number, sessionId?: string) {
    const endpoint = sessionId ? `/cart/${sessionId}/items` : '/cart/items';
    return this.request<{
      message: string;
      sessionId: string;
      item: CartItem;
    }>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(sessionId: string, itemId: string, quantity: number) {
    return this.request<{
      message: string;
      item: CartItem;
    }>(`/cart/${sessionId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(sessionId: string, itemId: string) {
    return this.request<{
      message: string;
      removedItem: CartItem;
    }>(`/cart/${sessionId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(sessionId: string) {
    return this.request<{
      message: string;
      sessionId: string;
    }>(`/cart/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // === AUTENTICAÇÃO ===
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    cpf?: string;
  }) {
    try {
      return await this.request<{
        message: string;
        data: {
          user: User;
          token: string;
          expiresIn: string;
        };
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error: unknown) {
      // Verificar se é erro de validação de telefone
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage && (errorMessage.includes('telefone') || errorMessage.includes('phone'))) {
        throw new Error('Por favor, insira o telefone no formato correto (ex: 11987654321)');
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    return this.request<{
      user: User;
      token: string;
      expiresIn: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request<{
      user: User;
    }>('/auth/profile');
  }

  async updateProfile(userData: {
    name?: string;
    lastName?: string;
    phone?: string;
    cpf?: string;
  }) {
    return this.request<{
      message: string;
      user: User;
    }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{
      message: string;
    }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logout() {
    return this.request<{
      message: string;
    }>('/auth/logout', {
      method: 'POST',
    });
  }

  async forgotPassword(email: string) {
    return this.request<{
      message: string;
    }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request<{
      message: string;
    }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // === PEDIDOS ===
  async createOrder(orderData: {
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
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        order: {
          id: string;
          orderNumber: string;
          total: number;
          status: string;
          paymentStatus: string;
        };
      };
    }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: {
        orders: Array<{
          id: string;
          orderNumber: string;
          customerName: string;
          status: string;
          total: number;
          createdAt: string;
        }>;
        pagination: {
          currentPage: number;
          totalPages: number;
          totalOrders: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      };
    }>(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrderById(orderId: string) {
    const url = `${this.baseURL}/orders/${orderId}`;
    
    // Sempre verificar o token mais recente do localStorage
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken && currentToken !== this.token) {
      this.token = currentToken;
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro de rede',
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new Error(errorData.message || errorData.error || 'Erro na requisição');
      }

      const response_data = await response.json();
      // Retornar a estrutura completa sem extrair o data
      return response_data;
    } catch (error) {
      console.error('Erro na API getOrderById:', error);
      throw error;
    }
  }

  // === CATEGORIAS ===
  async getCategories(featured?: boolean) {
    const query = featured !== undefined ? `?featured=${featured}` : '';
    return this.publicRequest<{
      categories: Category[];
      total: number;
    }>(`/categories${query}`);
  }

  async getCategory(id: string) {
    return this.publicRequest<{
      category: Category;
      stats: {
        totalProducts: number;
        inStockProducts: number;
        averagePrice: number;
        brands: string[];
      };
      products: Product[];
    }>(`/categories/${id}`);
  }

  async getCategoryProducts(id: string, params?: {
    page?: number;
    limit?: number;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.publicRequest<{
      category: Category;
      products: Product[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalProducts: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
      filters: {
        availableBrands: string[];
        priceRange: { min: number; max: number };
        applied: Record<string, unknown>;
      };
    }>(`/categories/${id}/products${query ? `?${query}` : ''}`);
  }

  // === MÉTODOS PARA MARCAS ===
  async getBrands() {
    return this.publicRequest<{
      success: boolean;
      data: {
        brands: { id: string; name: string; productCount: number }[];
      };
    }>('/products/brands');
  }

  // === MÉTODOS PARA ADMIN ===
  async getAdminDashboard() {
    return this.request<{
      summary: {
        totalProducts: number;
        totalUsers: number;
        totalOrders: number;
        totalRevenue: number;
      };
      ordersByStatus: Record<string, number>;
      lowStockProducts: Product[];
      salesChart: Array<{ date: string; sales: number; orders: number }>;
      salesByCategory: Array<{ category: string; orders: number; items_sold: number; revenue: number }>;
      bestSellers: Product[];
      conversionMetrics: {
        total_orders: number;
        unique_customers: number;
        avg_order_value: number;
        total_revenue: number;
        total_products: number;
        total_users: number;
        customer_conversion_rate: number;
        avg_orders_per_customer: number;
      };
    }>('/admin/dashboard');
  }

  async getAdminUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    
    // Interface temporária para os dados do backend
    interface BackendUser extends Omit<User, 'isActive'> {
      status: string;
    }
    
    const response = await this.request<{
      users: BackendUser[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalUsers: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/admin/users${query ? `?${query}` : ''}`);
    
    // Converter o campo status para isActive
    const mappedUsers: User[] = response.users.map(user => ({
      ...user,
      isActive: user.status === 'active'
    }));
    
    return {
      ...response,
      users: mappedUsers
    };
  }

  async updateUser(userId: string, userData: {
    name?: string;
    email?: string;
    role?: string;
  }): Promise<{
    success: boolean;
    message: string;
    user: User;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      user: User;
    }>(`/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async deactivateUser(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/admin/users/${userId}/deactivate`, {
      method: 'PUT',
    });
  }

  async activateUser(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/admin/users/${userId}/activate`, {
      method: 'PUT',
    });
  }

  async promoteUser(userId: string): Promise<{
    success: boolean;
    message: string;
    user: User;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      user: User;
    }>(`/admin/users/${userId}/promote`, {
      method: 'PUT',
    });
  }

  async demoteUser(userId: string): Promise<{
    success: boolean;
    message: string;
    user: User;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      user: User;
    }>(`/admin/users/${userId}/demote`, {
      method: 'PUT',
    });
  }

  async getAdminOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<{
      orders: Array<{
        id: string;
        orderNumber: string;
        customerName: string;
        customerEmail: string;
        status: string;
        total: number;
        createdAt: string;
        trackingCode?: string;
        userName?: string;
        userEmail?: string;
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalOrders: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/admin/orders${query ? `?${query}` : ''}`);
  }

  async getAdminOrderById(orderId: string) {
    return this.request(`/admin/orders/${orderId}`);
  }

  async getAdminUserById(userId: string) {
    return this.request<{
      success: boolean;
      user: {
        id: string;
        name: string;
        lastName?: string;
        email: string;
        cpf?: string;
        phone?: string;
        role: string;
        isActive: boolean;
        createdAt: string;
      };
    }>(`/admin/users/${userId}`);
  }

  async updateOrderStatus(orderId: string, status: string, trackingCode?: string) {
    const body: { status: string; trackingCode?: string } = { status };
    if (trackingCode) {
      body.trackingCode = trackingCode;
    }
    return this.request(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async deleteOrder(orderId: string) {
    return this.request(`/admin/orders/${orderId}`, {
      method: 'DELETE'
    });
  }

  async createProduct(productData: {
    name: string;
    originalPrice: number;
    category: string;
    brand: string;
    inStock: boolean;
    stockQuantity: number;
    sku?: string;
    description?: string;
    featured?: boolean;
    useCategoryDimensions?: boolean;
    widthCm?: number;
    heightCm?: number;
    lengthCm?: number;
    weightKg?: number;
  }) {
    return this.request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  // === GERENCIAMENTO DE IMAGENS ===
  async uploadProductImages(productId: string, images: File[]) {
    const formData = new FormData();
    images.forEach(image => {
      formData.append('images', image);
    });

    return this.request<{
      success: boolean;
      message: string;
      images: Array<{
        id: string;
        productId: string;
        imageName: string;
        imageSize: number;
        isPrimary: boolean;
        displayOrder: number;
        createdAt: string;
      }>;
    }>(`/admin/products/${productId}/images`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  async getProductImages(productId: string) {
    return this.request<{
      success: boolean;
      images: Array<{
        id: string;
        productId: string;
        imageName: string;
        imageSize: number;
        isPrimary: boolean;
        displayOrder: number;
        createdAt: string;
      }>;
    }>(`/products/${productId}/images`);
  }

  async getImageData(imageId: string): Promise<Blob> {
    const url = `${this.baseURL}/admin/images/${imageId}`;
    
    const response = await fetch(url, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar imagem');
    }

    return response.blob();
  }

  async setPrimaryImage(productId: string, imageId: string) {
    return this.request<{
      success: boolean;
      message: string;
      images: Array<{
        id: string;
        productId: string;
        imageName: string;
        imageSize: number;
        isPrimary: boolean;
        displayOrder: number;
        createdAt: string;
      }>;
    }>(`/admin/products/${productId}/images/${imageId}/primary`, {
      method: 'PUT',
    });
  }

  async deleteImage(imageId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/admin/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  // === ADMIN - PRODUTOS ===
  async updateProduct(productId: string, productData: {
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
  }) {
    return this.request<{
      success: boolean;
      message: string;
      product: Product;
    }>(`/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId: string) {
    return this.request<{
      success: boolean;
      message: string;
      product: Product;
    }>(`/admin/products/${productId}`, {
      method: 'DELETE',
    });
  }

  // === ENDEREÇOS ===
  async getAddresses() {
    return this.request<UserAddress[]>('/addresses');
  }

  async getAddress(addressId: string) {
    return this.request<UserAddress>(`/addresses/${addressId}`);
  }

  async createAddress(addressData: CreateAddressData) {
    return this.request<UserAddress>('/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  }

  async updateAddress(addressId: string, addressData: CreateAddressData) {
    return this.request<UserAddress>(`/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  }

  async deleteAddress(addressId: string) {
    return this.request<{ message: string }>(`/addresses/${addressId}`, {
      method: 'DELETE',
    });
  }

  async setDefaultAddress(addressId: string) {
    return this.request<UserAddress>(`/addresses/${addressId}/default`, {
      method: 'PATCH',
    });
  }

  // === SHIPPING ===
  async calculateShipping(params: {
    sessionId: string;
    fromCep: string;
    toCep: string;
    token?: string;
  }) {
    return this.publicRequest<{
      success: boolean;
      message: string;
      data: {
        options: ShippingOption[];
        cartSummary: {
          totalItems: number;
          totalQuantity: number;
          subtotal: number;
        };
      };
    }>('/shipping/calculate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async calculateShippingDirect(params: {
    fromCep: string;
    toCep: string;
    products: ShippingProduct[];
    token?: string;
  }) {
    return this.publicRequest<{
      success: boolean;
      message: string;
      data: {
        options: ShippingOption[];
        raw: unknown;
      };
    }>('/shipping/calculate-direct', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async calculateIndividualShipping(params: {
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
  }) {
    return this.publicRequest<{
      success: boolean;
      message: string;
      data: {
        product: {
          id: string;
          name: string;
          dimensions: {
            width: number;
            height: number;
            length: number;
            weight: number;
          };
        };
        options: ShippingOption[];
        raw: unknown;
      };
    }>('/shipping/calculate-individual', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async testShippingService() {
    return this.request<{
      success: boolean;
      message: string;
      timestamp: string;
      environment: string;
    }>('/shipping/test');
  }

  async testIndividualShipping() {
    return this.request<{
      success: boolean;
      message: string;
      testProduct: unknown;
      result: unknown;
    }>('/shipping/test-individual', {
      method: 'POST',
    });
  }

  // === CUPONS ===
  async createCoupon(couponData: {
    userId: string;
    discountPercentage: number;
    expiresAt?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      coupon: {
        id: string;
        code: string;
        userId: string;
        discountPercentage: number;
        isUsed: boolean;
        expiresAt: string | null;
        createdAt: string;
      };
    }>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData),
    });
  }

  // Validar cupom
  async validateCoupon(code: string) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  // === ADMIN - VISITAS ===
  async resetAllViewCounts() {
    return this.request<{
      success: boolean;
      message: string;
      resetCount: number;
    }>('/admin/products/reset-views', {
      method: 'POST',
    });
  }

  // === SLIDES ===
  async getSlides() {
    return this.publicRequest<{ slides: Slide[]; total: number }>('/slides');
  }

  async getAdminSlides() {
    return this.request<{ slides: Slide[]; total: number }>('/slides/admin');
  }

  async createSlide(slideData: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    backgroundImage: File;
  }) {
    const formData = new FormData();
    formData.append('title', slideData.title);
    formData.append('subtitle', slideData.subtitle);
    formData.append('ctaText', slideData.ctaText);
    formData.append('ctaLink', slideData.ctaLink);
    formData.append('backgroundImage', slideData.backgroundImage);

    return this.request<{
      success: boolean;
      message: string;
      slide: Slide;
    }>('/slides', {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  async updateSlide(slideId: string, slideData: {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImage?: File;
    isActive?: boolean;
  }) {
    const formData = new FormData();
    
    if (slideData.title) formData.append('title', slideData.title);
    if (slideData.subtitle) formData.append('subtitle', slideData.subtitle);
    if (slideData.ctaText) formData.append('ctaText', slideData.ctaText);
    if (slideData.ctaLink) formData.append('ctaLink', slideData.ctaLink);
    if (slideData.backgroundImage) formData.append('backgroundImage', slideData.backgroundImage);
    if (slideData.isActive !== undefined) formData.append('isActive', slideData.isActive.toString());

    return this.request<{
      success: boolean;
      message: string;
      slide: Slide;
    }>(`/slides/${slideId}`, {
      method: 'PUT',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  async deleteSlide(slideId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/slides/${slideId}`, {
      method: 'DELETE',
    });
  }

  async reorderSlides(slideIds: string[]) {
    return this.request<{
      success: boolean;
      message: string;
      slides: Slide[];
    }>('/slides/reorder', {
      method: 'PUT',
      body: JSON.stringify({ slideIds }),
    });
  }

  // === HEALTH CHECK ===
  async healthCheck() {
    return this.request<{
      status: string;
      message: string;
      timestamp: string;
      version: string;
    }>('/health');
  }
}

// Instância singleton da API
export const api = new ApiService();
export default api;