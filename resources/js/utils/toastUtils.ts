import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Estilos consistentes para todos los toasts de añadir al carrito
const toastStyles = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  border: '1px solid #334155',
  color: '#f1f5f9',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
};

const actionButtonStyles = {
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  border: 'none',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: '600',
  boxShadow: '0 4px 12px -2px rgba(16, 185, 129, 0.4)',
  transition: 'all 0.2s ease',
};

// Hook personalizado para navegación en toasts
export const useToastNavigation = () => {
  const navigate = useNavigate();

  const navigateToCart = () => {
    navigate('/cart');
  };

  return { navigateToCart };
};

// Función reutilizable para toast de añadir al carrito
export const showAddToCartToast = (itemName: string, quantity: number = 1, itemType?: 'pack' | 'card', onNavigateToCart?: () => void) => {
  const message = quantity > 1
    ? `${quantity}x ${itemName} añadidos al carrito`
    : itemType === 'pack'
    ? `${itemName} añadido al carrito`
    : itemType === 'card'
    ? `${itemName} añadida al carrito`
    : `${itemName} añadido al carrito`;

  toast.success(message, {
    action: {
      label: 'Ver Carrito',
      onClick: onNavigateToCart || (() => {
        window.location.href = '/cart';
      }),
    },
    style: toastStyles,
    actionButtonStyle: actionButtonStyles,
  });
};

// Función para toast de error genérico
export const showErrorToast = (message: string) => {
  toast.error(message, {
    style: {
      ...toastStyles,
      border: '1px solid #dc2626',
    },
  });
};

// Función para toast de éxito genérico
export const showSuccessToast = (message: string) => {
  toast.success(message, {
    style: toastStyles,
  });
};
