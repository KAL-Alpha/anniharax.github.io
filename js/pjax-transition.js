'use strict';

/*
 * PJAX 页面切换过渡
 *
 *   点击链接 → pjax:send     给 #pjax-container / #pjax-header 加 .pjax-leaving
 *                            （变淡并轻微上移，作为「已响应点击」的即时反馈）
 *   内容替换 → pjax:complete 换成 .pjax-entering 播放淡入动画；出错时也会还原，
 *                            不会卡在半透明状态
 *
 * 淡入用的是 keyframes 动画而不是「置为透明→下一帧移除」的过渡：
 * 后者依赖帧回调，页面被浏览器节流（后台标签、不可见）时回调不执行，
 * 类会一直挂着、正文停在 opacity:0，看起来像整页空白。
 * 动画即使没播放，元素自身仍是常态样式，不会把内容卡住。
 *
 * #pjax-container 与 #pjax-header 是 pjax 的替换目标，元素本身不会被重建，
 * 所以标记类挂在它们上面即可跨越替换生效。
 * #sidebar 不在替换范围内、内容不变，但同样挂上标记类，
 * 让它与正文、顶栏同向淡入（移动端由 CSS 排除，抽屉有自己的位移动画）。
 *
 * 系统开启「减少动态效果」时整段过渡跳过（CSS 里也做了同样的兜底）。
 */

(function () {
    var SELECTOR = '#pjax-container, #pjax-header, #sidebar';
    var LEAVING = 'pjax-leaving';
    var ENTERING = 'pjax-entering';

    function reduceMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function targets() {
        return Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
    }

    function clear(el) {
        el.classList.remove(LEAVING);
        el.classList.remove(ENTERING);
    }

    function reset() {
        targets().forEach(clear);
    }

    function leave() {
        if (reduceMotion()) return;
        targets().forEach(function (el) {
            el.classList.remove(ENTERING);
            el.classList.add(LEAVING);
        });
    }

    function enter() {
        var els = targets();
        els.forEach(clear);
        if (reduceMotion()) return;

        els.forEach(function (el) {
            void el.offsetWidth; // 强制回流，保证同名动画能重新播放
            el.classList.add(ENTERING);
        });
    }

    document.addEventListener('pjax:send', leave);
    document.addEventListener('pjax:complete', enter);
    ['pjax:error', 'pjax:timeout'].forEach(function (name) {
        document.addEventListener(name, reset);
    });

    // 动画播完后摘掉标记类（只是保持 DOM 干净；
    // 即使这个回调没执行，内容也不会受影响）
    document.addEventListener('animationend', function (e) {
        if (e.animationName === 'pjax-enter') {
            e.target.classList.remove(ENTERING);
        }
    });
})();
