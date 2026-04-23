import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: React.ReactNode;
    children?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'destructive' | 'default';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    children,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'destructive'
}: ConfirmModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) onClose();
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                {children && <div className="py-4">{children}</div>}
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button variant={variant} onClick={() => {
                        onConfirm();
                        onClose();
                    }}>
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
