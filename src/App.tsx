import { onMount, For, Show } from "solid-js";
import { todoStore } from "./store/todoStore";
import StickyNote from "./components/StickyNote";
import AddTodoButton from "./components/AddTodoButton";
import "./App.css";

function App() {
  onMount(() => {
    todoStore.loadFromStorage();
  });

  return (
    <main class="app">
      <Show
        when={!todoStore.isLoading()}
        fallback={
          <div class="app__loading">
            <h2>📝 読み込み中...</h2>
            <p>付箋データを読み込んでいます</p>
          </div>
        }
      >
        <header class="app__header">
          <h1 class="app__title">🌸 Fu-Sendo-It</h1>
          <p class="app__subtitle">付箋形式のTodoアプリ</p>

          <div class="app__stats">
            <span class="app__stat">
              付箋数: <strong>{todoStore.todos().length}</strong>
            </span>
          </div>

          <Show when={todoStore.todos().length > 0}>
            <button
              class="app__backup-btn"
              onClick={async () => {
                const success = await todoStore.createBackup();
                if (success) {
                  alert("バックアップが作成されました！");
                } else {
                  alert("バックアップの作成に失敗しました。");
                }
              }}
            >
              📁 バックアップを作成
            </button>
          </Show>
        </header>

        <div class="app__workspace">
          <Show
            when={todoStore.todos().length > 0}
            fallback={
              <div class="app__empty">
                <p class="app__empty-message">
                  付箋がありません。新しい付箋を追加してみましょう！
                </p>
              </div>
            }
          >
            <For each={todoStore.todos()}>
              {(todo) => <StickyNote todo={todo} />}
            </For>
          </Show>
        </div>

        <AddTodoButton />
      </Show>
    </main>
  );
}

export default App;
