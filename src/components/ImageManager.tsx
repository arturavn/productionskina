import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useProductImages } from '@/hooks/useApi';
import { api } from '@/services/api';
import { Loader2, Upload, Star, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageManagerProps {
  productId: string;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadImages: () => void;
  onSetPrimary: (imageId: string) => void;
  onDeleteImage: (imageId: string) => void;
  editingImages: File[];
  onRemoveEditingImage: (index: number) => void;
  uploadMutation: any;
  setPrimaryMutation: any;
  deleteMutation: any;
}

const ImageManager: React.FC<ImageManagerProps> = ({
  productId,
  onImageUpload,
  onUploadImages,
  onSetPrimary,
  onDeleteImage,
  editingImages,
  onRemoveEditingImage,
  uploadMutation,
  setPrimaryMutation,
  deleteMutation
}) => {
  const { data: imagesData, isLoading: imagesLoading, error: imagesError } = useProductImages(productId);
  
  const [imageUrls, setImageUrls] = React.useState<{ [key: string]: string }>({});
  
  // Carregar URLs das imagens quando os dados chegarem
  React.useEffect(() => {
    if (imagesData?.images) {
      const loadImageUrls = async () => {
        const urls: { [key: string]: string } = {};
        
        for (const image of imagesData.images) {
          try {
            const blob = await api.getImageData(image.id);
            const url = URL.createObjectURL(blob);
            urls[image.id] = url;
          } catch (error) {
            console.error(`Erro ao carregar imagem ${image.id}:`, error);
          }
        }
        
        setImageUrls(urls);
      };
      
      loadImageUrls();
    }
    
    // Cleanup URLs quando o componente for desmontado
    return () => {
      Object.values(imageUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imagesData]);
  
  if (imagesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-muted-foreground">Carregando imagens...</span>
      </div>
    );
  }
  
  if (imagesError) {
    return (
      <div className="text-center py-8 text-red-600">
        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Erro ao carregar imagens</p>
        <p className="text-sm">Tente recarregar a página</p>
      </div>
    );
  }
  
  const existingImages = imagesData?.images || [];
  
  return (
    <div className="space-y-6">
      {/* Upload de novas imagens */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="image-upload">Adicionar Novas Imagens</Label>
          <Input
            id="image-upload"
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.svg,image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            multiple
            onChange={onImageUpload}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Selecione uma ou mais imagens (JPEG, PNG, GIF, WebP, SVG).
          </p>
        </div>
        
        {/* Visualização das imagens selecionadas para upload */}
        {editingImages.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Imagens Selecionadas ({editingImages.length})</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              {editingImages.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveEditingImage(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-center mt-1 truncate">
                    {image.name}
                  </p>
                </div>
              ))}
            </div>
            
            <Button
              type="button"
              onClick={onUploadImages}
              disabled={uploadMutation.isPending}
              className="mt-4 w-full"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Fazendo Upload...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Fazer Upload das Imagens
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Imagens existentes */}
      <div>
        <Label className="text-lg font-medium">Imagens do Produto ({existingImages.length})</Label>
        
        {existingImages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma imagem encontrada</p>
            <p className="text-sm">Adicione imagens para este produto</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {existingImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {imageUrls[image.id] ? (
                    <img
                      src={imageUrls[image.id]}
                      alt={image.imageName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Badge de imagem principal */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Principal
                  </div>
                )}
                
                {/* Botões de ação */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!image.isPrimary && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onSetPrimary(image.id)}
                      disabled={setPrimaryMutation.isPending}
                      title="Definir como principal"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteImage(image.id)}
                    disabled={deleteMutation.isPending}
                    title="Excluir imagem"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-2">
                  <p className="text-xs text-center truncate">
                    {image.imageName}
                  </p>
                  <p className="text-xs text-center text-muted-foreground">
                    {(image.imageSize / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageManager;