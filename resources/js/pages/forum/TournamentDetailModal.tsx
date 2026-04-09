// components/Forum/TournamentDetailModal.tsx

import React, { useState, useEffect, CSSProperties } from "react";
import ApiService from "../../services/ApiService";
import { C, FONT } from "./constants";
import { useAuth } from "../../contexts/AuthContext";

interface Player {
    id: number;
    name: string;
}

interface TournamentDetail {
    id: number;
    name: string;
    description?: string;
    starts_at: string;
    location: string;
    format: string;
    max_players: number;
    spots_left: number;
    is_full: boolean;
    entry_fee: number;
    prize?: string;
    status: string;
    creator: { id: number; name: string };
    confirmed_players?: Player[];
}

interface Props {
    tournamentId: number;
    onClose: () => void;
}

const FORMAT_LABEL: Record<string, string> = {
    standard: "Standard", modern: "Modern", pioneer: "Pioneer",
    legacy: "Legacy", draft: "Draft", sealed: "Sealed", commander: "Commander"
};

const row: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "7px 0", borderBottom: `1px solid ${C.border}`
};

const metaLabel: React.CSSProperties = {
    fontSize: 12, color: C.textSecondary, fontFamily: FONT
};

const metaValue: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: C.textPrimary, fontFamily: FONT
};

