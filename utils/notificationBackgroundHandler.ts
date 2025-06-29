import messaging from '@react-native-firebase/messaging';

// Configurar o background message handler o mais cedo possível
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📬 [BACKGROUND] Mensagem recebida em background:', remoteMessage);
  
  // Aqui você pode processar dados da notificação se necessário
  // Por exemplo, salvar no cache local, incrementar badges, etc.
  
  if (remoteMessage.data) {
    console.log('📦 [BACKGROUND] Dados da notificação:', remoteMessage.data);
    
    // Exemplo: se a notificação contém informações de pedido
    if (remoteMessage.data.type === 'order_update') {
      console.log('📋 [BACKGROUND] Atualização de pedido recebida:', remoteMessage.data.orderId);
      // Aqui você poderia salvar no AsyncStorage ou fazer algum processamento
    }
    
    if (remoteMessage.data.type === 'product_update') {
      console.log('🛍️ [BACKGROUND] Atualização de produto recebida:', remoteMessage.data.productId);
    }
  }
  
  // Se você quiser exibir notificação local personalizada (opcional)
  if (remoteMessage.notification) {
    console.log('📱 [BACKGROUND] Título:', remoteMessage.notification.title);
    console.log('📱 [BACKGROUND] Corpo:', remoteMessage.notification.body);
  }
});

console.log('✅ Background message handler configurado');