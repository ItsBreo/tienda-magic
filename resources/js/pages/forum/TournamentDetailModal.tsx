import React, { useState, useEffect } from "react";
import ApiService from "../../services/ApiService";
import { useAuth } from "../../contexts/AuthContext";

const FORMAT_LABEL: Record<string, string> = {
  standard: "Standard", modern: "Modern", pioneer: "Pioneer",
  legacy: "Legacy", draft: "Draft", sealed: "Sealed", commander: "Commander",
};

export default function TournamentDetailModal({ tournamentId, onClose }: { tournamentId: number; onClose: () => void }) {
  const { user } = useAuth();
  const [tournament, setTournament] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(false);

  const load = () => {
    setIsLoading(true);
    ApiService.getTournamentDetail(tournamentId)
      .then(res => {
        const data = res.data ?? res;
        setTournament(data);
        setIsRegistered((data.confirmed_players ?? []).some((p: any) => p.id === user?.id));
      })
      .catch(() => setError("Error cargando el torneo."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    setTimeout(() => setAnimate(true), 10);
  }, [tournamentId]);

  const handleClose = () => { setAnimate(false); setTimeout(onClose, 300); };

  const canRegister = tournament?.status === "upcoming" && !tournament?.is_full;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      className={`fixed inset-0 z-[200] flex items-center justify-center p-5 transition-colors duration-300 overflow-y-auto ${animate ? 'bg-black/55' : 'bg-transparent'}`}
    >
      <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto flex flex-col transition-all duration-300 ${animate ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-2.5 opacity-0'}`}>

        {/* Header */}
        <div className="p-4 px-5 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-[15px] font-bold text-[var(--text-primary)]">
            {isLoading ? "Cargando…" : tournament?.name}
          </span>
          <button onClick={handleClose} className="text-[var(--text-secondary)] text-xl hover:text-[var(--text-primary)] cursor-pointer">✕</button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-secondary)] text-[13px]">Cargando información del torneo…</div>
        ) : tournament && (
          <>
            <div className="p-4 px-5 border-b border-[var(--border)]">
              {tournament.description && <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-3.5">{tournament.description}</p>}
              <div className="flex flex-col">
                {[
                  ["Fecha", tournament.starts_at],
                  ["Lugar", tournament.location],
                  ["Formato", FORMAT_LABEL[tournament.format] ?? tournament.format],
                  ["Plazas", `${tournament.max_players - tournament.spots_left} / ${tournament.max_players}`],
                  ["Entrada", tournament.entry_fee > 0 ? `${tournament.entry_fee} €` : "Gratuito"],
                  ["Premio", tournament.prize ?? "—"],
                ].map(([lbl, val], i, arr) => (
                  <div key={lbl} className={`flex justify-between items-center py-2 ${i < arr.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                    <span className="text-xs text-[var(--text-secondary)]">{lbl}</span>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 px-5 border-b border-[var(--border)]">
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2.5">Inscritos ({tournament.confirmed_players?.length || 0})</div>
              <div className="flex flex-col gap-1.5">
                {(tournament.confirmed_players || []).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-bold text-white">
                      {(p.name || 'US').substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[13px]">{p.name || 'Usuario'}</span>
                    {p.id === user?.id && <span className="ml-auto text-[10px] text-[var(--accent)] font-bold italic">tú</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 px-5 flex flex-col gap-2">
              {error && <div className="text-xs text-[var(--red)]">{error}</div>}
              {canRegister && (
                <button
                  onClick={() => isRegistered ? ApiService.unregisterTournament(tournamentId).then(load) : ApiService.registerTournament(tournamentId).then(load)}
                  disabled={isSubmitting}
                  className={`w-full py-2 rounded-md text-[13px] font-semibold cursor-pointer transition-opacity ${isSubmitting ? 'opacity-70' : 'opacity-100'} ${isRegistered ? 'bg-transparent border border-[var(--border)] text-[var(--text-secondary)]' : 'bg-[var(--accent)] text-white'}`}
                >
                  {isSubmitting ? "Procesando…" : isRegistered ? "Cancelar inscripción" : "Inscribirse al torneo"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
