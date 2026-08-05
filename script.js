// Helpers compartilhados entre index (menu)/visao-geral/categorias.

function getData() {
  // window.CONDOR_DATA vem de data.js (<script src>, funciona tanto aberto
  // localmente via file:// quanto servido pelo GitHub Pages -- fetch('data.json')
  // falha silenciosamente no Chromium quando aberto via file://).
  return window.CONDOR_DATA;
}

function fmtBRL(v) {
  v = Number(v) || 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
function fmtBRLCentavos(v) {
  v = Number(v) || 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtInt(v) {
  v = Number(v) || 0;
  return Math.round(v).toLocaleString("pt-BR");
}
function fmtNum(v, dec) {
  v = Number(v) || 0;
  return v.toLocaleString("pt-BR", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
}
function fmtPct(v) {
  if (v === null || v === undefined) return "—";
  return fmtNum(v, 1) + "%";
}

function pctStatus(pct) {
  if (pct === null || pct === undefined) return "neutral";
  if (pct >= 100) return "good";
  if (pct >= 70) return "warning";
  return "critical";
}

// Meter / progress track -- trilho e preenchimento usam a MESMA rampa de cor
// (tom claro no trilho, tom cheio no preenchimento), nunca um trilho cinza generico.
function meterRow(label, pct) {
  var status = pctStatus(pct);
  var fillWidth = pct === null || pct === undefined ? 0 : Math.min(100, Math.max(0, pct));
  var pctText = pct === null || pct === undefined ? "—" : fmtPct(pct);
  return (
    '<div class="meter-row meter-' + status + '">' +
      '<div class="meter-label">' + label + '</div>' +
      '<div class="meter-track"><span style="width:' + fillWidth + '%"></span></div>' +
      '<div class="meter-pct num">' + pctText + '</div>' +
    '</div>'
  );
}

function supAccent(id) { return "var(--sup-" + id + ")"; }
function catAccent(id) { return "var(--cat-" + id + ")"; }

// ---------------------------------------------------------------------------
// App shell -- sidebar de navegacao + topbar, compartilhados pelas paginas
// (index/visao-geral/categorias). active: "geral" | "categorias" | "" (menu).
// ---------------------------------------------------------------------------
function sidebarHTML(active, opts) {
  opts = opts || {};
  var items = [
    { key: "geral", href: "visao-geral.html", label: "Visão Geral", icon: iconGeral() },
    { key: "categorias", href: "categorias.html", label: "Categorias Performance", icon: iconCategorias() },
    { key: "estoque", href: "estoque.html", label: "Estoque", icon: iconBox() }
  ];
  var nav = items.map(function (it) {
    return '<a class="side-link' + (it.key === active ? ' active' : '') + '" href="' + it.href + '">' +
      '<span class="side-icon">' + it.icon + '</span>' + it.label +
    '</a>';
  }).join("");
  var exportHtml = "";
  if (opts.exportFn) {
    exportHtml =
      '<div class="side-export">' +
        '<div class="side-export-title">Exportar</div>' +
        '<button class="side-export-btn" onclick="' + opts.exportFn + '()">' + iconDownload() + ' Exportar Excel</button>' +
        '<button class="side-export-btn ghost" onclick="printPage()">' + iconPrint() + ' Exportar PDF / Imprimir</button>' +
      '</div>';
  }
  return (
    '<div class="sidebar">' +
      '<a class="side-brand" href="menu.html">' +
        '<span class="side-brand-badge">Triunfante</span><span class="side-brand-x">×</span><span class="side-brand-name">Condor</span>' +
      '</a>' +
      '<nav class="side-nav">' + nav + '</nav>' +
      exportHtml +
    '</div>'
  );
}

function mesBadgeHTML() {
  var meses = window.CONDOR_MESES || [];
  var atual = window.CONDOR_MES_ATUAL;
  if (!atual || meses.length < 1) return "";
  var info = meses.filter(function (m) { return m.id === atual; })[0];
  var label = info ? info.label : atual;
  return '<a class="datepill mespill" href="index.html" title="Trocar mês">' + iconCalendar() + label + '</a>';
}

function topbarHTML(title, sub, atualizadoEmISO) {
  var dt = atualizadoEmISO ? new Date(atualizadoEmISO).toLocaleString("pt-BR") : "—";
  return (
    '<div class="topbar">' +
      '<div><h1>' + title + '</h1>' + (sub ? '<div class="topbar-sub">' + sub + '</div>' : '') + '</div>' +
      '<div class="topbar-pills">' + mesBadgeHTML() + '<div class="datepill">' + iconCalendar() + 'Atualizado em ' + dt + '</div></div>' +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// Portao de mes -- tela inicial (index.html), antes de qualquer dado/menu.
// Um card grande por mes; escolher salva (localStorage) e manda pro menu.html
// (dashboard de verdade) ja com esse mes selecionado. index.html NAO carrega
// data-<mes>.js nem mostra numero nenhum -- so o manifesto de meses.
// ---------------------------------------------------------------------------
function mesGateCardsHTML(meses) {
  if (!meses || !meses.length) return '<div class="empty-note">Nenhum mês disponível ainda.</div>';
  var ultimoId = meses[meses.length - 1].id;
  return meses.map(function (m) {
    return (
      '<button type="button" class="mesgate-btn" data-mes="' + m.id + '">' +
        '<span class="mesgate-btn-icon">' + iconCalendar() + '</span>' +
        '<span class="mesgate-btn-label">' + m.label + '</span>' +
        (m.id === ultimoId ? '<span class="mesgate-btn-tag">Mais recente</span>' : '') +
      '</button>'
    );
  }).join("");
}
function wireMesGate(root) {
  root.querySelectorAll(".mesgate-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var mes = btn.getAttribute("data-mes");
      try { localStorage.setItem("condorMes", mes); } catch (e) {}
      window.location.href = "menu.html?mes=" + encodeURIComponent(mes);
    });
  });
}

// ---------------------------------------------------------------------------
// Stat tile -- card de KPI com icone, valor, "vs meta" e sparkline opcional.
// ---------------------------------------------------------------------------
function statTileHTML(opts) {
  return (
    '<div class="stat-tile" style="--tile-accent:' + opts.accent + '">' +
      '<div class="stat-top"><span class="stat-icon">' + opts.icon + '</span><span class="stat-label">' + opts.label + '</span></div>' +
      '<div class="stat-value num">' + opts.value + '</div>' +
      (opts.vsMeta ? '<div class="stat-vsmeta">vs meta <b>' + opts.vsMeta + '</b></div>' : '') +
      (opts.spark ? '<div class="stat-spark">' + opts.spark + '</div>' : '') +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// Sparkline -- mini grafico de linha+area SVG, sem dependencia externa.
// values: array de numeros (ex.: valor do KPI por supervisor). colorVar: "var(--x)".
// ---------------------------------------------------------------------------
var _sparkGradSeq = 0;
function sparklineSVG(values, colorVar, opts) {
  opts = opts || {};
  var w = opts.w || 148, h = opts.h || 38, pad = 3;
  var n = values.length;
  if (!n) return "";
  var max = Math.max.apply(null, values), min = Math.min.apply(null, values);
  var range = (max - min) || 1;
  var stepX = n > 1 ? (w - pad * 2) / (n - 1) : 0;
  var pts = values.map(function (v, i) {
    var x = pad + i * stepX;
    var y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  var lineD = pts.map(function (p, i) { return (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
  var areaD = lineD + " L" + pts[n - 1][0].toFixed(1) + "," + (h - pad) + " L" + pts[0][0].toFixed(1) + "," + (h - pad) + " Z";
  var gid = "sparkgrad" + (_sparkGradSeq++);
  return (
    '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + colorVar + '" stop-opacity="0.35"/>' +
        '<stop offset="100%" stop-color="' + colorVar + '" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + areaD + '" fill="url(#' + gid + ')" stroke="none"/>' +
      '<path d="' + lineD + '" fill="none" stroke="' + colorVar + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>'
  );
}

// ---------------------------------------------------------------------------
// Donut -- rosca de progresso de meta (SVG stroke-dasharray). Retorna so o
// <svg>; quem chama envolve em .donut-wrap + .donut-center pro texto central.
// ---------------------------------------------------------------------------
function donutSVG(pct, colorMain, colorTrack, opts) {
  opts = opts || {};
  var size = opts.size || 168, stroke = opts.stroke || 20;
  var r = (size - stroke) / 2, c = size / 2;
  var circumference = 2 * Math.PI * r;
  var clamped = Math.max(0, Math.min(100, pct || 0));
  var offset = circumference * (1 - clamped / 100);
  return (
    '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + colorTrack + '" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + colorMain + '" stroke-width="' + stroke +
        '" stroke-linecap="round" stroke-dasharray="' + circumference.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) +
        '" transform="rotate(-90 ' + c + ' ' + c + ')"/>' +
    '</svg>'
  );
}

// ---------------------------------------------------------------------------
// Insights -- lista de observacoes automaticas + CTA opcional.
// items: [{ icon, html }]
// ---------------------------------------------------------------------------
function insightsCardHTML(items, opts) {
  opts = opts || {};
  var rows = items.map(function (it) {
    return '<div class="insight-row"><span class="insight-icon">' + it.icon + '</span><div class="insight-text">' + it.html + '</div></div>';
  }).join("");
  var cta = opts.ctaHref ? '<a class="insight-cta" href="' + opts.ctaHref + '">' + (opts.ctaLabel || "Ver análises completas") + ' ›</a>' : "";
  return '<div class="card insights-card"><div class="insights-title">Insights</div>' + rows + cta + '</div>';
}

// ---------------------------------------------------------------------------
// Estoque -- relatorio bruto por SKU (tabela + busca) e linha de produto em
// risco na simulacao (pedido pendente > estoque disponivel).
// ---------------------------------------------------------------------------
function estoqueProdutoRowHTML(p) {
  return (
    '<tr><td>' + p.descricao + ' <span style="color:var(--ink-muted)">(#' + p.codigo + (p.embalagem ? ' · ' + p.embalagem : '') + ')</span></td>' +
    '<td class="num">' + fmtNum(p.qtCaixas, 1) + '</td>' +
    '<td class="num">' + fmtInt(p.qtUnidades) + '</td>' +
    '<td class="num">' + fmtBRLCentavos(p.valorUnit) + '</td>' +
    '<td class="num" style="font-weight:800">' + fmtBRLCentavos(p.valorTotal) + '</td></tr>'
  );
}
function produtoRiscoRowHTML(p) {
  return (
    '<tr><td>' + p.descricao + ' <span style="color:var(--ink-muted)">(#' + p.codigo + (p.embalagem ? ' · ' + p.embalagem : '') + ')</span></td>' +
    '<td class="num">' + fmtNum(p.pedidoCx, 1) + '</td>' +
    '<td class="num">' + fmtNum(p.estoqueCx, 1) + '</td>' +
    '<td class="num">' + fmtNum(p.faltaCx, 1) + '</td>' +
    '<td class="num">' + fmtBRLCentavos(p.valorPedido) + '</td>' +
    '<td class="num" style="color:var(--critical);font-weight:800">' + fmtBRLCentavos(p.valorRisco) + '</td></tr>'
  );
}
function renderEstoqueTabela(container, produtos) {
  if (!produtos.length) {
    container.innerHTML = '<div class="empty-note">Nenhum produto encontrado.</div>';
    return;
  }
  container.innerHTML =
    '<div class="datatable-wrap"><table class="datatable">' +
      '<tr><th>Produto</th><th>Caixas</th><th>Unidades</th><th>Vl.Ult.Ent.Unit.</th><th>Valor em estoque</th></tr>' +
      produtos.map(estoqueProdutoRowHTML).join("") +
    '</table></div>';
}
function ativarBuscaEstoque(inputEl, container, produtos, contadorEl) {
  inputEl.addEventListener("input", function () {
    var termo = inputEl.value.trim().toLowerCase();
    var filtrados = termo === "" ? produtos : produtos.filter(function (p) {
      return p.descricao.toLowerCase().indexOf(termo) !== -1 || String(p.codigo).indexOf(termo) !== -1;
    });
    renderEstoqueTabela(container, filtrados);
    if (contadorEl) contadorEl.textContent = filtrados.length + " de " + produtos.length + " produtos";
  });
}
function exportarEstoqueXls(produtos) {
  var headers = ["Código", "Descrição", "Embalagem", "Qt.Estoque (unidades)", "Qt.Estoque (caixas)", "Vl.Ult.Ent.Unit.", "Valor em estoque"];
  var rows = produtos.map(function (p) {
    return [p.codigo, p.descricao, p.embalagem, p.qtUnidades, fmtNum(p.qtCaixas, 2), fmtBRLCentavos(p.valorUnit), fmtBRLCentavos(p.valorTotal)];
  });
  downloadHtmlAsXls("Condor Estoque", headers, rows, "Condor - Estoque.xls");
}

// Tabela detalhada Faturado / A Faturar / Total, opcionalmente com Meta+% e Caixas.
function metricTableHTML(m, opts) {
  opts = opts || {};
  var rows = "";
  rows += '<tr><th></th><th>Faturado</th><th>A Faturar</th><th>Total</th></tr>';
  rows += '<tr><td>Faturamento (R$)</td><td>' + fmtBRLCentavos(m.faturado) + '</td><td>' + fmtBRLCentavos(m.aFaturar) + '</td><td class="num">' + fmtBRLCentavos(m.faturamento) + '</td></tr>';
  if (opts.caixas) {
    rows += '<tr><td>Caixas vendidas</td><td>' + fmtNum(m.caixasFaturado, 2) + '</td><td>' + fmtNum(m.caixasAFaturar, 2) + '</td><td>' + fmtNum(m.caixasVenda, 2) + '</td></tr>';
  }
  if (opts.unidades) {
    rows += '<tr><td>Unidades vendidas</td><td>' + fmtInt(m.unidadesFaturado) + '</td><td>' + fmtInt(m.unidadesAFaturar) + '</td><td>' + fmtInt(m.unidadesVenda) + '</td></tr>';
  }
  rows += '<tr class="total"><td>Positivação (clientes)</td><td>' + fmtInt(m.positivacaoFaturado) + '</td><td>' + fmtInt(m.positivacaoAFaturar) + '</td><td>' + fmtInt(m.positivacao) + '</td></tr>';
  var html = '<table class="metrictable">' + rows + '</table>';
  if (opts.meta && (m.metaFaturamento || m.metaPositivacao)) {
    html += '<div style="margin-top:12px">';
    if (m.metaFaturamento) html += meterRow("Faturamento", m.pctMetaFaturamento);
    if (m.metaPositivacao) html += meterRow("Positivação", m.pctMetaPositivacao);
    html += '</div>';
    if (m.metaFaturamento) html += '<div class="sub" style="font-size:11.5px;color:var(--ink-muted);margin-top:2px">Meta faturamento: ' + fmtBRLCentavos(m.metaFaturamento) + (m.metaPositivacao ? ' &nbsp;·&nbsp; Meta positivação: ' + fmtInt(m.metaPositivacao) + ' clientes' : '') + '</div>';
  }
  return html;
}

function toggleSupCard(el) {
  el.classList.toggle("open");
}

function wireTabs(root) {
  var btns = root.querySelectorAll(".tab-btn");
  btns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-tab");
      root.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.toggle("active", b === btn); });
      root.querySelectorAll(".tabpanel").forEach(function (p) { p.classList.toggle("active", p.id === target); });
    });
  });
}

// ---------------------------------------------------------------------------
// Ranking bar chart -- comparacao de magnitude entre entidades nomeadas
// (supervisores). Barra fina, ponta arredondada, cor por identidade (categorica),
// rotulo de valor na ponta. items: [{ nome, accentVar, pct(0-100), valorTexto }]
// ---------------------------------------------------------------------------
function rankChartHTML(items) {
  return '<div class="rankchart">' + items.map(function (it) {
    return (
      '<div class="rankchart-row">' +
        '<div class="rankchart-name"><span class="dot" style="background:' + it.accentVar + '"></span>' + it.nome + '</div>' +
        '<div class="rankchart-track"><div class="rankchart-fill" style="width:' + Math.max(0, Math.min(100, it.pct)) + '%;background:' + it.accentVar + '"></div></div>' +
        '<div class="rankchart-value-wrap"><div class="rankchart-value num">' + it.valorTexto + '</div>' +
          (it.valorSub ? '<div class="rankchart-sub">' + it.valorSub + '</div>' : '') +
        '</div>' +
      '</div>'
    );
  }).join("") + '</div>';
}

// ---------------------------------------------------------------------------
// Stacked bar -- parte-do-todo (composicao por categoria). segments:
// [{ label, value, valueText, colorVar }]. Largura calculada automaticamente.
// ---------------------------------------------------------------------------
function stackBarHTML(segments) {
  var total = segments.reduce(function (s, x) { return s + x.value; }, 0) || 1;
  var segs = segments.map(function (s) {
    var pct = (s.value / total * 100);
    return '<div class="stackbar-seg" style="width:' + pct.toFixed(2) + '%;background:' + s.colorVar + '"></div>';
  }).join("");
  var legend = segments.map(function (s) {
    var pct = (s.value / total * 100);
    return (
      '<div class="stackbar-legend-item"><span class="sw" style="background:' + s.colorVar + '"></span>' +
      '<b>' + s.label + '</b><span class="muted">' + s.valueText + ' · ' + fmtNum(pct, 1) + '%</span></div>'
    );
  }).join("");
  return '<div class="stackbar">' + segs + '</div><div class="stackbar-legend">' + legend + '</div>';
}

// ---------------------------------------------------------------------------
// Icones inline (SVG, sem dependencia externa) para os cards do menu.
// ---------------------------------------------------------------------------
function iconGeral() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="20" x2="5" y2="11"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="19" y1="20" x2="19" y2="14"/></svg>';
}
function iconCategorias() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
}
function iconMoney() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M15 9.3c0-1.5-1.4-2.6-3-2.6s-3 1-3 2.4 1.3 2 3 2.4 3 1 3 2.5-1.4 2.5-3 2.5-3-1.1-3-2.6"/></svg>';
}
function iconTrendUp() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 6"/><polyline points="14 6 21 6 21 13"/></svg>';
}
function iconClock() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>';
}
function iconBox() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7.5 12 3 3 7.5 12 12l9-4.5Z"/><path d="M3 7.5v9L12 21l9-4.5v-9"/><path d="M12 12v9"/></svg>';
}
function iconPeople() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.5" cy="8" r="3.2"/><path d="M2.7 20c0-3.5 3-6.2 6.8-6.2s6.8 2.7 6.8 6.2"/><circle cx="18" cy="8.5" r="2.4"/><path d="M17.5 13.9c2.6.4 4.5 2.6 4.5 5.4"/></svg>';
}
function iconTarget() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>';
}
function iconDownload() {
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>';
}
function iconPrint() {
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="9" width="12" height="7"/><path d="M6 14H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><path d="M6 9V3h12v6"/></svg>';
}
function iconCalendar() {
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>';
}

// ---------------------------------------------------------------------------
// Exportacao para Excel: gera um .xls (HTML table, Excel abre nativamente) --
// sem dependencia externa, funciona offline e em qualquer navegador.
// ---------------------------------------------------------------------------
function downloadHtmlAsXls(title, headers, rows, filename) {
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
  html += '<x:Name>' + title + '</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>';
  html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
  html += '<style>td,th{border:1px solid #ccc;padding:4px 8px;font-family:Calibri,Arial,sans-serif;font-size:11pt;} th{background:#9E1420;color:#fff;}</style></head><body><table>';
  html += '<tr>' + headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>';
  rows.forEach(function (r) {
    html += '<tr>' + r.map(function (c) { return '<td>' + (c === null || c === undefined ? '' : c) + '</td>'; }).join('') + '</tr>';
  });
  html += '</table></body></html>';

  var blob = new Blob(['﻿' + html], { type: "application/vnd.ms-excel" });
  var link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printPage() { window.print(); }
