
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock, Phone } from 'lucide-react';
import { useLogin, useRegister, useAuth } from '@/hooks/useApi';
import { api } from '@/services/api';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados para o formulário de login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Estados para o formulário de cadastro
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Estados para reset de senha
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);
  
  // Hooks de login, cadastro e autenticação
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirecionar se já estiver autenticado
  // Redirecionamento removido - agora é feito nos hooks useLogin/useRegister
  
  // Função para lidar com o submit do login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      loginMutation.mutate({ email: loginEmail, password: loginPassword });
    }
  };

  // Função para lidar com o submit do cadastro
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    if (registerPassword !== registerConfirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }
    
    if (registerPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (!acceptTerms) {
      alert('Você deve aceitar os termos de uso e política de privacidade.');
      return;
    }
    
    // Dados do usuário
    const userData = {
      name: registerName,
      email: registerEmail,
      password: registerPassword,
      phone: registerPhone || undefined
    };
    
    registerMutation.mutate(userData);
  };
  
  // Função para lidar com o envio do email de reset de senha
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      toast.error('Por favor, insira seu e-mail.');
      return;
    }

    setIsSubmittingForgotPassword(true);
    
    try {
      await api.forgotPassword(forgotPasswordEmail);
      toast.success('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
      setIsForgotPasswordOpen(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar e-mail de redefinição.');
    } finally {
      setIsSubmittingForgotPassword(false);
    }
  };

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

        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-skina-blue">
                Acesse sua conta
              </CardTitle>
              <p className="text-gray-600">
                Entre ou crie sua conta para continuar
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
                </TabsList>

                {/* Tab de Login */}
                <TabsContent value="login" className="space-y-4 mt-6">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Sua senha"
                          className="pl-10 pr-10"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-gray-600">Lembrar de mim</span>
                      </label>
                      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-skina-blue">
                            Esqueci minha senha
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-center text-skina-blue">
                              Redefinir Senha
                            </DialogTitle>
                            <DialogDescription>
                              Digite seu e-mail para receber as instruções de redefinição de senha.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="forgot-email">E-mail</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="forgot-email"
                                  type="email"
                                  placeholder="Digite seu e-mail cadastrado"
                                  className="pl-10"
                                  value={forgotPasswordEmail}
                                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              Enviaremos um link para redefinição de senha no seu e-mail.
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  setIsForgotPasswordOpen(false);
                                  setForgotPasswordEmail('');
                                }}
                                disabled={isSubmittingForgotPassword}
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                className="flex-1 bg-skina-blue hover:bg-skina-blue/90"
                                disabled={isSubmittingForgotPassword}
                              >
                                {isSubmittingForgotPassword ? 'Enviando...' : 'Enviar'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-skina-blue to-blue-600 hover:from-skina-blue/90 hover:to-blue-600/90 text-white font-semibold py-3 rounded-2xl"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>

                  <div className="text-center text-sm text-gray-600">
                    Não tem uma conta?{' '}
                    <Button variant="link" className="p-0 h-auto text-skina-blue">
                      Cadastre-se
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab de Cadastro */}
                <TabsContent value="register" className="space-y-4 mt-6">
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nome completo *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Seu nome completo"
                          className="pl-10"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">E-mail *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Telefone (opcional)</Label>
                      <div className="relative">
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          className="pl-4"
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Crie uma senha (mín. 6 caracteres)"
                          className="pl-10 pr-10"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">Confirmar senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua senha"
                          className="pl-10 pr-10"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600">
                      <label className="flex items-start space-x-2">
                        <input 
                          type="checkbox" 
                          className="rounded mt-0.5" 
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          required
                        />
                        <span>
                          Eu aceito os{' '}
                          <Button variant="link" className="p-0 h-auto text-skina-blue text-xs">
                            Termos de Uso
                          </Button>{' '}
                          e{' '}
                          <Button variant="link" className="p-0 h-auto text-skina-blue text-xs">
                            Política de Privacidade
                          </Button>
                        </span>
                      </label>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-skina-green to-green-500 hover:from-skina-green/90 hover:to-green-500/90 text-white font-semibold py-3 rounded-2xl"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? 'Criando conta...' : 'Criar Conta'}
                    </Button>
                  </form>

                  <div className="text-center text-sm text-gray-600">
                    Já tem uma conta?{' '}
                    <Button variant="link" className="p-0 h-auto text-skina-blue">
                      Faça login
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
