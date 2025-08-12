
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Shield, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useProductImages, useAddToCart, useCartSession } from '@/hooks/useApi';
import { toast } from 'sonner';

interface ProductCardProps {
  id: string;
  name: string;
  originalPrice?: number;
  discountPrice?: number;
  original_price?: number;
  discount_price?: number;
  image?: string;
  imageUrl?: string;
  brand: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  originalPrice,
  discountPrice,
  original_price,
  discount_price,
  image,
  imageUrl,
  brand
}) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Hooks do carrinho
  const { sessionId } = useCartSession();
  const addToCartMutation = useAddToCart();
  
  // Buscar imagens do produto
  const { data: productImagesData } = useProductImages(id);
  
  // Normalizar os dados de preço
  const normalizedOriginalPrice = Number(originalPrice || original_price || 0);
  const normalizedDiscountPrice = Number(discountPrice || discount_price || 0) || normalizedOriginalPrice;
  const normalizedImage = image || imageUrl || '/placeholder.svg';
  
  // Preparar lista de imagens
  const productImages = productImagesData?.images || [];
  const allImages = [
    normalizedImage,
    ...productImages.map(img => `http://localhost:3001/api/products/images/${img.id}`)
  ].filter((img, index, self) => self.indexOf(img) === index);
  
  // Reset do índice quando mudar de produto
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id]);
  
  const discountPercentage = normalizedOriginalPrice > 0 
    ? Math.round(((normalizedOriginalPrice - normalizedDiscountPrice) / normalizedOriginalPrice) * 100)
    : 0;

  const handleViewDetails = () => {
    navigate(`/produto/${id}`);
  };
  
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!sessionId) {
      toast.error('Erro ao conectar com o carrinho. Tente novamente.');
      return;
    }

    setIsAddingToCart(true);
    
    try {
      await addToCartMutation.mutateAsync({
        sessionId,
        productId: id,
        quantity: 1
      });
      
      // Animação de sucesso
      toast.success('Produto adicionado ao carrinho!', {
        icon: '🛒',
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho. Tente novamente.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div 
      className="group bg-white dark:bg-gray-800 gradient-card-dynamic border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 overflow-hidden p-6 hover:-translate-y-2 relative cursor-pointer h-[620px] flex flex-col w-full"
      onClick={handleViewDetails}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Discount Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-skina-green to-green-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
            -{discountPercentage}%
          </div>
        </div>
      )}

      {/* Product Image with Carousel */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-700">
        <img
          src={allImages[currentImageIndex] || normalizedImage}
          alt={name}
          className="w-full aspect-square object-contain object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Navigation Buttons - Only show if multiple images and hovered */}
        {allImages.length > 1 && isHovered && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-skina-blue dark:text-skina-blue rounded-full p-1 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-skina-blue dark:text-skina-blue rounded-full p-1 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        
        {/* Image Indicators - Only show if multiple images */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  currentImageIndex === index 
                    ? 'bg-white' 
                    : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-4 flex-grow flex flex-col">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-skina-blue dark:text-skina-blue border-skina-blue/20 dark:border-skina-blue/30 bg-skina-blue/5 dark:bg-skina-blue/10">
            {brand}
          </Badge>
        </div>

        {/* Product Name */}
        <h3 className="text-skina-blue dark:text-white font-semibold text-lg leading-tight line-clamp-2 min-h-[3.5rem]">
          {name}
        </h3>

        {/* Pricing */}
        <div className="space-y-2">
          {normalizedOriginalPrice > normalizedDiscountPrice && (
            <div className="text-gray-400 dark:text-gray-500 line-through text-base">
              R$ {normalizedOriginalPrice.toFixed(2).replace('.', ',')}
            </div>
          )}
          <div className="text-skina-green dark:text-skina-green text-2xl font-bold">
            R$ {normalizedDiscountPrice.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
           
            <Shield className="w-3 h-3" />
          </div>
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 py-2">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Garantia</span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button 
          className="w-full bg-gradient-to-r from-skina-green to-green-500 hover:from-skina-green/90 hover:to-green-500/90 text-white font-semibold py-3 rounded-2xl text-base transition-all duration-300 hover:shadow-lg group-hover:scale-[1.02] mt-auto pulse-glow shimmer"
          onClick={handleAddToCart}
          disabled={isAddingToCart}
        >
          {isAddingToCart ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Adicionando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Adicionar ao Carrinho
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
