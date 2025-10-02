import { Component, createSignal, Show } from "solid-js";
import { Todo, StickyColor } from "../types/todo";
import { todoStore } from "../store/todoStore";
import "./StickyNote.css";

interface StickyNoteProps {
  todo: Todo;
  zoomLevel: number;
}

const StickyNote: Component<StickyNoteProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [editTitle, setEditTitle] = createSignal(props.todo.title);
  const [editContent, setEditContent] = createSignal(props.todo.content);
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

  // マウスダウン開始
  const handleMouseDown = (e: MouseEvent) => {
    if (isEditing()) return; // 編集中はドラッグ無効

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

  // マウスアップ終了
  const handleMouseUp = (e: MouseEvent) => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    if (isDragging()) {
      // ドラッグ終了時に最終位置を保存
      todoStore.updatePosition(props.todo.id, tempPosition());
      setIsDragging(false);
    } else if (!hasMouseMoved()) {
      // クリックと判定された場合は編集モードに
      // ボタンやカラーピッカー以外の領域でのクリックのみ編集開始
      const target = e.target as HTMLElement;
      const isButton = target.tagName === "BUTTON" || target.closest("button");
      const isColorPicker = target.closest(".sticky-note__color-picker");

      if (!isButton && !isColorPicker && !isEditing()) {
        setIsEditing(true);
      }
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
              <h3 class="sticky-note__title">
                {props.todo.title || "Untitled"}
              </h3>
              <p class="sticky-note__text">
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
