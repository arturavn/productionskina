
import React from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  
  return (
    <footer className="bg-skina-dark gradient-hero floating-elements text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-montserrat">
              <span className="text-white">SKINA</span> <span className="text-skina-green">ECOPEÇAS</span>
            </h3>
            <p className="text-gray-300 mb-4">
              Sua loja de confiança para autopeças originais com os melhores preços e qualidade garantida.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 text-gray-300 hover:text-skina-green cursor-pointer transition-colors" />
              <Instagram className="h-6 w-6 text-gray-300 hover:text-skina-green cursor-pointer transition-colors" />
              <Youtube className="h-6 w-6 text-gray-300 hover:text-skina-green cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-skina-green" />
                <span className="text-gray-300">(61) 99850-1771</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-skina-green" />
                <span className="text-gray-300">contato@skinaecopecas.com.br</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-skina-green" />
                <span className="text-gray-300">SHN, Area Especial 162 Área Especial<br />Taguatinga norte, Brasília - DF<br />72130-721</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-skina-green" />
                <span className="text-gray-300">Seg-Sex: 8h às 18h<br />Sáb: 8h às 12h</span>
              </div>
            </div>
          </div>



          {/* Payment Methods */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Formas de Pagamento</h4>
            <div className="flex justify-start mb-6">
              <img 
                src="/lovable-uploads/mercado-pago-logo__05862_zoom.png" 
                alt="Mercado Pago" 
                className="h-32 w-auto object-contain"
                title="Pagamento via Mercado Pago"
              />
            </div>

          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm font-montserrat">
               © 2024 Skina Ecopeças. Todos os direitos reservados.
             </p>
            <p className="text-gray-300 text-sm mt-2 md:mt-0">
              CNPJ: 29.643.260/0001-67
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
