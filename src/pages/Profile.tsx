import React, { useState } from 'react';
import { useAuth, useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress, useUpdateProfile } from '../hooks/useApi';
import AddressForm, { AddressFormData } from '../components/AddressForm';
import { AddressData } from '../hooks/useCepLookup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { User, Package, ShieldCheck, MapPin, Plus, Edit, Trash2, Star, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAddress, CreateAddressData } from '../services/api';
import UserOrders from '../components/UserOrders';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();
  const updateProfileMutation = useUpdateProfile();

  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  const [accountData, setAccountData] = useState({
    name: user?.name || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cpf: user?.cpf || ''
  });
  const [addressData, setAddressData] = useState<CreateAddressData>({
    title: '',
    recipientName: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin' || user.role === 'colaborador';

  const handleSaveAccount = () => {
    updateProfileMutation.mutate({
      name: accountData.name,
      phone: accountData.phone,
      cpf: accountData.cpf
    }, {
      onSuccess: () => {
        setIsEditingAccount(false);
      }
    });
  };

  const handleSaveAddress = () => {
    if (editingAddress) {
      updateAddressMutation.mutate({
        addressId: editingAddress.id,
        addressData
      }, {
        onSuccess: () => {
          setIsAddressDialogOpen(false);
          resetAddressForm();
        }
      });
    } else {
      createAddressMutation.mutate(addressData, {
        onSuccess: () => {
          setIsAddressDialogOpen(false);
          resetAddressForm();
        }
      });
    }
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    setAddressData({
      title: address.title,
      recipientName: address.recipientName,
      street: address.street,
      number: address.number,
      complement: address.complement || '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      isDefault: address.isDefault
    });
    setIsAddressDialogOpen(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (confirm('Tem certeza que deseja excluir este endereço?')) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleSetDefaultAddress = (addressId: string) => {
    setDefaultAddressMutation.mutate(addressId);
  };

  const resetAddressForm = () => {
    setEditingAddress(null);
    setAddressData({
      title: '',
      recipientName: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false
    });
  };

  const openNewAddressDialog = () => {
    resetAddressForm();
    setIsAddressDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header do Perfil */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
              <p className="text-gray-600">Gerencie suas informações pessoais e configurações</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Voltar ao Início
            </Button>
          </div>
        </div>

        {/* Seções Principais - Lado a Lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gerenciamento de Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Minha Conta
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingAccount(!isEditingAccount)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingAccount ? 'Cancelar' : 'Editar'}
                </Button>
              </CardTitle>
              <CardDescription>
                Gerencie suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingAccount ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={accountData.name}
                      onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      value={accountData.lastName}
                      onChange={(e) => setAccountData({ ...accountData, lastName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={accountData.phone}
                      onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={accountData.cpf}
                      onChange={(e) => setAccountData({ ...accountData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveAccount} className="flex-1">
                      Salvar Alterações
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingAccount(false)}>
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome</label>
                    <p className="text-lg">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sobrenome</label>
                    <p className="text-lg">{user.lastName || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <p className="text-lg">{user.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">CPF</label>
                    <p className="text-lg">{user.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de Conta</label>
                    <div className="flex items-center gap-2">
                      <Badge variant={isAdmin ? 'default' : 'secondary'}>
                        {isAdmin ? 'Administrador' : 'Cliente'}
                      </Badge>
                      {isAdmin && <ShieldCheck className="h-4 w-4 text-blue-600" />}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Ativo
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Gerenciamento de Endereços */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Meus Endereços
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openNewAddressDialog}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardTitle>
              <CardDescription>
                Gerencie seus endereços de entrega
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addressesLoading ? (
                <p className="text-gray-500">Carregando endereços...</p>
              ) : addresses && addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{address.title}</h4>
                            {address.isDefault && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                <Star className="h-3 w-3 mr-1" />
                                Padrão
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {address.street}, {address.number}
                            {address.complement && `, ${address.complement}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.neighborhood}, {address.city} - {address.state}
                          </p>
                          <p className="text-sm text-gray-600">CEP: {address.zipCode}</p>
                        </div>
                        <div className="flex gap-1">
                          {!address.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefaultAddress(address.id)}
                              title="Definir como padrão"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum endereço cadastrado.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel Administrativo - Apenas para Admins */}
        {isAdmin && (
          <div className="mt-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Painel Administrativo
                </CardTitle>
                <CardDescription>
                  Acesse as ferramentas de administração
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/admin')}
                >
                  Acessar Painel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}



        {/* Dialog para Adicionar/Editar Endereço */}
        <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Editar Endereço' : 'Adicionar Novo Endereço'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do endereço abaixo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Endereço</Label>
                <Input
                  id="title"
                  placeholder="Ex: Casa, Trabalho, etc."
                  value={addressData.title}
                  onChange={(e) => setAddressData({ ...addressData, title: e.target.value })}
                />
              </div>
              <AddressForm
                data={{
                  cep: addressData.zipCode,
                  street: addressData.street,
                  number: addressData.number,
                  complement: addressData.complement,
                  neighborhood: addressData.neighborhood,
                  city: addressData.city,
                  state: addressData.state
                } as AddressFormData}
                onChange={(field, value) => {
                  if (field === 'cep') {
                    setAddressData({ ...addressData, zipCode: value });
                  } else {
                    setAddressData({ ...addressData, [field]: value });
                  }
                }}
                onAddressFound={(addressData: AddressData) => {
                  setAddressData(prev => ({
                    ...prev,
                    street: addressData.street,
                    neighborhood: addressData.neighborhood,
                    city: addressData.city,
                    state: addressData.state,
                    zipCode: addressData.cep
                  }));
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAddress}>
                {editingAddress ? 'Atualizar' : 'Adicionar'} Endereço
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Profile;