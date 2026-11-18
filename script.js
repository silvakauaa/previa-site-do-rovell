/* Rovell Marinho — interações (sem dependências) */
(() => {
  "use strict";

  // ⚠️ CONFIGURAR: número de WhatsApp do Rovell (DDI + DDD + número, só dígitos)
  const WHATSAPP = "5599984996603"; // (99) 98499-6603

  // Planos online: nome, preço e a abertura personalizada de cada mensagem.
  const PLANOS = {
    treino: {
      nome: "Protocolo de Treino",
      preco: "R$ 199,90",
      abertura: "Olá Rovell! Quero contratar o *Protocolo de Treino* e já preenchi minha ficha para você montar meu treino:",
      dieta: false,
    },
    dieta: {
      nome: "Protocolo de Dieta",
      preco: "R$ 209,90",
      abertura: "Olá Rovell! Quero contratar o *Protocolo de Dieta*. Segue minha ficha para você montar meu planejamento alimentar:",
      dieta: true,
    },
    acompanhamento: {
      nome: "Treino + Acompanhamento",
      preco: "R$ 249,90",
      abertura: "Olá Rovell! Quero o plano *Treino + Acompanhamento*, com suporte e ajustes ao longo do caminho. Segue minha ficha:",
      dieta: false,
    },
    completo: {
      nome: "Pacote Completo (treino + dieta)",
      preco: "R$ 389,90",
      abertura: "Olá Rovell! Quero o *Pacote Completo* com treino e dieta. Segue minha ficha completa:",
      dieta: true,
    },
  };

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const waUrl = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  const setWa = (a) => { a.href = waUrl(a.dataset.msg || "Olá Rovell!"); a.target = "_blank"; a.rel = "noopener"; };

  $$(".js-wa").forEach(setWa);
  $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Entrada do hero ---------- */
  const start = () => requestAnimationFrame(() => root.classList.add("loaded"));
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
  setTimeout(() => root.classList.add("loaded"), 1500);

  /* ---------- Navegação ---------- */
  const nav = $(".nav");
  const toggle = $(".nav-toggle");
  const menu = $("#mobile-menu");
  const waFloat = $(".wa-float");
  const hero = $(".hero");
  const links = $$(".nav-links a");
  const targets = links.map((a) => $(a.getAttribute("href")));
  let lastY = scrollY, ticking = false;

  function onScroll() {
    const y = scrollY, vh = innerHeight;
    const open = toggle.getAttribute("aria-expanded") === "true";
    nav.classList.toggle("scrolled", y > 16 || open);
    nav.classList.toggle("hide", !open && y > lastY + 4 && y > vh);
    if (y < lastY - 4 || y < vh) nav.classList.remove("hide");
    lastY = y;
    waFloat.classList.toggle("show", y > hero.offsetHeight * 0.7);
    let cur = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < vh * 0.35) cur = i; });
    links.forEach((a, i) => a.classList.toggle("active", i === cur));
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.hidden = !open;
    onScroll();
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Presencial: frequência ---------- */
  const opts = $$(".freq-opt");
  const freqCta = $(".js-freq-cta");
  const freqLabel = $(".js-freq-label");
  const freqPrice = $(".js-freq-price");
  function selectFreq(btn, focus) {
    opts.forEach((o) => { const on = o === btn; o.setAttribute("aria-checked", String(on)); o.tabIndex = on ? 0 : -1; });
    const n = btn.dataset.freq;
    const preco = `R$ ${btn.dataset.preco}`;
    freqLabel.textContent = `${n}x`;
    freqPrice.textContent = preco;
    [freqLabel, freqPrice].forEach((el) => { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); });
    freqCta.dataset.msg = `Olá Rovell! Quero o acompanhamento presencial ${n}x por semana (${preco}/mês). Quais horários você tem livres?`;
    setWa(freqCta);
    if (focus) btn.focus();
  }
  opts.forEach((o, i) => {
    o.tabIndex = o.getAttribute("aria-checked") === "true" ? 0 : -1;
    o.addEventListener("click", () => selectFreq(o));
    o.addEventListener("keydown", (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      selectFreq(opts[(i + dir + opts.length) % opts.length], true);
    });
  });

  /* ---------- Ficha de anamnese ---------- */
  const form = $("#anamnese");
  const dietBox = $(".diet-only", form);
  const lesaoDesc = $("[name=lesao_desc]", form);
  const errBox = $(".form-error", form);
  const okBox = $(".form-ok", form);

  function syncConditional() {
    const plano = PLANOS[form.plano.value];
    dietBox.hidden = !(plano && plano.dieta);
    const sim = form.lesao.value === "Sim";
    lesaoDesc.hidden = !sim;
    lesaoDesc.required = sim;
  }
  const markValid = (holder) => {
    holder.classList.remove("invalid");
    $$("input, select, textarea", holder).forEach((el) => el.removeAttribute("aria-invalid"));
  };
  form.addEventListener("change", (e) => {
    syncConditional();
    const holder = e.target.closest(".invalid");
    if (holder && isFilled(e.target)) markValid(holder);
    if (!$(".invalid", form)) errBox.hidden = true;
  });

  // Botões da tabela de planos ("Quero o de treino"…): marcam o plano na ficha
  $$(".js-pick").forEach((a) => a.addEventListener("click", () => {
    const radio = $(`input[name=plano][value="${a.dataset.plan}"]`, form);
    radio.checked = true;
    syncConditional();
    markValid(radio.closest("fieldset"));
    const label = radio.closest("label");
    label.classList.remove("flash"); void label.offsetWidth; label.classList.add("flash");
  }));

  const isFilled = (el) => el.type === "radio" ? !!form[el.name].value : el.value.trim() !== "" && el.checkValidity();

  function validate() {
    const bad = new Set();
    $$("[required]", form).forEach((el) => {
      if (el.hidden || isFilled(el)) return;
      bad.add(el.type === "radio" ? el.closest("fieldset") : el.closest(".field"));
    });
    $$(".invalid", form).forEach(markValid);
    bad.forEach((n) => {
      n.classList.add("invalid");
      $$("[required]", n).forEach((el) => { if (!el.hidden) el.setAttribute("aria-invalid", "true"); });
    });
    return [...bad];
  }

  function buildMessage() {
    const f = form;
    const p = PLANOS[f.plano.value];
    const v = (n) => (f[n] && f[n].value.trim()) || "";
    const lines = [
      p.abertura,
      "",
      `*Plano:* ${p.nome} — ${p.preco}`,
      "",
      "*FICHA DE AVALIAÇÃO*",
      `• Nome: ${v("nome")}`,
      `• Idade: ${v("idade")} anos`,
      `• Sexo: ${v("sexo")}`,
      `• Altura: ${v("altura")} cm`,
      `• Peso: ${v("peso").replace(".", ",")} kg`,
      `• Objetivo: ${v("objetivo")}`,
      `• Tempo de treino: ${v("experiencia")}`,
      `• Dias disponíveis: ${v("dias")} por semana`,
      `• Lesão/limitação: ${v("lesao") === "Sim" ? `Sim — ${v("lesao_desc")}` : "Não"}`,
      `• Saúde/remédios: ${v("saude") || "Nada a declarar"}`,
    ];
    if (p.dieta) {
      lines.push(
        "",
        "*ALIMENTAÇÃO*",
        `• Refeições por dia: ${v("refeicoes") || "Não informado"}`,
        `• Restrições/alergias: ${v("restricoes") || "Nenhuma"}`,
        `• Não come: ${v("nao_come") || "Nada específico"}`
      );
    }
    if (v("rotina")) lines.push("", `*Rotina:* ${v("rotina")}`);
    lines.push("", "Enviado pelo site.");
    return lines.join("\n");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    okBox.hidden = true;
    const bad = validate();
    errBox.hidden = bad.length === 0;
    if (bad.length) {
      const first = bad[0];
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = first.querySelector("input, select, textarea");
      if (input) setTimeout(() => input.focus({ preventScroll: true }), 300);
      return;
    }
    const url = waUrl(buildMessage());
    $(".js-ok-link", form).href = url;
    okBox.hidden = false;
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    else location.href = url;
  });

  syncConditional();
  onScroll();
})();
