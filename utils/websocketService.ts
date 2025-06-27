import { io, Socket } from 'socket.io-client';

const WS_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/^http/, 'ws') || 'ws://localhost:3000';

interface WebSocketService {
  connect: (orderId: string, onUpdate: (data: any) => void) => Socket | null;
}

const websocketService: WebSocketService = {
  connect: (orderId: string, onUpdate: (data: any) => void) => {
    try {
      const socket = io(`${WS_BASE_URL}/tracking`, {
        transports: ['websocket'],
        timeout: 5000,
      });

      socket.on('connect', () => {
        console.log('WebSocket conectado para tracking');
        socket.emit('joinOrder', { orderId });
      });

      socket.on('trackingUpdate', (data) => {
        console.log('Atualização de tracking recebida:', data);
        onUpdate(data);
      });

      socket.on('disconnect', () => {
        console.log('WebSocket desconectado');
      });

      socket.on('connect_error', (error) => {
        console.error('Erro de conexão WebSocket:', error);
      });

      return socket;
    } catch (error) {
      console.error('Erro ao criar conexão WebSocket:', error);
      return null;
    }
  }
};

export default websocketService;