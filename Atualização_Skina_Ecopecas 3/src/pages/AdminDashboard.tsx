import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts, useAdminProducts, useLogout, useAdminDashboard, useAdminUsers, useAdminOrders, useUpdateOrderStatus, useDeleteOrder, useCreateProduct, useUpdateProduct, useDeleteProduct, useProductImages, useUploadProductImages, useSetPrimaryImage, useDeleteImage, useUpdateUser, useDeleteUser, useDeactivateUser, useActivateUser, usePromoteUser, useDemoteUser, usePromoteToCollaborator, useDemoteFromCollaborator, useCategories, useResetAllViewCounts, useAdminUserById, useAdminSlides, useCreateSlide, useUpdateSlide, useDeleteSlide, useReorderSlides, useAuth, useMercadoLivreStatusSync } from '@/hooks/useApi';
import { api } from '@/services/api';
import AdminOrderDetailsModal from '@/components/AdminOrderDetailsModal';
import ImageManager from '@/components/ImageManager';
import { useShippingLabelGenerator } from '@/components/ShippingLabelGenerator';
import { toast } from 'sonner';

import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  LogOut,
  BarChart3,
  DollarSign,
  FileText,
  Search,
  Filter,
  Download,
  Loader2,
  UserX,
  UserCheck,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Type definitions
