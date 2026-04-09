// components/Forum/TournamentModal.tsx

import React, { useState, useEffect, CSSProperties } from "react";
import ApiService from "../../services/ApiService";
import { C, FONT } from "./constants";

const FORMATS = ["standard", "modern", "pioneer", "legacy", "draft", "sealed", "commander"];

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

const field: React.CSSProperties = {
    display: "flex", flexDirection: "column", gap: 4
};

const label: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: C.textSecondary, fontFamily: FONT
};

const input: React.CSSProperties = {
    padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`,
    background: C.surface2, color: C.textPrimary, fontFamily: FONT,
    fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box"
};

const row: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12
};

export default function TournamentModal({ onClose, onSuccess }: Props) {
    const [form, setForm] = useState({
        name: "",
        description: "",
        date: "",
        time: "",
        location: "",
        format: "standard",
        max_players: 32,
        entry_fee: 0,
        prize: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        // Pequeño retraso para que la transición de entrada se aplique correctamente
        const timer = setTimeout(() => setAnimate(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const set = (key: string, value: string | number) =>
        setForm(f => ({ ...f, [key]: value }));

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "El nombre es obligatorio.";
        if (!form.date) e.date = "La fecha es obligatoria.";
        if (!form.time) e.time = "La hora es obligatoria.";
        if (!form.location.trim()) e.location = "El lugar es obligatorio.";
        if (form.max_players < 2) e.max_players = "Mínimo 2 jugadores.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await ApiService.createTournament({
                name: form.name,
                description: form.description || undefined,
                starts_at: `${form.date}T${form.time}`,
                location: form.location,
                format: form.format,
                max_players: Number(form.max_players),
                entry_fee: Number(form.entry_fee) || undefined,
                prize: form.prize || undefined,
            });
            onSuccess();
        } catch (err: any) {
            const serverErrors = err?.response?.data?.errors;
            if (serverErrors) {
                const mapped: Record<string, string> = {};
                Object.entries(serverErrors).forEach(([k, v]) => {
                    mapped[k] = Array.isArray(v) ? v[0] : String(v);
                });
                setErrors(mapped);
            } else {
                setErrors({ general: "Error al crear el torneo. Inténtalo de nuevo." });
            }
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

    const overlayStyle: CSSProperties = {
        position: "fixed", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
        transition: "background-color .3s ease-out",
        backgroundColor: animate ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
    };

    const modalStyle: CSSProperties = {
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        width: 480, maxWidth: "95vw",
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
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
                        Crear nuevo torneo
                    </span>
                    <button onClick={handleClose} style={{
                        background: "none", border: "none", fontSize: 18,
                        color: C.textSecondary, cursor: "pointer", lineHeight: 1, padding: "2px 6px"
                    }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

                    {errors.general && (
                        <div style={{
                            background: "rgba(248,113,113,.1)", border: `1px solid rgba(248,113,113,.3)`,
                            borderRadius: 6, padding: "8px 12px", fontSize: 12, color: C.red, fontFamily: FONT
                        }}>
                            {errors.general}
                        </div>
                    )}

                    <div style={field}>
                        <span style={label}>Nombre del torneo</span>
                        <input style={input} placeholder="Ej: FNM Standard Mayo"
                            value={form.name} onChange={e => set("name", e.target.value)} />
                        {errors.name && <span style={{ fontSize: 11, color: C.red }}>{errors.name}</span>}
                    </div>

                    <div style={field}>
                        <span style={label}>Descripción</span>
                        <textarea placeholder="Detalles, reglas especiales…" rows={3}
                            value={form.description} onChange={e => set("description", e.target.value)}
                            style={{ ...input, resize: "vertical", lineHeight: 1.5 }} />
                    </div>

                    <div style={row}>
                        <div style={field}>
                            <span style={label}>Fecha</span>
                            <input style={input} type="date"
                                value={form.date} onChange={e => set("date", e.target.value)} />
                            {errors.date && <span style={{ fontSize: 11, color: C.red }}>{errors.date}</span>}
                        </div>
                        <div style={field}>
                            <span style={label}>Hora</span>
                            <input style={input} type="time"
                                value={form.time} onChange={e => set("time", e.target.value)} />
                            {errors.time && <span style={{ fontSize: 11, color: C.red }}>{errors.time}</span>}
                        </div>
                    </div>

                    <div style={field}>
                        <span style={label}>Lugar</span>
                        <input style={input} placeholder="Ej: Tienda Magic — C/ Gran Vía 12"
                            value={form.location} onChange={e => set("location", e.target.value)} />
                        {errors.location && <span style={{ fontSize: 11, color: C.red }}>{errors.location}</span>}
                    </div>

                    <div style={row}>
                        <div style={field}>
                            <span style={label}>Formato</span>
                            <select style={input} value={form.format} onChange={e => set("format", e.target.value)}>
                                {FORMATS.map(f => (
                                    <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div style={field}>
                            <span style={label}>Máx. jugadores</span>
                            <input style={input} type="number" min={2} max={512}
                                value={form.max_players} onChange={e => set("max_players", Number(e.target.value))} />
                            {errors.max_players && <span style={{ fontSize: 11, color: C.red }}>{errors.max_players}</span>}
                        </div>
                    </div>

                    <div style={row}>
                        <div style={field}>
                            <span style={label}>Precio de inscripción (€)</span>
                            <input style={input} type="number" min={0} step={0.5} placeholder="0"
                                value={form.entry_fee} onChange={e => set("entry_fee", Number(e.target.value))} />
                        </div>
                        <div style={field}>
                            <span style={label}>Premio</span>
                            <input style={input} placeholder="Ej: Booster box + trofeo"
                                value={form.prize} onChange={e => set("prize", e.target.value)} />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div style={{
                    padding: "12px 20px", borderTop: `1px solid ${C.border}`,
                    display: "flex", justifyContent: "flex-end", gap: 8
                }}>
                    <button onClick={handleClose} style={{
                        background: "none", border: `1px solid ${C.border}`, color: C.textSecondary,
                        borderRadius: 6, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontFamily: FONT
                    }}>Cancelar</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} style={{
                        background: C.accent, color: "#fff", border: "none",
                        borderRadius: 6, padding: "7px 16px", fontSize: 13,
                        fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer",
                        fontFamily: FONT, opacity: isSubmitting ? 0.7 : 1
                    }}>
                        {isSubmitting ? "Creando…" : "Crear torneo"}
                    </button>
                </div>

            </div>
        </div>
    );
}
