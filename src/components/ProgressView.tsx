import { Component, For, createSignal, Show } from "solid-js";
import { todoStore } from "../store/todoStore";
import "./ProgressView.css";

const ProgressView: Component = () => {
  // 表示モード管理（進捗率順 or 期限順）
  const [viewType, setViewType] = createSignal<"progress" | "deadline">(
    "progress"
  );
  // 進捗率でソート（高い順）
  const sortedTodos = () => {
    return [...todoStore.todos()].sort(
      (a, b) => (b.progress || 0) - (a.progress || 0)
    );
  };

  // 期限でソート（近い順）
  const todosByDeadline = () => {
    const todosWithDeadline = todoStore.todos().filter((todo) => todo.deadline);
    return todosWithDeadline.sort((a, b) => {
      const dateA = new Date(a.deadline!).getTime();
      const dateB = new Date(b.deadline!).getTime();
      return dateA - dateB;
    });
  };

  // 期限の状態を判定
  const getDeadlineStatus = (deadline: Date) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return { status: "overdue", text: `${Math.abs(diffDays)}日超過` };
    if (diffDays === 0) return { status: "today", text: "今日期限" };
    if (diffDays <= 3) return { status: "urgent", text: `残り${diffDays}日` };
    if (diffDays <= 7) return { status: "warning", text: `残り${diffDays}日` };
    return { status: "normal", text: `残り${diffDays}日` };
  };

  // 進捗率の色を取得
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "#4CAF50"; // 緑
    if (progress >= 60) return "#8BC34A"; // 薄緑
    if (progress >= 40) return "#FFC107"; // 黄
    if (progress >= 20) return "#FF9800"; // オレンジ
    return "#F44336"; // 赤
  };

  return (
    <div class="progress-view">
      {/* 表示モード切り替えボタン */}
      <div class="progress-view__switcher">
        <button
          class={`progress-view__switch-btn ${
            viewType() === "progress" ? "progress-view__switch-btn--active" : ""
          }`}
          onClick={() => setViewType("progress")}
        >
          🎯 進捗率順
        </button>
        <button
          class={`progress-view__switch-btn ${
            viewType() === "deadline" ? "progress-view__switch-btn--active" : ""
          }`}
          onClick={() => setViewType("deadline")}
        >
          ⏰ 期限順
        </button>
      </div>

      <div class="progress-view__content">
        <Show when={viewType() === "progress"}>
          <div class="progress-view__section">
            <h3>🎯 進捗率順</h3>
            <div class="progress-view__list">
              <For each={sortedTodos()}>
                {(todo) => (
                  <div
                    class={`progress-view__item progress-view__item--${todo.color}`}
                  >
                    <div class="progress-view__item-header">
                      <h4 class="progress-view__item-title">{todo.title}</h4>
                      <div class="progress-view__progress-badge">
                        {todo.progress || 0}%
                      </div>
                    </div>
                    <div class="progress-view__progress-bar">
                      <div
                        class="progress-view__progress-fill"
                        style={{
                          width: `${todo.progress || 0}%`,
                          "background-color": getProgressColor(
                            todo.progress || 0
                          ),
                        }}
                      />
                    </div>
                    <div class="progress-view__item-content">
                      {todo.content && (
                        <p class="progress-view__item-description">
                          {todo.content}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        <Show when={viewType() === "deadline"}>
          <div class="progress-view__section">
            <h3>⏰ 期限順</h3>
            <div class="progress-view__list">
              <For each={todosByDeadline()}>
                {(todo) => {
                  const deadlineInfo = getDeadlineStatus(todo.deadline!);
                  return (
                    <div
                      class={`progress-view__item progress-view__item--${todo.color}`}
                    >
                      <div class="progress-view__item-header">
                        <h4 class="progress-view__item-title">{todo.title}</h4>
                        <div
                          class={`progress-view__deadline-badge progress-view__deadline-badge--${deadlineInfo.status}`}
                        >
                          {deadlineInfo.text}
                        </div>
                      </div>
                      <div class="progress-view__item-info">
                        <span class="progress-view__deadline-date">
                          期限:{" "}
                          {new Date(todo.deadline!).toLocaleDateString("ja-JP")}
                        </span>
                        <span class="progress-view__progress-text">
                          進捗: {todo.progress || 0}%
                        </span>
                      </div>
                      <div class="progress-view__item-content">
                        {todo.content && (
                          <p class="progress-view__item-description">
                            {todo.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default ProgressView;
