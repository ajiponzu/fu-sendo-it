export interface Todo {
  id: string;
  title: string;
  content: string;
  color: StickyColor;
  createdAt: Date;
  updatedAt: Date;
  position: {
    x: number;
    y: number;
  };
  deadline?: Date; // 期限（オプショナル）
  progress: number; // 進捗率（0-100）
}

export type StickyColor =
  | "yellow"
  | "pink"
  | "blue"
  | "green"
  | "orange"
  | "purple";

export const STICKY_COLORS: StickyColor[] = [
  "yellow",
  "pink",
  "blue",
  "green",
  "orange",
  "purple",
];
