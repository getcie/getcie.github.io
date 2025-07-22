// ==UserScript==
// @name         SaveMyNotes
// @author       DiamondPie
// @namespace    http://tampermonkey.net/
// @version      2025-07-22
// @description  去除Save My Exams复习笔记的5次查看限制
// @description:en Remove the 5-view limit for revision notes of Save My Exams
// @match        *://www.savemyexams.com/*
// @match        *://savemyexams.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=savemyexams.com
// @grant        none
// @license      MIT
// @run-at       document-start
// ==/UserScript==

const FORBIDDEN_CLASSES = [
    '[class*="RevisionNotesCountdownBanner_banner"]',
    '[class*="Wrapper_wrapper"] div [class*="FeatureSliderCTA_container"]',
    '.d-flex.flex-wrap.flex-md-nowrap.gap-3.mb-4',
    '.container-fluid .d-flex.align-items-center',
    'main .pb-5',
    '[class*="CourseNavigationPageContent_courseContent"] [class*="DownloadRibbon_wrapper"]',
];
const SCRIPT_INFO = {
    name: GM_info.script.name,
    version: GM_info.script.version
};

(function() {
    'use strict';

    console.info(`%c ${SCRIPT_INFO.name} %c v${SCRIPT_INFO.version} `, "padding: 2px 6px; border-radius: 3px 0 0 3px; color: #fff; background: #3768F7; font-weight: bold;", "padding: 2px 6px; border-radius: 0 3px 3px 0; color: #fff; background: #5C84F8; font-weight: bold;")
    console.info("\n失败不算苦涩，万物皆有终期。祝你天天开心！\n\nCopyright (c) 2025 DiamondPie. All rights reserved.\n");

    const keysToMonitor = ["SME.revision-note-views"];

    const originalSetItem = Storage.prototype.setItem;
    // 覆写 Storage.setItem 方法，检测写入的对象是否为特定键
    Storage.prototype.setItem = function(key, value) {
        if (keysToMonitor.includes(key)) {
            originalSetItem.apply(this, arguments);
            // 如果是，删除此项目
            this.removeItem(key);
        } else {
            originalSetItem.apply(this, arguments);
        }
    };

    // 监测本地存储写入事件
    window.addEventListener('storage', function(e) {
        if (keysToMonitor.includes(e.key)) {
            localStorage.removeItem(e.key);
        }
    });

    // 循环检测localStorage中是否具有笔记计数项，如果是，删除该项，轮询周期为3秒
    function pollLocalStorage() {
        keysToMonitor.forEach(key => {
            if (localStorage.getItem(key) !== null) {
                localStorage.removeItem(key);
            }
        });
    }
    setInterval(pollLocalStorage, 3000);

    // 移除非必要的广告元素，优化速度以及界面内容
    function removeForbiddenElements() {
        FORBIDDEN_CLASSES.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
        });
    }

    // 覆写 Node.removeChild() 防止移除不存在的元素时报错
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function (child) {
        try {
            if (child && this.contains(child)) {
                return originalRemoveChild.call(this, child);
            } else {
                // 静默跳过不存在的子元素，防止 NotFoundError
                console.warn("Bypassed removing an element that does not exist.")
                return null;
            }
        } catch (e) {
            console.warn('Safe removeChild caught error:', e);
            return null;
        }
    };

    // 覆写 Element.remove()，同理
    const originalRemove = Element.prototype.remove;
    Element.prototype.remove = function () {
        try {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            } else {
                console.warn("Bypassed removing an element that does not exist.");
            }
        } catch (e) {
            console.warn('Safe element.remove() caught error:', e);
        }
    };

    // 检测是否有元素插入，如有，检测他们是否符合移除条件
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                removeForbiddenElements();
                break;
            }
        }
    });

    // 开始监听 document.body 子树中的 DOM 变动
    observer.observe(document.body, { childList: true, subtree: true });

    console.info("喜报：初始化成功");
})();
