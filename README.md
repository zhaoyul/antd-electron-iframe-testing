Kevin，你碰到的“全局卡死”基本属于浏览器渲染死锁，而不是 React 或 Ant Design 本身的逻辑错误。把 AntD 组件塞进 `<svg>` → `<foreignObject>` → `<iframe>` 这一组合里，正好踩中了几个浏览器底层的“黑洞”——一旦 AntD 弹出 **Modal/Message/Notification** 这种基于 *portal* 的浮层，就会触发以下连环效应：

| 环节                                  | 发生了什么                                                                                                                                                                                                                                                                                                                                          | 结果 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -- |
| **1. Portal + foreignObject**       | AntD Modal 会 `ReactDOM.createPortal()` 到 `document.body`。可是在 `<iframe>` 里，`body` 实际处于 `foreignObject` 的 SVG 子树，而浏览器对 *HTML-in-SVG* 的布局实现多年未完善。Chrome 上早有 [#771852](https://bugs.chromium.org/p/chromium/issues/detail?id=771852) 报告，`foreignObject` 内部元素一旦触发重排，可能导致无限循环布局计算，CPU 飙满直到标签页失去响应 ([stackoverflow.com][1], [issues.chromium.org][2]) |    |
| **2. `position: fixed` 与 SVG 视口冲突** | AntD 浮层遮罩 `.ant-modal-root` 使用 `position: fixed`；在 `foreignObject` 里，浏览器需要把 *CSS 视口* 映射到 *SVG 视口*，这一映射在 Chrome/Safari 均存在裁剪与回流 Bug ([issues.chromium.org][2])                                                                                                                                                                                  |    |
| **3. ResizeObserver 回环**            | AntD 5 依赖 `rc-resize-observer` 来监听组件尺寸。当**布局在步骤 1、2 里抖动**时，`ResizeObserver` 连环触发，Chrome 会抛出 *ResizeObserver loop limit exceeded*，随后强制刷新导致再次布局，形成死锁 ([stackoverflow.com][3], [github.com][4])                                                                                                                                                   |    |
| **4. Focus-trap & Scroll-lock**     | Modal 为了锁定滚动与焦点，会给 `body` 动态加 `overflow: hidden;` 并捕获 `focusin`。在 iframe/foreignObject 场景里，焦点事件跨文档冒泡常常失败，脚本进入等待状态，进一步放大卡顿 ([ant.design][5])                                                                                                                                                                                                    |    |

---

### 可行的规避 / 修复策略

1. **彻底避开 foreignObject**
   把 SVG 放在独立 `<iframe>` 或直接 `<img>/<object>`；UI 层（AntD/React）放在正常的 HTML 树里，再用 `position: absolute` 叠加到 SVG 之上。只保留鼠标事件透传到 SVG 即可。

   > 这是最稳妥的做法，完全绕过浏览器对 *HTML-in-SVG* 的兼容坑。

2. **让 Modal 渲染到安全容器**
   如果 iframe 不能去掉，可在该 iframe 内部统一建一个普通 `<div id="modal-root">`，并通过：

   ```tsx
   import {ConfigProvider} from 'antd';

   const App = () => (
     <ConfigProvider
       getPopupContainer={() => document.getElementById('modal-root')!}
     >
       {/* 你的业务组件 */}
     </ConfigProvider>
   );
   ```

   让所有弹窗固定挂在这个容器，而**不要**再挂到 `document.body`（默认行为）。这样可以避免 portal 跑到 foreignObject 的布局层。

3. **禁用 `position: fixed`**
   在容器内用 CSS 覆盖：

   ```css
   .ant-modal-root,
   .ant-message,
   .ant-notification {
     position: absolute !important;
   }
   ```

   把定位交给本地 CSSFlow，避免触发浏览器对 fixed-viewport 的异常计算。

4. **关掉滚动与焦点陷阱**
   若仍出现“点不到”或“焦点丢失”，可给 Modal 传递：

   ```tsx
   <Modal
     mask={false}          // 先去遮罩
     focusTriggerAfterClose={false}
     keyboard={false}
   />
   ```

   或使用 `Modal.useModal` 手动管理开关，确保关闭时立刻移除监听。

5. **加自定义节流的 ResizeObserver**
   在最外围用 `ResizeObserver` 监听 foreignObject/iframe 尺寸变化时，自己做 `requestAnimationFrame` 节流，防止 AntD 内部 Observer 级联触发。

---

### 调试 Checklist

1. Chrome DevTools ➜ Performance ➜ 录制卡顿，查看是否大量 `Layout` & `Recalculate Style` 在 `.ant-modal-root`、`foreignObject`。
2. Console 是否反复出现 `ResizeObserver loop limit exceeded`。
3. DevTools ➜ Layers 面板，看 `.ant-modal-root` 是否因为 `position: fixed` 落在视口 (0,0) 但被 SVG clip 掉。

---

#### 小结

“AntD + `<foreignObject>` + `<iframe>` + Modal” 是一条众所周知的深坑路径：浏览器对 SVG 嵌套 HTML 的支持不完整，加上 AntD 浮层一系列 *portal / fixed / focus-trap* 机制，极易触发无限布局循环或焦点死锁，表面现象就是“全局卡死”。绕开 foreignObject、指定安全的弹窗挂载点，并减少 `position: fixed`、`ResizeObserver` 滥用，基本就能解决。

[1]: https://stackoverflow.com/questions/46561099/div-inside-svg-foreignobject-loses-its-position-and-not-visible-in-latest-chrome?utm_source=chatgpt.com "Div inside SVG foreignObject loses its position and not visible in ..."
[2]: https://issues.chromium.org/41203405?utm_source=chatgpt.com "fixed inside of foreignObject has strange scroll and clip behavior ..."
[3]: https://stackoverflow.com/questions/76187282/how-to-fix-resizeobserver-loop-completed-with-undelivered-notifications?utm_source=chatgpt.com "How to fix \"ResizeObserver loop completed with undelivered ..."
[4]: https://github.com/floating-ui/floating-ui/issues/1740?utm_source=chatgpt.com "ResizeObserver loop limit exceeded · Issue #1740 · floating-ui ..."
[5]: https://ant.design/components/modal/?utm_source=chatgpt.com "Modal - Ant Design"
