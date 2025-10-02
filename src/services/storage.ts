import {
  writeTextFile,
  readTextFile,
  exists,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { Todo } from "../types/todo";

const STORAGE_FILE = "fu-sendo-it-todos.json";

export class TauriStorageService {
  static async saveTodos(todos: Todo[]): Promise<void> {
    try {
      const data = JSON.stringify(todos, null, 2);
      await writeTextFile(STORAGE_FILE, data, {
        baseDir: BaseDirectory.AppLocalData,
      });
      console.log("Todos saved to file system");
    } catch (error) {
      console.error("Failed to save todos to file system:", error);
      throw error;
    }
  }

  static async loadTodos(): Promise<Todo[]> {
    try {
      const fileExists = await exists(STORAGE_FILE, {
        baseDir: BaseDirectory.AppLocalData,
      });

      if (!fileExists) {
        console.log("No todos file found, returning empty array");
        return [];
      }

      const data = await readTextFile(STORAGE_FILE, {
        baseDir: BaseDirectory.AppLocalData,
      });

      const parsedTodos = JSON.parse(data);

      // 日付文字列をDateオブジェクトに変換
      const todos: Todo[] = parsedTodos.map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
        updatedAt: new Date(todo.updatedAt),
      }));

      console.log("Todos loaded from file system:", todos.length);
      return todos;
    } catch (error) {
      console.error("Failed to load todos from file system:", error);
      return [];
    }
  }

  static async backupTodos(todos: Todo[]): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `fu-sendo-it-todos-backup-${timestamp}.json`;
      const data = JSON.stringify(todos, null, 2);

      await writeTextFile(backupFileName, data, {
        baseDir: BaseDirectory.AppLocalData,
      });

      console.log("Backup created:", backupFileName);
    } catch (error) {
      console.error("Failed to create backup:", error);
    }
  }
}
