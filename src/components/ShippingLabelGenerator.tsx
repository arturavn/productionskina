import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Download } from 'lucide-react';

interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerLastName?: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  total: number;
  createdAt: string;
}

const useShippingLabelGenerator = () => {
  
  // Funções auxiliares removidas - não necessárias para comandos ZPL

  const generateShippingLabelForOrder = async (orderData: OrderData) => {
    try {
      // Gerar comandos ZPL para impressora térmica
      let zplCommands = '';
      
      // Comandos de inicialização ZPL
      zplCommands += '^XA\n'; // Início do formato
      zplCommands += '^MCY\n'; // Configuração de mídia
      zplCommands += '^CI28\n'; // Codificação UTF-8
      zplCommands += '^LH30,20\n'; // Posição inicial ajustada para a direita
      
      // Logo da empresa (ZPL gráfico fornecido)
      zplCommands += '^FO100,40^GFA,1584,1584,24,,gY018,M0EgQ03,L0FgR02E,K079FFgP065,L0FB7CgO0D3C,J01BD02FgO0A87,J0E680078gM01969C,I01CCI01CK0648Y015157,I0318J0EK02FFEX014D49C,I0E7K06K06FE9X01A4AA7,001A6K03gM01K5C,0018C001F818gL0152IA7,0021800FBF08gL034AJ58,0013003D0388K04g02LAE,003600680044gL03M5,00E400DI024gL02LAB80018C01AI01gM01552IA9400318034J02gL01AADJ5600690068J02gL01556JAB007340DK02gL01IAK500D201AgS0AAB2JA80C68180LFE3FC003FFC7F83EJ0FEJ03AA9CIABC1840347LFC3FC007FF0FF07FJ0FEJ07I5635544105039MF83FC01FFE0FF0FF8001FEJ0FIAB0AABA048063FB6B5AD03B403F680ED0F7C001EEI01FDI5C354A2CA077DKFE03FC07DF00FF0FDE001F8I03DDI561AB61820D7FB5DB7407BC1FF800F71DFF001DCI07F6IAB8D553900C76FF7FD807E83ED800FD1F6F801FCI0F7FIADC6AB6940EFDM06F87FA001D61DFBC01D4001FDBD5B5635560418D7M07A9F5C001FE1F5DE03BC001D6EEJA1B57041CFBM06FBDBI01AA1AEB703E8003BAD5IAB1AA52014D7JFC007576CI01DE3BB6D83580076C7B5AD70D77281CDADJFC0DADA8I01AA355B6C36800DA86DE6A98D9C28346AAI8AF0D5ABJ036836955E35801D503541B68D6A28303MF0JF8I03FC3F8FF77F803FE03FF05B86B808381EEF7F778F6DBCI03BC3B877F7B807B601DB02A86DA082800FBEBDF8IFEEI03EC3E83DBEE00FFC01FF81A86AA0838L07B9DA6FFI03FC7B81JF01ED800EF80DC6C60828L07E9FE3BB8003B47F80EDB703FFI0FBC06C6A60838L0779EE1EFE007F877007FFD03B6I07EC07076E082C3MF9FA0IF007687D003B6F07FC3FFEFE0285AA08347KFED1BE076F807F877001FFE0FB07IFB6038ECA081CLFBF1EE03FBC07787FI0EDA1EF0IFBFF038D4B0C15F6D6B5F63FC01DFE07D8FBI07FE3FD1F6DEDF028EC70C1FDKFBC3B400FB70F78EEI03B67B63DFF7F7830D850C15FB6DDBF03FC007FF8FF0FEI01FCFFC7FB7EDD831A870C0DBIF7E803DC0036FCED0F6J0E9ED8F6FDBFFC21F05060DgY06340206068gX043A028703C001gV06C00C302E002gV0F,0C380BC1C4gT01D,0E1806FF09FF81FE07F00FF07FF03FC03801FF8K01A,060C01A8134906901A5C1A585240D200680349L03C,070EJ062240D483524312C4901A900CC0624L0F,0387J083001800600A00146003I01A405M01C,0183C00302FE1400500A00345FC2I011605FF08I078,00C0F83C024A140050087FC84486I030A022502001E,00703FF003001400501C5250C00380060BI0280IF,0018K05FF17FC5FE04I0BFE2FF8CF507FD,I06K0424089022507I092411210A98D25,J0CR05,gN03,gN02,gN02,^FS\n';
      
      // Cabeçalho com informações do pedido centralizadas
      zplCommands += '^FO300,40^A0N,32,32^FDPEDIDO:^FS\n';
      zplCommands += `^FO300,75^A0N,28,28^FDN: ${orderData.orderNumber}^FS\n`;
      zplCommands += `^FO300,105^A0N,26,26^FDData: ${new Date(orderData.createdAt).toLocaleDateString('pt-BR')}^FS\n`;
      
      // Linha separadora do cabeçalho
      zplCommands += '^FO40,140^GB700,0,3^FS\n';
      
      // REMETENTE
      zplCommands += '^FO50,160^A0N,28,28^FDREMETENTE:^FS\n';
      zplCommands += '^FO50,190^A0N,26,26^FDRodrigues Auto Pecas LTDA^FS\n';
      zplCommands += '^FO50,220^A0N,24,24^FDCNPJ: 29.643.260/0001-67^FS\n';
      zplCommands += '^FO50,250^A0N,24,24^FDSHN, Area Especial 162^FS\n';
      zplCommands += '^FO50,280^A0N,24,24^FDArea Especial - Taguatinga Norte^FS\n';
      zplCommands += '^FO50,310^A0N,24,24^FDBrasilia - DF, 72130-721^FS\n';
      zplCommands += '^FO50,340^A0N,24,24^FDTel: (61) 3333-4444^FS\n';
      zplCommands += '^FO50,370^A0N,24,24^FDEmail: contato@rodriguesautopecas.com.br^FS\n';
      
      // Dados do destinatario com espaçamento melhorado
      zplCommands += '^FO50,420^A0N,28,28^FDDESTINATARIO:^FS\n';
      
      // Usar dados do usuário se disponível, senão usar dados do pedido
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const customerName = userData.name || orderData.customerName;
      const customerCpf = userData.cpf;
      const customerPhone = userData.phone || orderData.customerPhone;
      
      // Se customerName contem lastName duplicado, usar apenas o nome do usuario
      const fullName = customerName || `${orderData.customerName} ${orderData.customerLastName || ''}`.trim();
      // Remover acentos do nome
      const cleanName = fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      zplCommands += `^FO50,450^A0N,26,26^FH^FB600,2,0,L^FD${cleanName}^FS\n`;
      
      if (customerCpf) {
        zplCommands += `^FO50,480^A0N,24,24^FDCPF: ${customerCpf}^FS\n`;
      }
      
      if (customerPhone) {
        zplCommands += `^FO50,510^A0N,24,24^FDTel: ${customerPhone}^FS\n`;
      }
      
      // Endereco de entrega
      const address = orderData.shippingAddress;
      // Remover acentos do endereco
      const cleanStreet = address.street.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cleanNeighborhood = address.neighborhood.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cleanCity = address.city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cleanComplement = address.complement ? address.complement.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
      
      zplCommands += `^FO50,550^A0N,24,24^FH^FB600,2,0,L^FDEndereco: ${cleanStreet}, ${address.number}^FS\n`;
      if (address.complement) {
        zplCommands += `^FO50,580^A0N,24,24^FH^FB600,2,0,L^FD${cleanComplement}^FS\n`;
      }
      zplCommands += `^FO50,610^A0N,24,24^FD${cleanNeighborhood}^FS\n`;
      zplCommands += `^FO50,640^A0N,24,24^FD${cleanCity} - ${address.state}^FS\n`;
      zplCommands += `^FO50,670^A0N,26,26^FDCEP: ${address.zipCode}^FS\n`;
      
      // Resumo dos itens com espaçamento melhorado
      const totalItems = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
      zplCommands += `^FO50,710^A0N,26,26^FDITENS: ${totalItems} produto(s)^FS\n`;
      
      // Linha separadora
      zplCommands += '^FO40,750^GB700,0,3^FS\n';
      
      // Codigo de barras com informações de remetente e destinatário
      const senderCode = 'RAP'; // Rodrigues Auto Pecas
      const recipientCode = orderData.customerName.substring(0,4).toUpperCase();
      const barcodeData = `${senderCode}|${recipientCode}`;
      zplCommands += `^FO120,760^BY3,,0^BCN,180,N,N,N^FD>:${barcodeData}^FS\n`;
      
      // QR Code com todas as informações da etiqueta
      const qrData = `PEDIDO:${orderData.orderNumber}|DATA:${new Date(orderData.createdAt).toLocaleDateString('pt-BR')}|REMETENTE:Rodrigues Auto Pecas LTDA|CNPJ:29.643.260/0001-67|END_REM:SHN Area Especial 162, Taguatinga Norte, Brasilia-DF, 72130-721|TEL_REM:(61)3333-4444|EMAIL:contato@rodriguesautopecas.com.br|DESTINATARIO:${fullName}${customerCpf ? '|CPF:' + customerCpf : ''}${customerPhone ? '|TEL:' + customerPhone : ''}|END_DEST:${cleanStreet}, ${address.number}${address.complement ? ', ' + cleanComplement : ''}, ${cleanNeighborhood}, ${cleanCity}-${address.state}, CEP:${address.zipCode}|ITENS:${totalItems}|TOTAL:R$${orderData.total.toFixed(2)}`;
      zplCommands += `^FO570,160^BY3,3,0^BQN,2,4^FDLA,${qrData}^FS\n`;
      
      // Rodape
      zplCommands += `^FO50,990^A0N,24,24^FDGerado: ${new Date().toLocaleDateString('pt-BR')}^FS\n`;
      
      // Fim do formato ZPL
      zplCommands += '^XZ\n';
      
      // Salvar arquivo ZPL
      const blob = new Blob([zplCommands], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiqueta_zpl_${orderData.orderNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erro ao gerar etiqueta de envio:', error);
      return false;
    }
  };

  return {
    generateShippingLabelForOrder
  };
};

const ShippingLabelGenerator: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { generateShippingLabelForOrder } = useShippingLabelGenerator();

  const handleGenerateLabel = async () => {
    if (!orderNumber || !customerName || !street || !city) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsGenerating(true);

    const orderData: OrderData = {
      orderNumber,
      customerName,
      customerPhone,
      shippingAddress: {
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode
      },
      items: [{ id: '1', name: 'Produto', quantity: 1, price: 100 }],
      total: 100,
      createdAt: new Date().toISOString()
    };

    const success = await generateShippingLabelForOrder(orderData);
    
    if (success) {
      alert('Etiqueta ZPL gerada com sucesso!');
    } else {
      alert('Erro ao gerar etiqueta. Tente novamente.');
    }

    setIsGenerating(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Gerador de Etiqueta ZPL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="orderNumber">Número do Pedido *</Label>
            <Input
              id="orderNumber"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Ex: SKE20250724001"
            />
          </div>
          <div>
            <Label htmlFor="customerName">Nome do Cliente *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="customerPhone">Telefone</Label>
          <Input
            id="customerPhone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label htmlFor="street">Rua *</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Nome da rua"
            />
          </div>
          <div>
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="123"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={complement}
            onChange={(e) => setComplement(e.target.value)}
            placeholder="Apto, bloco, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Nome do bairro"
            />
          </div>
          <div>
            <Label htmlFor="zipCode">CEP</Label>
            <Input
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="00000-000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Nome da cidade"
            />
          </div>
          <div>
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="UF"
            />
          </div>
        </div>

        <Button 
          onClick={handleGenerateLabel} 
          disabled={isGenerating}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? 'Gerando...' : 'Gerar Etiqueta ZPL'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ShippingLabelGenerator;
export { useShippingLabelGenerator };