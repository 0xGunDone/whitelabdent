(()=>{
    const contentForm = document.querySelector("[data-admin-content-form]");
    const mediaCards = Array.from(document.querySelectorAll("[data-media-card]"));
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
    if (contentForm) {
        const seoTitle = contentForm.querySelector("[data-seo-title]");
        const seoDescription = contentForm.querySelector("[data-seo-description]");
        const seoOgTitle = contentForm.querySelector("[data-seo-og-title]");
        const seoOgDescription = contentForm.querySelector("[data-seo-og-description]");
        const titleCount = contentForm.querySelector("[data-seo-title-count]");
        const descriptionCount = contentForm.querySelector("[data-seo-description-count]");
        const previewTitle = contentForm.querySelector("[data-seo-preview-title]");
        const previewDescription = contentForm.querySelector("[data-seo-preview-description]");
        const servicesJson = contentForm.querySelector("[data-services-json]");
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
                if (servicesJson) {
                    const services = JSON.parse(servicesJson.value || "[]");
                    if (!Array.isArray(services)) {
                        throw new Error("Поле «Услуги (JSON)» должно содержать массив.");
                    }
                    for (const [index, item] of services.entries()){
                        if (!item || typeof item !== "object") {
                            throw new Error(`Услуги: элемент #${index + 1} должен быть объектом.`);
                        }
                        if (!item.slug || !item.title) {
                            throw new Error(`Услуги: элемент #${index + 1} должен содержать slug и title.`);
                        }
                    }
                }
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
                addIssue("Главный экран: не заполнен заголовок hero.", "[name='hero_title']");
            }
            if (!phoneValue) {
                addIssue("Контакты: не заполнен телефон для отображения.", "[name='brand_phone_display']");
            }
            if (!emailValue) {
                addIssue("Контакты: не заполнена электронная почта.", "[name='brand_email']");
            }
            if (!faqValue || !Array.isArray(faqValue)) {
                addIssue("ЧаВо: некорректный JSON.", "[name='faq_json']");
            } else if (!faqValue.length) {
                addIssue("ЧаВо: список вопросов пустой.", "[name='faq_json']");
            }
            if (!mediaCards.length) {
                addIssue("Медиатека: отсутствуют медиафайлы.", "#admin-media");
            }
            if (orderNumbers.length !== sectionOrderFields.length) {
                addIssue("Секции: укажите корректные позиции для всех секций.", "#admin-sections");
            } else if (new Set(orderNumbers).size !== orderNumbers.length) {
                addIssue("Секции: позиции секций не должны повторяться.", "#admin-sections");
            }
            const serviceCards = Array.from(document.querySelectorAll(".admin-service-item"));
            if (!serviceCards.length) {
                addIssue("Страницы услуг: не найдено ни одной услуги.", "#admin-services-pages");
            }
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
        const scheduleAudit = ()=>{
            clearTimeout(auditTimer);
            auditTimer = setTimeout(renderSeoAudit, 120);
        };
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
    const cards = Array.from(document.querySelectorAll("[data-media-card]"));
    const searchInput = document.querySelector("[data-media-search]");
    const typeSelect = document.querySelector("[data-media-type]");
    const countLabel = document.querySelector("[data-media-count]");
    if (!cards.length || !searchInput || !typeSelect || !countLabel) {
        return;
    }
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
})();


//# sourceURL=src/public/scripts/admin.ts