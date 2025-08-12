import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MercadoLivreWelcomeCard = () => {
  const navigate = useNavigate();

  const handleViewOffers = () => {
    navigate('/produtos');
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-b from-yellow-400 to-yellow-200 border-none shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center max-w-md mx-auto">
      {/* Logo do Mercado Livre */}
      <div className="flex justify-center mb-6">
        <img
          src="/lovable-uploads/mercado-livre-87.png"
          alt="Mercado Livre"
          className="h-12 object-contain"
        />
      </div>

      {/* Texto de boas-vindas */}
      <div className="space-y-4 mb-6">
        {/* Ícone de mão acenando e primeira frase */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">👋</span>
          <p className="text-blue-600 font-medium text-lg">
            Chegou do Mercado Livre?
          </p>
        </div>

        {/* Frase de destaque */}
        <h2 className="text-blue-900 text-2xl font-bold leading-tight">
          Seja muito bem-vindo ao nosso site!
        </h2>

        {/* Texto complementar */}
        <p className="text-blue-600 text-base">
          Aqui você encontra os mesmos produtos com mais vantagens.
        </p>
      </div>

      {/* Ícones simples */}
      <div className="flex justify-center gap-4 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
          <Star className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Botão CTA */}
      <Button
        onClick={handleViewOffers}
        className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] text-base"
      >
        Ver Ofertas Exclusivas →
      </Button>
    </Card>
  );
};

export default MercadoLivreWelcomeCard;