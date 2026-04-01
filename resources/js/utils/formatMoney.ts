/**
 * Utilidad para formatear dinero de forma segura
 * Convierte cualquier valor a número y lo formatea con 2 decimales
 */
export const formatMoney = (value: string | number | null | undefined): string => {
    const numValue = Number(value || 0);
    return numValue.toFixed(2);
};

/**
 * Utilidad para formatear dinero con símbolo de euro
 */
export const formatEuro = (value: string | number | null | undefined): string => `€${formatMoney(value)}`;
