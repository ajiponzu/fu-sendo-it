import { createSignal, createEffect } from "solid-js";
import { Todo, StickyColor } from "../types/todo";
import { TauriStorageService } from "../services/storage";

const [todos, setTodos] = createSignal<Todo[]>([]);
const [isLoading, setIsLoading] = createSignal(false);

// ランダムな位置を生成する関数
const generateRandomPosition = () => {
  // 基準となる画面サイズでランダムな位置を生成（ズームに依存しない座標系）
  const baseWidth = 1200; // 基準幅
  const baseHeight = 800; // 基準高さ

  const maxX = baseWidth * 0.8;
  const maxY = baseHeight * 0.8;
  const minX = 50;
  const minY = 50;

  return {
    x: Math.random() * (maxX - minX) + minX,
    y: Math.random() * (maxY - minY) + minY,
  };
};

export const todoStore = {
  todos,
  isLoading,

  addTodo: async (
    title: string,
    content: string = "",
    color: StickyColor = "yellow"
  ) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title,
      content,
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
      position: generateRandomPosition(),
      progress: 0, // デフォルト進捗率は0%
    };
    setTodos((prev) => [...prev, newTodo]);
    await todoStore.saveToStorage();
  },

  updateTodo: async (
    id: string,
    updates: Partial<Omit<Todo, "id" | "createdAt">>
  ) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, ...updates, updatedAt: new Date() } : todo
      )
    );
    await todoStore.saveToStorage();
  },

  // 位置を更新する専用メソッド
  updatePosition: async (id: string, position: { x: number; y: number }) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, position, updatedAt: new Date() } : todo
      )
    );
    await todoStore.saveToStorage();
  },

  // 期限を更新する専用メソッド
  updateDeadline: async (id: string, deadline: Date | undefined) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, deadline, updatedAt: new Date() } : todo
      )
    );
    await todoStore.saveToStorage();
  },

  // 進捗率を更新する専用メソッド
  updateProgress: async (id: string, progress: number) => {
    // 進捗率は0-100の範囲でクランプ
    const clampedProgress = Math.max(0, Math.min(100, progress));
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? { ...todo, progress: clampedProgress, updatedAt: new Date() }
          : todo
      )
    );
    await todoStore.saveToStorage();
  },

  deleteTodo: async (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    await todoStore.saveToStorage();
  },

  // 付箋を整理配置する機能
  arrangeNotes: async () => {
    const todos = todoStore.todos();
    if (todos.length === 0) return;

    // グリッド配置の設定
    const cols = Math.ceil(Math.sqrt(todos.length));
    const noteWidth = 270; // 付箋幅 + マージン
    const noteHeight = 250; // 付箋高さ + マージン
    const startX = 50;
    const startY = 50;

    // 作成日時順でソート
    const sortedTodos = [...todos].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // グリッド状に配置
    sortedTodos.forEach((todo, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const newPosition = {
        x: startX + col * noteWidth,
        y: startY + row * noteHeight,
      };

      todoStore.updatePosition(todo.id, newPosition);
    });
  },

  // Tauriファイルシステムから読み込み
  loadFromStorage: async () => {
    setIsLoading(true);
    try {
      const loadedTodos = await TauriStorageService.loadTodos();
      // 既存のデータに位置情報がない場合は生成
      const todosWithPosition = loadedTodos.map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
        updatedAt: new Date(todo.updatedAt),
        position: todo.position || generateRandomPosition(),
        progress: todo.progress ?? 0, // 既存データに進捗率がない場合は0%
        deadline: todo.deadline ? new Date(todo.deadline) : undefined, // 期限があれば変換
      }));
      setTodos(todosWithPosition);
      console.log("Todos loaded successfully");
    } catch (error) {
      console.error("Failed to load todos:", error);
      // フォールバック: ローカルストレージから読み込み
      try {
        const stored = localStorage.getItem("fu-sendo-it-todos");
        if (stored) {
          const parsedTodos = JSON.parse(stored).map((todo: any) => ({
            ...todo,
            createdAt: new Date(todo.createdAt),
            updatedAt: new Date(todo.updatedAt),
            position: todo.position || generateRandomPosition(),
            progress: todo.progress ?? 0, // 既存データに進捗率がない場合は0%
            deadline: todo.deadline ? new Date(todo.deadline) : undefined, // 期限があれば変換
          }));
          setTodos(parsedTodos);
          // Tauriファイルシステムに移行
          await todoStore.saveToStorage();
        }
      } catch (fallbackError) {
        console.error("Fallback load also failed:", fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  },

  // Tauriファイルシステムに保存
  saveToStorage: async () => {
    try {
      await TauriStorageService.saveTodos(todos());
      // バックアップとしてローカルストレージにも保存
      localStorage.setItem("fu-sendo-it-todos", JSON.stringify(todos()));
    } catch (error) {
      console.error("Failed to save todos:", error);
      // フォールバック: ローカルストレージのみに保存
      try {
        localStorage.setItem("fu-sendo-it-todos", JSON.stringify(todos()));
      } catch (fallbackError) {
        console.error("Fallback save also failed:", fallbackError);
      }
    }
  },

  // バックアップを作成
  createBackup: async () => {
    try {
      await TauriStorageService.backupTodos(todos());
      return true;
    } catch (error) {
      console.error("Failed to create backup:", error);
      return false;
    }
  },
};

// 定期的な自動保存（変更を検知して保存）
let saveTimeout: number | null = null;
createEffect(() => {
  // 依存関係として todos() を参照
  todos();

  // デバウンス処理（1秒後に保存）
  if (saveTimeout !== null) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = window.setTimeout(async () => {
    if (todos().length > 0) {
      await todoStore.saveToStorage();
    }
  }, 1000);
});
