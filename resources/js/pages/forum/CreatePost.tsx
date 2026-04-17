import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ImageIcon } from 'lucide-react';

interface CreatePostViewProps {
  forumsList: { id: number; name: string; slug: string }[];
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (data: { forum_id: number; title: string; body: string; tags?: string[]; image?: File }) => void;
}

export default function CreatePostView({
 forumsList, isSubmitting, onCancel, onSubmit,
}: CreatePostViewProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [forumId, setForumId] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!title.trim() || !body.trim() || !forumId) {
      alert('Por favor, rellena el título, el contenido y selecciona una categoría.');
      return;
    }
    const tagsArray = tags.split(",").map((t: string) => t.trim()).filter((t: string) => t !== "");
    onSubmit({
      forum_id: Number(forumId),
      title,
      body,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      image: image || undefined,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es demasiado grande. Máximo 5MB.');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-forum font-bold text-foreground m-0">
          Forjar Nueva Publicación
        </h2>
        <button
          onClick={onCancel}
          className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer py-2 px-4 rounded-xl border border-border bg-transparent hover:bg-accent hover:text-foreground transition-all"
        >
          Cancelar
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Categoría</label>
            <select
              value={forumId} onChange={e => setForumId(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-border bg-accent/40 text-foreground text-sm outline-none focus:border-primary/50 transition-colors font-montserrat"
            >
              <option value="">Selecciona el destino de tu mensaje...</option>
              {forumsList.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
        </div>

        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Título</label>
            <input
              type="text" placeholder="Título que capture la esencia..."
              value={title} onChange={e => setTitle(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-border bg-accent/40 text-foreground text-sm outline-none focus:border-primary/50 transition-colors font-forum font-bold text-lg"
            />
        </div>

        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contenido</label>
            <textarea
              placeholder="Escribe el contenido aquí... Deja que tus palabras fluyan como mana." rows={8}
              value={body} onChange={e => setBody(e.target.value)}
              className="w-full p-4 rounded-xl border border-border bg-accent/40 text-foreground text-base outline-none resize-y focus:border-primary/50 transition-colors font-literata italic"
            />
        </div>

        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Etiquetas</label>
            <input
              type="text" placeholder="magic, torneo, duda..."
              value={tags} onChange={e => setTags(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-border bg-accent/40 text-foreground text-sm outline-none focus:border-primary/50 transition-colors font-montserrat uppercase tracking-tight"
            />
        </div>

        {/* IMAGE UPLOAD SECTION */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-3">
             <label className="flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/20 rounded-xl text-[11px] font-black uppercase tracking-widest text-primary cursor-pointer hover:bg-primary/20 transition-all">
                <ImageIcon size={16} /> <span>Añadir Arte / Imagen</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
             </label>
             {image && <span className="text-[11px] font-bold text-muted-foreground truncate max-w-[200px]">{image.name}</span>}
          </div>

          {imagePreview && (
            <div className="relative w-max mt-4 group">
              <img 
                src={imagePreview} 
                alt="Vista previa" 
                className="max-w-full max-h-[300px] rounded-2xl border border-border shadow-2xl object-cover" 
              />
              <button
                onClick={removeImage}
                className="absolute top-3 right-3 bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center text-[18px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none shadow-xl"
                title="Quitar imagen"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-border/40">
          <button
            onClick={handleSubmit} disabled={isSubmitting}
            className={`bg-primary text-primary-foreground border-none py-4 px-10 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all shadow-xl shadow-primary/20 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
          >
            {isSubmitting ? "Canalizando..." : "Publicar Hilo"}
          </button>
        </div>
      </div>
    </div>
  );
}
