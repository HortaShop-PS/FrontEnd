import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { ProducerProfile, isProfileComplete } from '../(tabsProducers)/utils/profileValidationService'; 
import * as SecureStore from 'expo-secure-store';

export default function CompleteProfileScreen() {
  const router = useRouter();
  // Suponha que você carregue o perfil existente ou comece com um objeto vazio/parcial
  // Esta é uma simulação, você precisará buscar e atualizar os dados reais do perfil
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  // Adicione outros campos necessários

  // Simulação de carregamento de dados do perfil (se já houver algum)
  useEffect(() => {
    // Exemplo: carregar dados parciais se existirem
    // const currentProfile = await getProducerProfileFromAPI();
    // if (currentProfile) {
    //   setName(currentProfile.name || '');
    //   setFarmName(currentProfile.farmName || '');
    //   setCity(currentProfile.city || '');
    //   setPhoneNumber(currentProfile.phoneNumber || '');
    // }
  }, []);

  const handleSubmit = async () => {
    const updatedProfile: ProducerProfile = {
      name,
      farmName,
      city,
      phoneNumber,
      // Adicione outros campos aqui
    };

    if (!isProfileComplete(updatedProfile)) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Lógica para salvar o perfil atualizado
    // Exemplo: await updateProducerProfileAPI(updatedProfile);
    console.log("Perfil atualizado:", updatedProfile);
    Alert.alert("Sucesso", "Perfil atualizado com sucesso!");

    // Redirecionar de volta para a tela de perfil ou para onde for apropriado
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/(tabsProducers)' });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Completar Perfil</Text>
      <Text style={styles.label}>Nome Completo:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Seu nome completo"
      />
      <Text style={styles.label}>Nome da Fazenda/Propriedade:</Text>
      <TextInput
        style={styles.input}
        value={farmName}
        onChangeText={setFarmName}
        placeholder="Nome da sua fazenda"
      />
      <Text style={styles.label}>Cidade:</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder="Cidade onde está localizada"
      />
      <Text style={styles.label}>Telefone de Contato:</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="(XX) XXXXX-XXXX"
        keyboardType="phone-pad"
      />
      {/* Adicione mais campos conforme necessário */}
      <Button title="Salvar Perfil" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});