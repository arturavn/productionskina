
import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import ThemeToggle from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCategories, useCart, useCartSession, useAuth, useLogout } from '@/hooks/useApi';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Integração com API para categorias
  const { data: categoriesData } = useCategories();
  const apiCategories = categoriesData?.categories || [];

  // Filtrar apenas as categorias que correspondem ao painel administrativo
  const adminCategoryNames = ['motores', 'suspensao', 'freios', 'acessorios', 'transmissao', 'farois-eletrica'];
  const filteredCategories = apiCategories.filter(cat => adminCategoryNames.includes(cat.name));

  // Mapeamento dos nomes das categorias para nomes de exibição
  const categoryDisplayNames: Record<string, string> = {
    'motores': 'Motores',
    'suspensao': 'Suspensão',
    'freios': 'Freios',
    'acessorios': 'Acessórios',
    'transmissao': 'Transmissão',
    'farois-eletrica': 'Faróis e Elétrica'
  };

  // Categorias com nomes de exibição e slugs
  const categories = filteredCategories.map(category => ({
    ...category,
    displayName: categoryDisplayNames[category.name] || category.name,
    slug: category.name
  }));

  // Integração com API do carrinho - não fazer requisição automática
  const { sessionId } = useCartSession();
  // Não usar useCart aqui para evitar requisições automáticas
  // O contador será atualizado quando necessário via invalidateQueries
  const [cartCount, setCartCount] = useState(0);
  
  // Atualizar contador do carrinho do localStorage quando disponível
  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('cart_items_count');
      if (savedCart) {
        setCartCount(parseInt(savedCart, 10) || 0);
      }
    };
    
    updateCartCount();
    
    // Escutar mudanças no localStorage
    window.addEventListener('storage', updateCartCount);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  // Integração com autenticação
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/categoria/${categorySlug}`);
    window.scrollTo(0, 0);
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    navigate('/');
    window.scrollTo(0, 0);
  };

  const handleCartClick = () => {
    navigate('/carrinho');
    window.scrollTo(0, 0);
  };



  const handleAuthClick = () => {
    navigate('/auth');
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        navigate('/');
        window.scrollTo(0, 0);
      }
    });
  };

  const handleProfileClick = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white dark:gradient-hero shadow-xl' : 'bg-white dark:gradient-hero'
    } border-b border-gray-200 dark:border-gray-700`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <button 
              onClick={handleLogoClick}
              className="transition-transform duration-300 hover:scale-105"
            >
              <img 
                src="/lovable-uploads/8a0fe179-938f-4738-9857-d6aee154845b.png" 
                alt="Skina Ecopeças" 
                className="h-8 w-auto md:h-10 transition-all duration-300"
                onError={(e) => {
                  console.error('Erro ao carregar logo:', e);
                  // Fallback para texto se a imagem não carregar
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.innerHTML = '<div class="text-xl md:text-2xl skina-logo-style"><span class="skina-part">SKINA</span> <span class="ecopecas-part">ECOPEÇAS</span></div>';
                  target.parentNode?.appendChild(fallback);
                }}
                onLoad={() => console.log('Logo carregado com sucesso')}
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 ml-12">
            <Link 
              to="/" 
              onClick={() => window.scrollTo(0, 0)}
              className="relative text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue transition-all duration-300 font-medium group"
            >
              Início
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-skina-blue transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <Link 
              to="/produtos" 
              onClick={() => window.scrollTo(0, 0)}
              className="relative text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue transition-all duration-300 font-medium group"
            >
              Produtos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-skina-blue transition-all duration-300 group-hover:w-full"></span>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue transition-all duration-300 font-medium group">
                  Categorias
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl">
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => handleCategoryClick(category.slug)}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer rounded-lg mx-2 my-1"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-300">{category.displayName}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link 
              to="/contato" 
              onClick={() => window.scrollTo(0, 0)}
              className="relative text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue transition-all duration-300 font-medium group"
            >
              Contato
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-skina-blue transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <SearchBar />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User Menu - Hidden on mobile */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="hidden lg:flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue hover:bg-skina-light-blue dark:hover:bg-skina-light-blue rounded-full px-4 py-2 transition-all duration-300 font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{user.name?.split(' ')[0] || 'Perfil'}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl">
                  <DropdownMenuItem
                    onClick={() => handleProfileClick('/perfil')}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer rounded-lg mx-2 my-1"
                  >
                    <User className="h-4 w-4 mr-3" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Minha Conta</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleProfileClick('/pedidos')}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer rounded-lg mx-2 my-1"
                  >
                    <ShoppingCart className="h-4 w-4 mr-3" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Meus Pedidos</span>
                  </DropdownMenuItem>
                  {(user.role === 'admin' || user.role === 'colaborador') && (
                    <DropdownMenuItem
                      onClick={() => handleProfileClick('/admin')}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer rounded-lg mx-2 my-1"
                    >
                      <Shield className="h-4 w-4 mr-3" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">Painel Admin</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 cursor-pointer rounded-lg mx-2 my-1 text-red-600 dark:text-red-400"
                  >
                    <span className="font-medium">Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                onClick={handleAuthClick}
                className="hidden lg:flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue hover:bg-skina-light-blue dark:hover:bg-skina-light-blue rounded-full px-4 py-2 transition-all duration-300 font-medium"
              >
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Entrar</span>
              </Button>
            )
            }
            
            {/* Cart Button */}
            <Button 
              variant="ghost" 
              onClick={handleCartClick}
              className="relative flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue hover:bg-skina-light-blue dark:hover:bg-skina-light-blue rounded-full px-3 md:px-4 py-2 transition-all duration-300 hover:scale-105 font-medium"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">Carrinho</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-skina-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse shadow-lg">
                  {cartCount}
                </span>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              className="lg:hidden rounded-full p-2 transition-all duration-300 hover:bg-skina-light-blue dark:hover:bg-skina-light-blue text-gray-700 dark:text-gray-300" 
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 transition-transform duration-300" />
              ) : (
                <Menu className="h-6 w-6 transition-transform duration-300" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search - Always visible on mobile */}
        <div className="md:hidden pb-4">
          <SearchBar />
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-40" onClick={toggleMenu}>
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-xl animate-slide-in">
              <div className="container mx-auto px-4 py-6 space-y-6">
                <Link 
                  to="/" 
                  onClick={() => {
                    window.scrollTo(0, 0);
                    toggleMenu();
                  }}
                  className="block text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue transition-colors duration-300 py-2"
                >
                  Início
                </Link>

                <Link 
                  to="/produtos" 
                  onClick={() => {
                    window.scrollTo(0, 0);
                    toggleMenu();
                  }}
                  className="block text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue transition-colors duration-300 py-2"
                >
                  Produtos
                </Link>
                
                <div className="space-y-3">
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300 py-2">Categorias</div>
                  <div className="pl-4 space-y-3">
                    {categories.map((category) => (
                      <button 
                        key={category.id}
                        onClick={() => handleCategoryClick(category.slug)}
                        className="block text-gray-600 dark:text-gray-400 hover:text-skina-blue dark:hover:text-skina-blue transition-colors duration-300 py-1 text-left w-full"
                      >
                        {category.displayName}
                      </button>
                    ))}
                  </div>
                </div>
                
                <Link 
                  to="/contato" 
                  onClick={() => {
                    window.scrollTo(0, 0);
                    toggleMenu();
                  }}
                  className="block text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue transition-colors duration-300 py-2"
                >
                  Contato
                </Link>
                
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    handleCartClick();
                    toggleMenu();
                  }}
                  className="relative w-full justify-start text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue hover:bg-skina-light-blue dark:hover:bg-skina-light-blue rounded-xl py-3 transition-all duration-300 font-medium"
                >
                  <ShoppingCart className="h-4 w-4 mr-3" />
                  <span className="text-lg">Carrinho</span>
                  {cartCount > 0 && (
                    <span className="absolute right-3 bg-skina-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg">
                      {cartCount}
                    </span>
                  )}
                </Button>
                
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <Button 
                       variant="ghost" 
                       onClick={() => {
                         handleProfileClick('/perfil');
                         toggleMenu();
                       }}
                       className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue hover:bg-skina-light-blue dark:hover:bg-skina-light-blue rounded-xl py-3 transition-all duration-300 font-medium"
                     >
                       <User className="h-4 w-4 mr-3" />
                       <span className="text-lg">Minha Conta</span>
                     </Button>
                     
                     <Button 
                       variant="ghost" 
                       onClick={() => {
                         handleProfileClick('/pedidos');
                         toggleMenu();
                       }}
                       className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue hover:bg-skina-light-blue dark:hover:bg-skina-light-blue rounded-xl py-3 transition-all duration-300 font-medium"
                     >
                       <ShoppingCart className="h-4 w-4 mr-3" />
                       <span className="text-lg">Meus Pedidos</span>
                     </Button>
                     
                     {(user.role === 'admin' || user.role === 'colaborador') && (
                       <Button 
                         variant="ghost" 
                         onClick={() => {
                           handleProfileClick('/admin');
                           toggleMenu();
                         }}
                         className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue hover:bg-skina-light-blue dark:hover:bg-skina-light-blue rounded-xl py-3 transition-all duration-300 font-medium"
                       >
                         <Shield className="h-4 w-4 mr-3" />
                         <span className="text-lg">Painel Admin</span>
                       </Button>
                     )}
                    
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        handleLogout();
                        toggleMenu();
                      }}
                      className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl py-3 transition-all duration-300 font-medium"
                    >
                      <span className="text-lg">Sair</span>
                    </Button>
                  </div>
                ) : (
                  <Button 
                     variant="ghost" 
                     onClick={() => {
                       handleAuthClick();
                       toggleMenu();
                     }}
                     className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-skina-blue dark:hover:text-skina-blue hover:bg-skina-light-blue dark:hover:bg-skina-light-blue rounded-xl py-3 transition-all duration-300 font-medium"
                   >
                     <User className="h-4 w-4 mr-3" />
                     <span className="text-lg">Entrar</span>
                   </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
