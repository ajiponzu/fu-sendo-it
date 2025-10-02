import { onMount, For, Show, createSignal } from "solid-js";
import { todoStore } from "./store/todoStore";
import StickyNote from "./components/StickyNote";
import AddTodoButton from "./components/AddTodoButton";
import "./App.css";

function App() {
  const [zoomLevel, setZoomLevel] = createSignal(1);
  const [transformOrigin, setTransformOrigin] = createSignal("50% 50%");
  const [windowSize, setWindowSize] = createSignal({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  onMount(() => {
    todoStore.loadFromStorage();

    // ウィンドウリサイズイベント
    const handleResize = () => {
      const newSize = { width: window.innerWidth, height: window.innerHeight };
      const oldSize = windowSize();

      // 既存の付箋の相対位置を保持
      if (todoStore.todos().length > 0) {
        todoStore.todos().forEach((todo) => {
          const relativeX = todo.position.x / oldSize.width;
          const relativeY = todo.position.y / oldSize.height;

          const newPosition = {
            x: Math.min(relativeX * newSize.width, newSize.width - 270),
            y: Math.min(relativeY * newSize.height, newSize.height - 220),
          };

          todoStore.updatePosition(todo.id, newPosition);
        });
      }

      setWindowSize(newSize);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
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
        <div
          class="app__workspace-container"
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();

              // マウスカーソルの位置を取得
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;

              // パーセンテージでtransform-originを設定
              const originX = (mouseX / rect.width) * 100;
              const originY = (mouseY / rect.height) * 100;
              setTransformOrigin(`${originX}% ${originY}%`);

              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              const newZoom = Math.min(Math.max(zoomLevel() + delta, 0.5), 2.0);
              setZoomLevel(newZoom);
            }
          }}
        >
          <div
            class="app__workspace"
            style={{
              transform: `scale(${zoomLevel()})`,
              "transform-origin": transformOrigin(),
              width: `${100 / zoomLevel()}vw`,
              height: `${100 / zoomLevel()}vh`,
              "min-width": `${100 / zoomLevel()}vw`,
              "min-height": `${100 / zoomLevel()}vh`,
            }}
          >
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
                {(todo) => <StickyNote todo={todo} zoomLevel={zoomLevel()} />}
              </For>
            </Show>
          </div>
        </div>

        <div class="app__zoom-indicator">
          ズーム: {Math.round(zoomLevel() * 100)}%
          <div class="app__zoom-hint">Ctrl + マウスホイールでズーム</div>
        </div>

        <AddTodoButton />
      </Show>
    </main>
  );
}

export default App;
