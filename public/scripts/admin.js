(()=>{
    const contentForm = document.querySelector("[data-admin-content-form]");
    const servicesForm = document.querySelector("[data-admin-services-form]");
    const mediaCards = Array.from(document.querySelectorAll("[data-media-card]"));
    const mediaIndexNode = document.querySelector("[data-admin-media-index]");
    const mediaIndex = new Map();
    if (mediaIndexNode) {
        try {
            const parsed = JSON.parse(mediaIndexNode.textContent || "[]");
            if (Array.isArray(parsed)) {
                for (const item of parsed){
                    if (!item || !item.id) {
                        continue;
                    }
                    mediaIndex.set(String(item.id), {
                        id: String(item.id),
                        type: String(item.type || "image"),
                        src: String(item.src || ""),
                        title: String(item.title || item.alt || "Без названия")
                    });
                }
            }
        } catch  {}
    }
    const toArrayField = (value)=>{
        if (Array.isArray(value)) {
            return value;
        }
        if (value === undefined || value === null) {
            return [];
        }
        return [
            value
        ];
    };
    const parseTextareaLines = (value)=>String(value || "").split("\n").map((item)=>item.trim()).filter(Boolean);
    const normalizeUrlValue = (value)=>String(value || "").trim();
    const isValidUrlLike = (value, { allowTel = false } = {})=>{
        if (!value) {
            return true;
        }
        if (allowTel && value.startsWith("tel:")) {
            return /^tel:\+?[0-9\-() ]{6,}$/.test(value);
        }
        if (value.startsWith("/") || value.startsWith("#")) {
            return true;
        }
        if (value.startsWith("http://") || value.startsWith("https://")) {
            try {
                const parsed = new URL(value);
                return Boolean(parsed.hostname);
            } catch  {
                return false;
            }
        }
        return false;
    };
    const parseDate = (value)=>{
        if (!value) {
            return NaN;
        }
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : NaN;
    };
    const getDragAfterElement = (container, pointerY, selector, draggingItem)=>{
        const candidates = Array.from(container.querySelectorAll(selector)).filter((item)=>item !== draggingItem);
        let closestOffset = Number.NEGATIVE_INFINITY;
        let closestElement = null;
        for (const element of candidates){
            const rect = element.getBoundingClientRect();
            const offset = pointerY - rect.top - rect.height / 2;
            if (offset < 0 && offset > closestOffset) {
                closestOffset = offset;
                closestElement = element;
            }
        }
        return closestElement;
    };
    const enableSortableList = (container, selector, onUpdate)=>{
        let draggingItem = null;
        container.addEventListener("dragstart", (event)=>{
            const target = event.target.closest(selector);
            if (!target) {
                return;
            }
            draggingItem = target;
            target.classList.add("is-dragging");
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", target.dataset.sortKey || target.dataset.serviceSlug || "item");
            }
        });
        container.addEventListener("dragover", (event)=>{
            if (!draggingItem) {
                return;
            }
            event.preventDefault();
            const nextElement = getDragAfterElement(container, event.clientY, selector, draggingItem);
            if (!nextElement) {
                container.appendChild(draggingItem);
                return;
            }
            if (nextElement !== draggingItem) {
                container.insertBefore(draggingItem, nextElement);
            }
        });
        container.addEventListener("drop", (event)=>{
            if (!draggingItem) {
                return;
            }
            event.preventDefault();
            onUpdate();
        });
        container.addEventListener("dragend", ()=>{
            if (!draggingItem) {
                return;
            }
            draggingItem.classList.remove("is-dragging");
            draggingItem = null;
            onUpdate();
        });
        onUpdate();
    };
    let scheduleAudit = ()=>{};
    if (contentForm) {
        const seoTitle = contentForm.querySelector("[data-seo-title]");
        const seoDescription = contentForm.querySelector("[data-seo-description]");
        const seoOgTitle = contentForm.querySelector("[data-seo-og-title]");
        const seoOgDescription = contentForm.querySelector("[data-seo-og-description]");
        const titleCount = contentForm.querySelector("[data-seo-title-count]");
        const descriptionCount = contentForm.querySelector("[data-seo-description-count]");
        const previewTitle = contentForm.querySelector("[data-seo-preview-title]");
        const previewDescription = contentForm.querySelector("[data-seo-preview-description]");
        const faqJson = contentForm.querySelector("[data-faq-json]");
        const auditList = document.querySelector("[data-seo-audit-list]");
        function updateSeoPreview() {
            if (!previewTitle || !previewDescription) {
                return;
            }
            const titleValue = (seoOgTitle?.value || seoTitle?.value || "").trim();
            const descriptionValue = (seoOgDescription?.value || seoDescription?.value || "").trim();
            previewTitle.textContent = titleValue || "White Lab";
            previewDescription.textContent = descriptionValue || "Описание для выдачи поисковых систем.";
        }
        function updateCounters() {
            if (titleCount && seoTitle) {
                titleCount.textContent = `${seoTitle.value.length} символов`;
            }
            if (descriptionCount && seoDescription) {
                descriptionCount.textContent = `${seoDescription.value.length} символов`;
            }
        }
        function parseJsonSafely(rawValue) {
            try {
                return JSON.parse(rawValue || "[]");
            } catch  {
                return null;
            }
        }
        function validateJsonFields(event) {
            try {
                if (faqJson) {
                    const faq = JSON.parse(faqJson.value || "[]");
                    if (!Array.isArray(faq)) {
                        throw new Error("Поле «ЧаВо (JSON)» должно содержать массив.");
                    }
                    for (const [index, item] of faq.entries()){
                        if (!item || typeof item !== "object") {
                            throw new Error(`ЧаВо: элемент #${index + 1} должен быть объектом.`);
                        }
                        if (!item.q || !item.a) {
                            throw new Error(`ЧаВо: элемент #${index + 1} должен содержать поля q и a.`);
                        }
                    }
                }
            } catch (error) {
                event.preventDefault();
                alert(error.message || "Проверьте JSON перед сохранением.");
            }
        }
        function buildSeoIssues() {
            const issues = [];
            const addIssue = (message, selector)=>issues.push({
                    message,
                    selector
                });
            const titleValue = (seoTitle?.value || "").trim();
            const descriptionValue = (seoDescription?.value || "").trim();
            const ogTitleValue = (seoOgTitle?.value || "").trim();
            const ogDescriptionValue = (seoOgDescription?.value || "").trim();
            const heroTitle = (contentForm.querySelector("[name='hero_title']")?.value || "").trim();
            const phoneValue = (contentForm.querySelector("[name='brand_phone_display']")?.value || "").trim();
            const emailValue = (contentForm.querySelector("[name='brand_email']")?.value || "").trim();
            const faqValue = parseJsonSafely(faqJson?.value || "[]");
            const sectionOrderFields = Array.from(contentForm.querySelectorAll("input[name^='section_order_']"));
            const orderNumbers = sectionOrderFields.map((field)=>Number(field.value)).filter((value)=>Number.isFinite(value) && value > 0);
            if (!titleValue) {
                addIssue("SEO: не заполнен заголовок страницы.", "[name='seo_title']");
            } else if (titleValue.length < 55 || titleValue.length > 65) {
                addIssue("SEO: заголовок желательно держать в диапазоне 55-65 символов.", "[name='seo_title']");
            }
            if (!descriptionValue) {
                addIssue("SEO: не заполнено описание страницы.", "[name='seo_description']");
            } else if (descriptionValue.length < 130 || descriptionValue.length > 160) {
                addIssue("SEO: описание желательно держать в диапазоне 130-160 символов.", "[name='seo_description']");
            }
            if (!ogTitleValue) {
                addIssue("SEO: не заполнен OG-заголовок.", "[name='seo_og_title']");
            }
            if (!ogDescriptionValue) {
                addIssue("SEO: не заполнено OG-описание.", "[name='seo_og_description']");
            }
            if (!heroTitle) {
                addIssue("Главная (H1): не заполнен заголовок hero.", "[name='hero_title']");
            }
            if (!phoneValue) {
                addIssue("Контакты: не заполнен телефон для отображения.", "[name='brand_phone_display']");
            }
            if (!emailValue) {
                addIssue("Контакты: не заполнена электронная почта.", "[name='brand_email']");
            }
            const urlChecks = [
                {
                    selector: "[name='brand_instagram']",
                    label: "Ссылка на Инстаграм",
                    allowTel: false
                },
                {
                    selector: "[name='brand_order_link']",
                    label: "Ссылка на заказ",
                    allowTel: true
                },
                {
                    selector: "[name='brand_map_2gis']",
                    label: "Ссылка 2GIS",
                    allowTel: false
                },
                {
                    selector: "[name='brand_map_yandex']",
                    label: "Ссылка Яндекс Карты",
                    allowTel: false
                },
                {
                    selector: "[name='hero_primary_url']",
                    label: "Hero: URL кнопки 1",
                    allowTel: true
                },
                {
                    selector: "[name='hero_secondary_url']",
                    label: "Hero: URL кнопки 2",
                    allowTel: true
                }
            ];
            for (const item of urlChecks){
                const field = contentForm.querySelector(item.selector);
                const value = normalizeUrlValue(field?.value);
                if (!value) {
                    continue;
                }
                if (!isValidUrlLike(value, {
                    allowTel: item.allowTel
                })) {
                    addIssue(`${item.label}: некорректный URL или формат ссылки.`, item.selector);
                }
            }
            const sourceLinksField = contentForm.querySelector("[name='source_links']");
            const sourceLinks = parseTextareaLines(sourceLinksField?.value || "");
            const uniqueLinks = new Set(sourceLinks);
            if (sourceLinks.length !== uniqueLinks.size) {
                addIssue("Источники: обнаружены дубли ссылок.", "[name='source_links']");
            }
            sourceLinks.forEach((link)=>{
                if (!isValidUrlLike(link)) {
                    addIssue(`Источники: невалидный URL — ${link}`, "[name='source_links']");
                }
            });
            if (!faqValue || !Array.isArray(faqValue)) {
                addIssue("ЧаВо: некорректный JSON.", "[name='faq_json']");
            } else if (!faqValue.length) {
                addIssue("ЧаВо: список вопросов пустой.", "[name='faq_json']");
            }
            if (!mediaCards.length) {
                addIssue("Медиатека: отсутствуют медиафайлы.", "#admin-media");
            }
            const altInputs = Array.from(document.querySelectorAll("[data-media-alt-input]"));
            const missingAlt = altInputs.filter((field)=>!String(field.value || "").trim());
            if (missingAlt.length) {
                const firstMissing = missingAlt[0];
                addIssue(`Медиатека: заполните ALT у ${missingAlt.length} медиафайлов.`, `[data-media-alt-input='${firstMissing.dataset.mediaAltInput}']`);
            }
            if (orderNumbers.length !== sectionOrderFields.length) {
                addIssue("Секции: укажите корректные позиции для всех секций.", "#admin-sections");
            } else if (new Set(orderNumbers).size !== orderNumbers.length) {
                addIssue("Секции: позиции секций не должны повторяться.", "#admin-sections");
            }
            const sectionKeys = [
                "services",
                "process",
                "materials",
                "about",
                "gallery",
                "contacts"
            ];
            let enabledSections = 0;
            for (const key of sectionKeys){
                const enabledField = contentForm.querySelector(`input[type='checkbox'][name='section_${key}_enabled']`);
                const fromField = contentForm.querySelector(`[name='section_${key}_visible_from']`);
                const toField = contentForm.querySelector(`[name='section_${key}_visible_to']`);
                const enabled = Boolean(enabledField?.checked);
                const fromValue = String(fromField?.value || "");
                const toValue = String(toField?.value || "");
                const fromTs = parseDate(fromValue);
                const toTs = parseDate(toValue);
                if (enabled) {
                    enabledSections += 1;
                }
                if (Number.isFinite(fromTs) && Number.isFinite(toTs) && fromTs > toTs) {
                    addIssue(`Секция «${key}»: дата "Показ с" позже даты "Показ до".`, `[name='section_${key}_visible_from']`);
                }
            }
            if (enabledSections === 0) {
                addIssue("Секции: все секции скрыты. Включите минимум одну.", "#admin-sections");
            }
            const serviceTitleFields = Array.from(document.querySelectorAll("[name='service_title']"));
            const serviceSlugFields = Array.from(document.querySelectorAll("[name='service_slug']"));
            const serviceMediaFields = Array.from(document.querySelectorAll("[data-service-media-ids]"));
            if (!serviceTitleFields.length) {
                addIssue("Страницы услуг: не найдено ни одной услуги.", "#admin-services-pages");
            }
            serviceTitleFields.forEach((field, index)=>{
                if (!String(field.value || "").trim()) {
                    addIssue(`Услуги: пустой заголовок в позиции #${index + 1}.`, "[name='service_title']");
                }
            });
            serviceSlugFields.forEach((field, index)=>{
                const slug = String(field.value || "").trim();
                if (!slug) {
                    addIssue(`Услуги: пустой slug в позиции #${index + 1}.`, "[name='service_slug']");
                    return;
                }
                if (!/^[a-z0-9-]+$/.test(slug)) {
                    addIssue(`Услуги: slug "${slug}" должен содержать только a-z, 0-9 и дефис.`, "[name='service_slug']");
                }
            });
            serviceMediaFields.forEach((field, index)=>{
                const ids = parseTextareaLines(field.value || "");
                for (const id of ids){
                    if (!mediaIndex.has(id)) {
                        addIssue(`Услуги: у услуги #${index + 1} указан несуществующий медиа ID "${id}".`, "[data-service-media-ids]");
                        break;
                    }
                }
            });
            return issues;
        }
        function renderSeoAudit() {
            if (!auditList) {
                return;
            }
            const issues = buildSeoIssues();
            auditList.innerHTML = "";
            if (!issues.length) {
                const okItem = document.createElement("li");
                okItem.className = "admin-audit-ok";
                okItem.textContent = "Критичных проблем не найдено.";
                auditList.appendChild(okItem);
                return;
            }
            for (const issue of issues){
                const item = document.createElement("li");
                const button = document.createElement("button");
                button.type = "button";
                button.className = "admin-audit-link";
                button.textContent = issue.message;
                button.addEventListener("click", ()=>{
                    const target = document.querySelector(issue.selector) || contentForm.querySelector(issue.selector);
                    if (!target) {
                        return;
                    }
                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                    if (typeof target.focus === "function") {
                        target.focus({
                            preventScroll: true
                        });
                    }
                });
                item.appendChild(button);
                auditList.appendChild(item);
            }
        }
        let auditTimer;
        scheduleAudit = ()=>{
            clearTimeout(auditTimer);
            auditTimer = setTimeout(renderSeoAudit, 120);
        };
        const sectionSortList = contentForm.querySelector("[data-section-sort-list]");
        if (sectionSortList) {
            const updateSectionOrderFields = ()=>{
                const items = Array.from(sectionSortList.querySelectorAll("[data-sort-item]"));
                items.forEach((item, index)=>{
                    const position = String(index + 1);
                    const input = item.querySelector("[data-section-order-input]");
                    const badge = item.querySelector("[data-sort-position]");
                    if (input) {
                        input.value = position;
                    }
                    if (badge) {
                        badge.textContent = position;
                    }
                });
                scheduleAudit();
            };
            enableSortableList(sectionSortList, "[data-sort-item]", updateSectionOrderFields);
        }
        [
            seoTitle,
            seoDescription,
            seoOgTitle,
            seoOgDescription
        ].forEach((field)=>{
            if (!field) {
                return;
            }
            field.addEventListener("input", ()=>{
                updateCounters();
                updateSeoPreview();
                scheduleAudit();
            });
        });
        const allFormFields = contentForm.querySelectorAll("input, textarea, select");
        allFormFields.forEach((field)=>{
            field.addEventListener("input", scheduleAudit);
            field.addEventListener("change", scheduleAudit);
        });
        contentForm.addEventListener("submit", validateJsonFields);
        updateCounters();
        updateSeoPreview();
        renderSeoAudit();
    }
    if (servicesForm) {
        const servicesSortList = servicesForm.querySelector("[data-service-sort-list]");
        if (servicesSortList) {
            const updateServicePositions = ()=>{
                const items = Array.from(servicesSortList.querySelectorAll("[data-service-sort-item]"));
                items.forEach((item, index)=>{
                    const badge = item.querySelector("[data-service-position]");
                    if (badge) {
                        badge.textContent = `#${index + 1}`;
                    }
                });
            };
            enableSortableList(servicesSortList, "[data-service-sort-item]", ()=>{
                updateServicePositions();
                scheduleAudit();
            });
        }
        const serviceItems = Array.from(servicesForm.querySelectorAll("[data-service-sort-item]"));
        const renderServiceMediaPreview = (textarea, previewNode)=>{
            if (!textarea || !previewNode) {
                return;
            }
            const ids = parseTextareaLines(textarea.value || "");
            previewNode.innerHTML = "";
            if (!ids.length) {
                const empty = document.createElement("p");
                empty.className = "admin-section-note";
                empty.textContent = "Медиа не выбраны.";
                previewNode.appendChild(empty);
                return;
            }
            const grid = document.createElement("div");
            grid.className = "admin-service-media-preview-grid";
            for (const id of ids){
                const item = mediaIndex.get(id);
                const card = document.createElement("article");
                card.className = "admin-service-media-preview-card";
                if (!item) {
                    card.classList.add("is-missing");
                    card.innerHTML = `<strong>${id}</strong><span>ID не найден в медиатеке</span>`;
                    grid.appendChild(card);
                    continue;
                }
                if (item.type === "video") {
                    card.innerHTML = `
            <video controls preload="metadata">
              <source src="${item.src}" type="video/mp4" />
            </video>
            <strong>${item.id}</strong>
            <span>${item.title}</span>
          `;
                } else {
                    card.innerHTML = `
            <img src="${item.src}" alt="${item.title}" loading="lazy" />
            <strong>${item.id}</strong>
            <span>${item.title}</span>
          `;
                }
                grid.appendChild(card);
            }
            previewNode.appendChild(grid);
        };
        serviceItems.forEach((serviceItem)=>{
            const mediaIdsField = serviceItem.querySelector("[data-service-media-ids]");
            const previewNode = serviceItem.querySelector("[data-service-media-preview]");
            const picker = serviceItem.querySelector("[data-media-picker]");
            const addButton = serviceItem.querySelector("[data-media-picker-add]");
            if (mediaIdsField && previewNode) {
                renderServiceMediaPreview(mediaIdsField, previewNode);
                mediaIdsField.addEventListener("input", ()=>{
                    renderServiceMediaPreview(mediaIdsField, previewNode);
                    scheduleAudit();
                });
                mediaIdsField.addEventListener("change", ()=>{
                    renderServiceMediaPreview(mediaIdsField, previewNode);
                    scheduleAudit();
                });
            }
            if (mediaIdsField && picker && addButton) {
                addButton.addEventListener("click", ()=>{
                    const value = String(picker.value || "").trim();
                    if (!value) {
                        return;
                    }
                    const existing = parseTextareaLines(mediaIdsField.value || "");
                    if (!existing.includes(value)) {
                        existing.push(value);
                        mediaIdsField.value = `${existing.join("\n")}\n`;
                        mediaIdsField.dispatchEvent(new Event("input", {
                            bubbles: true
                        }));
                    }
                });
            }
        });
        const allServicesFields = servicesForm.querySelectorAll("input, textarea, select");
        allServicesFields.forEach((field)=>{
            field.addEventListener("input", scheduleAudit);
            field.addEventListener("change", scheduleAudit);
        });
    }
    const cards = Array.from(document.querySelectorAll("[data-media-card]"));
    const searchInput = document.querySelector("[data-media-search]");
    const typeSelect = document.querySelector("[data-media-type]");
    const countLabel = document.querySelector("[data-media-count]");
    if (cards.length && searchInput && typeSelect && countLabel) {
        function applyMediaFilter() {
            const search = searchInput.value.trim().toLowerCase();
            const type = typeSelect.value;
            let visible = 0;
            for (const card of cards){
                const cardTitle = card.dataset.title || "";
                const cardType = card.dataset.type || "";
                const matchesSearch = !search || cardTitle.includes(search);
                const matchesType = type === "all" || cardType === type;
                const isVisible = matchesSearch && matchesType;
                card.classList.toggle("is-hidden", !isVisible);
                if (isVisible) {
                    visible += 1;
                }
            }
            countLabel.textContent = `Показано: ${visible} / ${cards.length}`;
        }
        [
            searchInput,
            typeSelect
        ].forEach((control)=>{
            control.addEventListener("input", applyMediaFilter);
            control.addEventListener("change", applyMediaFilter);
        });
        applyMediaFilter();
    }
})();


//# sourceURL=src/public/scripts/admin.ts