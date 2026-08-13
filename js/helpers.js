// ===============================
// General helper functions
// ===============================

window.$ = function(id) {
    return document.getElementById(id);
};

window.esc = function(s) {
    return String(s).replace(
        /[&<>'"]/g,
        c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[c])
    );
};

window.parseCalendarDate = function(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return new Date(NaN);
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : new Date(NaN);
};

window.dateInputValue = function(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

window.scheduleDayLabel = function(date) {
    return date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'short' });
};

window.show = function(message, error = false) {
    const n = $("notice");
    n.textContent = message;
    n.className = "notice " + (error ? "error" : "");
    n.style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};
