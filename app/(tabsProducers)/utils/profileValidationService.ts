export interface ProducerProfile {
  name: string;
  farmName: string;
  city: string;
  phoneNumber: string;
  // Adicione outros campos que você considera obrigatórios ou parte do perfil
  // Exemplo: email?: string; documentNumber?: string; etc.
}

/**
 * Verifica se os campos obrigatórios do perfil do produtor estão preenchidos.
 * @param profile O objeto de perfil do produtor.
 * @returns true se o perfil estiver completo, false caso contrário.
 */
export function isProfileComplete(profile: ProducerProfile | null | undefined): boolean {
  if (!profile) {
    return false;
  }

  // Defina aqui quais campos são obrigatórios
  const requiredFields: (keyof ProducerProfile)[] = ['name', 'farmName', 'city', 'phoneNumber'];

  for (const field of requiredFields) {
    if (!profile[field] || (typeof profile[field] === 'string' && (profile[field] as string).trim() === '')) {
      return false; // Encontrou um campo obrigatório vazio
    }
  }

  return true; // Todos os campos obrigatórios estão preenchidos
}

// Você pode adicionar outras funções de validação de perfil aqui, se necessário
// Exemplo:
// export function validateEmail(email: string): boolean {
//   const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//   return re.test(String(email).toLowerCase());
// }