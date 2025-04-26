import React, { useState } from 'react';

import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';

const CadastroScreen = () => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    setLoading(true);
    if (!email && !phoneNumber) {
      Alert.alert('Erro', 'Por favor, preencha o e-mail ou o número de telefone.');
      setLoading(false);
      return;
    }
    if (!password) {
      Alert.alert('Erro', 'Por favor, digite uma senha.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/auth/register', { // Certifique-se de que a porta corresponde ao seu backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phoneNumber, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        // Navegar para a próxima tela (opcional)
      } else {
        Alert.alert('Erro', data.message || 'Erro ao cadastrar.');
      }
    } catch (error) {
      Alert.alert('Erro de conexão', 'Não foi possível conectar ao servidor.');
      console.error('Erro ao cadastrar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Adicione o componente Image aqui */}
      <Image
        // Atualize o caminho para a imagem na pasta assets
        source={require('../assets/Autenticacao-cadastro.png')}
        style={styles.logo} // Adicione um estilo para a imagem
      />
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Crie sua conta e comece a comprar</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Endereço de E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Número de telefone</Text>
        <TextInput
          style={styles.input}
          placeholder="(XX) XXXXX-XXXX"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCadastro} disabled={loading}>
        <Text style={styles.createButtonText}>{loading ? 'Cadastrando...' : 'Criar'}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => { /* Navegar para tela de login */ }}>
          <Text style={styles.footerText}>
            Já tem uma conta? <Text style={styles.boldText}>Entrar</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { /* Navegar para tela de cadastro de vendedor */ }}>
          <Text style={styles.footerText}>
            É produtor? <Text style={styles.boldText}>Criar conta de vendedor</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center', // Centraliza os itens horizontalmente, incluindo a imagem
  },
  // Adicione o estilo para o logo
  logo: {
    width: 150, // Ajuste a largura conforme necessário
    height: 150, // Ajuste a altura conforme necessário
    marginBottom: 20, // Adiciona espaço abaixo da imagem
    resizeMode: 'contain', // Ajuste o resizeMode conforme necessário ('cover', 'stretch', etc.)
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    // Remova marginBottom se o logo já tiver margem inferior
    // marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default CadastroScreen;