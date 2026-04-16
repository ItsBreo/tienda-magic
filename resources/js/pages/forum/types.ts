export type Category = "noticias" | "estrategia" | "torneos" | "general";
export type SortMode = "hot" | "nuevo" | "top";
export type View = "feed" | "thread" | "create";

export interface Post {
  id: number; forum_id: number; title: string; preview: string; body?: string; author: string;
  author_id: number; isMod?: boolean; category: Category; score: number; userVote?: number;
  comments: number; timeAgo: string; tags: string[];
  reputation?: number;
  can_delete?: boolean;
  can_edit?: boolean;
  isSaved?: boolean;
  image_url?: string;
}

export interface Reply {
  id: number; author: string; author_id: number; avatarColor: string; initials: string;
  timeAgo: string; score: number; body: string; hidden?: boolean;
  reputation?: number;
  can_delete?: boolean;
  can_edit?: boolean;
}

export interface Comment {
  id: number; author: string; author_id: number; avatarColor: string; initials: string;
  timeAgo: string; score: number; body: string; replies: Reply[]; is_hidden?: boolean;
  reputation?: number;
  can_delete?: boolean;
  can_edit?: boolean;
}

export interface Tournament {
  id: number;
  name: string; status: "live" | "soon"; date: string;
}
