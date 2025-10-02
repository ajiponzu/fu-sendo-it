import { Component, createSignal, Show } from "solid-js";
import { Todo, StickyColor } from "../types/todo";
import { todoStore } from "../store/todoStore";
import "./StickyNote.css";

interface StickyNoteProps {
  todo: Todo;
}

const StickyNote: Component<StickyNoteProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [editTitle, setEditTitle] = createSignal(props.todo.title);
  const [editContent, setEditContent] = createSignal(props.todo.content);
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });

  const handleSave = () => {
    todoStore.updateTodo(props.todo.id, {
      title: editTitle().trim() || "Untitled",
      content: editContent().trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(props.todo.title);
    setEditContent(props.todo.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("この付箋を削除しますか？")) {
      todoStore.deleteTodo(props.todo.id);
    }
  };

  const changeColor = (color: StickyColor) => {
    todoStore.updateTodo(props.todo.id, { color });
  };

  // ドラッグ開始
  const handleMouseDown = (e: MouseEvent) => {
    if (isEditing()) return; // 編集中はドラッグ無効

    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    e.preventDefault();
  };

  // ドラッグ中
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;

    const newPosition = {
      x: e.clientX - dragOffset().x,
      y: e.clientY - dragOffset().y,
    };

    // 画面外に出ないように制限
    const maxX = window.innerWidth - 250; // 付箋の幅を考慮
    const maxY = window.innerHeight - 200; // 付箋の高さを考慮

    newPosition.x = Math.max(0, Math.min(maxX, newPosition.x));
    newPosition.y = Math.max(0, Math.min(maxY, newPosition.y));

    todoStore.updatePosition(props.todo.id, newPosition);
  };

  // ドラッグ終了
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
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
        left: `${props.todo.position.x}px`,
        top: `${props.todo.position.y}px`,
        cursor: isDragging() ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      <div class="sticky-note__header">
        <div class="sticky-note__actions">
          <Show when={!isEditing()}>
            <button
              class="sticky-note__btn sticky-note__btn--edit"
              onClick={() => setIsEditing(true)}
              title="編集"
            >
              ✏️
            </button>
          </Show>
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
        <Show
          when={isEditing()}
          fallback={
            <div>
              <h3 class="sticky-note__title" onClick={() => setIsEditing(true)}>
                {props.todo.title || "Untitled"}
              </h3>
              <p class="sticky-note__text" onClick={() => setIsEditing(true)}>
                {props.todo.content || "クリックして編集..."}
              </p>
            </div>
          }
        >
          <div class="sticky-note__edit-form">
            <input
              type="text"
              class="sticky-note__title-input"
              value={editTitle()}
              onInput={(e) => setEditTitle(e.currentTarget.value)}
              placeholder="タイトル"
              autofocus
            />
            <textarea
              class="sticky-note__content-input"
              value={editContent()}
              onInput={(e) => setEditContent(e.currentTarget.value)}
              placeholder="内容を入力..."
              rows="4"
            />
            <div class="sticky-note__edit-actions">
              <button
                class="sticky-note__btn sticky-note__btn--save"
                onClick={handleSave}
              >
                保存
              </button>
              <button
                class="sticky-note__btn sticky-note__btn--cancel"
                onClick={handleCancel}
              >
                キャンセル
              </button>
            </div>
          </div>
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
