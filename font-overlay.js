(() => {
    if (new URLSearchParams(location.search).has("__marpichFontPreview")) return;
    const key = "__marpichFontAudit";
    if (window[key]) {
        window[key].toggle();
        return;
    }

    const host = document.createElement("div");
    host.setAttribute("data-marpich-font-audit", "root");
    const shadow = host.attachShadow({ mode: "open" });
    const state = { current: [], captures: [], marks: true, hidden: false, preview: false, listeners: [], previewListeners: [] };
    let pageWindow = window;
    let pageDocument = document;
    let resizeTimer = 0;

    const style = document.createElement("style");
    const nonceSource = document.querySelector("style[nonce],script[nonce]");
    if (nonceSource?.nonce) style.nonce = nonceSource.nonce;
    style.textContent = `
        :host{all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;color-scheme:light;font-family:Arial,Tahoma,sans-serif}
        *{box-sizing:border-box}
        .panel{position:fixed;z-index:2;right:14px;bottom:14px;width:min(980px,calc(100vw - 28px));max-height:min(84vh,820px);display:flex;flex-direction:column;overflow:hidden;border:1px solid rgb(213,222,235);border-radius:16px;background:white;color:rgb(22,35,59);box-shadow:0 18px 70px rgba(7,21,43,.33);pointer-events:auto;font:13px/1.5 Arial,Tahoma,sans-serif;direction:rtl}
        .top{display:flex;align-items:center;gap:12px;padding:13px 16px;background:rgb(16,26,48);color:white}
        .brand{min-width:0;flex:1}.brand strong{display:block;font-size:15px}.brand small{display:block;margin-top:2px;color:rgb(196,207,223);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;text-align:right;unicode-bidi:isolate}
        button{min-height:34px;padding:6px 10px;border:1px solid rgb(211,221,236);border-radius:8px;background:white;color:rgb(33,51,78);font:600 12px Arial,Tahoma,sans-serif;cursor:pointer;white-space:nowrap}
        button:hover{background:rgb(238,245,255);border-color:rgb(131,189,242)}button.primary{background:rgb(248,118,12);border-color:rgb(248,118,12);color:rgb(255,255,255)}button.primary:hover{background:rgb(233,103,6)}button.close{width:34px;padding:0;background:rgb(38,51,74);border-color:rgb(77,90,112);color:white;font-size:17px}
        .actions{display:flex;flex-wrap:wrap;align-items:center;gap:7px;padding:10px 12px;border-bottom:1px solid rgb(226,232,240);background:rgb(247,249,252)}
        .search{flex:1 1 180px;min-width:150px;height:34px;padding:6px 9px;border:1px solid rgb(208,219,234);border-radius:8px;background:white;color:rgb(20,35,60);font:13px Arial,Tahoma,sans-serif;direction:rtl}
        .toggle{display:flex;align-items:center;gap:5px;padding:0 5px;color:rgb(83,100,124);font-size:11px;white-space:nowrap}.toggle input{accent-color:rgb(53,127,189)}
        .status{display:flex;justify-content:space-between;gap:10px;padding:8px 14px;color:rgb(86,103,127);background:rgb(255,255,255);font-size:11px}.status span{direction:ltr;text-align:left;unicode-bidi:isolate}.status b{color:rgb(36,94,153);white-space:nowrap}
        .notice{margin:0 12px 8px;padding:8px 10px;border-radius:8px;background:rgb(234,244,255);color:rgb(56,87,121);font-size:11px}
        .viewport-controls{display:grid;grid-template-columns:minmax(150px,1fr) auto auto auto;align-items:center;gap:7px;padding:9px 12px;border-bottom:1px solid rgb(226,232,240);background:white}.viewport-controls strong{font-size:11px;color:rgb(57,76,102)}.viewport-controls label{display:flex;align-items:center;gap:4px;color:rgb(93,109,131);font-size:10px;white-space:nowrap}.viewport-controls input,.viewport-controls select{height:32px;padding:4px 7px;border:1px solid rgb(208,219,234);border-radius:7px;background:white;color:rgb(20,35,60);font:12px Arial,Tahoma,sans-serif}.viewport-controls input{width:74px;direction:ltr}.viewport-controls select{min-width:120px}.viewport-controls .preview-toggle{min-width:106px}
        .launcher{position:fixed;z-index:4;right:14px;bottom:14px;width:48px;height:48px;padding:0;border:0;border-radius:50%;background:rgb(16,26,48);color:white;box-shadow:0 8px 26px rgba(7,21,43,.3);font:700 13px Arial,Tahoma,sans-serif;cursor:pointer;pointer-events:auto}.launcher:hover{background:rgb(36,94,153)}
        [hidden]{display:none!important}.panel{width:min(540px,calc(100vw - 28px))}.panel>.actions,.panel>.status,.panel>.notice,.panel>.results,.panel>.bottom,.panel .url{display:none!important}.panel .viewport-controls{display:flex;flex-wrap:wrap}.viewport-shell{position:fixed;z-index:0;inset:0;display:flex;flex-direction:column;align-items:stretch;gap:0;overflow:auto;padding:0;background:rgb(20,28,43);pointer-events:auto;overscroll-behavior:contain}.preview-toolbar{position:sticky;top:0;z-index:2;display:flex;flex:none;align-items:center;justify-content:center;gap:8px;width:max-content;max-width:100%;padding:5px 8px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(16,26,48,.96);color:white;font:11px Arial,Tahoma,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.2)}.preview-toolbar span{padding:0 4px;direction:ltr;white-space:nowrap}.preview-toolbar button{min-height:28px;padding:4px 8px;font-size:11px}.preview-frame{display:block;flex:none;margin:0 auto;border:0;background:white;box-shadow:0 8px 28px rgba(0,0,0,.28)}
        .results{min-height:100px;overflow:auto;padding:0 12px 12px;overscroll-behavior:contain}
        .item{display:grid;grid-template-columns:145px minmax(130px,1.1fr) minmax(250px,1.6fr);gap:10px;align-items:start;padding:10px;border-top:1px solid rgb(230,235,242)}
        .role{font-weight:700;color:rgb(23,41,67)}.sample{min-width:0;color:rgb(52,68,92);overflow-wrap:anywhere}.sample small{display:block;margin-top:4px;color:rgb(122,135,153);font-size:10px;direction:ltr;text-align:left;overflow-wrap:anywhere}
        .values{display:flex;flex-wrap:wrap;gap:5px}.chip{padding:3px 7px;border:1px solid rgb(220,229,239);border-radius:999px;background:rgb(246,249,252);color:rgb(64,83,108);font-size:10px;direction:ltr;unicode-bidi:plaintext}.chip.size{border-color:rgb(185,215,245);background:rgb(234,244,255);color:rgb(24,85,142);font-weight:700}
        .empty{padding:28px 12px;text-align:center;color:rgb(109,123,144)}.bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 13px;border-top:1px solid rgb(227,233,241);color:rgb(107,120,138);background:rgb(251,252,254);font-size:10px}
        .mark{position:fixed;z-index:1;box-sizing:border-box;border:1px solid rgb(242,109,50);background:rgba(242,109,50,.025);pointer-events:none}.mark.title{border-color:rgb(241,145,39);background:rgba(241,145,39,.025)}.mark.cta{border-color:rgb(48,162,123);background:rgba(48,162,123,.025)}.mark-label{position:absolute;top:-1px;right:-1px;transform:translateY(-100%);max-width:min(260px,calc(100vw - 16px));padding:2px 5px;border-radius:4px 4px 0 0;background:rgb(21,36,58);color:white;font:10px/1.35 Arial,Tahoma,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:rtl}
        @media(max-width:700px){.panel{right:7px;bottom:7px;width:calc(100vw - 14px);max-height:88vh;border-radius:12px}.top{gap:7px;padding:10px}.brand strong{font-size:13px}.actions{gap:5px;padding:8px}.item{grid-template-columns:1fr;gap:5px;padding:9px}.values{gap:4px}.bottom{align-items:flex-start;flex-direction:column}.search{flex-basis:100%}.viewport-controls{grid-template-columns:1fr 1fr;gap:6px;padding:8px}.viewport-controls strong{grid-column:1/-1}.viewport-controls select{grid-column:1/-1;width:100%}.viewport-controls .preview-toggle{grid-column:1/-1;width:100%}.viewport-controls label{justify-content:space-between}.viewport-controls input{width:70px}.viewport-shell{padding:0}.preview-toolbar{gap:4px;padding:4px}.preview-toolbar button{padding:3px 6px;font-size:10px}.launcher{right:8px;bottom:8px;width:44px;height:44px}}
    `;
    shadow.appendChild(style);

    const panel = document.createElement("section");
    panel.className = "panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "بازرس فونت صفحه");
    panel.innerHTML = `
        <header class="top"><div class="brand"><strong>بازرس فونت صفحه</strong><small class="url"></small></div><button class="close" type="button" title="بستن ابزار" aria-label="بستن">×</button></header>
        <div class="actions">
            <input class="search" type="search" placeholder="جست‌وجو در نقش یا متن…" aria-label="جست‌وجو" />
            <button class="rescan" type="button">اسکن دوباره</button>
            <button class="capture primary" type="button">ثبت این اندازه</button>
            <label class="toggle"><input class="show-marks" type="checkbox" checked /> برچسب روی صفحه</label>
            <button class="csv" type="button">دانلود CSV</button>
            <button class="json" type="button">دانلود JSON</button>
            <button class="clear" type="button">پاک‌کردن ثبت‌ها</button>
        </div>
        <div class="viewport-controls" aria-label="تنظیم اندازه پیش‌نمایش">
            <strong>اندازه صفحه برای بررسی واکنش‌گرا</strong>
            <select class="viewport-preset" aria-label="اندازه آماده صفحه">
                <option value="custom">اندازه دلخواه</option>
                <option value="390x844">موبایل · 390 × 844</option>
                <option value="768x1024">تبلت · 768 × 1024</option>
                <option value="1366x900">دسکتاپ · 1366 × 900</option>
                <option value="1920x1080">دسکتاپ بزرگ · 1920 × 1080</option>
            </select>
            <label>عرض <input class="viewport-width" type="number" min="320" max="3840" step="1" inputmode="numeric" /> px</label>
            <label>ارتفاع <input class="viewport-height" type="number" min="320" max="3000" step="1" inputmode="numeric" /> px</label>
            <button class="preview-toggle primary" type="button">پیش‌نمایش این اندازه</button>
        </div>
        <div class="status"><span></span><b></b></div>
        <p class="notice">اندازه دلخواه را وارد کن یا یک اندازه آماده انتخاب کن؛ پیش‌نمایش با همان viewport واقعی CSS باز می‌شود. داده‌ها فقط تا وقتی صفحه باز است در همین نشست می‌مانند.</p>
        <div class="results" aria-live="polite"></div>
        <footer class="bottom"><span>بدون تغییر در CSS سایت · بدون ارسال داده به شبکه</span><span class="capture-count">ثبت‌شده‌ها: ۰</span></footer>
    `;
    shadow.appendChild(panel);

    const launcher = document.createElement("button");
    launcher.className = "launcher";
    launcher.type = "button";
    launcher.textContent = "Aa";
    launcher.title = "بازکردن پنل اندازه فونت";
    launcher.setAttribute("aria-label", "بازکردن پنل اندازه فونت");
    launcher.hidden = true;
    shadow.appendChild(launcher);

    const viewportShell = document.createElement("div");
    viewportShell.className = "viewport-shell";
    viewportShell.hidden = true;
    viewportShell.innerHTML = `<div class="preview-toolbar"><span class="preview-size"></span><button class="preview-settings" type="button">تنظیم اندازه</button><button class="preview-exit" type="button" aria-label="خروج از پیش‌نمایش">خروج</button></div><iframe class="preview-frame" title="پیش‌نمایش واکنش‌گرای سایت"></iframe>`;
    shadow.appendChild(viewportShell);
    document.documentElement.appendChild(host);

    const q = (selector) => shadow.querySelector(selector);
    const results = q(".results");
    const searchInput = q(".search");
    const markerLayer = document.createElement("div");
    markerLayer.className = "marker-layer";
    shadow.appendChild(markerLayer);
    q(".url").textContent = `${location.hostname}${location.pathname}`;
    const frame = viewportShell.querySelector(".preview-frame");
    const widthInput = q(".viewport-width");
    const heightInput = q(".viewport-height");
    widthInput.value = String(innerWidth);
    heightInput.value = String(innerHeight);
    q(".url").textContent = `${location.hostname}${location.pathname}`;

    function getPageWindow() { return pageWindow; }
    function getPageDocument() { return pageDocument; }

    function clearPreviewListeners() {
        for (const [target, event, listener, options] of state.previewListeners) target.removeEventListener(event, listener, options);
        state.previewListeners = [];
    }

    function setPreviewContext() {
        clearPreviewListeners();
        try {
            pageWindow = frame.contentWindow;
            pageDocument = frame.contentDocument;
            if (!pageWindow || !pageDocument || pageDocument.location.origin !== location.origin) throw new Error("Preview must remain on this site.");
        } catch {
            stopPreview();
            return;
        }
        const previewScroll = { passive: true, capture: true };
        const previewResize = { passive: true };
        pageWindow.addEventListener("scroll", updateMarkers, previewScroll);
        pageWindow.addEventListener("resize", onResize, previewResize);
        state.previewListeners.push([pageWindow, "scroll", updateMarkers, previewScroll], [pageWindow, "resize", onResize, previewResize]);
        pageDocument.addEventListener("click", (event) => {
            const link = event.target.closest?.("a[href]");
            if (!link) return;
            try {
                const nextUrl = new URL(link.href, pageWindow.location.href);
                if (nextUrl.origin === location.origin) {
                    nextUrl.searchParams.set("__marpichFontPreview", "1");
                    link.href = nextUrl.href;
                }
            } catch { /* Ignore non-URL links. */ }
        }, true);
        scan();
    }

    function applyPreviewSize() {
        const width = Number(widthInput.value);
        const height = Number(heightInput.value);
        if (!Number.isInteger(width) || width < 320 || width > 3840 || !Number.isInteger(height) || height < 320 || height > 3000) {
            widthInput.setCustomValidity("عرض 320 تا 3840 و ارتفاع 320 تا 3000 پیکسل وارد کن.");
            widthInput.reportValidity();
            return;
        }
        widthInput.setCustomValidity("");
        heightInput.setCustomValidity("");
        frame.style.width = `${width}px`;
        frame.style.height = `${height}px`;
        viewportShell.querySelector(".preview-size").textContent = `${width} × ${height} CSS px`;
        if (!state.preview) {
            state.preview = true;
            viewportShell.hidden = false;
            panel.style.display = "none";
            launcher.hidden = true;
            markerLayer.style.display = state.marks ? "block" : "none";
            const previewUrl = new URL(location.href);
            previewUrl.searchParams.set("__marpichFontPreview", "1");
            frame.onload = setPreviewContext;
            frame.src = previewUrl.href;
            q(".preview-toggle").textContent = "اعمال اندازه جدید";
            return;
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(scan, 160);
        hidePanel();
    }

    function stopPreview() {
        if (!state.preview) return;
        state.preview = false;
        clearPreviewListeners();
        pageWindow = window;
        pageDocument = document;
        frame.onload = null;
        frame.src = "about:blank";
        viewportShell.hidden = true;
        panel.style.display = "none";
        state.hidden = true;
        launcher.hidden = false;
        q(".preview-toggle").textContent = "پیش‌نمایش این اندازه";
        scan();
    }

    function hidePanel() {
        state.hidden = true;
        panel.style.display = "none";
        launcher.hidden = state.preview;
        markerLayer.style.display = state.marks ? "block" : "none";
    }

    function showPanel() {
        state.hidden = false;
        panel.style.display = "flex";
        launcher.hidden = true;
        markerLayer.style.display = state.marks ? "block" : "none";
    }

    function toggle() { state.hidden ? showPanel() : hidePanel(); }

    function textOf(el) {
        if (el.matches("input,textarea,select")) {
            const labels = el.labels ? [...el.labels].map((label) => label.innerText.trim()).filter(Boolean).join(" ") : "";
            return labels || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || "فیلد ورودی";
        }
        return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    }

    function isVisible(el) {
        const css = getPageWindow().getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return css.display !== "none" && css.visibility !== "hidden" && Number(css.opacity) > 0 && rect.width > 0 && rect.height > 0 && el.getClientRects().length > 0;
    }

    function roleOf(el) {
        const tag = el.tagName.toLowerCase();
        const classes = typeof el.className === "string" ? el.className.toLowerCase() : "";
        const card = el.closest("article,[class*=card i],[class*=tile i],[class*=product i]");
        if (/^(input|textarea|select)$/.test(tag)) return "فیلد فرم";
        if (tag === "label") return "برچسب فرم";
        if (/^h[1-6]$/.test(tag)) return card ? "عنوان کارت" : tag === "h1" ? "عنوان اصلی صفحه" : tag === "h2" ? "عنوان بخش" : "زیرعنوان";
        if (tag === "button" || tag === "a" || el.getAttribute("role") === "button") {
            if (el.querySelector("h1,h2,h3,h4,h5,h6") && textOf(el) === textOf(el.querySelector("h1,h2,h3,h4,h5,h6"))) return "پیوند عنوان";
            return card || /cta|action|button/.test(classes) || tag === "button" ? "CTA / دکمه" : "پیوند";
        }
        if (tag === "p") return card ? "توضیح کارت" : "متن توضیح";
        if (/title|heading/.test(classes)) return card ? "عنوان کارت" : "عنوان";
        if (/subtitle|description|summary/.test(classes)) return card ? "توضیح کارت" : "متن توضیح";
        if (tag === "li") return "آیتم فهرست";
        return "متن";
    }

    function domPath(el) {
        const parts = [];
        let node = el;
        while (node && node.nodeType === 1 && parts.length < 6 && node !== getPageDocument().documentElement) {
            let part = node.tagName.toLowerCase();
            if (node.id) {
                part += String.fromCharCode(35) + node.id;
                parts.unshift(part);
                break;
            }
            const classes = typeof node.className === "string" ? node.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
            if (classes.length) part += `.${classes.join(".")}`;
            const siblings = node.parentElement ? [...node.parentElement.children].filter((sibling) => sibling.tagName === node.tagName) : [];
            if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
            parts.unshift(part);
            node = node.parentElement;
        }
        return parts.join(" > ");
    }

    function scan() {
        const selector = "h1,h2,h3,h4,h5,h6,p,a,button,label,input,textarea,select,li,[role=button],[class*=title i],[class*=heading i],[class*=subtitle i],[class*=description i],[class*=summary i]";
        const doc = getPageDocument();
        const elements = [...doc.querySelectorAll(selector)].filter((el) => (doc !== document || !host.contains(el)) && isVisible(el));
        const unique = elements.filter((el) => {
            const text = textOf(el);
            if (!text || text.length < 2) return false;
            if ((el.tagName === "A" || el.tagName === "BUTTON") && el.querySelector("h1,h2,h3,h4,h5,h6") && text === textOf(el.querySelector("h1,h2,h3,h4,h5,h6"))) return false;
            const parent = el.parentElement?.closest(selector);
            if (parent && textOf(parent) === text) return false;
            return true;
        });
        state.current = unique.map((el, index) => {
            const css = getPageWindow().getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            const families = css.fontFamily.split(",").map((name) => name.trim().replace(/^['"]|['"]$/g, ""));
            return {
                element: el,
                index: index + 1,
                role: roleOf(el),
                text: textOf(el).slice(0, 180),
                tag: el.tagName.toLowerCase(),
                selector: domPath(el),
                fontPrimary: families[0] || "نامشخص",
                fontFallbacks: families.slice(1).join(", "),
                fontSize: css.fontSize,
                weight: css.fontWeight,
                lineHeight: css.lineHeight,
                textAlign: css.textAlign,
                rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
        });
        render();
        updateMarkers();
    }

    function addChip(parent, value, special) {
        const chip = document.createElement("span");
        chip.className = `chip${special ? " size" : ""}`;
        chip.textContent = value;
        parent.appendChild(chip);
    }

    function render() {
        const query = searchInput.value.trim().toLocaleLowerCase();
        const visible = state.current.filter((item) => `${item.role} ${item.text} ${item.fontPrimary} ${item.selector}`.toLocaleLowerCase().includes(query));
        results.replaceChildren();
        if (!visible.length) {
            const empty = document.createElement("div");
            empty.className = "empty";
            empty.textContent = "متنی برای این جست‌وجو پیدا نشد.";
            results.appendChild(empty);
        }
        for (const item of visible) {
            const row = document.createElement("article");
            row.className = "item";
            const role = document.createElement("div");
            role.className = "role";
            role.textContent = `${item.index}. ${item.role}`;
            const sample = document.createElement("div");
            sample.className = "sample";
            sample.textContent = item.text;
            const path = document.createElement("small");
            path.textContent = item.selector;
            sample.appendChild(path);
            const values = document.createElement("div");
            values.className = "values";
            addChip(values, item.fontSize, true);
            addChip(values, `اصلی: ${item.fontPrimary}`);
            if (item.fontFallbacks) addChip(values, `جایگزین: ${item.fontFallbacks}`);
            addChip(values, `وزن: ${item.weight}`);
            addChip(values, `line-height: ${item.lineHeight}`);
            addChip(values, `چینش: ${item.textAlign}`);
            row.append(role, sample, values);
            results.appendChild(row);
        }
        const view = getPageWindow();
        const doc = getPageDocument();
        const language = doc.documentElement.lang || "نامشخص";
        q(".url").textContent = `${view.location.hostname}${view.location.pathname}`;
        q(".status span").textContent = `${view.location.hostname}${view.location.pathname}`;
        q(".status b").textContent = `${view.innerWidth} × ${view.innerHeight}px · ${language} · ${visible.length} متن`;
        q(".capture-count").textContent = `ثبت‌شده‌ها: ${state.captures.length} عرض`;
    }

    function updateMarkers() {
        markerLayer.replaceChildren();
        if (!state.marks) return;
        for (const item of state.current) {
            const rect = item.element.getBoundingClientRect();
            const frameRect = state.preview ? frame.getBoundingClientRect() : { left: 0, top: 0 };
            const left = rect.left + frameRect.left;
            const top = rect.top + frameRect.top;
            const view = getPageWindow();
            if (rect.width <= 0 || rect.height <= 0 || rect.bottom < 0 || rect.top > view.innerHeight || rect.right < 0 || rect.left > view.innerWidth) continue;
            const mark = document.createElement("div");
            mark.className = `mark${item.role.includes("عنوان") ? " title" : item.role.includes("CTA") ? " cta" : ""}`;
            // Keep fractional CSS pixels: rounding shifts thin borders away from
            // the element's real edge on high-DPI and zoomed viewports.
            mark.style.left = `${left.toFixed(2)}px`;
            mark.style.top = `${top.toFixed(2)}px`;
            mark.style.width = `${rect.width.toFixed(2)}px`;
            mark.style.height = `${rect.height.toFixed(2)}px`;
            const label = document.createElement("span");
            label.className = "mark-label";
            label.textContent = `${item.role} · ${item.fontSize}`;
            mark.appendChild(label);
            markerLayer.appendChild(mark);
        }
    }

    function capture() {
        scan();
        state.captures.push({
            url: getPageWindow().location.href,
            pageTitle: getPageDocument().title,
            language: getPageDocument().documentElement.lang || "نامشخص",
            capturedAt: new Date().toISOString(),
            viewport: { width: getPageWindow().innerWidth, height: getPageWindow().innerHeight, devicePixelRatio: getPageWindow().devicePixelRatio },
            items: state.current.map(({ element, ...item }) => ({ ...item, rect: { ...item.rect } })),
        });
        render();
    }

    function csvEscape(value) {
        const text = value == null ? "" : String(value);
        return `"${text.replace(/"/g, '""')}"`;
    }

    function download(name, content, type) {
        const blob = new Blob(["\uFEFF", content], { type });
        const anchor = document.createElement("a");
        const objectUrl = URL.createObjectURL(blob);
        anchor.href = objectUrl;
        anchor.download = name;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    }

    function exportJson() {
        download("font-audit.json", JSON.stringify({ page: { url: getPageWindow().location.href, title: getPageDocument().title }, captures: state.captures }, null, 2), "application/json;charset=utf-8");
    }

    function exportCsv() {
        const columns = ["url", "pageTitle", "language", "capturedAt", "viewportWidth", "viewportHeight", "devicePixelRatio", "role", "text", "tag", "selector", "fontPrimary", "fontFallbacks", "fontSize", "weight", "lineHeight", "textAlign", "x", "y", "elementWidth", "elementHeight"];
        const rows = [columns.map(csvEscape).join(",")];
        for (const capture of state.captures) for (const item of capture.items) rows.push([
            capture.url, capture.pageTitle, capture.language, capture.capturedAt,
            capture.viewport.width, capture.viewport.height, capture.viewport.devicePixelRatio,
            item.role, item.text, item.tag, item.selector, item.fontPrimary, item.fontFallbacks,
            item.fontSize, item.weight, item.lineHeight, item.textAlign,
            item.rect.x, item.rect.y, item.rect.width, item.rect.height,
        ].map(csvEscape).join(","));
        download("font-audit.csv", rows.join("\r\n"), "text/csv;charset=utf-8");
    }

    function cleanup() {
        clearTimeout(resizeTimer);
        clearPreviewListeners();
        for (const [target, event, listener, options] of state.listeners) target.removeEventListener(event, listener, options);
        host.remove();
        delete window[key];
    }

    q(".rescan").addEventListener("click", scan);
    q(".capture").addEventListener("click", capture);
    q(".csv").addEventListener("click", exportCsv);
    q(".json").addEventListener("click", exportJson);
    q(".clear").addEventListener("click", () => { state.captures = []; render(); });
    q(".close").addEventListener("click", hidePanel);
    launcher.addEventListener("click", showPanel);
    q(".viewport-preset").addEventListener("change", (event) => {
        if (event.target.value === "custom") return;
        const [width, height] = event.target.value.split("x");
        widthInput.value = width;
        heightInput.value = height;
        applyPreviewSize();
    });
    q(".preview-toggle").addEventListener("click", () => state.preview ? applyPreviewSize() : applyPreviewSize());
    q(".preview-exit").addEventListener("click", stopPreview);
    q(".preview-settings").addEventListener("click", showPanel);
    widthInput.addEventListener("input", () => { q(".viewport-preset").value = "custom"; });
    heightInput.addEventListener("input", () => { q(".viewport-preset").value = "custom"; });
    q(".show-marks").addEventListener("change", (event) => { state.marks = event.target.checked; updateMarkers(); });
    searchInput.addEventListener("input", render);
    const onScroll = () => updateMarkers();
    viewportShell.addEventListener("scroll", onScroll, { passive: true });
    function onResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(scan, 140); }
    const onKey = (event) => { if (event.key === "Escape") { state.preview ? stopPreview() : hidePanel(); } };
    const scrollOptions = { passive: true, capture: true };
    const resizeOptions = { passive: true };
    const keyOptions = true;
    window.addEventListener("scroll", onScroll, scrollOptions);
    window.addEventListener("resize", onResize, resizeOptions);
    window.addEventListener("keydown", onKey, keyOptions);
    state.listeners.push([window, "scroll", onScroll, scrollOptions], [window, "resize", onResize, resizeOptions], [window, "keydown", onKey, keyOptions]);
    window[key] = { toggle, close: hidePanel, cleanup };
    hidePanel(); scan();
})();

