
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ArrowLeft, Truck, Shield, Calendar, Package } from 'lucide-react';
import { useProduct, useAddToCart, useCartSession, useProductImages, useLastPurchase, useAnyPurchase, useAuth } from '@/hooks/useApi';
import { toast } from 'sonner';
import ProductDimensions from '@/components/ProductDimensions';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Todos os hooks devem ser chamados no topo do componente
  const { data: productResponse, isLoading, error } = useProduct(productId || '');
  const product = productResponse;
  const { data: productImagesData } = useProductImages(productId || '');
  const addToCartMutation = useAddToCart();
  const { sessionId } = useCartSession();
  const { user, isAuthenticated } = useAuth();
  const { data: lastPurchase, isLoading: isLoadingLastPurchase } = useLastPurchase(productId || '');
  const { data: anyPurchase, isLoading: isLoadingAnyPurchase } = useAnyPurchase(productId || '');

  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Reset do índice selecionado quando as imagens mudarem
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productId]);

  const handleAddToCart = async () => {
    if (!productResponse?.product || !sessionId) {
      toast.error('Erro ao conectar com o carrinho. Tente novamente.');
      return;
    }
    
    try {
      await addToCartMutation.mutateAsync({
        sessionId,
        productId: productResponse.product.id,
        quantity: 1
      });
      
      // Notificação de sucesso com animação
      toast.success('Produto adicionado ao carrinho!', {
        icon: '🛒',
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho. Tente novamente.');
    }
  };

  const handleBuyNow = async () => {
    if (!productResponse?.product || !sessionId) {
      toast.error('Erro ao conectar com o carrinho. Tente novamente.');
      return;
    }
    
    try {
      await addToCartMutation.mutateAsync({
        sessionId,
        productId: productResponse.product.id,
        quantity: 1
      });
      
      // Redireciona para o carrinho após adicionar o produto
      navigate('/carrinho');
      
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho. Tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Carregando produto...</h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !productResponse?.product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Produto não encontrado</h1>
            <Button onClick={() => navigate('/produtos')}>
              Voltar para produtos
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Normalizar os nomes dos campos de preço e converter para números
  const originalPriceRaw = productResponse.product.originalPrice || 0;
  const discountPriceRaw = productResponse.product.discountPrice;
  
  const originalPrice = typeof originalPriceRaw === 'string' ? parseFloat(originalPriceRaw) : (originalPriceRaw || 0);
  const discountPrice = discountPriceRaw ? 
    (typeof discountPriceRaw === 'string' ? parseFloat(discountPriceRaw) : discountPriceRaw) : 
    originalPrice;
  
  const discountPercentage = originalPrice > discountPrice 
    ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
    : 0;

  // Normalizar campo de imagem e preparar lista de imagens
  const productImage = productResponse.product.image || '/placeholder.svg';
  
  // A API retorna { success: boolean, images: [...] }
  const productImages = productImagesData?.images || [];
  
  // Criar lista completa de imagens usando dados da API
  const allImages = [];
  
  // Adicionar imagens da API se existirem
  if (productImages && productImages.length > 0) {
    productImages.forEach(img => {
      allImages.push({
          url: `${import.meta.env.VITE_API_URL}/products/images/${img.id}`,
         isPrimary: img.isPrimary || false,
         id: img.id,
         displayOrder: img.displayOrder || 0,
         imageName: img.imageName || 'Imagem do produto'
        });
    });
  }
  
  // Se não há imagens da API, mas há mlImages, usar as imagens do Mercado Livre
  if (allImages.length === 0 && productResponse.product.mlImages && productResponse.product.mlImages.length > 0) {
    productResponse.product.mlImages.forEach((imageUrl, index) => {
      allImages.push({
        url: imageUrl,
        isPrimary: index === 0, // Primeira imagem como principal
        id: `ml-${index}`,
        displayOrder: index,
        imageName: `Imagem ML ${index + 1}`
      });
    });
  }
  
  // Se não há imagens da API nem mlImages, usar a imagem principal do produto
  if (allImages.length === 0) {
    allImages.push({
      url: productImage,
      isPrimary: true,
      id: 'main',
      displayOrder: 0,
      imageName: 'Imagem principal'
    });
  }
  
  // Ordenar imagens por display_order e colocar a primária primeiro
  const sortedImages = allImages.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.displayOrder - b.displayOrder;
  });
  
  // Garantir que sempre temos pelo menos uma imagem
  const finalImages = sortedImages.length > 0 ? sortedImages : [{ 
    url: productImage, 
    isPrimary: true, 
    id: 'fallback', 
    displayOrder: 0, 
    imageName: 'Imagem padrão' 
  }];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-32 lg:pt-36">
        {/* Botão voltar */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-skina-blue/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Carrossel de imagens do produto */}
          <div className="space-y-4">
            {/* Imagem principal */}
            <div className="relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-800">
              <img
                src={finalImages[selectedImageIndex]?.url || productImage}
                alt={productResponse.product.name}
                className="w-full h-96 object-contain"
                onError={(e) => {
                  console.error('Erro ao carregar imagem principal:', finalImages[selectedImageIndex]?.url);
                  e.currentTarget.src = productImage;
                }}
              />
              {discountPercentage > 0 && (
                <div className="absolute top-4 right-4">
                  <div className="bg-gradient-to-r from-skina-green to-green-500 text-white px-3 py-2 rounded-full text-sm font-bold">
                    -{discountPercentage}%
                  </div>
                </div>
              )}
            </div>
            

            
            {/* Carrossel de miniaturas - Sempre exibir se há mais de uma imagem */}
            {finalImages && finalImages.length > 1 && (
              <div className="relative mt-4">
                <div className="text-sm text-gray-600 mb-2">
                  {finalImages.length} imagens disponíveis
                </div>
                <Carousel
                  opts={{
                    align: "start",
                    loop: false,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2">
                    {finalImages.map((image, index) => (
                      <CarouselItem key={`${image.id}-${index}`} className="pl-2 basis-1/4">
                        <div 
                          className={`relative overflow-hidden rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                            selectedImageIndex === index 
                              ? 'ring-2 ring-skina-blue ring-offset-2 border-skina-blue' 
                              : 'border-gray-200 hover:border-gray-300 hover:opacity-80'
                          }`}
                          onClick={() => setSelectedImageIndex(index)}
                          title={`Ver ${image.imageName || `imagem ${index + 1}`}`}
                        >
                          <img
                            src={image.url}
                            alt={image.imageName || `${productResponse.product.name} - Imagem ${index + 1}`}
                            className="w-full h-20 object-contain"
                            loading="lazy"
                            onError={(e) => {
                              console.error('Erro ao carregar miniatura:', image.url);
                              e.currentTarget.src = productImage;
                            }}
                          />
                          {image.isPrimary && (
                            <div className="absolute top-1 left-1 bg-skina-blue text-white text-xs px-1 rounded">
                              Principal
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {finalImages.length > 4 && (
                    <>
                      <CarouselPrevious className="-left-4" />
                      <CarouselNext className="-right-4" />
                    </>
                  )}
                </Carousel>
              </div>
            )}
          </div>

          {/* Informações do produto */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="text-skina-blue border-skina-blue/20 bg-skina-blue/5 mb-3">
                {productResponse.product.brand}
              </Badge>
              <h1 className="text-2xl lg:text-3xl font-bold text-skina-blue mb-4">
                {productResponse.product.name}
              </h1>
            </div>

            {/* Preços */}
            <div className="space-y-2">
              {originalPrice > discountPrice && (
                <div className="text-gray-400 line-through text-lg">
                  R$ {originalPrice.toFixed(2).replace('.', ',')}
                </div>
              )}
              <div className="text-skina-green text-3xl font-bold">
                R$ {discountPrice.toFixed(2).replace('.', ',')}
              </div>

            </div>

            {/* Histórico de compra - apenas para usuários logados */}
            {isAuthenticated && anyPurchase?.data?.anyPurchase && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                {isLoadingAnyPurchase ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Package className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">Verificando histórico de compras...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Você comprou este produto pela última vez em{' '}
                      <span className="font-semibold">
                        {new Date(anyPurchase.data.anyPurchase.purchaseDate).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Features principais */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-skina-green">
                <Shield className="w-4 h-4" />
                <span>30 dias</span>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3">
              <Button 
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending || !sessionId}
                className="w-full bg-gradient-to-r from-skina-green to-green-500 hover:from-skina-green/90 hover:to-green-500/90 text-white font-semibold py-4 rounded-2xl text-lg"
              >
                {addToCartMutation.isPending ? 'Adicionando...' : 'Adicionar ao Carrinho'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBuyNow}
                disabled={addToCartMutation.isPending || !sessionId}
                className="w-full border-skina-blue text-skina-blue hover:bg-skina-blue/10 py-4 rounded-2xl"
              >
                {addToCartMutation.isPending ? 'Processando...' : 'Comprar Agora'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs com informações detalhadas */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="description">Descrição</TabsTrigger>
            <TabsTrigger value="specifications">Especificações</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensões</TabsTrigger>
            <TabsTrigger value="compatibility">Compatibilidade</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
              <h3 className="text-xl font-semibold text-skina-blue dark:text-skina-green mb-4">Descrição do Produto</h3>
              <p className="text-muted-foreground dark:text-gray-300 leading-relaxed">
                {productResponse.product.description}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
              <h3 className="text-xl font-semibold text-skina-blue dark:text-skina-green mb-4">Especificações Técnicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productResponse.product.specifications ? Object.entries(productResponse.product.specifications).map(([key, value], index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                    <span className="text-muted-foreground dark:text-gray-300">{key}:</span>
                    <span className="font-semibold text-skina-blue dark:text-skina-green">{String(value)}</span>
                  </div>
                )) : (
                  <p className="text-muted-foreground dark:text-gray-300">Nenhuma especificação disponível.</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dimensions" className="mt-6">
            <ProductDimensions 
              product={productResponse.product} 
              className="bg-white dark:bg-gray-800 border dark:border-gray-700" 
            />
          </TabsContent>

          <TabsContent value="compatibility" className="mt-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
              <h3 className="text-xl font-semibold text-skina-blue dark:text-skina-green mb-4">Veículos Compatíveis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {productResponse.product.compatibility && productResponse.product.compatibility.length > 0 ? productResponse.product.compatibility.map((vehicle, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-muted-foreground dark:text-gray-300">{vehicle}</span>
                  </div>
                )) : (
                  <p className="text-muted-foreground dark:text-gray-300">Nenhuma informação de compatibilidade disponível.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ProductDetail;
