import { FirebaseError } from "firebase/app";

const KNOWN_MESSAGES: Record<string, string> = {
  "permission-denied": "Você não tem permissão para fazer essa ação.",
  unavailable: "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
  "not-found": "Não encontrado — pode já ter sido removido em outra sessão.",
  "resource-exhausted": "Muitas operações em pouco tempo. Aguarde um instante e tente novamente.",
  "storage/unauthorized": "Sem permissão para acessar o armazenamento de arquivos.",
  "storage/canceled": "Envio cancelado.",
  "storage/quota-exceeded": "Limite de armazenamento excedido.",
  "storage/retry-limit-exceeded": "Falha de conexão durante o envio. Tente novamente.",
  "storage/object-not-found": "Arquivo não encontrado no armazenamento.",
};

/**
 * Traduz erros comuns do Firestore/Storage para mensagens acionáveis.
 * Sem correspondência conhecida, cai para `fallback` + sugestão de próximo passo.
 */
export function describeFirebaseError(err: unknown, fallback: string): string {
  if (err instanceof FirebaseError && KNOWN_MESSAGES[err.code]) {
    return KNOWN_MESSAGES[err.code];
  }
  const detail = err instanceof Error ? err.message : null;
  const suggestion = "Tente novamente ou verifique sua conexão.";
  return detail ? `${fallback} ${suggestion} (${detail})` : `${fallback} ${suggestion}`;
}
