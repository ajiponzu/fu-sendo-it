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
  const [showTooltip, setShowTooltip] = createSignal(false);
  const [tooltipValue, setTooltipValue] = createSignal(0);

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
    setTooltipValue(value);
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
            onClick={(e) => {
              e.stopPropagation();
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
        <div style="position: relative;">
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
              setShowTooltip(true);
              setTooltipValue(editProgress());
            }}
            onInput={(e) => {
              const value = parseInt(e.currentTarget.value);
              handleProgressChange(value);
            }}
            onMouseUp={() => {
              setIsDragging(false);
              setShowTooltip(false);
              setDisplayProgress(editProgress());
              handleProgressSave();
            }}
            onMouseLeave={() => {
              setShowTooltip(false);
            }}
          />
          <div
            class={`sticky-note__progress-tooltip ${
              showTooltip() ? "sticky-note__progress-tooltip--visible" : ""
            }`}
          >
            {tooltipValue()}%
          </div>
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
