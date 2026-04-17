import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminPaginationProps {
    currentPage: number;
    lastPage: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function AdminPagination({
    currentPage,
    lastPage,
    onPageChange,
    className,
}: AdminPaginationProps) {
    if (lastPage <= 1) return null;

    const renderPageButtons = () => {
        const buttons = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(lastPage, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={cn(
                        'w-10 h-10 rounded-xl text-xs font-black transition-all duration-300 font-montserrat border',
                        currentPage === i
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110'
                            : 'bg-accent/40 text-muted-foreground hover:bg-accent hover:text-foreground border-border/30'
                    )}
                >
                    {i}
                </button>
            );
        }
        return buttons;
    };

    return (
        <div className={cn('flex items-center justify-center gap-2 py-8 mt-4', className)}>
            <div className="flex items-center gap-1.5 bg-card/30 backdrop-blur-sm p-1.5 rounded-2xl border border-border/50">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-20"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </Button>
                
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-20"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1.5 px-2">
                    {renderPageButtons()}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === lastPage}
                    className="w-10 h-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-20"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(lastPage)}
                    disabled={currentPage === lastPage}
                    className="w-10 h-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-20"
                >
                    <ChevronsRight className="w-4 h-4" />
                </Button>
            </div>
            
            <div className="ml-4 text-[10px] font-black uppercase tracking-[0.2em] font-montserrat text-muted-foreground/40 hidden sm:block">
                Página {currentPage} de {lastPage}
            </div>
        </div>
    );
}
