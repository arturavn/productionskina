import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MercadoLivreWelcomeCard from './MercadoLivreWelcomeCard';
import { useSlides } from '@/hooks/useApi';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentBrandSlide, setCurrentBrandSlide] = useState(0);
  
  // Buscar slides da API
  const { data: slidesData, isLoading: slidesLoading } = useSlides();
  
  // Slides da API + slide especial do Mercado Livre
  const apiSlides = slidesData?.slides || [];
  const slides = [
    ...apiSlides.map(slide => ({
      title: slide.title,
      subtitle: slide.subtitle,
      cta: slide.ctaText,
      ctaLink: slide.ctaLink,
      background: slide.backgroundImage
    })),
    {
      type: "mercado-livre-card",
      title: "Card do Mercado Livre",
      subtitle: "Card especial de boas-vindas",
      cta: "Ver Ofertas",
      ctaLink: "/produtos",
      background: "linear-gradient(to bottom, #fbbf24, #fde68a)"
    }
  ];

  // Integração com API para marcas


  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [slides.length]);

  // Carrossel automático para marcas no mobile
  useEffect(() => {
    const brandTimer = setInterval(() => {
      setCurrentBrandSlide((prev) => (prev + 1) % 6); // 6 marcas total
    }, 3000);
    return () => clearInterval(brandTimer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative gradient-hero floating-elements">
      {/* Hero Banner */}
      <div className="relative h-[500px] overflow-hidden rounded-tl-3xl rounded-tr-3xl rounded-bl-2xl rounded-br-2xl mx-4 md:mx-8 mt-32 md:mt-28">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex items-center justify-center text-center transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={('type' in slide && slide.type === 'mercado-livre-card') 
              ? { background: slide.background }
              : {
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${slide.background})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }
            }
          >
            {('type' in slide && slide.type === 'mercado-livre-card') ? (
              <div className="max-w-md mx-auto">
                <MercadoLivreWelcomeCard />
              </div>
            ) : (
              <div className="text-white dark:text-white max-w-4xl px-6">
                <h2 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in text-white dark:text-white">
                  {slide.title}
                </h2>
                <p className="text-xl md:text-2xl mb-8 opacity-90 text-white dark:text-white">
                  {slide.subtitle}
                </p>
                <Button 
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 text-lg rounded-xl"
                  onClick={() => {
                    if ('ctaLink' in slide && slide.ctaLink) {
                      if (slide.ctaLink.startsWith('http')) {
                        window.open(slide.ctaLink, '_blank');
                      } else {
                        window.location.href = slide.ctaLink;
                      }
                    } else if (slide.cta === 'Saiba Mais') {
                      const whatsappNumber = '556133540877';
                      const message = 'Olá! Gostaria de saber mais sobre a entrega rápida em todo DF.';
                      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                      window.open(url, '_blank');
                    }
                  }}
                >
                  {slide.cta}
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-foreground hover:bg-background/20"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
        <Button
          variant="ghost"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary-foreground hover:bg-background/20"
          onClick={nextSlide}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-secondary' : 'bg-primary-foreground/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* Brand Logos */}
      <div className="container mx-auto px-4 mt-12">
        <h3 className="text-center text-2xl font-semibold mb-8 text-skina-dark dark:text-white">
          Trabalhamos com as Melhores Marcas
        </h3>
        
        {/* Desktop: Grid fixo */}
        <div className="hidden md:grid grid-cols-6 gap-6">
          {[
            {
              name: 'Chevrolet',
              logo: '/lovable-uploads/6a74cd15-9970-448e-bf76-b07ac524d3a2.png'
            },
            {
              name: 'Fiat',
              logo: '/lovable-uploads/f857c4a9-64a8-42bd-a633-5002d3e485ce.png'
            },
            {
              name: 'Mopar',
              logo: '/lovable-uploads/135bb7f7-4360-4b55-9c1f-add44a359a5a.png'
            },
            {
              name: 'VW',
              logo: '/lovable-uploads/de1a3a69-7f40-4318-b1fa-b8fe9ba24421.png'
            },
            {
              name: 'RAM',
              logo: '/lovable-uploads/e6064578-00a0-4e72-b76d-c08dfcbc3f58.png'
            },
            {
              name: 'Jeep',
              logo: '/lovable-uploads/25989ba3-557d-41ff-b96c-fb1b7a826c19.png'
            }
          ].map((brand) => (
            <div
              key={brand.name}
              className="bg-card dark:bg-gray-800 rounded-lg p-4 text-center hover:shadow-lg dark:hover:shadow-2xl transition-shadow card-hover cursor-pointer flex items-center justify-center h-20"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-12 max-w-full object-contain"
              />
            </div>
          ))}
        </div>

        {/* Mobile: Carrossel */}
        <div className="md:hidden relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentBrandSlide * 100}%)` }}
          >
            {[
              {
                name: 'Chevrolet',
                logo: '/lovable-uploads/6a74cd15-9970-448e-bf76-b07ac524d3a2.png'
              },
              {
                name: 'Fiat',
                logo: '/lovable-uploads/f857c4a9-64a8-42bd-a633-5002d3e485ce.png'
              },
              {
                name: 'Mopar',
                logo: '/lovable-uploads/135bb7f7-4360-4b55-9c1f-add44a359a5a.png'
              },
              {
                name: 'VW',
                logo: '/lovable-uploads/de1a3a69-7f40-4318-b1fa-b8fe9ba24421.png'
              },
              {
                name: 'RAM',
                logo: '/lovable-uploads/e6064578-00a0-4e72-b76d-c08dfcbc3f58.png'
              },
              {
                name: 'Jeep',
                logo: '/lovable-uploads/25989ba3-557d-41ff-b96c-fb1b7a826c19.png'
              }
            ].map((brand, index) => (
              <div
                key={brand.name}
                className="w-full flex-shrink-0 px-2"
              >
                <div className="bg-card dark:bg-gray-800 rounded-lg p-4 text-center hover:shadow-lg dark:hover:shadow-2xl transition-shadow card-hover cursor-pointer flex items-center justify-center h-20">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-12 max-w-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Indicadores do carrossel */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentBrandSlide ? 'bg-skina-primary' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentBrandSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
