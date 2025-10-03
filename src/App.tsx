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

  // 表示の相対座標管理
  const [viewOffset, setViewOffset] = createSignal({ x: 0, y: 0 });
  const [isDraggingView, setIsDraggingView] = createSignal(false);
  const [dragStartPosition, setDragStartPosition] = createSignal({
    x: 0,
    y: 0,
  });
  const [dragStartOffset, setDragStartOffset] = createSignal({ x: 0, y: 0 });

  onMount(() => {
    todoStore.loadFromStorage();

    // ウィンドウリサイズイベント
    const handleResize = () => {
      const newSize = { width: window.innerWidth, height: window.innerHeight };
      const oldSize = windowSize();

      // 既存の付箋の相対位置を保持（境界制限なし）
      if (todoStore.todos().length > 0) {
        todoStore.todos().forEach((todo) => {
          const relativeX = todo.position.x / oldSize.width;
          const relativeY = todo.position.y / oldSize.height;

          const newPosition = {
            x: relativeX * newSize.width,
            y: relativeY * newSize.height,
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

  // ズームと表示位置をリセットする関数
  const resetView = () => {
    setZoomLevel(1);
    setTransformOrigin("50% 50%");
    setViewOffset({ x: 0, y: 0 });
  };

  // 背景ドラッグのイベントハンドラー
  const handleMouseDown = (e: MouseEvent) => {
    // 付箋やボタンをクリックした場合は無視
    const target = e.target as HTMLElement;
    if (
      target.closest(".sticky-note") ||
      target.closest(".app__control-btn") ||
      target.closest(".add-todo-button")
    ) {
      return;
    }

    setIsDraggingView(true);
    setDragStartPosition({ x: e.clientX, y: e.clientY });
    setDragStartOffset(viewOffset());

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingView()) return;

    // ズームレベルに応じた移動量調整（ズームイン時は移動量を小さく、ズームアウト時は大きく）
    const movementScale = zoomLevel(); // ズームレベルが高いほど移動量を小さく
    const deltaX = (e.clientX - dragStartPosition().x) / movementScale;
    const deltaY = (e.clientY - dragStartPosition().y) / movementScale;

    setViewOffset({
      x: dragStartOffset().x + deltaX,
      y: dragStartOffset().y + deltaY,
    });
  };

  const handleMouseUp = () => {
    setIsDraggingView(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // 付箋を整理配置する関数
  const arrangeNotes = async () => {
    await todoStore.arrangeNotes();
  };

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
          onMouseDown={handleMouseDown}
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
          style={{
            cursor: isDraggingView() ? "grabbing" : "grab",
          }}
        >
          <div
            class="app__workspace"
            style={{
              transform: `scale(${zoomLevel()}) translate(${
                viewOffset().x
              }px, ${viewOffset().y}px)`,
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

        <div class="app__controls">
          <button
            class="app__control-btn app__control-btn--reset"
            onClick={(e) => {
              e.stopPropagation();
              resetView();
            }}
            title="ズームをリセット"
          >
            🔍 ズームリセット
          </button>
          <button
            class="app__control-btn app__control-btn--arrange"
            onClick={(e) => {
              e.stopPropagation();
              arrangeNotes();
            }}
            title="付箋を整理配置"
          >
            📐 付箋整理
          </button>
        </div>

        <AddTodoButton />
      </Show>
    </main>
  );
}

export default App;
