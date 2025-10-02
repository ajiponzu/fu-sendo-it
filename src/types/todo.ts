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
