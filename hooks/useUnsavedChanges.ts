import { useEffect } from "react";

/**
 * Hook que avisa o usuário se há mudanças não salvas ao sair da página
 * @param isDirty - Se há mudanças não salvas
 * @param message - Mensagem customizada (padrão: "Você tem mudanças não salvas")
 */
export function useUnsavedChanges(isDirty: boolean, message = "Você tem mudanças não salvas. Deseja sair sem salvar?") {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);
}
