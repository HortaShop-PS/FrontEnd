import { Platform } from 'react-native';
import { getToken } from './authServices'; // Importar getToken do seu authServices

let API_BASE_URL_FROM_ENV: string | undefined;
try {
  // Tenta carregar de @env, pode falhar se não estiver configurado ou em certos contextos
  const env = require('@env');
  API_BASE_URL_FROM_ENV = env.API_BASE_URL;
} catch (e) {
  console.warn("Falha ao carregar API_BASE_URL de @env. Usando process.env.");
}

const resolvedApiBaseUrl = API_BASE_URL_FROM_ENV || Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL, // Para Android (emulador geralmente usa 10.0.2.2 para localhost do host)
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS,   // Para iOS (simulador geralmente pode usar localhost diretamente)
  default: process.env.EXPO_PUBLIC_API_BASE_URL, // Fallback para outras plataformas ou se não especificado
});

if (!resolvedApiBaseUrl) {
  console.error("API_BASE_URL não está definida. Verifique sua configuração .env (API_BASE_URL ou EXPO_PUBLIC_API_BASE_URL) e a configuração do projeto.");
  // Você pode querer lançar um erro aqui ou ter um fallback mais robusto,
  // por exemplo, uma URL de produção padrão se nada for encontrado.
  // Ex: const resolvedApiBaseUrl = DEFAULT_PROD_URL;
}

// Defina o caminho base para os endpoints de cartão.
// Ajuste '/payments/cards' conforme a rota definida em seu limbo/payments/payments.controller.ts
// Se o controller for, por exemplo, @Controller('cards'), então seria apenas '/cards'.
// Se o controller for @Controller('payments') e a rota @Get('/cards'), então '/payments/cards'.
const CARDS_API_PATH = '/payments/cards'; // <<<< AJUSTE ESTE CAMINHO CONFORME SEU BACKEND

export interface ApiCard {
    id: string;
    cardholderName: string;
    number: string; // Este campo pode não vir do backend, mas é útil para a UI às vezes
    last4Digits: string; // O backend envia este
    expiry: string; // Formatado como "MM/YY" no frontend
    expiryMonth: string; // Vem do backend
    expiryYear: string; // Vem do backend
    // cvv?: string; // CVV não deve vir do backend
    isPrincipal: boolean;
    brand: string; // e.g., "Visa", "Mastercard"
    nickname?: string;
    paymentMethodType: string;
}

export interface CreateCardPayload {
    cardholderName: string;
    number: string;
    expiry: string; // Formato "MM/YY"
    cvv: string;
    brand: string; // Bandeira do cartão, ex: "visa", "mastercard"
    nickname?: string;
    paymentMethodType: string; // 'credit' ou 'debit'
}

export interface UpdateCardPayload {
    cardholderName?: string;
    number?: string; // Geralmente não se atualiza o número do cartão, mas sim adiciona um novo
    expiry?: string; // Formato "MM/YY"
    // cvv?: string; // CVV não deve ser enviado para atualização
    isPrincipal?: boolean;
    brand?: string; // Bandeira do cartão
    nickname?: string;
    paymentMethodType?: string;
}

const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Se não houver token, pode ser um problema para rotas protegidas.
    // Algumas APIs podem permitir a criação de cartões sem token se for parte de um fluxo de checkout anônimo,
    // mas geralmente, o gerenciamento de cartões salvos é para usuários autenticados.
    return headers;
};

export const cardService = {
    async getCards(): Promise<ApiCard[]> {
        const headers = await getAuthHeaders();
        if (!headers.Authorization && resolvedApiBaseUrl) {
            console.warn("Tentando buscar cartões sem token de autorização.");
        }
        const response = await fetch(`${resolvedApiBaseUrl}${CARDS_API_PATH}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            throw new Error(errorData.message || 'Falha ao buscar cartões');
        }
        return response.json();
    },
    async createCard(payload: CreateCardPayload): Promise<ApiCard> {
        const headers = await getAuthHeaders();
        if (!headers.Authorization && resolvedApiBaseUrl) {
            console.warn("Tentando criar cartão sem token de autorização.");
        }
        const response = await fetch(`${resolvedApiBaseUrl}${CARDS_API_PATH}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            throw new Error(errorData.message || 'Falha ao adicionar cartão');
        }
        return response.json();
    },
    async updateCard(cardId: string, payload: UpdateCardPayload): Promise<ApiCard> {
        const headers = await getAuthHeaders();
        if (!headers.Authorization && resolvedApiBaseUrl) {
            console.warn("Tentando atualizar cartão sem token de autorização.");
        }
        const response = await fetch(`${resolvedApiBaseUrl}${CARDS_API_PATH}/${cardId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            throw new Error(errorData.message || 'Falha ao atualizar cartão');
        }
        return response.json();
    },
    async deleteCard(cardId: string): Promise<void> {
        const headers = await getAuthHeaders();
        if (!headers.Authorization && resolvedApiBaseUrl) {
            console.warn("Tentando deletar cartão sem token de autorização.");
        }
        const response = await fetch(`${resolvedApiBaseUrl}${CARDS_API_PATH}/${cardId}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            throw new Error(errorData.message || 'Falha ao deletar cartão');
        }
    },
};
