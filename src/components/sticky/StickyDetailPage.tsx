import { Component, createSignal, Show } from "solid-js";
import { todoStore } from "../../store/todoStore";

interface StickyDetailPageProps {
  todoId: string;
}

const StickyDetailPage: Component<StickyDetailPageProps> = (props) => {
  const [editDeadline, setEditDeadline] = createSignal("");
  const [editProgress, setEditProgress] = createSignal(0);
  const [displayProgress, setDisplayProgress] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);

  // todoStoreから現在のデータを取得
  const getTodo = () => todoStore.todos().find((t) => t.id === props.todoId);

  // 初期化：コンポーネントマウント時にデータを読み込み
  const initializeData = () => {
    const todo = getTodo();
    if (todo) {
      setEditDeadline(
        todo.deadline ? todo.deadline.toISOString().split("T")[0] : ""
      );
      setEditProgress(todo.progress);
      setDisplayProgress(todo.progress);
    }
  };

  // 初期化実行
  initializeData();

  const handleDeadlineSave = () => {
    const deadlineDate = editDeadline() ? new Date(editDeadline()) : undefined;
    todoStore.updateDeadline(props.todoId, deadlineDate);
  };

  const handleProgressSave = () => {
    todoStore.updateProgress(props.todoId, editProgress());
    // 保存時に表示も更新
    setDisplayProgress(editProgress());
  };

  // 操作中の進捗率更新（表示は更新しない）
  const handleProgressChange = (value: number) => {
    setEditProgress(value);
    // ドラッグ中でなければ表示も更新
    if (!isDragging()) {
      setDisplayProgress(value);
    }
  };

  const todo = getTodo();
  if (!todo) return null;

  return (
    <div class="sticky-note__details" onMouseDown={(e) => e.stopPropagation()}>
      <div class="sticky-note__detail-group">
        <label class="sticky-note__detail-label">期限</label>
        <input
          type="date"
          class="sticky-note__date-input"
          value={editDeadline()}
          onMouseDown={(e) => e.stopPropagation()}
          onInput={(e) => {
            setEditDeadline(e.currentTarget.value);
            handleDeadlineSave();
          }}
        />
        <Show when={todo.deadline}>
          <button
            class="sticky-note__clear-btn"
            onClick={() => {
              setEditDeadline("");
              todoStore.updateDeadline(props.todoId, undefined);
            }}
            title="期限をクリア"
          >
            ✕
          </button>
        </Show>
      </div>

      <div class="sticky-note__detail-group">
        <label class="sticky-note__detail-label">
          進捗率: {displayProgress()}%
        </label>
        <input
          type="range"
          class="sticky-note__progress-slider"
          min="0"
          max="100"
          step="1"
          value={editProgress()}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDragging(true);
          }}
          onInput={(e) => {
            const value = parseInt(e.currentTarget.value);
            handleProgressChange(value);
          }}
          onMouseUp={() => {
            setIsDragging(false);
            setDisplayProgress(editProgress());
            handleProgressSave();
          }}
        />
        <div class="sticky-note__progress-input-group">
          <input
            type="number"
            class="sticky-note__progress-input"
            min="0"
            max="100"
            step="1"
            value={editProgress()}
            onMouseDown={(e) => e.stopPropagation()}
            onInput={(e) => {
              const value = Math.max(
                0,
                Math.min(100, parseInt(e.currentTarget.value) || 0)
              );
              handleProgressChange(value);
            }}
            onBlur={() => {
              handleProgressSave();
            }}
          />
          <span class="sticky-note__progress-unit">%</span>
        </div>
      </div>

      <div class="sticky-note__progress-bar">
        <div
          class="sticky-note__progress-fill"
          style={{ width: `${displayProgress()}%` }}
        />
      </div>
    </div>
  );
};

export default StickyDetailPage;
