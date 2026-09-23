document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const mask = document.getElementById('sidebar-mask');

    function openMenu() {
        if (sidebar) sidebar.classList.add('open');
        if (mask) mask.classList.add('open');
    }

    function closeMenu() {
        if (sidebar) sidebar.classList.remove('open');
        if (mask) mask.classList.remove('open');
    }

    function toggleMenu() {
        if (sidebar && sidebar.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    if (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleMenu();
        });
    }

    if (mask) {
        mask.addEventListener('click', function () {
            closeMenu();
        });
    }

    // 抽屉里的导航项：点完就收起抽屉
    // （抽屉位于 #pjax-container 之外，PJAX 切换页面时不会重建，播放器才不会被打断）
    if (sidebar) {
        sidebar.addEventListener('click', function (e) {
            const link = e.target.closest && e.target.closest('a');
            if (link && sidebar.classList.contains('open')) {
                closeMenu();
            }
        });
    }

    syncSidebarNav();
    document.addEventListener('pjax:complete', syncSidebarNav);
    startRunningTime();
});

/* ------------------------------------------------------------------ *
 * 网站运行时间（侧边栏「站点信息」组件）
 *   初始文案由模板按站点语言渲染，这里每秒重算一次；
 *   单位文案同样取自主题语言文件，存在 data-unit-* 上
 * ------------------------------------------------------------------ */
function startRunningTime() {
    const nodes = document.querySelectorAll('.info-running');
    if (!nodes.length) return;

    const tick = function () {
        nodes.forEach(function (node) {
            const start = new Date(node.dataset.runningStart);
            if (isNaN(start.getTime())) return;

            let seconds = Math.floor((Date.now() - start.getTime()) / 1000);
            if (seconds < 0) seconds = 0;

            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            node.textContent = [
                days, node.dataset.unitDay,
                hours, node.dataset.unitHour,
                minutes, node.dataset.unitMinute,
                secs, node.dataset.unitSecond
            ].join(' ');
        });
    };

    tick();
    setInterval(tick, 1000);
}

/* 把路径规整成 /a/b 形式，便于比较：去掉查询串、index.html 与结尾斜杠 */
function normalizePath(path) {
    let p = String(path || '').split(/[?#]/)[0];
    if (p.charAt(0) !== '/') p = '/' + p;
    p = p.replace(/index\.html$/, '');
    p = p.replace(/\/+$/, '');
    return p === '' ? '/' : p;
}

/*
 * 侧边展开栏中的导航高亮。
 * 抽屉不会被 PJAX 重建，所以每次切换页面后按当前地址重新标记激活项，
 * 规则与主题 layout/_partial/nav.ejs 中的 active 一致。
 */
function syncSidebarNav() {
    const items = document.querySelectorAll('#sidebar .mobile-nav-item');
    if (!items.length) return;

    const current = normalizePath(window.location.pathname);

    items.forEach(function (item) {
        const rule = String(item.dataset.navRule || 'current').toLowerCase();
        const target = normalizePath(item.dataset.navPath || '/');
        let active = false;

        if (rule === 'always') {
            active = true;
        } else if (rule === 'never') {
            active = false;
        } else if (rule === 'home') {
            active = current === '/';
        } else if (rule === 'archive') {
            active = current === '/archives' || current.indexOf('/archives/') === 0;
        } else {
            active = current === target;
        }

        item.classList.toggle('active', active);
    });
}