export default function TournamentDetailModal({ tournamentId, onClose }: Props) {
    const { user } = useAuth();
    const [tournament, setTournament] = useState<TournamentDetail | null>(null);
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
                // Comprobar si el usuario ya está inscrito
                const players: Player[] = data.confirmed_players ?? [];
                setIsRegistered(players.some((p: Player) => p.id === user?.id));
            })
            .catch(() => setError("Error cargando el torneo."))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        load();
        // Pequeño retraso para que la transición de entrada se aplique correctamente
        const timer = setTimeout(() => setAnimate(true), 10);
        return () => clearTimeout(timer);
    }, [tournamentId]);


    const handleRegister = async () => {
        setIsSubmitting(true);
        setError("");
        try {
            await ApiService.registerTournament(tournamentId);
            load(); // recargar para ver el jugador en la lista
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Error al inscribirse.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnregister = async () => {
        setIsSubmitting(true);
        setError("");
        try {
            await ApiService.unregisterTournament(tournamentId);
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Error al cancelar inscripción.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setAnimate(false);
        setTimeout(onClose, 300); // Coincidir con la duración de la transición
    };

    const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) handleClose();
    };

    const isCreator = tournament?.creator?.id === user?.id;
    const canRegister = tournament?.status === "upcoming" && !tournament?.is_full;

    const overlayStyle: CSSProperties = {
        position: "fixed", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200,
        padding: "20px 0",
        overflowY: "auto",
        transition: "background-color .3s ease-out",
        backgroundColor: animate ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
    };

    const modalStyle: CSSProperties = {
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        width: 480, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto",
        display: "flex", flexDirection: "column",
        transition: "transform .3s ease-out, opacity .3s ease-out",
        transform: animate ? "scale(1) translateY(0)" : "scale(0.95) translateY(10px)",
        opacity: animate ? 1 : 0,
        willChange: "transform, opacity",
    };

    return (
        <div onClick={handleOverlay} style={overlayStyle}>
            <div style={modalStyle}>

                {/* Header */}
                <div style={{
                    padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, fontFamily: FONT }}>
                        {isLoading ? "Cargando…" : tournament?.name}
                    </span>
                    <button onClick={handleClose} style={{
                        background: "none", border: "none", fontSize: 18,
                        color: C.textSecondary, cursor: "pointer", padding: "2px 6px"
                    }}>✕</button>
                </div>

                {isLoading && (
                    <div style={{ padding: 32, textAlign: "center", color: C.textSecondary, fontFamily: FONT, fontSize: 13 }}>
                        Cargando información del torneo…
                    </div>
                )}

                {!isLoading && tournament && (
                    <>
                        {/* Info */}
                        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
                            {tournament.description && (
                                <p style={{
                                    fontSize: 13, color: C.textSecondary, fontFamily: FONT,
                                    lineHeight: 1.6, marginBottom: 14
                                }}>
                                    {tournament.description}
                                </p>
                            )}
                            <div>
                                {[
                                    ["Fecha", tournament.starts_at],
                                    ["Lugar", tournament.location],
                                    ["Formato", FORMAT_LABEL[tournament.format] ?? tournament.format],
                                    ["Plazas", `${tournament.max_players - tournament.spots_left} / ${tournament.max_players}`],
                                    ["Entrada", tournament.entry_fee > 0 ? `${tournament.entry_fee} €` : "Gratuito"],
                                    ["Premio", tournament.prize ?? "—"],
                                    ["Creado por", tournament.creator.name],
                                ].map(([label, value], i, arr) => (
                                    <div key={label} style={{ ...row, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                        <span style={metaLabel}>{label}</span>
                                        <span style={metaValue}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Jugadores inscritos */}
                        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
                            <div style={{
                                fontSize: 11, fontWeight: 700, color: C.textSecondary,
                                textTransform: "uppercase", letterSpacing: "1px",
                                fontFamily: FONT, marginBottom: 10
                            }}>
                                Jugadores inscritos ({(tournament.confirmed_players ?? []).length})
                            </div>

                            {(tournament.confirmed_players ?? []).length === 0 ? (
                                <div style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT }}>
                                    Aún no hay jugadores inscritos. ¡Sé el primero!
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {(tournament.confirmed_players ?? []).map(player => (
                                        <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{
                                                width: 26, height: 26, borderRadius: "50%",
                                                background: C.accent, display: "flex", alignItems: "center",
                                                justifyContent: "center", fontSize: 10, fontWeight: 700,
                                                color: "#fff", flexShrink: 0, fontFamily: FONT
                                            }}>
                                                {player.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: 13, color: C.textPrimary, fontFamily: FONT }}>
                                                {player.name}
                                            </span>
                                            {player.id === user?.id && (
                                                <span style={{ fontSize: 10, color: C.accent, fontFamily: FONT, marginLeft: "auto" }}>
                                                    tú
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer — inscripción */}
                        <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                            {error && (
                                <div style={{ fontSize: 12, color: C.red, fontFamily: FONT }}>{error}</div>
                            )}

                            {/* El creador no puede inscribirse en su propio torneo */}
                            {!isCreator && canRegister && (
                                isRegistered ? (
                                    <button onClick={handleUnregister} disabled={isSubmitting} style={{
                                        background: "transparent", border: `1px solid ${C.border}`,
                                        color: C.textSecondary, borderRadius: 6, padding: "8px 0",
                                        fontSize: 13, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer",
                                        fontFamily: FONT, opacity: isSubmitting ? 0.7 : 1
                                    }}>
                                        {isSubmitting ? "Cancelando…" : "Cancelar inscripción"}
                                    </button>
                                ) : (
                                    <button onClick={handleRegister} disabled={isSubmitting} style={{
                                        background: C.accent, color: "#fff", border: "none",
                                        borderRadius: 6, padding: "8px 0", fontSize: 13,
                                        fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer",
                                        fontFamily: FONT, opacity: isSubmitting ? 0.7 : 1
                                    }}>
                                        {isSubmitting ? "Inscribiendo…" : "Inscribirse al torneo"}
                                    </button>
                                )
                            )}

                            {tournament.is_full && !isRegistered && (
                                <div style={{ fontSize: 12, color: C.red, textAlign: "center", fontFamily: FONT }}>
                                    El torneo está completo.
                                </div>
                            )}

                            {tournament.status !== "upcoming" && (
                                <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", fontFamily: FONT }}>
                                    Este torneo ya no admite inscripciones.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
