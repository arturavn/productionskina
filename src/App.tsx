import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Category from "./pages/Category";
import Contact from "./pages/Contact";
import AllProducts from "./pages/AllProducts";
import ProductDetail from "./pages/ProductDetail";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import ShippingTest from "./pages/ShippingTest";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import CheckoutPending from "./pages/CheckoutPending";
import ProtectedRoute from "./components/ProtectedRoute";
import Orders from "./pages/Orders";

import MercadoLivrePage from "./app/admin/mercado-livre/page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Não tentar novamente se for erro de autenticação
        if (error && typeof error === 'object' && 'response' in error && 
            error.response && typeof error.response === 'object' && 
            'status' in error.response && error.response.status === 401) {
          console.error('🚨 Erro de autenticação detectado:', error);
          return false;
        }
        return failureCount < 3;
      }
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* SEO-friendly URLs with keywords */}
            <Route path="/categoria/:categoryName" element={<Category />} />
            <Route path="/pecas/:categoryName" element={<Category />} />
            <Route path="/autopecas/:categoryName" element={<Category />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/produtos" element={<AllProducts />} />
            <Route path="/pecas" element={<AllProducts />} />
            <Route path="/autopecas" element={<AllProducts />} />
            <Route path="/produto/:productSlug" element={<ProductDetail />} />
            <Route path="/peca/:productSlug" element={<ProductDetail />} />
            <Route path="/autopeca/:productSlug" element={<ProductDetail />} />
            <Route path="/busca" element={<SearchResults />} />
            <Route path="/buscar-pecas" element={<SearchResults />} />
            <Route path="/carrinho" element={<Cart />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/mercado-livre" element={
              <ProtectedRoute requireAdmin={true}>
                <MercadoLivrePage />
              </ProtectedRoute>
            } />
            <Route path="/shipping-test" element={<ShippingTest />} />

            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failure" element={<PaymentFailure />} />
            <Route path="/payment-pending" element={<CheckoutPending />} />
            <Route path="/checkout/pending" element={<CheckoutPending />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
