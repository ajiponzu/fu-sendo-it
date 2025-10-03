import { Component, createSignal, Show } from "solid-js";
import { Todo, StickyColor } from "../types/todo";
import { todoStore } from "../store/todoStore";
import StickyMainPage from "./sticky/StickyMainPage";
import StickyDetailPage from "./sticky/StickyDetailPage";
import "./StickyNote.css";

interface StickyNoteProps {
  todo: Todo;
  zoomLevel: number;
}

const StickyNote: Component<StickyNoteProps> = (props) => {
  // 座標移動関連の状態のみ
  const [isDragging, setIsDragging] = createSignal(false);
  const [tempPosition, setTempPosition] = createSignal({ x: 0, y: 0 });
  const [mouseDownPosition, setMouseDownPosition] = createSignal({
    x: 0,
    y: 0,
  });
  const [hasMouseMoved, setHasMouseMoved] = createSignal(false);
  const [dragStartPosition, setDragStartPosition] = createSignal({
    x: 0,
    y: 0,
  });

  // ページ切り替え機能（todoStoreの状態を使用）
  const setCurrentPage = (page: number) => {
    todoStore.updateCurrentPage(props.todo.id, page);
  };

  // 削除機能
  const handleDelete = () => {
    if (confirm("この付箋を削除しますか？")) {
      todoStore.deleteTodo(props.todo.id);
    }
  };

  // 色変更機能
  const changeColor = (color: StickyColor) => {
    todoStore.updateTodo(props.todo.id, { color });
  };

  // マウスダウン開始（座標移動専用）
  const handleMouseDown = (e: MouseEvent) => {
    // 進捗率設定要素でのドラッグを無効にする
    const target = e.target as HTMLElement;
    const inputTarget = target as HTMLInputElement;
    const isProgressControl =
      inputTarget.type === "range" ||
      inputTarget.type === "number" ||
      inputTarget.type === "date" ||
      target.classList.contains("sticky-note__progress-slider") ||
      target.classList.contains("sticky-note__progress-input") ||
      target.classList.contains("sticky-note__date-input") ||
      target.classList.contains("sticky-note__progress-unit") ||
      target.closest(".sticky-note__progress-slider") ||
      target.closest(".sticky-note__progress-input") ||
      target.closest(".sticky-note__progress-input-group") ||
      target.closest(".sticky-note__date-input") ||
      target.closest(".sticky-note__detail-group") ||
      target.closest(".sticky-note__progress-bar");

    if (isProgressControl) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    // 入力フィールドでのドラッグを無効にする
    const isInputField =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("input") ||
      target.closest("textarea");
    if (isInputField) return;

    // マウスダウン位置を記録
    setMouseDownPosition({ x: e.clientX, y: e.clientY });
    setHasMouseMoved(false);
    setTempPosition({ x: props.todo.position.x, y: props.todo.position.y });
    setDragStartPosition({
      x: props.todo.position.x,
      y: props.todo.position.y,
    });

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    e.preventDefault();
  };

  // マウス移動中
  const handleMouseMove = (e: MouseEvent) => {
    const moveDistance = Math.sqrt(
      Math.pow(e.clientX - mouseDownPosition().x, 2) +
        Math.pow(e.clientY - mouseDownPosition().y, 2)
    );

    // 5px以上移動したらドラッグ開始
    if (moveDistance > 5 && !hasMouseMoved()) {
      setHasMouseMoved(true);
      setIsDragging(true);
    }

    if (!isDragging()) return;

    // ズームレベルを考慮した相対移動量を計算
    const deltaX = (e.clientX - mouseDownPosition().x) / props.zoomLevel;
    const deltaY = (e.clientY - mouseDownPosition().y) / props.zoomLevel;

    const newPosition = {
      x: dragStartPosition().x + deltaX,
      y: dragStartPosition().y + deltaY,
    };

    // ズーム時も実際の利用可能領域で制限（ズームアウト時により広い範囲で移動可能）
    const effectiveWidth = window.innerWidth / props.zoomLevel;
    const effectiveHeight = window.innerHeight / props.zoomLevel;

    const maxX = effectiveWidth - 50; // 付箋が見切れないための余白
    const maxY = effectiveHeight - 50;

    newPosition.x = Math.max(20, Math.min(maxX, newPosition.x));
    newPosition.y = Math.max(20, Math.min(maxY, newPosition.y));

    // ドラッグ中は一時的な位置のみ更新
    setTempPosition(newPosition);
  };

  // マウスアップ終了（座標移動専用）
  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    if (isDragging()) {
      // ドラッグ終了時に最終位置を保存
      todoStore.updatePosition(props.todo.id, tempPosition());
      setIsDragging(false);
    }

    setHasMouseMoved(false);
  };

  // ランダムな回転角度を生成（付箋らしい効果）
  const randomRotation = () => {
    const seed = props.todo.id.charCodeAt(0) + props.todo.id.charCodeAt(1);
    return ((seed % 11) - 5) * 0.5; // -2.5度から2.5度の範囲
  };

  return (
    <div
      class={`sticky-note sticky-note--${props.todo.color} ${
        isDragging() ? "sticky-note--dragging" : ""
      }`}
      style={{
        transform: `rotate(${randomRotation()}deg)`,
        position: "absolute",
        left: `${isDragging() ? tempPosition().x : props.todo.position.x}px`,
        top: `${isDragging() ? tempPosition().y : props.todo.position.y}px`,
        cursor: isDragging() ? "grabbing" : "pointer",
      }}
      onMouseDown={handleMouseDown}
    >
      <div class="sticky-note__header">
        <div class="sticky-note__page-indicator">
          <button
            class={`sticky-note__page-btn ${
              props.todo.currentPage === 1 ? "sticky-note__page-btn--active" : ""
            }`}
            onClick={() => setCurrentPage(1)}
          >
            📝
          </button>
          <button
            class={`sticky-note__page-btn ${
              props.todo.currentPage === 2 ? "sticky-note__page-btn--active" : ""
            }`}
            onClick={() => setCurrentPage(2)}
          >
            📊
          </button>
        </div>
        <div class="sticky-note__actions">
          <button
            class="sticky-note__btn sticky-note__btn--delete"
            onClick={handleDelete}
            title="削除"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="sticky-note__content">
        <Show when={props.todo.currentPage === 1}>
          <StickyMainPage todoId={props.todo.id} />
        </Show>

        <Show when={props.todo.currentPage === 2}>
          <StickyDetailPage todoId={props.todo.id} />
        </Show>
      </div>

      <div class="sticky-note__footer">
        <div class="sticky-note__color-picker">
          {["yellow", "pink", "blue", "green", "orange", "purple"].map(
            (color) => (
              <button
                class={`sticky-note__color-btn sticky-note__color-btn--${color} ${
                  props.todo.color === color
                    ? "sticky-note__color-btn--active"
                    : ""
                }`}
                onClick={() => changeColor(color as StickyColor)}
                title={`色を${color}に変更`}
              />
            )
          )}
        </div>
        <div class="sticky-note__timestamp">
          {new Date(props.todo.updatedAt).toLocaleDateString("ja-JP")}
        </div>
      </div>
    </div>
  );
};

export default StickyNote;
