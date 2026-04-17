import React, { useState, useEffect } from 'react';
import { Trash2, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ApiService from '../../services/ApiService';
import { useAuth } from '../../contexts/AuthContext';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const FORMAT_LABEL: Record<string, string> = {
  standard: 'Standard',
modern: 'Modern',
pioneer: 'Pioneer',
  legacy: 'Legacy',
draft: 'Draft',
sealed: 'Sealed',
commander: 'Commander',
};

export default function TournamentDetailModal({ tournamentId, onClose }: { tournamentId: number; onClose: () => void }) {
  const { user } = useAuth();
  const [tournament, setTournament] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [animate, setAnimate] = useState(false);

  // Estados para borrado
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    setIsLoading(true);
    ApiService.getTournamentDetail(tournamentId)
      .then((res) => {
        const data = res.data ?? res;
        setTournament(data);
        setIsRegistered((data.confirmed_players ?? []).some((p: any) => p.id === user?.id));
      })
      .catch(() => setError('Error cargando el torneo.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    setTimeout(() => setAnimate(true), 10);
  }, [tournamentId]);

  const handleClose = () => { setAnimate(false); setTimeout(onClose, 300); };

  const handleDelete = () => setShowDeleteDialog(true);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await ApiService.axiosInstance.delete(`/api/tournaments/${tournamentId}`);
      toast.success('Torneo eliminado correctamente');
      setShowDeleteDialog(false);
      handleClose();
      // Refrescar la página o el estado global para quitar el torneo de la lista
      window.location.reload();
    } catch (err) {
      toast.error('No se pudo eliminar el torneo');
    } finally {
      setIsDeleting(false);
    }
  };

  const canRegister = tournament?.status === 'upcoming' && !tournament?.is_full;
  return (
    <>
      <AnimatePresence>
        {tournamentId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 overflow-y-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border border-border rounded-2xl w-full max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative z-10"
            >
              {/* Header */}
              <div className="p-4 px-6 border-b border-border flex items-center justify-between bg-accent/20">
                <span className="text-lg font-forum font-bold text-foreground">
                  {isLoading ? 'Invocando información...' : tournament?.name}
                </span>
                <button 
                  onClick={onClose} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1">
                {isLoading ? (
                  <div className="p-12 text-center text-muted-foreground text-sm font-medium animate-pulse">Cargando la arena de combate...</div>
                ) : tournament && (
                  <>
                    <div className="p-6 border-b border-border">
                      {tournament.description && <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-literata">{tournament.description}</p>}
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          ['Fecha', tournament.starts_at],
                          ['Lugar', tournament.location],
                          ['Formato', FORMAT_LABEL[tournament.format] ?? tournament.format],
                          ['Plazas', `${tournament.max_players - tournament.spots_left} / ${tournament.max_players}`],
                          ['Entrada', tournament.entry_fee > 0 ? `${tournament.entry_fee} €` : 'Gratuito'],
                          ['Premio', tournament.prize ?? '—'],
                        ].map(([lbl, val]) => (
                          <div key={lbl} className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{lbl}</span>
                            <span className="text-xs font-bold text-foreground">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 border-b border-border bg-accent/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Inscritos ({tournament.confirmed_players?.length || 0})</div>
                        {tournament.can_delete && (
                          <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            <Trash2 size={12} /> Eliminar
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {(tournament.confirmed_players || []).map((p: any) => (
                          <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-card border border-border/50 group hover:border-primary/30 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-black text-primary shrink-0">
                              {(p.name || 'US').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-foreground truncate">{p.name || 'Usuario'}</div>
                              {p.id === user?.id && <div className="text-[9px] text-primary font-black uppercase">Tú</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-card sticky bottom-0 border-t border-border">
                      {error && <div className="text-xs text-destructive mb-3 font-bold uppercase">{error}</div>}
                      {canRegister && (
                        <button
                          onClick={() => (isRegistered ? ApiService.unregisterTournament(tournamentId).then(load) : ApiService.registerTournament(tournamentId).then(load))}
                          disabled={isSubmitting}
                          className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all ${isSubmitting ? 'opacity-70 scale-95' : 'hover:scale-[1.02] active:scale-95'} ${isRegistered ? 'bg-accent/50 border border-border text-foreground hover:bg-accent' : 'bg-primary text-primary-foreground shadow-primary/20'}`}
                        >
                          {isSubmitting ? 'Canalizando...' : isRegistered ? 'Abandonar Torneo' : 'Inscribirse al Duelo'}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar torneo?"
        description="Esta acción eliminará el torneo permanentemente. Se notificará a los jugadores inscritos (simulado)."
      />
    </>
  );
}
