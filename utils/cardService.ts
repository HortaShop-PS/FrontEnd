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
    name: string; // Changed from holderName
    last4: string;
    cardType: string; // Changed from brand
    expiry: string;
    isPrincipal: boolean;
}

export interface CreateCardPayload {
    // Campos conforme esperado pelo backend (baseado no erro)
    name: string;       // Anteriormente holderName
    number: string;     // Anteriormente cardNumber
    expiry: string;     // Anteriormente expiryDate, formato "MM/YY"
    cvv: string;
    cardType: string;   // Novo campo exigido pelo backend
    // isPrincipal foi removido, pois o backend indicou "property isPrincipal should not exist"
}

export interface UpdateCardPayload {
    name?: string; // Changed from holderName
    expiry?: string; // Changed from expiryDate
    isPrincipal?: boolean; // 'isPrincipal' pode ser aceito na atualização
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
        if (!headers.Authorization && resolvedApiBaseUrl) { // Verifica se o token era esperado mas não foi encontrado
             console.warn("Tentando buscar cartões sem token de autorização.");
             // Dependendo da sua API, isso pode falhar ou retornar uma lista vazia.
        }
        const response = await fetch(`${resolvedApiBaseUrl}${CARDS_API_PATH}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            console.error("Erro ao buscar cartões:", errorData);
            throw new Error(errorData.message || 'Falha ao buscar cartões');
        }
        return response.json();
    },

    async createCard(payload: CreateCardPayload): Promise<ApiCard> {
        const headers = await getAuthHeaders();
        if (!headers.Authorization && resolvedApiBaseUrl) {
            console.warn("Tentando criar cartão sem token de autorização.");
        }

        // O payload já deve estar no formato esperado pela interface CreateCardPayload ajustada
        // Não é mais necessário transformar os nomes dos campos aqui se a interface estiver correta.

        const response = await fetch(`${resolvedApiBaseUrl}${CARDS_API_PATH}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload), 
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            console.error("Erro ao adicionar cartão:", errorData);
            // A mensagem de erro já é um array de strings ou um objeto com uma propriedade message que é um array.
            // Para lançar um erro mais legível no frontend:
            let errorMessage = 'Falha ao adicionar cartão';
            if (errorData && errorData.message && Array.isArray(errorData.message)) {
                errorMessage = errorData.message.join(', ');
            } else if (errorData && errorData.message && typeof errorData.message === 'string') {
                errorMessage = errorData.message;
            } else if (typeof errorData === 'string') {
                errorMessage = errorData;
            }
            throw new Error(errorMessage);
        }
        return response.json();
    },

    async updateCard(cardId: string, payload: UpdateCardPayload): Promise<ApiCard> {
        const headers = await getAuthHeaders();
        if (!headers.Authorization && resolvedApiBaseUrl) {
            console.warn("Tentando atualizar cartão sem token de autorização.");
        }
        // Similar à criação, pode ser necessário transformar payload.expiryDate aqui também.

        const response = await fetch(`${resolvedApiBaseUrl}${CARDS_API_PATH}/${cardId}`, {
            method: 'PATCH', // Ou PUT, dependendo da sua API (geralmente PATCH para atualizações parciais)
            headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            console.error("Erro ao atualizar cartão:", errorData);
            throw new Error(errorData.message || 'Falha ao atualizar cartão');
        }
        return response.json();
    },

    async deleteCard(cardId: string): Promise<void> {
        const headers = await getAuthHeaders();
        if (!headers.Authorization && resolvedApiBaseUrl) {
            console.warn("Tentando excluir cartão sem token de autorização.");
        }
        const response = await fetch(`${resolvedApiBaseUrl}${CARDS_API_PATH}/${cardId}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            console.error("Erro ao excluir cartão:", errorData);
            throw new Error(errorData.message || 'Falha ao excluir cartão');
        }
        // DELETE geralmente retorna 204 No Content, então não há .json() para parsear
    },
};
