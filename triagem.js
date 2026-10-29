/* Pré-qualificação: respostas somente na memória/DOM desta página.
   Sem backend, persistência, respostas em URLs do site ou eventos de analytics. */
(() => {
    'use strict';
    const dialog = document.getElementById('triagem-dialog');
    if (!dialog) return;
    const form = document.getElementById('triagem-form');
    const steps = [...dialog.querySelectorAll('[data-triagem-step]')];
    const name = document.getElementById('triagem-name');
    const state = document.getElementById('triagem-state');
    const back = document.getElementById('triagem-back');
    const next = document.getElementById('triagem-next');
    const handoff = document.getElementById('triagem-handoff');
    const message = document.getElementById('triagem-message');
    const copyStatus = document.getElementById('triagem-copy-status');
    const params = new URLSearchParams(window.location.search);
    // Lista fechada: não ecoar UTMs desconhecidas ou dados fornecidos pela URL.
    const campaign = (params.get('utm_content') || '').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[\s_]+/g, '-');
    const origin = new Map([
        ['o-plantao-termina', 'O plantão termina'],
        ['anos-de-servico', 'Anos de serviço'],
        ['video-seguranca-publica', 'Vídeo Segurança Pública'],
        ['video-saude', 'Vídeo Saúde']
    ]).get(campaign) || 'site';
    let step = 0;
    let returnFocus;

    function track(action) {
        try {
            if (typeof window.gtag === 'function') {
                // Eventos genéricos: nenhum nome, renda, resposta ou URL do WhatsApp.
                window.gtag('event', `triagem_${action}`, { event_category: 'triagem' });
            }
        } catch { /* A medição nunca impede o atendimento. */ }
    }

    function open() {
        if (dialog.open) return;
        returnFocus = document.activeElement;
        dialog.showModal();
        document.body.classList.add('triagem-open');
        if (handoff.hidden) steps[step].querySelector('input, select').focus();
        else document.getElementById('triagem-handoff-title').focus();
        track('open');
    }
    document.querySelectorAll('[data-open-triagem]').forEach(button => button.addEventListener('click', open));
    document.getElementById('triagem-close').addEventListener('click', () => dialog.close());
    // O dialog nativo trata Escape e fundo inerte. Fecha o ciclo de Tab
    // explicitamente para navegadores que passam pelo chrome da janela.
    dialog.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const controls = [...dialog.querySelectorAll('button, input, select, textarea, a[href]')]
            .filter(control => !control.disabled && control.tabIndex >= 0 && control.getClientRects().length);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
    dialog.addEventListener('close', () => {
        document.body.classList.remove('triagem-open');
        const target = returnFocus && returnFocus !== document.body && returnFocus.isConnected
            ? returnFocus : document.querySelector('[data-open-triagem]');
        target?.focus({ preventScroll: true });
    });

    function showStep(index) {
        step = index;
        steps.forEach((section, i) => { section.hidden = i !== index; });
        back.hidden = index === 0;
        next.textContent = index === 0 ? 'Continuar' : 'Continuar no WhatsApp';
        document.getElementById('triagem-progress').textContent = index === 0
            ? 'Etapa 1 de 2 · Sobre você' : 'Etapa 2 de 2 · Renda e estado';
        steps[index].querySelector('input, select').focus();
        dialog.scrollTop = 0;
    }

    function error(id, controls, text) {
        const element = document.getElementById(id);
        element.textContent = text;
        element.hidden = !text;
        controls.forEach(control => {
            if (text) control.setAttribute('aria-invalid', 'true');
            else control.removeAttribute('aria-invalid');
        });
        return text ? controls[0] : null;
    }
    const group = key => [...form.querySelectorAll(`input[name="triagem-${key}"]`)];
    const chosen = key => group(key).find(input => input.checked)?.value;

    function validate(index) {
        let invalid = [];
        if (index === 0) {
            const firstName = name.value.trim();
            invalid.push(error('triagem-name-error', [name],
                firstName && /\p{L}/u.test(firstName) ? '' : 'Informe seu primeiro nome.'));
            invalid.push(error('triagem-profession-error', group('profession'),
                chosen('profession') ? '' : 'Selecione seu vínculo profissional.'));
        } else {
            invalid.push(error('triagem-income-error', group('income'),
                chosen('income') ? '' : 'Selecione uma opção de renda.'));
            invalid.push(error('triagem-state-error', [state],
                state.value ? '' : 'Selecione o estado onde reside.'));
        }
        const first = invalid.find(Boolean);
        first?.focus();
        return !first;
    }
    form.addEventListener('input', event => {
        // Não mover o foco enquanto a pessoa digita ou escolhe uma resposta.
        const target = event.target;
        if (target === name) error('triagem-name-error', [name], '');
        if (target === state) error('triagem-state-error', [state], '');
        if (target.name === 'triagem-profession') error('triagem-profession-error', group('profession'), '');
        if (target.name === 'triagem-income') error('triagem-income-error', group('income'), '');
    });
    back.addEventListener('click', () => showStep(0));

    function openWhatsapp() {
        track('whatsapp_open'); // Tentativa de abertura; não representa mensagem enviada.
        try {
            // URL efêmera: não fica em href (evita captura automática de link_url pelo GA4).
            window.open(`https://wa.me/5544988198287?text=${encodeURIComponent(message.value)}`,
                '_blank', 'noopener,noreferrer');
        } catch { /* As alternativas permanecem visíveis mesmo se o navegador bloquear. */ }
    }
    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!validate(step)) return;
        if (step === 0) { showStep(1); return; }
        // Revalida a etapa anterior sem descartar respostas.
        if (!validate(0)) { showStep(0); return; }
        message.value = [
            origin === 'site'
                ? 'Olá! Vim pelo site e gostaria de entender como funciona a análise.'
                : `Olá! Vim pelo anúncio ${origin} e gostaria de entender como funciona a análise.`,
            '',
            `Nome: ${name.value.trim().replace(/\s+/g, ' ')}`,
            `Vínculo profissional: ${chosen('profession')}`,
            `Renda bruta mensal informada: ${chosen('income')}`,
            `Estado: ${state.value}`
        ].join('\n');
        form.hidden = true;
        handoff.hidden = false;
        copyStatus.textContent = '';
        dialog.scrollTop = 0;
        document.getElementById('triagem-handoff-title').focus();
        track('complete');
        openWhatsapp();
    });
    document.getElementById('triagem-retry').addEventListener('click', openWhatsapp);
    document.getElementById('triagem-edit').addEventListener('click', () => {
        handoff.hidden = true;
        form.hidden = false;
        showStep(1);
    });
    document.getElementById('triagem-copy').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(message.value);
            copyStatus.textContent = 'Mensagem copiada. Cole no WhatsApp do escritório e toque em Enviar.';
        } catch {
            message.focus();
            message.select();
            copyStatus.textContent = 'Não foi possível copiar automaticamente. O texto está selecionado: use Copiar no seu dispositivo.';
        }
    });
    if (params.get('triagem') === '1') open();
})();
