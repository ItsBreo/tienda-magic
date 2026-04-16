import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CreatePostViewProps {
  forumsList: { id: number; name: string; slug: string }[];
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (data: { forum_id: number; title: string; body: string; tags?: string[] }) => void;
}

export default function CreatePostView({ forumsList, isSubmitting, onCancel, onSubmit }: CreatePostViewProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [forumId, setForumId] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !body.trim() || !forumId) {
      alert("Por favor, rellena el título, el contenido y selecciona una categoría.");
      return;
    }
    const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t !== "");
    onSubmit({
      forum_id: Number(forumId),
      title,
      body,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground m-0">
          Crear nuevo post
        </h2>
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground cursor-pointer py-1 px-2.5 rounded-md border border-border bg-transparent font-medium hover:bg-accent hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <select
          value={forumId} onChange={e => setForumId(e.target.value)}
          className="p-2.5 rounded-md border border-border bg-accent text-foreground text-sm outline-none focus:border-primary transition-colors"
        >
          <option value="">Selecciona una categoría...</option>
          {forumsList.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        <input
          type="text" placeholder="Título de tu publicación"
          value={title} onChange={e => setTitle(e.target.value)}
          className="p-2.5 rounded-md border border-border bg-accent text-foreground text-sm outline-none focus:border-primary transition-colors"
        />

        <textarea
          placeholder="Escribe el contenido aquí..." rows={8}
          value={body} onChange={e => setBody(e.target.value)}
          className="p-2.5 rounded-md border border-border bg-accent text-foreground text-sm outline-none resize-y focus:border-primary transition-colors"
        />

        <input
          type="text" placeholder="Etiquetas (separadas por coma, ej: magic, torneo, duda)"
          value={tags} onChange={e => setTags(e.target.value)}
          className="p-2.5 rounded-md border border-border bg-accent text-foreground text-sm outline-none focus:border-primary transition-colors"
        />

        <div className="flex justify-end mt-2">
          <button
            onClick={handleSubmit} disabled={isSubmitting}
            className={`bg-primary text-primary-foreground border-none py-2.5 px-6 rounded-md text-sm font-bold cursor-pointer transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'}`}
          >
            {isSubmitting ? "Publicando..." : "Publicar post"}
          </button>
        </div>
      </div>
    </div>
  );
}
