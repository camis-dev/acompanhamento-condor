// Escolhe qual data-<mes>.js carregar (window.CONDOR_MESES vem de meses.js,
// carregado antes deste script). Prioridade: ?mes= na URL > ultima escolha
// salva (localStorage) > mes mais recente do manifesto.
// Usa document.write (script sincrono, executado durante o parse do HTML,
// antes do <script src="script.js"> seguinte) pra injetar a tag <script> do
// arquivo do mes escolhido -- mesma tecnica de <script src> (nao fetch) ja
// usada em data.js, funciona tanto file:// quanto GitHub Pages.
(function () {
  var meses = window.CONDOR_MESES || [];
  var ids = meses.map(function (m) { return m.id; });

  var params = new URLSearchParams(window.location.search);
  var mesParam = params.get("mes");

  var salvo = null;
  try { salvo = localStorage.getItem("condorMes"); } catch (e) {}

  var mes = mesParam || salvo;
  if (!mes || ids.indexOf(mes) === -1) {
    mes = ids.length ? ids[ids.length - 1] : null;
  }
  if (mes) {
    try { localStorage.setItem("condorMes", mes); } catch (e) {}
  }
  window.CONDOR_MES_ATUAL = mes;

  if (mes) {
    document.write('<scr' + 'ipt src="data-' + mes + '.js"><\/scr' + 'ipt>');
  }
})();
