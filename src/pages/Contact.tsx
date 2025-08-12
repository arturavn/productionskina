
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-32 lg:pt-36">
        {/* Header da página */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg px-4 md:px-6 py-8 md:py-12 shadow-sm border dark:border-gray-700">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 md:mb-6">
              Contato
            </h1>
            <div className="w-16 h-1 bg-skina-green mb-4 md:mb-6"></div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Entre em contato conosco para dúvidas, orçamentos ou qualquer informação sobre nossos produtos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações de contato */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-skina-blue mb-6">Informações de Contato</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-skina-green/10 p-2 rounded-full">
                    <Phone className="h-5 w-5 text-skina-green" />
                  </div>
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-muted-foreground">(61) 99850-1771</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-skina-green/10 p-2 rounded-full">
                    <Mail className="h-5 w-5 text-skina-green" />
                  </div>
                  <div>
                    <p className="font-medium">E-mail</p>
                    <p className="text-muted-foreground">skinapecas@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-skina-green/10 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-skina-green" />
                  </div>
                  <div>
                    <p className="font-medium">Endereço</p>
                    <p className="text-muted-foreground">SHN Área Especial, 170<br />Taguatinga Norte, Brasília - DF<br />72130-721</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-skina-green/10 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-skina-green" />
                  </div>
                  <div>
                    <p className="font-medium">Horário de Funcionamento</p>
                    <p className="text-muted-foreground">
                      Segunda a Sexta: 8h às 18h<br />
                      Sábado: 8h às 12h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de contato */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-skina-blue mb-6">Envie sua Mensagem</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Nome</label>
                  <Input id="name" type="text" placeholder="Seu nome" required />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">E-mail</label>
                  <Input id="email" type="email" placeholder="seu@email.com" required />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">Telefone</label>
                <Input id="phone" type="tel" placeholder="(11) 99999-9999" />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">Assunto</label>
                <Input id="subject" type="text" placeholder="Assunto da mensagem" required />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">Mensagem</label>
                <Textarea 
                  id="message" 
                  placeholder="Digite sua mensagem..." 
                  className="min-h-[120px]"
                  required 
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-skina-green to-green-500 hover:from-skina-green/90 hover:to-green-500/90 text-white font-semibold py-3 rounded-xl text-base transition-all duration-300 hover:shadow-lg"
              >
                Enviar Mensagem
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Contact;
