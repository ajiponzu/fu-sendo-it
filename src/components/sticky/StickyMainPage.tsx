import { Component, createSignal, Show } from "solid-js";
import { todoStore } from "../../store/todoStore";

interface StickyMainPageProps {
  todoId: string;
}

const StickyMainPage: Component<StickyMainPageProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [editTitle, setEditTitle] = createSignal("");
  const [editContent, setEditContent] = createSignal("");

  // todoStoreから現在のデータを取得
  const getTodo = () =>
    todoStore.todos().find((t: any) => t.id === props.todoId);

  // 編集開始時にデータを読み込み
  const startEditing = () => {
    const todo = getTodo();
    if (todo) {
      setEditTitle(todo.title);
      setEditContent(todo.content);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    todoStore.updateTodo(props.todoId, {
      title: editTitle().trim() || "Untitled",
      content: editContent().trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleEditAreaClick = (e: MouseEvent) => {
    startEditing();
    e.preventDefault();
    e.stopPropagation();
  };

  const todo = getTodo();
  if (!todo) return null;

  return (
    <Show
      when={isEditing()}
      fallback={
        <div class="sticky-note__editable-area" onClick={handleEditAreaClick}>
          <h3 class="sticky-note__title">{todo.title || "Untitled"}</h3>
          <p class="sticky-note__text">
            {todo.content || "クリックして編集..."}
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
  );
};

export default StickyMainPage;
