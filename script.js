// Helpers compartilhados entre index/condor-geral/categorias/casa-de-mae.

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

function pctBarRow(label, pct) {
  var status = pctStatus(pct);
  var pctFillWidth = pct === null || pct === undefined ? 0 : Math.min(100, pct);
  var pctText = pct === null || pct === undefined ? "—" : fmtPct(pct);
  return (
    '<div class="pbar-row">' +
      '<div class="pbar-label">' + label + '</div>' +
      '<div class="pbar"><span class="fill-' + status + '" style="width:' + pctFillWidth + '%"></span></div>' +
      '<div class="pbar-pct pct-' + status + '">' + pctText + '</div>' +
    '</div>'
  );
}

function supAccent(id) { return "var(--sup-" + id + ")"; }

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
    html += '<div style="margin-top:10px">';
    if (m.metaFaturamento) html += pctBarRow("Faturamento", m.pctMetaFaturamento) ;
    if (m.metaPositivacao) html += pctBarRow("Positivação", m.pctMetaPositivacao);
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
// Exportacao para Excel: gera um .xls (HTML table, Excel abre nativamente) --
// sem dependencia externa, funciona offline e em qualquer navegador.
// ---------------------------------------------------------------------------
function downloadHtmlAsXls(title, headers, rows, filename) {
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
  html += '<x:Name>' + title + '</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>';
  html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
  html += '<style>td,th{border:1px solid #ccc;padding:4px 8px;font-family:Calibri,Arial,sans-serif;font-size:11pt;} th{background:#B31217;color:#fff;}</style></head><body><table>';
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

// Exportacao no padrao EXATO do arquivo-modelo "Casa de mãe - Italo" fornecido:
// CNPJ | Rede | SEGMENTO | Cód TCV | DESCRIÇÃO DOS SKU'S | UNIDADES | PREÇO UND | VENDA | DATA | NFE
function exportCasaDeMaeTemplate() {
  var data = getData();
  var linhas = (data.casaDeMae && data.casaDeMae.linhasExport) || [];
  var headers = ["CNPJ", "Rede", "SEGMENTO", "Cód TCV", "DESCRIÇÃO DOS SKU'S", "UNIDADES", "PREÇO UND", "VENDA", "DATA", "NFE"];
  var rows = linhas.map(function (l) {
    return [
      l.cnpj, l.rede, l.segmento, l.codTcv, l.descricao,
      fmtNum(l.unidades, 0),
      fmtBRLCentavos(l.precoUnd),
      fmtBRLCentavos(l.venda),
      l.data, l.nfe
    ];
  });
  if (rows.length === 0) {
    alert("Nenhuma venda de Casa de Mãe / Rede Italo encontrada no período atual da base -- nada para exportar.");
    return;
  }
  downloadHtmlAsXls("Casa de Mae", headers, rows, "Casa de Mae - Rede Italo.xls");
}

function printPage() { window.print(); }
