import { onMount, For, Show, createSignal } from "solid-js";
import { todoStore } from "./store/todoStore";
import StickyNote from "./components/StickyNote";
import AddTodoButton from "./components/AddTodoButton";
import ProgressView from "./components/ProgressView";
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

  // 全体のドラッグ状態管理（背景ドラッグか付箋ドラッグかを区別）
  const [isAnyDragging, setIsAnyDragging] = createSignal(false);

  // 表示モード管理（ワークスペース or 進捗確認）
  const [viewMode, setViewMode] = createSignal<"workspace" | "progress">(
    "workspace"
  );

  // UIコントロールの表示・非表示管理
  const [isUIVisible, setIsUIVisible] = createSignal(true);

  // Markdown出力ウィザード管理
  const [showExportWizard, setShowExportWizard] = createSignal(false);
  const [exportPath, setExportPath] = createSignal("");

  // Markdown生成・保存機能
  const generateMarkdownReport = () => {
    const todos = todoStore.todos();
    const now = new Date();

    // Markdownコンテンツ生成
    let markdown = `# 📝 タスク管理レポート

生成日時: ${now.toLocaleString("ja-JP")}

## 📊 タスク情報マトリックス

| タスクタイトル | 進捗率 | 期限 | 内容 |
|---|---|---|---|
`;

    todos.forEach((todo) => {
      const title = todo.title.replace(/\|/g, "\\|"); // パイプ文字をエスケープ
      const progress = `${todo.progress || 0}%`;
      const deadline = todo.deadline
        ? new Date(todo.deadline).toLocaleDateString("ja-JP")
        : "-";
      const content = todo.content
        ? todo.content.replace(/\|/g, "\\|").replace(/\n/g, " ")
        : "-";

      markdown += `| ${title} | ${progress} | ${deadline} | ${content} |\n`;
    });

    // タスク進捗ダッシュボード
    markdown += `\n## 🎯 タスク進捗ダッシュボード

`;

    // 期限でソートしたタスク（緊急度順）
    const sortedTodos = todos.sort((a, b) => {
      // 期限超過が最優先
      const aOverdue = a.deadline && new Date(a.deadline) < now;
      const bOverdue = b.deadline && new Date(b.deadline) < now;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // 次に期限の近い順
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    sortedTodos.forEach((todo, index) => {
      const progress = todo.progress || 0;

      // ステータス絵文字
      let statusEmoji = "⚪"; // 未着手
      if (progress >= 100) statusEmoji = "✅"; // 完了
      else if (progress >= 75) statusEmoji = "🟢"; // 順調
      else if (progress >= 50) statusEmoji = "🟡"; // 進行中
      else if (progress >= 25) statusEmoji = "🟠"; // 開始済み
      else if (progress > 0) statusEmoji = "🔵"; // 少し進行

      // 期限ステータス
      let deadlineEmoji = "📅";
      let deadlineText = "期限なし";
      if (todo.deadline) {
        const deadlineDate = new Date(todo.deadline);
        const diffTime = deadlineDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          deadlineEmoji = "🚨";
          deadlineText = `${Math.abs(diffDays)}日超過`;
        } else if (diffDays === 0) {
          deadlineEmoji = "⏰";
          deadlineText = "今日期限";
        } else if (diffDays <= 3) {
          deadlineEmoji = "🔥";
          deadlineText = `残り${diffDays}日`;
        } else if (diffDays <= 7) {
          deadlineEmoji = "⚡";
          deadlineText = `残り${diffDays}日`;
        } else {
          deadlineEmoji = "📅";
          deadlineText = `残り${diffDays}日`;
        }
      }

      // 進捗バー（視覚的改善版）
      const segments = Math.floor(progress / 10);
      let progressBar = "";
      for (let i = 0; i < 10; i++) {
        if (i < segments) {
          if (progress >= 100) progressBar += "🟩"; // 完了
          else if (progress >= 75) progressBar += "🟨"; // 順調
          else if (progress >= 50) progressBar += "🟧"; // 進行中
          else progressBar += "🟦"; // 開始済み
        } else {
          progressBar += "⬜"; // 未完了
        }
      }

      markdown += `### ${index + 1}. ${statusEmoji} ${todo.title}

**進捗**: ${progress}% ${progressBar}
**期限**: ${deadlineEmoji} ${deadlineText}
${
  todo.deadline
    ? `**期限日**: ${new Date(todo.deadline).toLocaleDateString("ja-JP")}`
    : ""
}

---

`;
    });

    markdown += `### 📊 ステータス凡例

**進捗状況**:
- ✅ 完了 (100%)
- 🟢 順調 (75%以上)
- 🟡 進行中 (50%以上)
- 🟠 開始済み (25%以上)
- 🔵 少し進行 (1%以上)
- ⚪ 未着手 (0%)

**期限状況**:
- 🚨 期限超過
- ⏰ 今日期限
- 🔥 残り3日以内
- ⚡ 残り7日以内
- 📅 期限あり/なし

**進捗バー**:
- 🟩 完了部分 / 🟨 順調部分 / 🟧 進行部分 / 🟦 開始部分 / ⬜ 未完了部分

---
*このレポートは付箋アプリから自動生成されました*
`;

    return markdown;
  };

  // Markdown保存機能
  const saveMarkdownReport = async () => {
    try {
      const markdown = generateMarkdownReport();
      const blob = new Blob([markdown], {
        type: "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `付箋レポート_${new Date().toISOString().split("T")[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("レポート保存エラー:", error);
      alert("レポートの保存に失敗しました");
    }
  };

  // ディレクトリ選択機能（Rustバックエンド）
  const selectDirectory = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const dirPath = await invoke("select_directory");
      const fileName = `付箋レポート_${
        new Date().toISOString().split("T")[0]
      }.md`;
      setExportPath(`${dirPath}/${fileName}`);
    } catch (error) {
      console.error("ディレクトリ選択エラー:", error);
      alert("ディレクトリの選択に失敗しました。");
    }
  };

  // Markdown保存機能（ウィザード版、Rustバックエンド）
  const saveMarkdownReportFromWizard = async () => {
    try {
      const markdown = generateMarkdownReport();
      const { invoke } = await import("@tauri-apps/api/core");

      const fileName = `付箋レポート_${
        new Date().toISOString().split("T")[0]
      }.md`;

      if (exportPath()) {
        // ユーザーが指定したパスに保存
        await invoke("write_file_to_path", {
          filePath: exportPath(),
          content: markdown,
        });
        alert(`レポートを保存しました:\n${exportPath()}`);
      } else {
        // 保存ダイアログを表示
        const savedPath = await invoke("save_markdown_file", {
          content: markdown,
          filename: fileName,
        });
        alert(`レポートを保存しました:\n${savedPath}`);
      }

      // ウィザードを閉じる
      setShowExportWizard(false);
      setExportPath("");
    } catch (error) {
      console.error("レポート保存エラー:", error);
      alert("レポートの保存に失敗しました");
    }
  };

  // ウィザードを開く
  const openExportWizard = () => {
    setExportPath(""); // パスをリセット
    setShowExportWizard(true);
  };

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
    setIsAnyDragging(true);
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
    setIsAnyDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // 付箋を整理配置する関数
  const arrangeNotes = async () => {
    await todoStore.arrangeNotes();
    // 整理後に表示位置もリセットして付箋が見やすい位置に戻す
    setViewOffset({ x: 0, y: 0 });
    setZoomLevel(1);
    setTransformOrigin("50% 50%");
  };

  return (
    <main class="app">
      {/* ヘッダーボタン群 */}
      <div class="app__header-buttons">
        {/* UI表示切り替えボタン */}
        <button
          class="app__ui-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setIsUIVisible(!isUIVisible());
          }}
          title={isUIVisible() ? "UIを非表示" : "UIを表示"}
        >
          {isUIVisible() ? "▲ UI非表示" : "▼ UI表示"}
        </button>

        {/* Markdownレポート出力ボタン */}
        <button
          class="app__markdown-export"
          onClick={(e) => {
            e.stopPropagation();
            openExportWizard();
          }}
          title="進捗レポートをMarkdown形式で保存"
        >
          📄 レポート出力
        </button>
      </div>

      {/* 表示モード切り替えボタン */}
      <Show when={isUIVisible()}>
        <div class="app__mode-switcher">
          <button
            class={`app__mode-btn ${
              viewMode() === "workspace" ? "app__mode-btn--active" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setViewMode("workspace");
            }}
          >
            📝 ワークスペース
          </button>
          <button
            class={`app__mode-btn ${
              viewMode() === "progress" ? "app__mode-btn--active" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setViewMode("progress");
            }}
          >
            📊 進捗確認
          </button>
        </div>
      </Show>

      <Show
        when={!todoStore.isLoading()}
        fallback={
          <div class="app__loading">
            <h2>📝 読み込み中...</h2>
            <p>付箋データを読み込んでいます</p>
          </div>
        }
      >
        <Show when={viewMode() === "workspace"}>
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
                const newZoom = Math.min(
                  Math.max(zoomLevel() + delta, 0.5),
                  2.0
                );
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
                  {(todo) => (
                    <StickyNote
                      todo={todo}
                      zoomLevel={zoomLevel()}
                      onDragStart={() => setIsAnyDragging(true)}
                      onDragEnd={() => setIsAnyDragging(false)}
                    />
                  )}
                </For>
              </Show>
            </div>
          </div>

          <Show when={isUIVisible()}>
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

          {/* ドラッグ中の座標表示 */}
          <Show when={isAnyDragging()}>
            <div class="app__drag-coordinates">
              <div class="app__drag-coordinate app__drag-coordinate--left">
                <div class="app__coordinate-label">X</div>
                <div class="app__coordinate-value">
                  {Math.round(viewOffset().x)}
                </div>
              </div>
              <div class="app__drag-coordinate app__drag-coordinate--right">
                <div class="app__coordinate-label">Y</div>
                <div class="app__coordinate-value">
                  {Math.round(viewOffset().y)}
                </div>
              </div>
            </div>
          </Show>
        </Show>

        <Show when={viewMode() === "progress"}>
          <ProgressView />
        </Show>
      </Show>

      {/* Markdown出力ウィザード */}
      <Show when={showExportWizard()}>
        <div class="app__export-wizard-overlay">
          <div class="app__export-wizard">
            <h3>📄 レポート出力設定</h3>
            <p>Markdownレポートの保存先を指定してください</p>

            <div class="app__export-path-group">
              <label for="exportPath">保存先パス:</label>
              <div class="app__export-path-input">
                <input
                  id="exportPath"
                  type="text"
                  class="app__export-path-field"
                  value={exportPath()}
                  onInput={(e) => setExportPath(e.currentTarget.value)}
                  placeholder="保存先ディレクトリを入力または参照で選択"
                />
                <button
                  class="app__export-browse-btn"
                  onClick={selectDirectory}
                  title="ディレクトリを参照"
                >
                  📁 参照
                </button>
              </div>
            </div>

            <div class="app__export-wizard-buttons">
              <button
                class="app__export-wizard-btn app__export-wizard-btn--ok"
                onClick={saveMarkdownReportFromWizard}
              >
                💾 保存
              </button>
              <button
                class="app__export-wizard-btn app__export-wizard-btn--cancel"
                onClick={() => {
                  setShowExportWizard(false);
                  setExportPath("");
                }}
              >
                ❌ キャンセル
              </button>
            </div>
          </div>
        </div>
      </Show>
    </main>
  );
}

export default App;
