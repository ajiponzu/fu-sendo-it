import { Component, createSignal } from "solid-js";
import { todoStore } from "../store/todoStore";
import { StickyColor, STICKY_COLORS } from "../types/todo";
import "./AddTodoButton.css";

const AddTodoButton: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [title, setTitle] = createSignal("");
  const [content, setContent] = createSignal("");
  const [selectedColor, setSelectedColor] = createSignal<StickyColor>("yellow");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (title().trim()) {
      todoStore.addTodo(title().trim(), content().trim(), selectedColor());
      // リセット
      setTitle("");
      setContent("");
      setSelectedColor("yellow");
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setSelectedColor("yellow");
    setIsOpen(false);
  };

  return (
    <div class="add-todo">
      <button
        class="add-todo__trigger"
        onClick={() => setIsOpen(!isOpen())}
        title="新しい付箋を追加"
      >
        ＋
      </button>

      {isOpen() && (
        <div class="add-todo__form-container">
          <form class="add-todo__form" onSubmit={handleSubmit}>
            <div class="add-todo__form-header">
              <h3>新しい付箋を追加</h3>
              <button
                type="button"
                class="add-todo__close"
                onClick={handleCancel}
              >
                ✕
              </button>
            </div>

            <div class="add-todo__form-body">
              <input
                type="text"
                class="add-todo__title-input"
                placeholder="タイトルを入力..."
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                autofocus
                required
              />

              <textarea
                class="add-todo__content-input"
                placeholder="内容を入力..."
                value={content()}
                onInput={(e) => setContent(e.currentTarget.value)}
                rows="3"
              />

              <div class="add-todo__color-section">
                <label class="add-todo__color-label">色を選択:</label>
                <div class="add-todo__color-picker">
                  {STICKY_COLORS.map((color) => (
                    <button
                      type="button"
                      class={`add-todo__color-btn add-todo__color-btn--${color} ${
                        selectedColor() === color
                          ? "add-todo__color-btn--active"
                          : ""
                      }`}
                      onClick={() => setSelectedColor(color)}
                      title={`色: ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div class="add-todo__form-actions">
                <button type="submit" class="add-todo__submit">
                  追加
                </button>
                <button
                  type="button"
                  class="add-todo__cancel"
                  onClick={handleCancel}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddTodoButton;
