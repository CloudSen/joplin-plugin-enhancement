import { EditorView } from "@codemirror/view";
import { ContentScriptContext } from "api/types";

export let isDragging = false;
let dragStopTimer: NodeJS.Timeout | null = null;
const DRAG_STOP_THRESHOLD = 500;

const dragDetection = (context: ContentScriptContext) => EditorView.domEventHandlers({
    // Mouse down: initialize drag state (prevent misjudgment of single clicks)
    pointerdown() {
        isDragging = false;
    },
    // Mouse move + button pressed: mark as dragging state
    pointermove(e, view) {
        if (e.buttons === 1) {
            // Only trigger for left-button dragging
            isDragging = true;

            if (dragStopTimer) clearTimeout(dragStopTimer);
            dragStopTimer = setTimeout(() => {
                // 超过阈值未移动 → 标记拖拽结束
                isDragging = false;
                dragStopTimer = null; // 清空定时器标识
            }, DRAG_STOP_THRESHOLD);
        } else {
            // 左键未按下 → 直接结束拖拽
            isDragging = false;
        }
    },
    // Mouse up/leave: exit dragging state
    pointerup() {
        isDragging = false;
    },
    pointerleave() {
        isDragging = false;
    },
});

export default dragDetection;
