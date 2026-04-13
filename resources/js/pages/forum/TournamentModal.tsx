import React, { useState, useEffect } from "react";
import ApiService from "../../services/ApiService";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TournamentModal({ onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [format, setFormat] = useState("standard");
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [entryFee, setEntryFee] = useState(0);
  const [prize, setPrize] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setAnimate(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await ApiService.createTournament({
        name,
        description,
        starts_at: startsAt,
        location,
        format,
        max_players: Number(maxPlayers),
        entry_fee: Number(entryFee),
        prize,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al crear el torneo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-colors duration-300 overflow-y-auto ${
        animate ? 'bg-black/55' : 'bg-transparent'
      }`}
    >
      <div
        className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-[500px] flex flex-col transition-all duration-300 ${
          animate ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Crear Nuevo Torneo</h2>
          <button onClick={handleClose} className="text-[var(--text-secondary)] text-xl hover:text-[var(--text-primary)] cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Nombre del Torneo</label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Open Modern Primavera"
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Fecha y Hora</label>
              <input
                required
                type="datetime-local"
                value={startsAt}
                onChange={e => setStartsAt(e.target.value)}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Formato</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                <option value="standard">Standard</option>
                <option value="modern">Modern</option>
                <option value="pioneer">Pioneer</option>
                <option value="commander">Commander</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Lugar / Tienda</label>
            <input
              required
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Dirección o nombre del local"
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Máx. Jugadores</label>
              <input
                type="number"
                value={maxPlayers}
                onChange={e => setMaxPlayers(Number(e.target.value))}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Precio Entrada (€)</label>
              <input
                type="number"
                value={entryFee}
                onChange={e => setEntryFee(Number(e.target.value))}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Descripción / Premios</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
            />
          </div>

          {error && <p className="text-xs text-[var(--red)] font-medium">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-[var(--border)] rounded-md text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-md text-[13px] font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Creando..." : "Publicar Torneo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
