export type Category = "noticias" | "estrategia" | "torneos" | "general";
export type SortMode = "hot" | "nuevo" | "top" | "comentado";
export type View = "feed" | "thread" | "create";

export interface Post {
  id: number; title: string; preview: string; author: string;
  isMod?: boolean; category: Category; score: number; userVote?: number;
  comments: number; timeAgo: string; tags: string[];
}

export interface Reply {
  id: number; author: string; avatarColor: string; initials: string;
  timeAgo: string; score: number; body: string; hidden?: boolean;
}

export interface Comment {
  id: number; author: string; avatarColor: string; initials: string;
  timeAgo: string; score: number; body: string; replies: Reply[];
}

export interface Tournament {
  name: string; status: "live" | "soon"; date: string;
}