interface Product {
  id: string;
  name: string;
  originalPrice: number;
  discountPrice?: number;
  price?: number;
  category: string;
  brand: string;
  stockQuantity: number;
  inStock: boolean;
  sku?: string;
  description?: string;
  featured: boolean;
  imageUrl?: string;
  images?: Array<{ id: string; url: string; isPrimary: boolean; }>;
  createdAt: string;
  updatedAt: string;
  useCategoryDimensions?: boolean;
  widthCm?: number;
  heightCm?: number;
  lengthCm?: number;
  weightKg?: number;
  totalSold?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  widthCm?: number;
  heightCm?: number;
  lengthCm?: number;
  weightKg?: number;
  productCount: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerLastName?: string;
  customerPhone?: string;
  status: string;
  total: number;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  trackingCode?: string;
  userId?: string;
  shippingAddress?: string | ShippingAddress;
  items?: Array<{
    id: string;
    productName?: string;
    name?: string;
    quantity: number;
    unitPrice?: number;
    price?: number;
  }>;
}

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CreatedProduct {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface CreateProductResponse {
  success: boolean;
  message: string;
  product: CreatedProduct;
}

interface OrderResponse {
  order: Order;
}

interface CategoriesResponse {
  categories: Category[];
  total: number;
}

interface ProductWithSales extends Product {
  totalSold?: number;
}

interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  total: number;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  trackingCode?: string;
  userId?: string;
  shippingAddress?: ShippingAddress;
  items?: object[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Componentes auxiliares para Mercado Livre
const MercadoLivreStatusBadge = ({ mlStatus, isLoading, error }: {
  mlStatus: any;
  isLoading: boolean;
  error: any;
}) => {
  if (isLoading) {
    return (
      <Badge variant="outline" className="text-gray-600 border-gray-600">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Carregando...
      </Badge>
    );
  }
  
  if (error || !mlStatus) {
    return (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <XCircle className="w-3 h-3 mr-1" />
        Erro
      </Badge>
    );
  }
  
  if (mlStatus.connected) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
        <CheckCircle className="w-3 h-3 mr-1" />
        Conectado
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">
      <XCircle className="w-3 h-3 mr-1" />
      Não conectado
    </Badge>
  );
};

const MercadoLivreLastSync = ({ mlStatus }: { mlStatus: any }) => {
  if (mlStatus?.lastSync?.timestamp) {
    try {
      const date = new Date(mlStatus.lastSync.timestamp);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.error('Data inválida recebida:', mlStatus.lastSync.timestamp);
        return 'Data inválida';
      }
      
      // Formatar data e hora no formato brasileiro
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  }
  return 'Nunca';
};

const MercadoLivreProductCount = ({ mlStatus }: { mlStatus: any }) => {
  if (mlStatus?.productStats?.total !== undefined) {
    return mlStatus.productStats.total;
  }
  return 0;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'dashboard';
  });
  const [usersPage, setUsersPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Estados para gerenciamento de imagens no modal de edição
  const [editingProductImages, setEditingProductImages] = useState<File[]>([]);
  const [showImageManager, setShowImageManager] = useState(false);
  
  // Estados para gestão de usuários
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  
  // Estados para criação de cupom
  const [selectedUserForCoupon, setSelectedUserForCoupon] = useState<User | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    discountPercentage: '',
    expiresAt: ''
  });
  
  // Estados para gestão de categorias
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  
  // Estados para modal de código de rastreio
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState('');
  
  // Estados para gestão de slides
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [slideForm, setSlideForm] = useState({
    title: '',
    subtitle: '',
    ctaText: '',
    ctaLink: '',
    backgroundImage: null as File | null
  });
  
  // Estados para filtros de usuários
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  
  // Estados para gestão de produtos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');
  const [productFeaturedFilter, setProductFeaturedFilter] = useState('all');
  const [productsPage, setProductsPage] = useState(1);
  const [accumulatedProducts, setAccumulatedProducts] = useState<typeof allProducts>([]);
  const [productsSortBy, setProductsSortBy] = useState('created_at');
  const [productsSortOrder, setProductsSortOrder] = useState('desc');
  const [showProductForm, setShowProductForm] = useState(false);
  
  // Salvar aba ativa no localStorage
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);
  
  // Mutations para gestão de pedidos e produtos
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const deleteOrderMutation = useDeleteOrder();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  
  // Mutations para gerenciamento de imagens
  const uploadImagesMutation = useUploadProductImages();
  const setPrimaryImageMutation = useSetPrimaryImage();
  const deleteImageMutation = useDeleteImage();
  
  // Mutations para gestão de usuários
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const deactivateUserMutation = useDeactivateUser();
  const activateUserMutation = useActivateUser();
  const promoteUserMutation = usePromoteUser();
  const demoteUserMutation = useDemoteUser();
  const promoteToCollaboratorMutation = usePromoteToCollaborator();
  const demoteFromCollaboratorMutation = useDemoteFromCollaborator();
  
  // Mutation para criação de cupom
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  
  // Mutation para resetar visitas
  const resetAllViewCountsMutation = useResetAllViewCounts();
  
  // Hooks para slides
  const { data: slidesResponse } = useAdminSlides();
  const slidesData = slidesResponse?.slides || [];
  const createSlideMutation = useCreateSlide();
  const updateSlideMutation = useUpdateSlide();
  const deleteSlideMutation = useDeleteSlide();
  const reorderSlidesMutation = useReorderSlides();
  
  // Hook para status do Mercado Livre (com sincronização)
  const mlStatus = useMercadoLivreStatusSync();
  
  // Estados para o formulário de produto
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    brand: '',
    price: '',
    stock: '',
    sku: '',
    description: '',
    featured: false,
    useCategoryDimensions: true,
    widthCm: '',
    heightCm: '',
    lengthCm: '',
    weightKg: ''
  });
  
  // Estado para as imagens selecionadas
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [productCreationStep, setProductCreationStep] = useState<'product' | 'images'>('product');
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  
  // Função para atualizar campos do formulário
  const handleProductFormChange = (field: string, value: string | boolean) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };
  
  // Função para lidar com seleção de imagens
  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray: File[] = Array.from(files);
      const imageFiles = fileArray.filter((file: File) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const isValidImage = allowedTypes.includes(file.type);
        if (!isValidImage) {
          toast.error(`Arquivo ${file.name} não é uma imagem válida. Formatos aceitos: JPEG, PNG, GIF, WebP, SVG`);
        }
        return isValidImage;
      });
      
      setSelectedImages(prev => [...prev, ...imageFiles]);
    }
  };
  
  // Função para remover imagem selecionada
  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Função para submeter o formulário do produto (primeira etapa)
  const handleProductSubmit = async () => {
    try {
      // Validação básica
      if (!productForm.name || !productForm.category || !productForm.brand || !productForm.price || !productForm.stock) {
        toast.error('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      const productData = {
        name: productForm.name,
        originalPrice: parseFloat(productForm.price),
        category: productForm.category,
        brand: productForm.brand,
        stockQuantity: parseInt(productForm.stock),
        inStock: parseInt(productForm.stock) > 0,
        sku: productForm.sku || undefined,
        description: productForm.description || undefined,
        featured: productForm.featured,
        useCategoryDimensions: productForm.useCategoryDimensions,
        // Só enviar dimensões individuais se não estiver usando dimensões da categoria
        ...(productForm.useCategoryDimensions ? {} : {
          widthCm: productForm.widthCm ? parseFloat(productForm.widthCm) : undefined,
          heightCm: productForm.heightCm ? parseFloat(productForm.heightCm) : undefined,
          lengthCm: productForm.lengthCm ? parseFloat(productForm.lengthCm) : undefined,
          weightKg: productForm.weightKg ? parseFloat(productForm.weightKg) : undefined
        })
      };

      console.log('Produto a ser cadastrado:', productData);
      
      // Criar o produto
      const response = await createProductMutation.mutateAsync(productData) as CreateProductResponse;
      console.log('Resposta da criação do produto:', response);
      
      // A resposta vem como { success: true, message: '...', product: {...} }
      const createdProduct = response.product;
      
      if (createdProduct && createdProduct.id) {
        setCreatedProductId(createdProduct.id);
        setProductCreationStep('images');
        toast.success('Produto cadastrado com sucesso! Agora adicione as imagens.');
      } else {
        console.error('Produto criado mas sem ID válido:', response);
        toast.error('Erro ao criar produto. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      toast.error('Erro ao cadastrar produto. Tente novamente.');
    }
  };

  // Função para fazer upload das imagens (segunda etapa)
  const handleImageUploadStep = async () => {
    try {
      if (!createdProductId) {
        toast.error('Erro: ID do produto não encontrado');
        return;
      }

      if (selectedImages.length === 0) {
        toast.error('Por favor, selecione pelo menos uma imagem');
        return;
      }

      console.log('Iniciando upload de imagens para produto:', createdProductId);
      console.log('Imagens selecionadas:', selectedImages.length);
      
      const uploadResult = await api.uploadProductImages(createdProductId, selectedImages);
      console.log('Resultado do upload:', uploadResult);
      
      toast.success(`${selectedImages.length} imagem(ns) adicionada(s) com sucesso!`);
      
      // Resetar formulário e voltar para lista
      handleResetForm();
      
    } catch (imageError) {
      console.error('Erro detalhado ao fazer upload das imagens:', imageError);
      
      let errorMessage = 'Erro desconhecido no upload das imagens';
      if (imageError instanceof Error) {
        errorMessage = imageError.message;
      } else if (typeof imageError === 'string') {
        errorMessage = imageError;
      }
      
      toast.error(`Erro no upload das imagens: ${errorMessage}`);
    }
  };

  // Função para resetar o formulário
  const handleResetForm = () => {
    setProductForm({
      name: '',
      category: '',
      brand: '',
      price: '',
      stock: '',
      sku: '',
      description: '',
      featured: false,
      useCategoryDimensions: true,
      widthCm: '',
      heightCm: '',
      lengthCm: '',
      weightKg: ''
    });
    setSelectedImages([]);
    setProductCreationStep('product');
    setCreatedProductId(null);
    
    // Recarregar a lista de produtos
    window.location.reload();
  };

  // Função para voltar à etapa anterior
  const handleBackToProduct = () => {
    setProductCreationStep('product');
    setCreatedProductId(null);
  };

  // Função para pular etapa de imagens
  const handleSkipImages = () => {
    toast.success('Produto cadastrado com sucesso!');
    handleResetForm();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Funções para gestão de pedidos
  const handleViewOrder = (orderId: string) => {
    console.log('handleViewOrder called with:', orderId);
    setSelectedOrderId(orderId);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    console.log('handleCloseOrderModal called');
    setSelectedOrderId(null);
    setIsOrderModalOpen(false);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    // Se o status for 'shipped', abrir modal para código de rastreio
    if (newStatus === 'shipped') {
      setTrackingOrderId(orderId);
      setIsTrackingModalOpen(true);
      return;
    }
    
    try {
      await updateOrderStatusMutation.mutateAsync({ orderId, status: newStatus });
      toast.success('Status do pedido atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar status do pedido');
    }
  };
  
  const handleConfirmShipping = async () => {
    if (!trackingOrderId || !trackingCode.trim()) {
      toast.error('Código de rastreio é obrigatório');
      return;
    }
    
    try {
      await updateOrderStatusMutation.mutateAsync({ 
        orderId: trackingOrderId, 
        status: 'shipped',
        trackingCode: trackingCode.trim()
      });
      toast.success('Pedido marcado como enviado e e-mail enviado ao cliente!');
      setIsTrackingModalOpen(false);
      setTrackingOrderId(null);
      setTrackingCode('');
    } catch (error) {
      toast.error('Erro ao atualizar status do pedido');
    }
  };
  
  const handleCancelShipping = () => {
    setIsTrackingModalOpen(false);
    setTrackingOrderId(null);
    setTrackingCode('');
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o pedido ${orderNumber}?`)) {
      try {
        await deleteOrderMutation.mutateAsync(orderId);
        alert('Pedido excluído com sucesso!');
      } catch (error) {
        alert('Erro ao excluir pedido. Verifique se o pedido pode ser excluído.');
      }
    }
  };

  // Hook para geração de etiquetas
  const { generateShippingLabelForOrder } = useShippingLabelGenerator();

  const handleGenerateLabel = async (orderId: string) => {
    try {
      // Buscar dados completos do pedido
      const orderResponse = await api.getAdminOrderById(orderId);
      const orderData = (orderResponse as OrderResponse).order;

      if (!orderData) {
        toast.error('Pedido não encontrado');
        return;
      }

      // Buscar dados do usuário incluindo CPF
      let userData = null;
      if (orderData.userId) {
        try {
          const userResponse = await api.getAdminUserById(orderData.userId);
          userData = userResponse.user;
        } catch (error) {
          console.warn('Não foi possível buscar dados do usuário:', error);
        }
      }

      // Gerar a etiqueta
      const shippingAddress = typeof orderData.shippingAddress === 'string' 
        ? JSON.parse(orderData.shippingAddress) 
        : orderData.shippingAddress;
      
      if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
        toast.error('Endereço de entrega incompleto');
        return;
      }
      
      const orderForLabel = {
        orderNumber: orderData.orderNumber,
        customerName: orderData.customerName || userData?.name || '',
        customerLastName: orderData.customerLastName,
        customerPhone: (orderData as Order & { customerPhone?: string }).customerPhone || userData?.phone || '',
        shippingAddress: {
          street: shippingAddress.street,
          number: shippingAddress.number || '',
          complement: shippingAddress.complement,
          neighborhood: shippingAddress.neighborhood || '',
          city: shippingAddress.city,
          state: shippingAddress.state || '',
          zipCode: shippingAddress.zipCode || shippingAddress.cep || ''
        },
        items: orderData.items?.map(item => ({
          id: item.id || '',
          name: item.productName || item.name || '',
          quantity: item.quantity || 1,
          price: item.unitPrice || item.price || 0
        })) || [],
        total: orderData.total,
        createdAt: orderData.createdAt
      };
      
      await generateShippingLabelForOrder(orderForLabel);

      toast.success('Etiqueta de envio gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      toast.error('Erro ao gerar etiqueta de envio');
    }
  };

  // Funções para gestão de produtos
  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct({
      ...product,
      price: product.discountPrice || product.originalPrice,
      featured: Boolean(product.featured)
    });
    setIsEditModalOpen(true);
    setShowImageManager(false);
    setEditingProductImages([]);
  };
  
  // Funções para gerenciamento de imagens
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray: File[] = Array.from(files);
      const imageFiles = fileArray.filter((file: File) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const isValidImage = allowedTypes.includes(file.type);
        if (!isValidImage) {
          toast.error(`Arquivo ${file.name} não é uma imagem válida. Formatos aceitos: JPEG, PNG, GIF, WebP, SVG`);
        }
        return isValidImage;
      });
      
      setEditingProductImages(prev => [...prev, ...imageFiles]);
    }
  };
  
  const removeEditingImage = (index: number) => {
    setEditingProductImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUploadImages = async () => {
    if (!editingProduct || editingProductImages.length === 0) {
      toast.error('Selecione pelo menos uma imagem para fazer upload');
      return;
    }
    
    try {
      await uploadImagesMutation.mutateAsync({
        productId: editingProduct.id,
        images: editingProductImages
      });
      setEditingProductImages([]);
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error);
    }
  };
  
  const handleSetPrimaryImage = async (imageId: string) => {
    if (!editingProduct) return;
    
    try {
      await setPrimaryImageMutation.mutateAsync({
        productId: editingProduct.id,
        imageId
      });
    } catch (error) {
      console.error('Erro ao definir imagem principal:', error);
    }
  };
  
  const handleDeleteImage = async (imageId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta imagem?')) {
      try {
        await deleteImageMutation.mutateAsync(imageId);
      } catch (error) {
        console.error('Erro ao deletar imagem:', error);
      }
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${productName}"?`)) {
      try {
        await deleteProductMutation.mutateAsync(productId);
        toast.success('Produto excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir produto');
      }
    }
  };

  // Funções para gestão de usuários
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async (userData: { name?: string; email?: string; role?: string }) => {
    if (!editingUser) return;
    
    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        userData
      });
      setIsEditUserModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja deletar o usuário "${userName}"?`)) {
      try {
        await deleteUserMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
      }
    }
  };

  const handleDeactivateUser = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja inativar o usuário "${userName}"?`)) {
      try {
        await deactivateUserMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Erro ao inativar usuário:', error);
      }
    }
  };

  const handleActivateUser = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja ativar o usuário "${userName}"?`)) {
      try {
        await activateUserMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Erro ao ativar usuário:', error);
      }
    }
  };

  const handlePromoteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja promover "${userName}" para administrador?`)) {
      try {
        await promoteUserMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Erro ao promover usuário:', error);
      }
    }
  };

  const handleDemoteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja rebaixar "${userName}" para usuário comum?`)) {
      try {
        await demoteUserMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Erro ao rebaixar usuário:', error);
      }
    }
  };

  const handlePromoteToCollaborator = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja promover "${userName}" para colaborador?`)) {
      try {
        await promoteToCollaboratorMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Erro ao promover usuário para colaborador:', error);
      }
    }
  };

  const handleDemoteFromCollaborator = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja rebaixar "${userName}" para usuário comum?`)) {
      try {
        await demoteFromCollaboratorMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Erro ao rebaixar colaborador:', error);
      }
    }
  };

  // Função para criar cupom
  const handleCreateCoupon = (user: User) => {
    setSelectedUserForCoupon(user);
    setIsCouponModalOpen(true);
    setCouponForm({
      discountPercentage: '',
      expiresAt: ''
    });
  };

  const handleSubmitCoupon = async () => {
    if (!selectedUserForCoupon || !couponForm.discountPercentage) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const discountPercentage = parseFloat(couponForm.discountPercentage);
    if (discountPercentage <= 0 || discountPercentage > 100) {
      toast.error('A porcentagem de desconto deve estar entre 1 e 100');
      return;
    }

    setIsCreatingCoupon(true);
    try {
      const response = await api.createCoupon({
        userId: selectedUserForCoupon.id,
        discountPercentage: discountPercentage,
        expiresAt: couponForm.expiresAt || undefined
      });

      if (response.success) {
        toast.success(`Cupom criado com sucesso! Código: ${response.coupon.code}`);
        setIsCouponModalOpen(false);
        setSelectedUserForCoupon(null);
        setCouponForm({ discountPercentage: '', expiresAt: '' });
      } else {
        toast.error(response.message || 'Erro ao criar cupom');
      }
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      toast.error('Erro ao criar cupom. Tente novamente.');
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  // Funções para gerenciamento de slides
  const handleSlideFormChange = (field: string, value: string) => {
    setSlideForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSlideImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Formato de imagem não suportado. Use JPEG, PNG, GIF ou WebP.');
        return;
      }
      setSlideForm(prev => ({ ...prev, backgroundImage: file }));
    }
  };

  const handleCreateSlide = async () => {
    try {
      if (!slideForm.title || !slideForm.subtitle || !slideForm.ctaText || !slideForm.ctaLink || !slideForm.backgroundImage) {
        toast.error('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      const slideData = {
        title: slideForm.title,
        subtitle: slideForm.subtitle,
        ctaText: slideForm.ctaText,
        ctaLink: slideForm.ctaLink,
        backgroundImage: slideForm.backgroundImage
      };

      await createSlideMutation.mutateAsync(slideData);
      setIsSlideModalOpen(false);
      setSlideForm({
        title: '',
        subtitle: '',
        ctaText: '',
        ctaLink: '',
        backgroundImage: null
      });
    } catch (error) {
      console.error('Erro ao criar slide:', error);
    }
  };

  const handleDeleteSlide = async (slideId: string, slideTitle: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o slide "${slideTitle}"?`)) {
      try {
        await deleteSlideMutation.mutateAsync(slideId);
      } catch (error) {
        console.error('Erro ao excluir slide:', error);
      }
    }
  };

  const handleToggleSlideStatus = async (slideId: string, currentStatus: boolean) => {
    try {
      await updateSlideMutation.mutateAsync({
        slideId,
        slideData: { isActive: !currentStatus }
      });
    } catch (error) {
      console.error('Erro ao alterar status do slide:', error);
    }
  };

  const handleMoveSlideUp = async (slideId: string, currentOrder: number) => {
    if (currentOrder <= 1) return; // Já está no topo
    
    const sortedSlides = [...slidesData].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSlides.findIndex(slide => slide.id === slideId);
    
    if (currentIndex > 0) {
      const newOrder = [...sortedSlides];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      
      const slideIds = newOrder.map(slide => slide.id);
      
      try {
        await reorderSlidesMutation.mutateAsync(slideIds);
      } catch (error) {
        console.error('Erro ao reordenar slides:', error);
      }
    }
  };

  const handleMoveSlideDown = async (slideId: string, currentOrder: number) => {
    const sortedSlides = [...slidesData].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSlides.findIndex(slide => slide.id === slideId);
    
    if (currentIndex < sortedSlides.length - 1) {
      const newOrder = [...sortedSlides];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      
      const slideIds = newOrder.map(slide => slide.id);
      
      try {
        await reorderSlidesMutation.mutateAsync(slideIds);
      } catch (error) {
        console.error('Erro ao reordenar slides:', error);
      }
    }
  };

  const handleContinueDeleteProduct = async (productId: string) => {
    try {
      await deleteProductMutation.mutateAsync(productId);
      toast.success('Produto excluído com sucesso!');
      // A lista de produtos será atualizada automaticamente pelo React Query
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto. Tente novamente.');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    try {
      const productData = {
        name: editingProduct.name,
        originalPrice: parseFloat(String(editingProduct.price)),
        category: editingProduct.category,
        brand: editingProduct.brand,
        stockQuantity: parseInt(String(editingProduct.stockQuantity)),
        inStock: parseInt(String(editingProduct.stockQuantity)) > 0,
        featured: editingProduct.featured || false
      };

      await updateProductMutation.mutateAsync({
        productId: editingProduct.id,
        productData
      });
      
      setIsEditModalOpen(false);
      setEditingProduct(null);
      
      toast.success('Produto atualizado com sucesso!');
      // A lista de produtos será atualizada automaticamente pelo React Query
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return texts[status as keyof typeof texts] || status;
  };

  // Integração com API para dados reais
  const { data: recentProductsData, isLoading: recentProductsLoading } = useAdminProducts({ limit: 3, sortBy: 'created_at', sortOrder: 'desc' });
  
  // Parâmetros para busca e filtros de produtos
  const productParams = {
    page: productsPage,
    limit: 20,
    search: productSearchTerm || undefined,
    category: productCategoryFilter !== 'all' ? productCategoryFilter : undefined,
    sortBy: productsSortBy,
    sortOrder: productsSortOrder
  };
  
  const { data: allProductsData, isLoading: allProductsLoading, refetch: refetchProducts } = useAdminProducts(productParams);
  
  // A API retorna products diretamente, não data.products
  const products = allProductsData?.products;
  
  const { data: dashboardData, isLoading: dashboardLoading } = useAdminDashboard();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({ page: usersPage, limit: 10 });
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders({ page: ordersPage, limit: 10 });
  const { data: categoriesData, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const logoutMutation = useLogout();
  
  // Stats should be fetched from API
  const stats = {
    totalProducts: allProductsData?.pagination?.totalProducts || 0,
    totalUsers: dashboardData?.summary?.totalUsers || 0,
    totalOrders: dashboardData?.summary?.totalOrders || 0,
    totalRevenue: dashboardData?.summary?.totalRevenue || 0
  };

  const recentProducts = recentProductsData?.products || [];
  const allProducts = allProductsData?.products || [];
  
  // Acumular produtos quando novos dados chegam
  useEffect(() => {
    if (allProducts.length > 0) {
      if (productsPage === 1) {
        // Se é a primeira página, substitui a lista
        setAccumulatedProducts(allProducts);
      } else {
        // Se não é a primeira página, adiciona os novos produtos
        setAccumulatedProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = allProducts.filter(p => !existingIds.has(p.id));
          
          if (newProducts.length === 0) {
            // API retornou os mesmos produtos, mantém lista atual
            return prev;
          }
          
          return [...prev, ...newProducts];
        });
      }
    }
  }, [allProducts, productsPage]);
  
  // Resetar produtos acumulados quando filtros mudarem
  useEffect(() => {
    setProductsPage(1);
    setAccumulatedProducts([]);
  }, [productSearchTerm, productCategoryFilter, productsSortBy, productsSortOrder]);
  const recentOrders = ordersData?.orders?.slice(0, 5) || [];
  
  // Filtrar produtos localmente (além dos filtros da API) - usar produtos acumulados
  const filteredProducts = accumulatedProducts.filter(product => {
    // Filtro de estoque
    if (productStockFilter === 'in_stock' && (!product.inStock || product.stockQuantity <= 0)) return false;
    if (productStockFilter === 'out_of_stock' && (product.inStock && product.stockQuantity > 0)) return false;
    if (productStockFilter === 'low_stock' && product.stockQuantity > 5) return false;
    
    // Filtro de produtos em destaque
    if (productFeaturedFilter === 'featured' && !product.featured) return false;
    if (productFeaturedFilter === 'not_featured' && product.featured) return false;
    
    return true;
  });
  
  // Informações de paginação - usar apenas dados da API
  const totalProducts = allProductsData?.pagination?.totalProducts || 0;
  const totalPages = allProductsData?.pagination?.totalPages || Math.ceil(totalProducts / 20);
  const currentPage = allProductsData?.pagination?.currentPage || productsPage;
  
  // Para filtros locais, calcular paginação baseada nos produtos filtrados
  const hasLocalFilters = productStockFilter !== 'all' || productFeaturedFilter !== 'all';
  const localTotalPages = hasLocalFilters ? Math.ceil(filteredProducts.length / 20) : totalPages;
  const localCurrentPage = hasLocalFilters ? Math.min(productsPage, localTotalPages) : currentPage;
  
  // Sistema de "Carregar mais" - verificar se há mais produtos para carregar
  const hasMoreProducts = currentPage < totalPages;
  const loadMoreProducts = () => {
    if (hasMoreProducts) {
      setProductsPage(prev => prev + 1);
    }
  };
  
  // Filtrar usuários baseado nos filtros
  const filteredUsers = usersData?.users?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    return matchesSearch && matchesRole;
  }) || [];
  
  const isLoading = dashboardLoading || recentProductsLoading;

  // Reset da página quando filtros de estoque ou destaque mudarem
  useEffect(() => {
    setProductsPage(1);
  }, [productStockFilter, productFeaturedFilter]);

  // Funções auxiliares para produtos
  const clearProductFilters = () => {
    setProductSearchTerm('');
    setProductCategoryFilter('all');
    setProductStockFilter('all');
    setProductFeaturedFilter('all');
    setProductsPage(1);
  };
  
  const resetProductForm = () => {
    setProductForm({
      name: '',
      category: '',
      brand: '',
      price: '',
      stock: '',
      sku: '',
      description: '',
      featured: false,
      useCategoryDimensions: true,
      widthCm: '',
      heightCm: '',
      lengthCm: '',
      weightKg: ''
    });
    setSelectedImages([]);
    setShowProductForm(false);
  };
  
  const handleProductSort = (field: string) => {
    if (productsSortBy === field) {
      setProductsSortOrder(productsSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setProductsSortBy(field);
      setProductsSortOrder('asc');
    }
    setProductsPage(1);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        navigate('/auth');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold font-montserrat">
                <span className="text-skina-blue">SKINA</span> <span className="text-skina-green">ECOPEÇAS</span>
              </h1>
              <Badge variant="secondary" className="ml-3">Admin</Badge>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-8' : 'grid-cols-3'}`}>
            {user?.role === 'admin' && (
              <>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="products">Produtos</TabsTrigger>
                <TabsTrigger value="categories">Categorias</TabsTrigger>
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
                <TabsTrigger value="users">Usuários</TabsTrigger>
                <TabsTrigger value="slides">Slides</TabsTrigger>
                <TabsTrigger value="integration">Integração</TabsTrigger>
                <TabsTrigger value="reports">Relatórios</TabsTrigger>
              </>
            )}
            {user?.role === 'colaborador' && (
              <>
                <TabsTrigger value="products">Produtos</TabsTrigger>
                <TabsTrigger value="categories">Categorias</TabsTrigger>
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Carregando...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats.totalProducts}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalProducts > 0 ? 'Produtos cadastrados' : 'Nenhum produto cadastrado'}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Carregando...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats.totalUsers}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalUsers > 0 ? 'Usuários registrados' : 'Nenhum usuário registrado'}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Carregando...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats.totalOrders}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalOrders > 0 ? 'Pedidos realizados' : 'Nenhum pedido realizado'}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Carregando...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalRevenue > 0 ? 'Receita acumulada' : 'Nenhuma receita registrada'}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">R$ {product.discountPrice || product.originalPrice}</p>
                          <p className="text-sm text-muted-foreground">Estoque: {product.inStock}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pedidos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Carregando pedidos...</span>
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pedido encontrado.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              Pedido #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <Badge variant={
                              order.status === 'delivered' ? 'default' : 
                              order.status === 'processing' ? 'secondary' :
                              order.status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                              {order.status === 'pending' ? 'Pendente' :
                               order.status === 'processing' ? 'Processando' :
                               order.status === 'shipped' ? 'Enviado' :
                               order.status === 'delivered' ? 'Entregue' :
                               order.status === 'cancelled' ? 'Cancelado' : order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold tracking-tight">Gestão de Produtos</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja resetar todas as visitas dos produtos? Esta ação não pode ser desfeita.')) {
                      resetAllViewCountsMutation.mutate();
                    }
                  }}
                  disabled={resetAllViewCountsMutation.isPending}
                >
                  {resetAllViewCountsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Resetar Visitas
                </Button>
                <Button 
                  className="bg-skina-green hover:bg-skina-green/90"
                  onClick={() => setShowProductForm(!showProductForm)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {showProductForm ? 'Ocultar Formulário' : 'Novo Produto'}
                </Button>
              </div>
            </div>

            {/* Formulário de Cadastro (Colapsável) */}
            {showProductForm && (
              <Card>
                <CardHeader>
                  {/* Indicador de Etapas */}
                  <div className="mb-6">
                    <div className="flex items-center justify-center space-x-4">
                      <div className={`flex items-center space-x-2 ${
                        productCreationStep === 'product' ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          productCreationStep === 'product' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          1
                        </div>
                        <span className="font-medium">Dados do Produto</span>
                      </div>
                      
                      <div className="flex-1 h-0.5 bg-gray-300"></div>
                      
                      <div className={`flex items-center space-x-2 ${
                        productCreationStep === 'images' ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          productCreationStep === 'images' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          2
                        </div>
                        <span className="font-medium">Imagens</span>
                      </div>
                    </div>
                  </div>

                  {productCreationStep === 'product' ? (
                    <div>
                      <CardTitle>Etapa 1: Dados do Produto</CardTitle>
                      <CardDescription>
                        Preencha as informações básicas do produto
                      </CardDescription>
                    </div>
                  ) : (
                    <div>
                      <CardTitle>Etapa 2: Imagens do Produto</CardTitle>
                      <CardDescription>
                        Adicione imagens para o produto criado
                      </CardDescription>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Etapa 1: Dados do Produto */}
                  {productCreationStep === 'product' && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product-name">Nome do Produto</Label>
                      <Input 
                        id="product-name" 
                        placeholder="Ex: Filtro de Óleo Motor" 
                        value={productForm.name}
                        onChange={(e) => handleProductFormChange('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-category">Categoria</Label>
                      <Select 
                        value={productForm.category} 
                        onValueChange={(value) => handleProductFormChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="motores">Motores</SelectItem>
                          <SelectItem value="suspensao">Suspensão</SelectItem>
                          <SelectItem value="freios">Freios</SelectItem>
                          <SelectItem value="acessorios">Acessórios</SelectItem>
                          <SelectItem value="transmissao">Transmissão</SelectItem>
                          <SelectItem value="farois-eletrica">Faróis e Elétrica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="product-brand">Marca</Label>
                      <Input 
                        id="product-brand" 
                        placeholder="Ex: Bosch" 
                        value={productForm.brand}
                        onChange={(e) => handleProductFormChange('brand', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-price">Preço (R$)</Label>
                      <Input 
                        id="product-price" 
                        type="number" 
                        placeholder="0,00" 
                        value={productForm.price}
                        onChange={(e) => handleProductFormChange('price', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-stock">Estoque</Label>
                      <Input 
                        id="product-stock" 
                        type="number" 
                        placeholder="0" 
                        value={productForm.stock}
                        onChange={(e) => handleProductFormChange('stock', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-sku">SKU</Label>
                      <Input 
                        id="product-sku" 
                        placeholder="Ex: FLT001" 
                        value={productForm.sku}
                        onChange={(e) => handleProductFormChange('sku', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Dimensões para Cálculo de Frete</h3>
                    
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="use-category-dimensions"
                          checked={productForm.useCategoryDimensions}
                          onChange={(e) => handleProductFormChange('useCategoryDimensions', e.target.checked)}
                          className="h-4 w-4 text-skina-green focus:ring-skina-green border-gray-300 rounded"
                        />
                        <Label htmlFor="use-category-dimensions" className="text-sm font-medium">
                          Usar dimensões da categoria
                        </Label>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {productForm.useCategoryDimensions 
                          ? "O sistema utilizará as dimensões padrão definidas na categoria selecionada" 
                          : "Defina dimensões específicas para este produto"}
                      </p>
                    </div>
                    
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${productForm.useCategoryDimensions ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div>
                        <Label htmlFor="product-width">Largura (cm)</Label>
                        <Input 
                          id="product-width" 
                          type="number" 
                          step="0.1"
                          placeholder="0.0" 
                          value={productForm.widthCm}
                          onChange={(e) => handleProductFormChange('widthCm', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="product-height">Altura (cm)</Label>
                        <Input 
                          id="product-height" 
                          type="number" 
                          step="0.1"
                          placeholder="0.0" 
                          value={productForm.heightCm}
                          onChange={(e) => handleProductFormChange('heightCm', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="product-length">Comprimento (cm)</Label>
                        <Input 
                          id="product-length" 
                          type="number" 
                          step="0.1"
                          placeholder="0.0" 
                          value={productForm.lengthCm}
                          onChange={(e) => handleProductFormChange('lengthCm', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="product-weight">Peso (kg)</Label>
                        <Input 
                          id="product-weight" 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          value={productForm.weightKg}
                          onChange={(e) => handleProductFormChange('weightKg', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="product-description">Descrição</Label>
                    <Textarea 
                      id="product-description" 
                      placeholder="Descrição detalhada do produto..." 
                      value={productForm.description}
                      onChange={(e) => handleProductFormChange('description', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="product-featured"
                      checked={productForm.featured}
                      onChange={(e) => handleProductFormChange('featured', e.target.checked)}
                      className="h-4 w-4 text-skina-green focus:ring-skina-green border-gray-300 rounded"
                    />
                    <Label htmlFor="product-featured" className="text-sm font-medium">
                      Produto em Destaque
                    </Label>
                  </div>
                  

                  
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-skina-green hover:bg-skina-green/90"
                          onClick={handleProductSubmit}
                          disabled={createProductMutation.isPending}
                        >
                          {createProductMutation.isPending ? 'Cadastrando...' : 'Cadastrar Produto'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={resetProductForm}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Etapa 2: Upload de Imagens */}
                  {productCreationStep === 'images' && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-medium">✅ Produto criado com sucesso!</p>
                        <p className="text-green-600 text-sm mt-1">Agora adicione imagens para finalizar o cadastro.</p>
                      </div>

                      <div>
                        <Label htmlFor="product-images-step2">Selecionar Imagens</Label>
                        <Input 
                          id="product-images-step2" 
                          type="file"
                          accept=".jpg,.jpeg,.png,.gif,.webp,.svg,image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                          multiple
                          onChange={handleImageSelection}
                          className="cursor-pointer"
                        />
                        
                        {selectedImages.length > 0 && (
                          <div className="mt-4">
                            <Label className="text-sm font-medium">Imagens Selecionadas ({selectedImages.length})</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                              {selectedImages.map((image, index) => (
                                <div key={index} className="relative group">
                                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                                    <img 
                                      src={URL.createObjectURL(image)} 
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="absolute top-2 right-2">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeSelectedImage(index)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {index === 0 && (
                                    <div className="absolute bottom-2 left-2">
                                      <Badge variant="secondary" className="text-xs">
                                        Principal
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={handleBackToProduct}
                          className="flex-1"
                        >
                          ← Voltar
                        </Button>
                        <Button 
                          className="flex-1 bg-skina-green hover:bg-skina-green/90"
                          onClick={handleImageUploadStep}
                          disabled={selectedImages.length === 0}
                        >
                          Finalizar Cadastro
                        </Button>
                        <Button 
                          variant="secondary"
                          onClick={handleSkipImages}
                          className="flex-1"
                        >
                          Pular Imagens
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Filtros e Busca */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros e Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produtos..."
                      className="pl-8"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Categorias</SelectItem>
                      <SelectItem value="motores">Motores</SelectItem>
                      <SelectItem value="suspensao">Suspensão</SelectItem>
                      <SelectItem value="freios">Freios</SelectItem>
                      <SelectItem value="acessorios">Acessórios</SelectItem>
                      <SelectItem value="transmissao">Transmissão</SelectItem>
                      <SelectItem value="farois-eletrica">Faróis e Elétrica</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={productStockFilter} onValueChange={setProductStockFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estoque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Estoques</SelectItem>
                      <SelectItem value="in_stock">Em Estoque</SelectItem>
                      <SelectItem value="low_stock">Estoque Baixo (≤5)</SelectItem>
                      <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={productFeaturedFilter} onValueChange={setProductFeaturedFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Destaque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="featured">Em Destaque</SelectItem>
                      <SelectItem value="not_featured">Não Destacados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    {filteredProducts.length} de {totalProducts} produtos
                  </div>
                  <Button variant="outline" size="sm" onClick={clearProductFilters}>
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Produtos */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Produtos</CardTitle>
                <CardDescription>
                  Gerencie todos os produtos do seu catálogo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allProductsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">Carregando produtos...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {productSearchTerm || productCategoryFilter !== 'all' || productStockFilter !== 'all' || productFeaturedFilter !== 'all' 
                      ? 'Nenhum produto encontrado com os filtros aplicados.' 
                      : 'Nenhum produto cadastrado ainda.'}
                  </div>
                ) : (
                  <>
                    {/* Tabela de Produtos */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleProductSort('name')}
                            >
                              <div className="flex items-center gap-1">
                                Nome
                                {productsSortBy === 'name' && (
                                  <span className="text-xs">
                                    {productsSortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleProductSort('price')}
                            >
                              <div className="flex items-center gap-1">
                                Preço
                                {productsSortBy === 'price' && (
                                  <span className="text-xs">
                                    {productsSortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleProductSort('stock')}
                            >
                              <div className="flex items-center gap-1">
                                Estoque
                                {productsSortBy === 'stock' && (
                                  <span className="text-xs">
                                    {productsSortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleProductSort('view_count')}
                            >
                              <div className="flex items-center gap-1">
                                Visitas
                                {productsSortBy === 'view_count' && (
                                  <span className="text-xs">
                                    {productsSortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(hasLocalFilters ? filteredProducts : accumulatedProducts).map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-muted-foreground">SKU: {product.sku || 'N/A'}</div>
                                  </div>
                                  {product.featured && (
                          <Badge variant="secondary" className="text-xs">
                            ⭐ Destaque
                          </Badge>
                        )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {product.category || 'Sem categoria'}
                                </Badge>
                              </TableCell>
                              <TableCell>{product.brand || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  R$ {(product.discountPrice || product.originalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={`font-medium ${
                                  product.stockQuantity <= 0 ? 'text-red-600' :
                                  product.stockQuantity <= 5 ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {product.stockQuantity || 0} un.
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-blue-600">
                                  {product.viewCount || 0} visitas
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={product.inStock ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {product.inStock ? 'Disponível' : 'Indisponível'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewProduct(product as unknown as Product)}
                                    title="Ver detalhes"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditProduct(product as unknown as Product)}
                                    title="Editar produto"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                    title="Excluir produto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Botão Carregar Mais */}
                    {hasMoreProducts && !hasLocalFilters && (
                      <div className="flex items-center justify-center mt-6">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={loadMoreProducts}
                          disabled={allProductsLoading}
                          className="min-w-[200px]"
                        >
                          {allProductsLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Carregando...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Carregar mais produtos
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Informações dos produtos carregados */}
                    <div className="flex items-center justify-center mt-4">
                      <div className="text-sm text-muted-foreground">
                        {hasLocalFilters ? (
                          `${filteredProducts.length} produtos filtrados`
                        ) : (
                          `${accumulatedProducts.length} de ${totalProducts} produtos carregados`
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Gerenciar Pedidos</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Lista de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">Carregando pedidos...</span>
                  </div>
                ) : ordersData?.orders?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum pedido encontrado.
                  </p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {ordersData?.orders?.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">Pedido #{order.orderNumber}</h3>
                            <p className="text-sm text-muted-foreground">Cliente: {order.customerName}</p>
                            <p className="text-sm text-muted-foreground">Email: {order.customerEmail}</p>
                            <p className="text-sm text-muted-foreground">Data: {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                            {order.trackingCode && order.status === 'shipped' && (
                              <p className="text-sm font-medium text-blue-600 mt-1">
                                📦 Código de Rastreio: {order.trackingCode}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(order.total)}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewOrder(order.id)}
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleGenerateLabel(order.id)}
                                title="Gerar etiqueta de envio"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <select
                                className="px-2 py-1 text-xs border rounded"
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                title="Alterar status"
                              >
                                <option value="pending">Pendente</option>
                                <option value="confirmed">Confirmado</option>
                                <option value="processing">Processando</option>
                                <option value="shipped">Enviado</option>
                                <option value="delivered">Entregue</option>
                                <option value="cancelled">Cancelado</option>
                              </select>
                              {['cancelled', 'pending'].includes(order.status) && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                                  title="Excluir pedido"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Paginação de Pedidos */}
                    {ordersData?.pagination && ordersData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Página {ordersData.pagination.currentPage} de {ordersData.pagination.totalPages} 
                          ({ordersData.pagination.totalOrders} pedidos no total)
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
                            disabled={!ordersData.pagination.hasPrev}
                          >
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOrdersPage(Math.min(ordersData.pagination.totalPages, ordersPage + 1))}
                            disabled={!ordersData.pagination.hasNext}
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold tracking-tight">Gestão de Categorias</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Categorias e Dimensões para Frete</CardTitle>
                <CardDescription>
                  Configure as dimensões padrão de cada categoria para cálculo automático de frete
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">Carregando categorias...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Largura (cm)</TableHead>
                        <TableHead>Altura (cm)</TableHead>
                        <TableHead>Comprimento (cm)</TableHead>
                        <TableHead>Peso (kg)</TableHead>
                        <TableHead>Produtos</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoriesData?.data?.categories?.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              {category.imageUrl && (
                                <img 
                                  src={category.imageUrl} 
                                  alt={category.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">{category.name}</p>
                                {category.description && (
                                  <p className="text-sm text-muted-foreground">{category.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {category.widthCm || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                              {category.heightCm || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                              {category.lengthCm || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                              {category.weightKg || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {category.productCount || 0} produtos
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingCategory(category as Category);
                                setIsEditCategoryModalOpen(true);
                              }}
                              title="Editar dimensões"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar usuários..." 
                    className="pl-8" 
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span className="text-muted-foreground">Carregando usuários...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : !filteredUsers || filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {userSearchTerm || userRoleFilter !== 'all' ? 'Nenhum usuário encontrado com os filtros aplicados.' : 'Nenhum usuário encontrado.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={
                              user.role === 'admin' ? 'default' : 
                              user.role === 'colaborador' ? 'outline' : 'secondary'
                            }>
                              {user.role === 'admin' ? 'Admin' : 
                               user.role === 'colaborador' ? 'Colaborador' : 'Usuário'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                title="Editar usuário"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleCreateCoupon(user)}
                                title="Vincular desconto"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                              {user.role === 'user' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handlePromoteToCollaborator(user.id, user.name)}
                                    title="Promover para colaborador"
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <TrendingUp className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handlePromoteUser(user.id, user.name)}
                                    title="Promover para admin"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <TrendingUp className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {user.role === 'colaborador' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handlePromoteUser(user.id, user.name)}
                                    title="Promover para admin"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <TrendingUp className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDemoteFromCollaborator(user.id, user.name)}
                                    title="Rebaixar para usuário"
                                    className="text-orange-600 hover:text-orange-700"
                                  >
                                    <TrendingDown className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {user.role === 'admin' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDemoteUser(user.id, user.name)}
                                  title="Rebaixar para usuário"
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  <TrendingDown className="h-4 w-4" />
                                </Button>
                              )}
                              {user.isActive ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeactivateUser(user.id, user.name)}
                                  title="Inativar usuário"
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleActivateUser(user.id, user.name)}
                                  title="Ativar usuário"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                title="Deletar usuário permanentemente"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold tracking-tight">Integração com Mercado Livre</h2>
            </div>
            
            {/* Integração Completa */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <img 
                      src="/images/mercado-livre.png" 
                      alt="Mercado Livre" 
                      className="w-12 h-10 object-contain"
                    />
                    Integração Mercado Livre
                  </CardTitle>
                  
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <MercadoLivreStatusBadge 
                      mlStatus={mlStatus?.data} 
                      isLoading={mlStatus?.isLoading} 
                      error={mlStatus?.error} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Última sincronização:</span>
                    <span className="text-sm text-muted-foreground">
                      <MercadoLivreLastSync mlStatus={mlStatus?.data} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quantidade de produtos da Conexão:</span>
                    <span className="text-sm text-muted-foreground">
                      <MercadoLivreProductCount mlStatus={mlStatus?.data} />
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full bg-skina-green hover:bg-skina-green/90 text-white"
                    onClick={() => navigate('/admin/mercado-livre')}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Gerenciar Integração
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Relatórios</h2>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    <SelectItem value="1y">Último ano</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Período</CardTitle>
                  <CardDescription>Gráfico de vendas ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Carregando dados...</span>
                    </div>
                  ) : dashboardData?.salesChart && dashboardData.salesChart.length > 0 ? (
                    <div className="space-y-4">
                       <div className="grid grid-cols-3 gap-4 text-center">
                         <div>
                           <p className="text-2xl font-bold text-blue-600">
                             {dashboardData.salesChart.reduce((sum, day) => sum + parseInt(day.orders.toString()), 0)}
                           </p>
                           <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                         </div>
                         <div>
                           <p className="text-2xl font-bold text-green-600">
                             R$ {dashboardData.salesChart.reduce((sum, day) => sum + parseFloat(day.sales.toString()), 0).toFixed(2)}
                           </p>
                           <p className="text-sm text-muted-foreground">Receita Total</p>
                         </div>
                         <div>
                           <p className="text-2xl font-bold text-purple-600">
                             R$ {(dashboardData.salesChart.reduce((sum, day) => sum + parseFloat(day.sales.toString()), 0) / dashboardData.salesChart.reduce((sum, day) => sum + parseInt(day.orders.toString()), 0) || 0).toFixed(2)}
                           </p>
                           <p className="text-sm text-muted-foreground">Ticket Médio</p>
                         </div>
                       </div>
                       <div className="space-y-2">
                         {dashboardData.salesChart.map((day, index) => (
                           <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                             <span className="text-sm">{new Date(day.date).toLocaleDateString('pt-BR')}</span>
                             <div className="flex gap-4 text-sm">
                               <span className="text-blue-600">{day.orders} pedidos</span>
                               <span className="text-green-600">R$ {parseFloat(day.sales.toString()).toFixed(2)}</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma venda registrada</p>
                      <p className="text-sm">Os dados aparecerão quando houver vendas confirmadas</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Vendidos</CardTitle>
                  <CardDescription>Ranking dos produtos com mais vendas</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Carregando dados...</span>
                    </div>
                  ) : dashboardData?.bestSellers && dashboardData.bestSellers.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.bestSellers.slice(0, 5).map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{(product as unknown as ProductWithSales).totalSold || 0} vendas</p>
                            <p className="text-xs text-muted-foreground">R$ {parseFloat(String(product.discountPrice || product.originalPrice || 0)).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                      {dashboardData.bestSellers.length > 5 && (
                        <p className="text-center text-sm text-muted-foreground mt-3">
                          +{dashboardData.bestSellers.length - 5} produtos adicionais
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum produto vendido ainda</p>
                      <p className="text-sm">O ranking aparecerá quando houver vendas</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Categoria</CardTitle>
                  <CardDescription>Distribuição de vendas por categoria de produto</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Carregando dados...</span>
                    </div>
                  ) : dashboardData?.salesByCategory && dashboardData.salesByCategory.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.salesByCategory.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{category.category}</p>
                            <p className="text-xs text-muted-foreground">{category.orders} pedidos • {category.items_sold} itens</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-green-600">R$ {parseFloat(category.revenue.toString()).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma venda por categoria</p>
                      <p className="text-sm">O relatório aparecerá quando houver vendas confirmadas</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Conversão</CardTitle>
                  <CardDescription>Taxa de conversão e métricas de performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Carregando dados...</span>
                    </div>
                  ) : dashboardData?.conversionMetrics ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{dashboardData.conversionMetrics.customer_conversion_rate}%</p>
                        <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{dashboardData.conversionMetrics.avg_orders_per_customer.toString()}</p>
                        <p className="text-xs text-muted-foreground">Pedidos por Cliente</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">R$ {(dashboardData.conversionMetrics.avg_order_value || 0).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Ticket Médio</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{dashboardData.conversionMetrics.unique_customers.toString()}</p>
                        <p className="text-xs text-muted-foreground">Clientes Únicos</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Métricas não disponíveis</p>
                      <p className="text-sm">As métricas aparecerão quando houver dados suficientes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Slides Tab */}
          <TabsContent value="slides" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Slides</h2>
              <Button onClick={() => setIsSlideModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Slide
              </Button>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Slides da Página Principal</CardTitle>
                  <CardDescription>Gerencie os slides do carrossel da página inicial</CardDescription>
                </CardHeader>
                <CardContent>
                  {slidesData && slidesData.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imagem</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Subtítulo</TableHead>
                          <TableHead>CTA</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ordem</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {slidesData.map((slide: Slide) => (
                          <TableRow key={slide.id}>
                            <TableCell>
                              <img 
                                src={slide.backgroundImage} 
                                alt={slide.title}
                                className="w-16 h-10 object-cover rounded"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{slide.title}</TableCell>
                            <TableCell>{slide.subtitle}</TableCell>
                            <TableCell>{slide.ctaText}</TableCell>
                            <TableCell>
                              <Badge variant={slide.isActive ? 'default' : 'secondary'}>
                                {slide.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>{slide.order}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMoveSlideUp(slide.id, slide.order)}
                                  title="Mover para cima"
                                  disabled={slide.order <= 1}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMoveSlideDown(slide.id, slide.order)}
                                  title="Mover para baixo"
                                  disabled={slide.order >= slidesData.length}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleSlideStatus(slide.id, slide.isActive)}
                                  title={slide.isActive ? 'Desativar slide' : 'Ativar slide'}
                                >
                                  {slide.isActive ? 'Desativar' : 'Ativar'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteSlide(slide.id, slide.title)}
                                  title="Excluir slide"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum slide cadastrado</p>
                      <p className="text-sm">Clique em "Novo Slide" para começar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal de detalhes do pedido */}
      <AdminOrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        orderId={selectedOrderId}
      />

      {/* Modal de visualização de produto */}
      {isViewModalOpen && viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Detalhes do Produto</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsViewModalOpen(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="font-medium">Nome:</label>
                <p className="text-gray-700">{viewingProduct.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium">Categoria:</label>
                  <p className="text-gray-700">{viewingProduct.category}</p>
                </div>
                <div>
                  <label className="font-medium">Marca:</label>
                  <p className="text-gray-700">{viewingProduct.brand}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium">Preço:</label>
                  <p className="text-gray-700">R$ {parseFloat(String(viewingProduct.discountPrice || viewingProduct.originalPrice || 0)).toFixed(2)}</p>
                </div>
                <div>
                  <label className="font-medium">Estoque:</label>
                  <p className="text-gray-700">{viewingProduct.stockQuantity || 0} unidades</p>
                </div>
              </div>
              
              <div>
                <label className="font-medium">SKU:</label>
                <p className="text-gray-700">{viewingProduct.sku || 'Não informado'}</p>
              </div>
              
              <div>
                <label className="font-medium">Status:</label>
                <p className="text-gray-700">{viewingProduct.inStock ? 'Disponível' : 'Indisponível'}</p>
              </div>
              
              <div>
                <label className="font-medium">Produto em Destaque:</label>
                <p className="text-gray-700">{viewingProduct.featured ? 'Sim' : 'Não'}</p>
              </div>
              
              {viewingProduct.description && (
                <div>
                  <label className="font-medium">Descrição:</label>
                  <p className="text-gray-700">{viewingProduct.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de produto */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Editar Produto</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Produto</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do produto"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Categoria</Label>
                  <Select 
                    value={editingProduct.category || ''} 
                    onValueChange={(value) => setEditingProduct(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motores">Motores</SelectItem>
                      <SelectItem value="suspensao">Suspensão</SelectItem>
                      <SelectItem value="freios">Freios</SelectItem>
                      <SelectItem value="acessorios">Acessórios</SelectItem>
                      <SelectItem value="transmissao">Transmissão</SelectItem>
                      <SelectItem value="farois-eletrica">Faróis e Elétrica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-brand">Marca</Label>
                  <Input
                    id="edit-brand"
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Marca"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price">Preço (R$)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stock">Estoque</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stockQuantity || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                    placeholder="Quantidade em estoque"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do produto"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-featured"
                  checked={editingProduct.featured || false}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-featured">Produto em Destaque</Label>
              </div>
              
              {/* Seção de Gerenciamento de Imagens */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg font-semibold">Gerenciar Imagens</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImageManager(!showImageManager)}
                  >
                    {showImageManager ? 'Ocultar' : 'Mostrar'} Imagens
                  </Button>
                </div>
                
                {showImageManager && (
                  <ImageManager 
                    productId={editingProduct.id}
                    onImageUpload={handleImageUpload}
                    onUploadImages={handleUploadImages}
                    onSetPrimary={handleSetPrimaryImage}
                    onDeleteImage={handleDeleteImage}
                    editingImages={editingProductImages}
                    onRemoveEditingImage={removeEditingImage}
                    uploadMutation={uploadImagesMutation}
                    setPrimaryMutation={setPrimaryImageMutation}
                    deleteMutation={deleteImageMutation}
                  />
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpdateProduct}
                  disabled={updateProductMutation.isPending}
                  className="flex-1"
                >
                  {updateProductMutation.isPending ? 'Atualizando...' : 'Atualizar Produto'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Usuário */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Editar Usuário</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-user-name">Nome</Label>
                <Input
                  id="edit-user-name"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do usuário"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-user-email">Email</Label>
                <Input
                  id="edit-user-email"
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-user-role">Função</Label>
                <Select 
                  value={editingUser.role || 'user'} 
                  onValueChange={(value) => setEditingUser(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={() => handleUpdateUser({
                  name: editingUser.name,
                  email: editingUser.email,
                  role: editingUser.role
                })}
                disabled={updateUserMutation.isPending}
                className="flex-1"
              >
                {updateUserMutation.isPending ? 'Atualizando...' : 'Atualizar Usuário'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditCategoryModalOpen && editingCategory && (
        <Dialog open={isEditCategoryModalOpen} onOpenChange={setIsEditCategoryModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Dimensões da Categoria</DialogTitle>
              <DialogDescription>
                Configure as dimensões padrão para {editingCategory.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              
              try {
                const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                  },
                  body: JSON.stringify({
                    widthCm: parseFloat(formData.get('widthCm') as string) || null,
                    heightCm: parseFloat(formData.get('heightCm') as string) || null,
                    lengthCm: parseFloat(formData.get('lengthCm') as string) || null,
                    weightKg: parseFloat(formData.get('weightKg') as string) || null
                  })
                });

                if (response.ok) {
                  toast.success("Dimensões da categoria atualizadas com sucesso!");
                  setIsEditCategoryModalOpen(false);
                  setEditingCategory(null);
                  refetchCategories();
                } else {
                  throw new Error('Erro ao atualizar categoria');
                }
              } catch (error) {
                toast.error("Erro ao atualizar dimensões da categoria");
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="widthCm">Largura (cm)</Label>
                  <Input
                    id="widthCm"
                    name="widthCm"
                    type="number"
                    step="0.1"
                    min="0"
                    defaultValue={editingCategory.widthCm || ''}
                    placeholder="Ex: 10.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heightCm">Altura (cm)</Label>
                  <Input
                    id="heightCm"
                    name="heightCm"
                    type="number"
                    step="0.1"
                    min="0"
                    defaultValue={editingCategory.heightCm || ''}
                    placeholder="Ex: 5.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lengthCm">Comprimento (cm)</Label>
                  <Input
                    id="lengthCm"
                    name="lengthCm"
                    type="number"
                    step="0.1"
                    min="0"
                    defaultValue={editingCategory.lengthCm || ''}
                    placeholder="Ex: 15.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weightKg">Peso (kg)</Label>
                  <Input
                    id="weightKg"
                    name="weightKg"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editingCategory.weightKg || ''}
                    placeholder="Ex: 0.5"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditCategoryModalOpen(false);
                    setEditingCategory(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Dimensões
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Criação de Cupom */}
      {isCouponModalOpen && selectedUserForCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Criar Cupom de Desconto</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Criando cupom para: <strong>{selectedUserForCoupon.name}</strong> ({selectedUserForCoupon.email})
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="discount-percentage">Porcentagem de Desconto (%)</Label>
                <Input
                  id="discount-percentage"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={couponForm.discountPercentage}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, discountPercentage: e.target.value }))}
                  placeholder="Ex: 10"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="expires-at">Data de Expiração (Opcional)</Label>
                <Input
                  id="expires-at"
                  type="date"
                  value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleSubmitCoupon}
                disabled={isCreatingCoupon || !couponForm.discountPercentage}
                className="flex-1"
              >
                {isCreatingCoupon ? 'Criando...' : 'Criar Cupom'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCouponModalOpen(false);
                  setSelectedUserForCoupon(null);
                  setCouponForm({ discountPercentage: '', expiresAt: '' });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Código de Rastreio */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Código de Rastreio</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Informe o código de rastreio para o pedido que será marcado como enviado.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tracking-code">Código de Rastreio</Label>
                <Input
                  id="tracking-code"
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Ex: BR123456789BR"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleConfirmShipping}
                disabled={updateOrderStatusMutation.isPending || !trackingCode.trim()}
                className="flex-1"
              >
                {updateOrderStatusMutation.isPending ? 'Enviando...' : 'Confirmar Envio'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancelShipping}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Slide */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Novo Slide</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Crie um novo slide para o carrossel da página principal.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="slide-title">Título</Label>
                <Input
                  id="slide-title"
                  type="text"
                  value={slideForm.title}
                  onChange={(e) => handleSlideFormChange('title', e.target.value)}
                  placeholder="Ex: Peças Automotivas de Qualidade"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="slide-subtitle">Subtítulo</Label>
                <Textarea
                  id="slide-subtitle"
                  value={slideForm.subtitle}
                  onChange={(e) => handleSlideFormChange('subtitle', e.target.value)}
                  placeholder="Ex: Encontre as melhores peças para seu veículo"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="slide-cta-text">Texto do Botão</Label>
                <Input
                  id="slide-cta-text"
                  type="text"
                  value={slideForm.ctaText}
                  onChange={(e) => handleSlideFormChange('ctaText', e.target.value)}
                  placeholder="Ex: Ver Produtos"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="slide-cta-link">Link do Botão</Label>
                <Input
                  id="slide-cta-link"
                  type="text"
                  value={slideForm.ctaLink}
                  onChange={(e) => handleSlideFormChange('ctaLink', e.target.value)}
                  placeholder="Ex: /produtos"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="slide-image">Imagem de Fundo</Label>
                <Input
                  id="slide-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSlideImageUpload}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Formatos aceitos: JPEG, PNG, WebP</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleCreateSlide}
                disabled={createSlideMutation.isPending || !slideForm.title || !slideForm.ctaText || !slideForm.ctaLink || !slideForm.backgroundImage}
                className="flex-1"
              >
                {createSlideMutation.isPending ? 'Criando...' : 'Criar Slide'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSlideModalOpen(false);
                  setSlideForm({
                    title: '',
                    subtitle: '',
                    ctaText: '',
                    ctaLink: '',
                    backgroundImage: null
                  });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
   );
 };

export default AdminDashboard;