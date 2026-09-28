const firebaseConfig = {"apiKey": "AIzaSyCR0qW19cxd3eoCB0Vy-jj5MMVgGvExBcE",

  authDomain: "audit-sub-80cc8.firebaseapp.com",

  projectId: "audit-sub-80cc8",

  storageBucket: "audit-sub-80cc8.firebasestorage.app",

  messagingSenderId: "723771331916",

  appId: "1:723771331916:web:3e08ba453157f016702be9",

  measurementId: "G-MJR92411SV"

};
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const $ = (id) => document.getElementById(id);
    const UTDS = ["SUDOESTE", "CENTRO", "OESTE", "METROPOLITANA", "NORTE", "SUL"];
    Chart.register(ChartDataLabels);

    let cacheSolic = [], cacheVeic = [], cacheHE = [], userProfile = null; let cacheColaboradores = [], cacheUtds = [];
function admNorm(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();}
function organizacaoDaUtd(utd){ return cacheUtds.find(x=>admNorm(x.nome||x.utd||x._id)===admNorm(utd))||{}; }
function correspondeOrganizacao(x,f){ const org=organizacaoDaUtd(x.utd); if(f.superintendencia&&admNorm(org.superintendencia)!==admNorm(f.superintendencia))return false; if(f.setor&&admNorm(org.setor)!==admNorm(f.setor))return false; return true; }
function perfilGlobal(){const p=String((userProfile&&(userProfile.nivelAcesso||userProfile.funcao||userProfile.cargo))||'').toLowerCase();return ['dev','superintendente','gerente','gestor'].includes(p);}
function obterUtdsPermitidas(){
  if(!userProfile) return [];
  const origem = Array.isArray(userProfile.utds) && userProfile.utds.length ? userProfile.utds : [userProfile.utd];
  const normalizadas = origem.map(v=>admNorm(v)).filter(Boolean);
  return [...new Set(normalizadas)];
}
function nomeOficialUtd(valor){
  const org=organizacaoDaUtd(valor);
  return org.nome||org.utd||valor||'';
}
function utdPermitida(x){
  if(perfilGlobal()) return true;
  return obterUtdsPermitidas().includes(admNorm(x&&x.utd));
}
function aplicarEscopo(lista){return (lista||[]).filter(utdPermitida);}
function bloquearFiltrosUtd(){
  if(perfilGlobal())return;
  const permitidas=obterUtdsPermitidas();
  ['dFiltroUtd','lFiltroUtd','heFiltroUtd','heLFiltroUtd','massFiltroUtd'].forEach(id=>{
    const el=$(id);if(!el)return;
    const nomes=permitidas.map(nomeOficialUtd).filter(Boolean);
    if(nomes.length===1){el.innerHTML=`<option value="${nomes[0]}">${nomes[0]}</option>`;el.value=nomes[0];el.disabled=true;}
    else{el.innerHTML='<option value="">Todas as UTDs permitidas</option>'+nomes.map(v=>`<option value="${v}">${v}</option>`).join('');el.value='';el.disabled=false;}
  });
}

    let unsubSolic = null, unsubVeic = null, unsubHE = null;
    let filterD = { ini: null, fim: null, status: '', superintendencia: '', setor: '', utd: '' };
    // [EDIT] filtros Lançamentos (Viagens) agora incluem status e alterado por
  let filterL = { ini: null, fim: null, colab: '', superintendencia: '', setor: '', utd: '', status: '', alterado: '' };
    let filterHE = { ini: null, fim: null, tipos: [], benefs: [], acionado: '', autorizado: '', status:'', superintendencia:'', setor:'', utd:'', r10:true, r16:true, r31:true };
    let filterHEList = { ini: null, fim: null, colab: '', superintendencia: '', setor: '', utd: '', status: '', acionado: '', autorizado: '', benef: '' };
    let heBuscaGeral = '';
    const ITENS_POR_PAGINA = 12;
    let viagemBuscaGeral = '';
    let paginaViagem = 1;
    let paginaHE = 1;
    function normalizarBuscaGeral(v) {
      return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }
    function registroContemBusca(x, termo) {
      if(!termo) return true;
      const texto = Object.values(x || {}).map(v => v && typeof v === 'object' ? JSON.stringify(v) : String(v == null ? '' : v)).join(' ');
      return normalizarBuscaGeral(texto).includes(normalizarBuscaGeral(termo));
    }
    function paginarDados(lista, pagina) {
      const totalPaginas = Math.max(1, Math.ceil(lista.length / ITENS_POR_PAGINA));
      const paginaValida = Math.min(Math.max(1, pagina), totalPaginas);
      const inicio = (paginaValida - 1) * ITENS_POR_PAGINA;
      return { itens: lista.slice(inicio, inicio + ITENS_POR_PAGINA), pagina: paginaValida, totalPaginas };
    }
    function htmlPaginacao(tipo, pagina, totalPaginas, totalItens) {
      if(totalPaginas <= 1) return `<div class="admin-pagination"><span>${totalItens} lançamento(s)</span></div>`;
      const botoes = Array.from({length: totalPaginas}, (_,i) => i + 1).map(n => `<button type="button" class="page-btn ${n===pagina?'active':''}" onclick="mudarPaginaAdmin('${tipo}',${n})">${n}</button>`).join('');
      return `<div class="admin-pagination"><span>${totalItens} lançamento(s) • Página ${pagina} de ${totalPaginas}</span><div><button type="button" class="page-btn" ${pagina===1?'disabled':''} onclick="mudarPaginaAdmin('${tipo}',${pagina-1})"><i class="fa-solid fa-chevron-left"></i></button>${botoes}<button type="button" class="page-btn" ${pagina===totalPaginas?'disabled':''} onclick="mudarPaginaAdmin('${tipo}',${pagina+1})"><i class="fa-solid fa-chevron-right"></i></button></div></div>`;
    }
    function mudarPaginaAdmin(tipo, pagina) {
      if(tipo === 'viagem') { paginaViagem = pagina; renderLanca(); }
      else { paginaHE = pagina; renderHELista(); }
    }
    function normalizarBuscaHE(v) {
      return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }
    function textoCompletoHE(x) {
      return normalizarBuscaHE(Object.values(x || {}).map(v => {
        if(v && typeof v === 'object') return JSON.stringify(v);
        return v;
      }).join(' '));
    }
    function mapaDuplicidadesHE(data) {
      const grupos = new Map();
      (data || []).forEach(x => {
        const nome = normalizarBuscaHE(x.colaborador);
        const dataHE = String(x.data || '').trim();
        if(!nome || !dataHE) return;
        const chave = nome + '|' + dataHE;
        if(!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push(x);
      });
      const avisos = new Map();
      grupos.forEach(lista => {
        if(lista.length < 2) return;
        lista.forEach(atual => {
          const outro = lista.find(item => item._id !== atual._id) || lista[0];
          avisos.set(atual._id, `Possivel duplicidade no lançamento Nº ${outro.numero || '-'}`);
        });
      });
      return avisos;
    }

    auth.onAuthStateChanged(async (user) => {
      if(user) {
        setLoginLoading(true,true);
        $('loginScreen').style.display = 'none';
        $('appShell').style.display = 'block';
        let doc; try { doc = await db.collection('usuarios').doc(user.uid).get(); } catch(err) { console.error('Falha ao carregar perfil:',err); $('loginMsg').textContent='Login realizado, mas não foi possível carregar o perfil.'; await auth.signOut(); setLoginLoading(false,false); return; }
        userProfile = doc.exists ? doc.data() : { nome: user.email, cargo: 'gestor' };
        $('userBox').textContent = userProfile.nome;
        $('userRole').textContent = userProfile.funcao || userProfile.cargo || 'GESTOR';
        const isDevUser = String(userProfile.funcao || userProfile.cargo || '').toLowerCase() === 'dev';
        if($('navDev')) $('navDev').style.display = isDevUser ? 'flex' : 'none'; if($('navMass')) $('navMass').style.display = isDevUser ? 'flex' : 'none'; bloquearFiltrosUtd();
        initApp();
        setModo('viagem');
        setLoginLoading(false,false);
      } else {
        $('loginScreen').style.display = 'flex';
        $('appShell').style.display = 'none';
        setLoginLoading(false,false);
      }
    });
    function setLoginLoading(ativo, carregandoPerfil=false) {
      const btn=$('btnLogin'), overlay=$('loginLoadingOverlay');
      if(btn){ btn.disabled=ativo; btn.classList.toggle('is-loading',ativo); }
      if($('email')) $('email').disabled=ativo;
      if($('senha')) $('senha').disabled=ativo;
      if($('recSenha')) $('recSenha').classList.toggle('is-disabled',ativo);
      if(overlay){ overlay.classList.toggle('show',ativo&&carregandoPerfil); overlay.setAttribute('aria-hidden',ativo&&carregandoPerfil?'false':'true'); }
    }
    function mensagemLogin(texto, tipo='erro') { const el=$('loginMsg'); if(!el)return; el.textContent=texto; el.className='login-message '+tipo; }
    function mensagemErroAuth(err, contexto='login') {
      const codigo=err&&err.code||'';
      if(contexto==='recuperacao'){
        if(codigo==='auth/invalid-email') return 'Informe um e-mail válido.';
        if(codigo==='auth/user-not-found') return 'Não existe usuário cadastrado com este e-mail.';
        if(codigo==='auth/too-many-requests') return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        return 'Não foi possível enviar o e-mail de recuperação.';
      }
      if(codigo==='auth/invalid-email') return 'Informe um e-mail válido.';
      if(codigo==='auth/user-disabled') return 'Este usuário está desativado.';
      if(codigo==='auth/too-many-requests') return 'Muitas tentativas. Aguarde alguns minutos.';
      return 'E-mail ou senha inválidos.';
    }
    $('btnLogin').onclick = async () => {
      const email=$('email').value.trim(), senha=$('senha').value;
      mensagemLogin('');
      if(!email) return mensagemLogin('Informe o e-mail corporativo.');
      if(!senha) return mensagemLogin('Informe a senha.');
      setLoginLoading(true,false);
      try { await auth.signInWithEmailAndPassword(email,senha); }
      catch(err){ console.error('Falha no login:',err); mensagemLogin(mensagemErroAuth(err)); setLoginLoading(false,false); }
    };
    $('recSenha').onclick = async () => {
      const email=$('email').value.trim(); mensagemLogin('');
      if(!email){ mensagemLogin('Digite seu e-mail corporativo acima para recuperar a senha.'); $('email').focus(); return; }
      setLoginLoading(true,false);
      try{ await auth.sendPasswordResetEmail(email); mensagemLogin('E-mail de recuperação enviado. Verifique também a caixa de spam.','sucesso'); }
      catch(err){ console.error('Falha ao recuperar senha:',err); mensagemLogin(mensagemErroAuth(err,'recuperacao')); }
      finally{ setLoginLoading(false,false); }
    };
    ['email','senha'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('btnLogin').disabled)$('btnLogin').click();}));
    $('btnLogout').onclick = () => auth.signOut();

    function initApp() {
      configurarFiltrosOrganizacao();
      document.querySelectorAll('#nav a').forEach(t => {
        t.onclick = (e) => {
          e.preventDefault();
          document.querySelectorAll('#nav a').forEach(x => x.classList.remove('active'));
          t.classList.add('active');
          document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
          $('tab-' + t.dataset.tab).style.display = 'block';
        }
      });
      db.collection('utds').onSnapshot(snap => {
        cacheUtds = snap.docs.map(d => ({ _id:d.id, ...d.data() }));
        popularOrganizacaoAdmin();
        popularFiltrosOrganizacaoLancamentos();
      }, err => { console.error('Falha ao carregar estrutura de UTDs:', err); });
      if(unsubSolic) unsubSolic();
      unsubSolic = db.collection('solicitacoes_diaria').orderBy('createdAt', 'desc').onSnapshot(snap => {
        cacheSolic = aplicarEscopo(snap.docs.map(d => ({ _id: d.id, ...d.data() })));
        populateFilters(); renderDash(); renderLanca();
      });
      if(unsubVeic) unsubVeic();
      unsubVeic = db.collection('veiculos').onSnapshot(snap => {
        cacheVeic = aplicarEscopo(snap.docs.map(d => ({ _id: d.id, ...d.data() })));
        renderVeiculos();
      });
      if(unsubHE) unsubHE();
      unsubHE = db.collection('solicitacoes_hora_extra').onSnapshot(snap => {
        cacheHE = aplicarEscopo(snap.docs.map(d => ({ _id: d.id, ...d.data() })));
        cacheHE.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
        populateHEFilters(); renderHE(); renderHELista();
      });
    }

    function brl(v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

    function formatHours(min) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    }

    function runFilter(data, f) {
  return data.filter(x => {
    if(!correspondeOrganizacao(x,f)) return false;
    if(f.status && x.status !== f.status) return false;
    if(f.utd && (x.utd || '') !== f.utd) return false;
    // [EDIT] filtro por 'Alterado por' (statusBy)
    if(f.alterado && (x.statusBy || '') !== f.alterado) return false;
        if(f.colab && x.colaborador !== f.colab) return false;
        if(f.utd && (x.utd || '') !== f.utd) return false;
        if(f.ini || f.fim) {
          let recordDate = x.createdAt ? new Date(x.createdAt) : new Date(x.dataSaida + "T12:00:00");
          recordDate.setHours(0,0,0,0);
          if(f.ini && recordDate.getTime() < new Date(f.ini + "T00:00:00").getTime()) return false;
          if(f.fim && recordDate.getTime() > new Date(f.fim + "T23:59:59").getTime()) return false;
        }
        return true;
      });
    }

    function runFilterHE(data, f) {
      return data.filter(x=>{
        if(!correspondeOrganizacao(x,f)) return false;
        if(f.ini || f.fim){
          const t = new Date((x.data||'') + 'T00:00:00').getTime();
          if(f.ini && t < new Date(f.ini+'T00:00:00').getTime()) return false;
          if(f.fim && t > new Date(f.fim+'T23:59:59').getTime()) return false;
        }
        if(f.tipos && f.tipos.length && !f.tipos.includes(x.tipoHoraExtra)) return false;
 if(f.benefs && f.benefs.length){
   const bt = (x.beneficio_tipo || '').toLowerCase();
   const has = !!bt;
   const wantSem = f.benefs.includes('sem');
   const wantTypes = f.benefs.filter(v=>v!=='sem');
   if(wantTypes.length && !wantTypes.includes(bt)) return false;
   if(!wantSem && !has) return false;
   if(wantSem && wantTypes.length==0 && has) return false;
 }
        if(f.acionado && x.acionadoPor !== f.acionado) return false;
        if(f.autorizado && (x.autorizadoSupervisor||'').toUpperCase() !== f.autorizado) return false;
        if(f.status && (x.status||'Pendente') !== f.status) return false;
        if(f.utd && String(x.utd || '').trim().toUpperCase() !== String(f.utd).trim().toUpperCase()) return false;
        if(x.faixaMinutos==='10-15' && !f.r10) return false;
        if(x.faixaMinutos==='16-30' && !f.r16) return false;
        if(x.faixaMinutos==='31-60' && !f.r31) return false;
        return true;
      });
    }

    function runFilterHEList(data, f) {
      return data.filter(x => {
        if(!correspondeOrganizacao(x,f)) return false;
        if(heBuscaGeral && !textoCompletoHE(x).includes(normalizarBuscaHE(heBuscaGeral))) return false;
        if(f.colab && x.colaborador !== f.colab) return false;
                if(f.utd && String(x.utd || '').trim().toUpperCase() !== String(f.utd).trim().toUpperCase()) return false;
        if(f.status && (x.status || 'Pendente') !== f.status) return false;
        if(f.acionado && x.acionadoPor !== f.acionado) return false;
        if(f.autorizado && (x.autorizadoSupervisor || '').toUpperCase() !== f.autorizado) return false;
 if(f.benef){
   const bt = String(x.beneficio_tipo||'').toLowerCase();
   if(f.benef==='sem'){ if(bt) return false; }
   else { if(bt !== f.benef) return false; }
 }
        if(f.ini || f.fim) {
          let t = new Date((x.data || '') + "T12:00:00").getTime();
          if(f.ini && t < new Date(f.ini + "T00:00:00").getTime()) return false;
          if(f.fim && t > new Date(f.fim + "T23:59:59").getTime()) return false;
        }
        return true;
      });
    }

    function renderDash() {
      const d = runFilter(cacheSolic, filterD);
      const aprov = d.filter(x => x.status === 'Aprovado');
      $('kTotal').textContent = d.length;
      $('kAprov').textContent = aprov.length;
      $('kPend').textContent = d.filter(x => x.status === 'Pendente').length;
      $('kVal').textContent = brl(aprov.reduce((s, x) => s + (x.valor || 0), 0));
 const valAprov = aprov.reduce((s,x)=> s + (x.valor||0), 0);
 const valPend = d.filter(x=>x.status==='Pendente').reduce((s,x)=> s + (x.valor||0), 0);
 const valReprov = d.filter(x=>x.status==='Reprovado').reduce((s,x)=> s + (x.valor||0), 0);
 if($('kValAprov')) $('kValAprov').textContent = brl(valAprov);
 if($('kValPend')) $('kValPend').textContent = brl(valPend);
 if($('kValReprov')) $('kValReprov').textContent = brl(valReprov);
      
      const sMap = { Pendente:0, Aprovado:0, Reprovado:0 };
      d.forEach(x => sMap[x.status]++);
      const cMap = {};
      aprov.forEach(x => { cMap[x.colaborador] = (cMap[x.colaborador]||0) + (x.valor||0); });
      const sorted = Object.entries(cMap).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v);
      const rRows = sorted.map((r, i) => `<tr><td style="width:50px; font-weight:800">${i+1}º</td><td><b>${r.k}</b></td><td style="text-align:right">${brl(r.v)}</td></tr>`).join('');
      $('tblRankContainer').innerHTML = `<table><thead><tr><th>POS</th><th>COLABORADOR</th><th style="text-align:right">APROVADO</th></tr></thead><tbody>${rRows || '<tr><td colspan="3">Vazio</td></tr>'}</tbody></table>`;
      try {
        if(window._c1) window._c1.destroy();
        if(window._c2) window._c2.destroy();
        window._c1 = new Chart($('chStatus'), { type:'doughnut', data: { labels: Object.keys(sMap), datasets:[{ data: Object.values(sMap), backgroundColor:['#F59E0B','#10B981','#EF4444'], borderWidth: 0 }] }, options: { maintainAspectRatio:false, cutout:'70%', plugins: { legend: { position: 'right' }, datalabels: { color: '#fff', font: { weight: 'bold' } } } } });
        const top10 = sorted.slice(0, 10);
        window._c2 = new Chart($('chTop'), { type:'bar', data: { labels: top10.map(x => x.k), datasets: [{ label:'R$', data: top10.map(x => x.v), backgroundColor:'#6D28D9', borderRadius: 6 }] }, options: { indexAxis: 'y', maintainAspectRatio:false, plugins: { legend: { display: false }, datalabels: { anchor:'end', align:'end', color:'#1E293B', font:{size:10, weight:'bold'}, formatter: (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits:0 }) } }, scales: { x: { display: false }, y: { grid: { display: false } } } } });
      } catch(e){}
    }

    function renderLanca() {
      let filtrados = runFilter(cacheSolic, filterL).filter(x => registroContemBusca(x, viagemBuscaGeral));
      const pg = paginarDados(filtrados, paginaViagem); paginaViagem = pg.pagina;
      const rows = pg.itens.map(x => `
        <tr>
          <td class="col-num">#${x.numero || ''}</td>
          <td class="col-colab"><b>${x.colaborador || '-'}</b></td>
          <td class="col-utd">${x.utd || '-'}</td>
          <td class="col-destino">${x.destino || '-'}</td>
          <td class="col-veiculo">${x.placa || '-'}<br><small>${x.frota || '-'}</small></td>
          <td class="col-data">${(x.dataSaida||'').split('-').reverse().join('/')}<br><small>${x.horaSaida||''}</small></td>
          <td class="col-data">${x.dataRetorno ? x.dataRetorno.split('-').reverse().join('/') : '-'}<br><small>${x.horaRetorno || '-'}</small></td>
          <td class="col-duracao"><b>${x.duracaoTexto || '-'}</b></td>
          <td class="col-valor"><b>${brl(x.valor)}</b></td>
          <td class="col-status"><span class="pill ${x.status==='Aprovado'?'ok':(x.status==='Reprovado'?'bad':'wait')}">${x.status || 'Pendente'}</span></td>
          <td class="col-alterado">${x.statusBy || '-'}</td>
          <td class="col-nota">${x.numeroNotaAtividade || '-'}</td>
          <td class="col-obs">${x.observacao || '-'}</td>
          <td class="col-acoes"><div class="row-actions"><select class="input chgStatus" data-id="${x._id}"><option ${x.status==='Pendente'?'selected':''}>Pendente</option><option ${x.status==='Aprovado'?'selected':''}>Aprovado</option><option ${x.status==='Reprovado'?'selected':''}>Reprovado</option></select><button class="btn btn-primary icon-btn" onclick="openEditLanca('${x._id}')"><i class="fa-solid fa-pen"></i></button><button class="btn btn-danger icon-btn" onclick="askDelete('solic','${x._id}')"><i class="fa-solid fa-trash"></i></button></div></td>
        </tr>`).join('');
      const c = $('tblLancaContainer');
      if(c && !document.getElementById('viagemBuscaGeralInput')) {
        const busca = document.createElement('div'); busca.className='admin-search-bar';
        busca.innerHTML='<div class="admin-search-wrap"><i class="fa-solid fa-magnifying-glass"></i><input id="viagemBuscaGeralInput" class="input" type="search" placeholder="Buscar por qualquer item do lançamento..."></div><button id="viagemBuscaLimpar" class="btn btn-light" type="button"><i class="fa-solid fa-xmark"></i> Limpar</button>';
        c.parentElement.insertBefore(busca,c);
        $('viagemBuscaGeralInput').value=viagemBuscaGeral;
        $('viagemBuscaGeralInput').addEventListener('input',e=>{viagemBuscaGeral=e.target.value;paginaViagem=1;renderLanca();});
        $('viagemBuscaLimpar').addEventListener('click',()=>{viagemBuscaGeral='';paginaViagem=1;renderLanca();});
      }
      c.innerHTML = `<div class="launch-table-scroll"><table class="launch-table viagem-table"><thead><tr><th>Nº</th><th>Colab</th><th>UTD</th><th>Destino</th><th>Veículo</th><th>Saída</th><th>Chegada</th><th>Duração</th><th>Valor</th><th>Status</th><th>Alterado por</th><th>Nota/Atividade</th><th>Obs</th><th>Ação</th></tr></thead><tbody>${rows || '<tr><td colspan="14">Nenhum lançamento encontrado.</td></tr>'}</tbody></table></div>${htmlPaginacao('viagem',pg.pagina,pg.totalPaginas,filtrados.length)}`;
      document.querySelectorAll('.chgStatus').forEach(el => { el.onchange = async () => { if(el.value==='Reprovado') openEditLanca(el.dataset.id,true); else { const nm=(userProfile&&userProfile.nome)||(auth.currentUser&&auth.currentUser.email)||''; await db.collection('solicitacoes_diaria').doc(el.dataset.id).update({status:el.value,statusBy:nm,statusAt:new Date().toISOString()}); } }; });
    }

    function renderHE(){
  const d = runFilterHE(cacheHE, filterHE);
  $('kheTotal').textContent = d.length;

  const totalMinutosGeral = d.reduce((s, x) => s + (parseInt(x.duracaoMinutos) || 0), 0);
  $('kheAprov').textContent = formatHours(totalMinutosGeral);
  $('khePend').textContent = d.filter(x => (x.status||'Pendente') === 'Pendente').length;

  const aprov = d.filter(x => (x.status||'Pendente') === 'Aprovado');
  const pend = d.filter(x => (x.status||'Pendente') === 'Pendente');
  const reprov = d.filter(x => (x.status||'Pendente') === 'Reprovado');

  const benefValAprov = aprov.reduce((s,x)=> s + Number(x.beneficio_valor||0), 0);
  const benefValPend = pend.reduce((s,x)=> s + Number(x.beneficio_valor||0), 0);
  const benefValReprov = reprov.reduce((s,x)=> s + Number(x.beneficio_valor||0), 0);

  const benefQtdAprov = aprov.filter(x => !!String(x.beneficio_tipo||'').trim()).length;

  if($('kheBenefVal')) $('kheBenefVal').textContent = brl(benefValAprov);
  if($('kheBenefQtd')) $('kheBenefQtd').textContent = benefQtdAprov;
  if($('kheValAprov')) $('kheValAprov').textContent = brl(benefValAprov);
  if($('kheValPend')) $('kheValPend').textContent = brl(benefValPend);
  if($('kheValReprov')) $('kheValReprov').textContent = brl(benefValReprov);

  // Ranking de horas (por colaborador)
  const map = {};
  d.forEach(x=>{
    const c = x.colaborador || '-';
    if(!map[c]) map[c] = { c, a:0, b:0, c31:0, totalMin:0 };
    const faixa = x.faixaMinutos;
    if(faixa==='10-15') map[c].a++;
    if(faixa==='16-30') map[c].b++;
    if(faixa==='31-60') map[c].c31++;
    map[c].totalMin += (parseInt(x.duracaoMinutos) || 0);
  });
  const arr = Object.values(map).sort((p,q)=>q.totalMin - p.totalMin);
  const rows = arr.map((r,i)=>`<tr><td>${i+1}º</td><td><b>${r.c}</b></td><td style="text-align:center">${r.a}</td><td style="text-align:center">${r.b}</td><td style="text-align:center">${r.c31}</td><td style="text-align:right; font-weight:900">${formatHours(r.totalMin)}</td></tr>`).join('');
  $('heRankTbl').innerHTML = `<table><thead><tr><th style="width:40px">POS</th><th>COLABORADOR</th><th style="text-align:center">10-15</th><th style="text-align:center">16-30</th><th style="text-align:center">31-60</th><th style="text-align:right">TOTAL HORAS</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Sem dados</td></tr>'}</tbody></table>`;

  // Mapas para gráficos
  const tipoMap = {};
  const faixaMap = { '10-15':0, '16-30':0, '31-60':0 };
  const benefQtdMap = { refeicao:0, lanche:0, acumulativo:0, sem:0 };
  const benefValMap = { refeicao:0, lanche:0, acumulativo:0, sem:0 };

  d.forEach(x=>{
    tipoMap[x.tipoHoraExtra] = (tipoMap[x.tipoHoraExtra]||0) + 1;
    if(x.faixaMinutos in faixaMap) faixaMap[x.faixaMinutos]++;
    const bt = String(x.beneficio_tipo||'').toLowerCase();
    const key = bt ? bt : 'sem';
    if(key in benefQtdMap) benefQtdMap[key]++;
    if(key in benefValMap) benefValMap[key] += Number(x.beneficio_valor||0);
  });

  try{
    if(window._heTipoChart) window._heTipoChart.destroy();
    if(window._heFaixaChart) window._heFaixaChart.destroy();
    if(window._heBenefQtdChart) window._heBenefQtdChart.destroy();
    if(window._heBenefValChart) window._heBenefValChart.destroy();
    if(window._heTopBenefChart) window._heTopBenefChart.destroy();

    if(document.getElementById('heChartTipo')){
      window._heTipoChart = new Chart($('heChartTipo'), {
        type:'doughnut',
        data:{ labels:Object.keys(tipoMap), datasets:[{ data:Object.values(tipoMap), backgroundColor:['#1D4ED8','#0EA5E9','#10B981','#F59E0B','#EF4444'], borderWidth:0 }]},
        options:{ maintainAspectRatio:false, plugins:{ legend:{ position:'right' }, datalabels:{ color:'#fff', font:{weight:'bold'} } } }
      });
    }

    if(document.getElementById('heChartFaixa')){
      window._heFaixaChart = new Chart($('heChartFaixa'), {
        type:'doughnut',
        data:{ labels:['10-15','16-30','31-60'], datasets:[{ data:[faixaMap['10-15'], faixaMap['16-30'], faixaMap['31-60']], backgroundColor:['#22c55e','#f59e0b','#ef4444'], borderWidth:0 }]},
        options:{ maintainAspectRatio:false, plugins:{ legend:{ position:'right' }, datalabels:{ color:'#fff', font:{weight:'bold'} } } }
      });
    }

    const benefLabels = ['refeicao','lanche','acumulativo','sem'];

    if(document.getElementById('heChartBenefQtd')){
      const benefQtd = benefLabels.map(k => benefQtdMap[k] || 0);
      window._heBenefQtdChart = new Chart($('heChartBenefQtd'), {
        type:'doughnut',
        data:{ labels:['refeição','lanche','acumulativo','sem'], datasets:[{ data: benefQtd, backgroundColor:['#10B981','#0EA5E9','#F59E0B','#94A3B8'], borderWidth:0 }]},
        options:{ maintainAspectRatio:false, plugins:{ legend:{ position:'right' }, datalabels:{ color:'#fff', font:{weight:'bold'} } } }
      });
    }

    if(document.getElementById('heChartBenefVal')){
      const benefVal = benefLabels.map(k => benefValMap[k] || 0);
      window._heBenefValChart = new Chart($('heChartBenefVal'), {
        type:'bar',
        data:{ labels:['refeição','lanche','acumulativo','sem'], datasets:[{ label:'R$', data: benefVal, backgroundColor:['#10B981','#0EA5E9','#F59E0B','#94A3B8'], borderRadius:6 }]},
        options:{ maintainAspectRatio:false, plugins:{ legend:{ display:false }, datalabels:{ anchor:'end', align:'end', color:'#1E293B', font:{size:10, weight:'bold'}, formatter:(v)=> brl(v) } }, scales:{ y:{ beginAtZero:true }, x:{ grid:{ display:false } } } }
      });
    }

    if(document.getElementById('heChartTopBenef')){
      const mapBenef = {};
      d.forEach(x=>{ const c = x.colaborador || '-'; mapBenef[c] = (mapBenef[c]||0) + Number(x.beneficio_valor||0); });
      const topArr = Object.entries(mapBenef).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v).slice(0,20);
      window._heTopBenefChart = new Chart($('heChartTopBenef'), {
        type:'bar',
        data:{ labels: topArr.map(x=>x.k), datasets:[{ label:'R$', data: topArr.map(x=>x.v), backgroundColor:'#6D28D9', borderRadius:6 }]},
        options:{ indexAxis:'y', maintainAspectRatio:false, plugins:{ legend:{ display:false }, datalabels:{ anchor:'end', align:'end', color:'#1E293B', font:{size:10, weight:'bold'}, formatter:(v)=> brl(v) } }, scales:{ x:{ beginAtZero:true }, y:{ grid:{ display:false } } } }
      });
    }

  } catch(e){}
}

function renderHELista(){
  let filtrados = runFilterHEList(cacheHE, filterHEList).filter(x => registroContemBusca(x, heBuscaGeral));
  const pg = paginarDados(filtrados, paginaHE); paginaHE = pg.pagina;
  const avisosDuplicidade = mapaDuplicidadesHE(cacheHE);
  const rows = pg.itens.map(x=>`<tr>
    <td class="col-num">#${x.numero||''}</td><td class="col-colab"><b>${x.colaborador||'-'}</b></td><td class="col-utd">${x.utd||'-'}</td><td class="col-data">${(x.data||'').split('-').reverse().join('/')}</td><td>${x.acionadoPor||'-'}</td><td>${x.autorizadoSupervisor||'-'}</td><td class="col-periodo">${x.horaInicio||'-'} – ${x.horaFim||'-'}</td><td class="col-duracao"><b>${x.duracaoMinutos||0} min</b></td><td class="col-beneficio">${x.beneficio_tipo||'-'}</td><td class="col-valor"><b>${brl(x.beneficio_valor||0)}</b></td><td class="col-status"><span class="pill ${x.status==='Aprovado'?'ok':(x.status==='Reprovado'?'bad':'wait')}">${x.status||'Pendente'}</span></td><td class="he-just-cell"><i>${x.justificativa||'-'}</i></td><td class="he-obs-cell">${[avisosDuplicidade.get(x._id)?`<div class="he-duplicate-warning">${avisosDuplicidade.get(x._id)}</div>`:'',x.observacao?`<div>${x.observacao}</div>`:''].filter(Boolean).join('')||'-'}</td><td class="col-alterado">${x.statusBy||'-'}</td><td class="col-acoes"><div class="row-actions"><select class="input heChgStatus" data-id="${x._id}"><option ${x.status==='Pendente'?'selected':''}>Pendente</option><option ${x.status==='Aprovado'?'selected':''}>Aprovado</option><option ${x.status==='Reprovado'?'selected':''}>Reprovado</option></select><button class="btn btn-primary icon-btn" onclick="openEditHELanca('${x._id}')"><i class="fa-solid fa-pen"></i></button></div></td>
  </tr>`).join('');
  const c=$('heListaTbl');
  if(c && !document.getElementById('heBuscaGeralInput')) { const busca=document.createElement('div'); busca.className='admin-search-bar'; busca.innerHTML='<div class="admin-search-wrap"><i class="fa-solid fa-magnifying-glass"></i><input id="heBuscaGeralInput" class="input" type="search" placeholder="Buscar por qualquer item do lançamento..."></div><button id="heBuscaLimpar" class="btn btn-light" type="button"><i class="fa-solid fa-xmark"></i> Limpar</button>'; c.parentElement.insertBefore(busca,c); $('heBuscaGeralInput').value=heBuscaGeral; $('heBuscaGeralInput').addEventListener('input',e=>{heBuscaGeral=e.target.value;paginaHE=1;renderHELista();}); $('heBuscaLimpar').addEventListener('click',()=>{heBuscaGeral='';paginaHE=1;renderHELista();}); }
  c.innerHTML=`<div class="launch-table-scroll"><table class="launch-table he-table"><thead><tr><th>Nº</th><th>Colab</th><th>UTD</th><th>Data</th><th>Acionado</th><th>Autorizado</th><th>Período</th><th>Min</th><th>Benefício</th><th>Valor</th><th>Status</th><th>Justif. Index</th><th>Obs Auditoria</th><th>Alterado por</th><th>Ação</th></tr></thead><tbody>${rows||'<tr><td colspan="15">Nenhum lançamento encontrado.</td></tr>'}</tbody></table></div>${htmlPaginacao('he',pg.pagina,pg.totalPaginas,filtrados.length)}`;
  document.querySelectorAll('.heChgStatus').forEach(el=>{el.onchange=async()=>{if(el.value==='Reprovado')openEditHE(el.dataset.id);else{const nm=(userProfile&&userProfile.nome)||(auth.currentUser&&auth.currentUser.email)||'';await db.collection('solicitacoes_hora_extra').doc(el.dataset.id).update({status:el.value,statusBy:nm,statusAt:new Date().toISOString()});}};});
}


    function populateFilters() {
  // [EDIT] popula filtros de Viagens/Lançamentos: Colaborador + Status + Alterado por
  const nomes = [...new Set(cacheSolic.map(d => d.colaborador).filter(Boolean))].sort();
  const selCol = $('lFiltroColab');
  selCol.innerHTML = '<option value="">Todos os Colaboradores</option>';
  nomes.forEach(n => selCol.innerHTML += `<option value="${n}">${n}</option>`);

  // Status (únicos)
  const sts = [...new Set(cacheSolic.map(d => d.status).filter(Boolean))]
    .sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
  const selSt = $('lFiltroStatus');
  if(selSt) {
    selSt.innerHTML = '<option value="">Todos</option>';
    sts.forEach(s => selSt.innerHTML += `<option value="${s}">${s}</option>`);
  }

  // Alterado por (statusBy) - apenas não vazios
  const alt = [...new Set(cacheSolic.map(d => (d.statusBy || '').trim()).filter(v => !!v))]
    .sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
  const selAlt = $('lFiltroAlterado');
  if(selAlt) {
    selAlt.innerHTML = '<option value="">Todos</option>';
    alt.forEach(s => selAlt.innerHTML += `<option value="${s}">${s}</option>`);
  }
}

function populateHEFilters() {
      const nomes = [...new Set(cacheHE.map(d => d.colaborador).filter(Boolean))].sort();
      const sel = $('heLFiltroColab'); sel.innerHTML = '<option value="">Todos os Colaboradores</option>';
      nomes.forEach(n => sel.innerHTML += `<option value="${n}">${n}</option>`);
    }

    $('btnAplicaDash').onclick = () => { filterD.ini = $('dFiltroIni').value; filterD.fim = $('dFiltroFim').value; filterD.status = $('dFiltroStatus').value; filterD.superintendencia = $('dFiltroSuperintendencia').value; filterD.setor = $('dFiltroSetor').value; filterD.utd = $('dFiltroUtd').value; renderDash(); };
    $('btnLimpaDash').onclick = () => { ['dFiltroIni','dFiltroFim','dFiltroStatus','dFiltroSuperintendencia','dFiltroSetor','dFiltroUtd'].forEach(id => {if($(id)&&!$(id).disabled)$(id).value='';}); filterD = { ini: null, fim: null, status: '', superintendencia: '', setor: '', utd: '' }; popularFiltrosOrganizacaoLancamentos(); renderDash(); };
    $('btnAplicaLanca').onclick = () => { paginaViagem = 1;
  // [EDIT] captura novos filtros (status e alterado por)
  filterL.ini = $('lFiltroIni').value;
  filterL.fim = $('lFiltroFim').value;
  filterL.colab = $('lFiltroColab').value;
  filterL.superintendencia = $('lFiltroSuperintendencia').value;
  filterL.setor = $('lFiltroSetor').value;
  filterL.utd = $('lFiltroUtd').value;
  filterL.status = ($('lFiltroStatus') && $('lFiltroStatus').value) || '';
  filterL.alterado = ($('lFiltroAlterado') && $('lFiltroAlterado').value) || '';
  renderLanca();
};
    $('btnLimpaLanca').onclick = () => {
  // [EDIT] limpa também Status e Alterado por
  ['lFiltroIni','lFiltroFim','lFiltroColab','lFiltroSuperintendencia','lFiltroSetor','lFiltroUtd','lFiltroStatus','lFiltroAlterado'].forEach(id => { if($(id)) $(id).value = ''; });
  filterL = { ini: null, fim: null, colab: '', superintendencia: '', setor: '', utd: '', status: '', alterado: '' };
  popularFiltrosOrganizacaoLancamentos();

// [EDIT] impressão de Lançamentos Viagens (lista filtrada)
$('btnImprimir').onclick = () => {
  const d = runFilter(cacheSolic, filterL);

  const fmtDate = (iso) => {
    if(!iso) return '-';
    const parts = String(iso).split('-');
    if(parts.length===3) return parts.reverse().join('/');
    return iso;
  };

  const subPeriodo = (() => {
    const a = $('lFiltroIni') && $('lFiltroIni').value ? fmtDate($('lFiltroIni').value) : '';
    const b = $('lFiltroFim') && $('lFiltroFim').value ? fmtDate($('lFiltroFim').value) : '';
    if(a && b) return `Período: ${a} a ${b}`;
    if(a) return `Período: a partir de ${a}`;
    if(b) return `Período: até ${b}`;
    return 'Período: Todos';
  })();
  const subColab = `Colaborador: ${filterL.colab || 'Todos'}`;
  const subUtd = `UTD: ${filterL.utd || 'Todas'}`;
  const subSt = `Status: ${filterL.status || 'Todos'}`;
  const subAlt = `Alterado por: ${filterL.alterado || 'Todos'}`;

  $('pTitle').textContent = 'Relatório de Lançamentos Viagens';
  $('pSub').textContent = `${subPeriodo} | ${subColab} | ${subUtd} | ${subSt} | ${subAlt}`;
  $('pDate').textContent = new Date().toLocaleString('pt-BR');

  const rows = d.map(x => `
    <tr>
      <td style="font-weight:700">#${x.numero || ''}</td>
      <td><b>${x.colaborador || '-'}</b></td>
      <td>${x.utd || '-'}</td>
      <td>${x.destino || '-'}</td>
      <td style="font-size:11px">${x.placa || '-'}<br><small>${x.frota || '-'}</small></td>
      <td style="white-space:nowrap">${fmtDate(x.dataSaida || '')}<br><small>${x.horaSaida || ''}</small></td>
      <td style="white-space:nowrap">${x.dataRetorno ? fmtDate(x.dataRetorno) : '-'}<br><small>${x.horaRetorno || '-'}</small></td>
      <td style="font-weight:700">${x.duracaoTexto || '-'}</td>
      <td style="font-weight:800">${brl(x.valor)}</td>
      <td>${x.status || '-'}</td>
      <td>${x.statusBy || '-'}</td>
      <td>${x.numeroNotaAtividade || '-'}</td>
      <td>${x.observacao || ''}</td>
    </tr>`).join('');

  $('pContainer').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nº</th>
          <th>Colab</th>
          <th>UTD</th>
          <th>Destino</th>
          <th>Veículo</th>
          <th>Saída</th>
          <th>Chegada</th>
          <th>Duração</th>
          <th>Valor</th>
          <th>Status</th>
          <th>Alterado por</th>
          <th>Nota/Atividade</th>
          <th>Obs</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="13">Vazio.</td></tr>'}
      </tbody>
    </table>`;

  const totalAprov = d.filter(x => x.status === 'Aprovado').reduce((s, x) => s + (x.valor || 0), 0);
  $('pTotalValue').textContent = brl(totalAprov);

  window.print();
};

  renderLanca();
};

    $('btnAplicaHE').onclick = () => {
      filterHE.ini = $('heFiltroIni').value; filterHE.fim = $('heFiltroFim').value; filterHE.status = $('heFiltroStatus').value; filterHE.superintendencia = $('heFiltroSuperintendencia').value; filterHE.setor = $('heFiltroSetor').value; filterHE.utd = $('heFiltroUtd').value;
      filterHE.acionado = $('heFiltroAcionado').value; filterHE.autorizado = $('heFiltroAutorizado').value;
      filterHE.tipos = Array.from($('heFiltroTipo').selectedOptions).map(o=>o.value);
 filterHE.benefs = Array.from($('heFiltroBenef').selectedOptions).map(o=>o.value);
      filterHE.r10 = $('heR10').checked; filterHE.r16 = $('heR16').checked; filterHE.r31 = $('heR31').checked;
      renderHE();
    };
    $('btnLimpaHE').onclick = () => { 
      ['heFiltroIni','heFiltroFim','heFiltroStatus','heFiltroSuperintendencia','heFiltroSetor','heFiltroUtd','heFiltroAcionado','heFiltroAutorizado'].forEach(id => $(id).value=''); 
      const s=$('heFiltroTipo'); for(let i=0;i<s.options.length;i++) s.options[i].selected=false;
 const b=$('heFiltroBenef'); for(let i=0;i<b.options.length;i++) b.options[i].selected=false;
      ['heR10','heR16','heR31'].forEach(id => $(id).checked=true);
      filterHE = { ini: null, fim: null, tipos: [], benefs: [], acionado: '', autorizado: '', status:'', superintendencia:'', setor:'', utd:'', r10:true, r16:true, r31:true };
      popularFiltrosOrganizacaoLancamentos();
      renderHE();
    };

    $('btnAplicaHEList').onclick = () => { paginaHE = 1;
      filterHEList.colab = $('heLFiltroColab').value; filterHEList.superintendencia = $('heLFiltroSuperintendencia').value; filterHEList.setor = $('heLFiltroSetor').value; filterHEList.utd = $('heLFiltroUtd').value; filterHEList.ini = $('heLFiltroIni').value;
      filterHEList.fim = $('heLFiltroFim').value; filterHEList.status = $('heLFiltroStatus').value;
      filterHEList.acionado = $('heLFiltroAcionado').value; filterHEList.autorizado = $('heLFiltroAutorizado').value;
 filterHEList.benef = $('heLFiltroBenef').value;
      renderHELista();
    };
    $('btnLimpaHEList').onclick = () => {
      ['heLFiltroColab','heLFiltroSuperintendencia','heLFiltroSetor','heLFiltroUtd','heLFiltroIni','heLFiltroFim','heLFiltroStatus','heLFiltroAcionado','heLFiltroAutorizado','heLFiltroBenef'].forEach(id => { if($(id)) $(id).value = ''; });
      filterHEList = { ini: null, fim: null, colab: '', superintendencia: '', setor: '', utd: '', status: '', acionado: '', autorizado: '', benef: '' };
      popularFiltrosOrganizacaoLancamentos();
      renderHELista();
    };

    function exportToExcel(data, prefix) {
      if(!data.length) return showToast("Sem dados", false);
      const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Audit");
      XLSX.writeFile(wb, `${prefix}_${new Date().getTime()}.xlsx`);
    }


    function montarLinhaExcelHE(x) {
      return {
        'MODULO': 'HE',
        'NUMERO': x.numero || '',
        'COLABORADOR': x.colaborador || '',
        'UTD': x.utd || '',
        'TIPO_ESCALA': x.tipoEscala || '',
        'DATA': x.data || '',
        'TIPO_HORA_EXTRA': x.tipoHoraExtra || '',
        'ACIONADO_POR': x.acionadoPor || '',
        'AUTORIZADO_SUPERVISOR': x.autorizadoSupervisor || '',
        'HORA_INICIO': x.horaInicio || '',
        'HORA_FIM': x.horaFim || '',
        'JUSTIFICATIVA': x.justificativa || '',
        'DURACAO_MINUTOS': Number(x.duracaoMinutos || 0),
        'FAIXA_MINUTOS': x.faixaMinutos || '',
        'BENEFICIO_TIPO': x.beneficio_tipo || '',
        'BENEFICIO_VALOR': Number(x.beneficio_valor || 0),
        'STATUS': x.status || 'Pendente',
        'OBSERVACAO': x.observacao || '',
        'ALTERADO_POR': x.statusBy || '',
        'ALTERADO_EM': x.statusAt || '',
        'CRIADO_EM': x.createdAt || '',
        'CRIADO_POR': x.createdBy || '',
        'ORIGEM': x.origem || 'index'
      };
    }
    $('btnExportDash').onclick = () => exportToExcel(runFilter(cacheSolic, filterD).map(x => ({ Nº: x.numero, Colab: x.colaborador, UTD: x.utd || '', Valor: x.valor, Status: x.status, "Justif. Index": x.justificativa, "Obs Auditoria": x.observacao })), "Dash_Viagens");
    $('btnExport').onclick = () => exportToExcel(runFilter(cacheSolic, filterL).map(x => ({ 
  'Nº': x.numero, 
  'Colab': x.colaborador, 
  'Destino': x.destino, 
  'Placa': x.placa, 
  'Frota': x.frota, 
  'Saída (Data)': (x.dataSaida||'').split('-').reverse().join('/'), 
  'Saída (Hora)': x.horaSaida, 
  'Chegada (Data)': x.dataRetorno ? x.dataRetorno.split('-').reverse().join('/') : '-', 
  'Chegada (Hora)': x.horaRetorno, 
  'Duração': x.duracaoTexto, 
  'Valor': x.valor, 
  'Status': x.status, 
  'Alterado por': x.statusBy,
  'Nota/Atividade': x.numeroNotaAtividade, 
  'Obs Auditoria': x.observacao 
})), 'Lista_Viagens');
    $('btnExportHE').onclick = () => exportToExcel(runFilterHE(cacheHE, filterHE).map(montarLinhaExcelHE), 'BI_HE_COMPLETO');
    $('btnExportHEList').onclick = () => exportToExcel(runFilterHEList(cacheHE, filterHEList).map(montarLinhaExcelHE), 'LISTA_HE_COMPLETA');

    function openEditLanca(id, reprove = false) {
      const x = cacheSolic.find(d => d._id === id);
      $('modalEdit').style.display = 'flex'; $('editTitle').textContent = reprove ? 'Reprovar #' + x.numero : 'Editar #' + x.numero;
      if(reprove) {
        $('editBody').innerHTML = `<p style="font-size:11px">Justificativa Index: <b>${x.justificativa||'-'}</b></p><textarea id="eObs" class="input" style="height:100px" placeholder="Motivo..."></textarea>`;
        $('btnSaveEdit').onclick = async () => { const obs = $('eObs').value.trim(); if(!obs) return; const _nm = (userProfile && userProfile.nome) || (auth.currentUser && auth.currentUser.email) || ''; await db.collection('solicitacoes_diaria').doc(id).update({ status: 'Reprovado', observacao: obs, statusBy: _nm, statusAt: new Date().toISOString() }); closeEdit(); };
      } else {
        $('editBody').innerHTML = `<div><label>VALOR</label><input id="edV" type="number" step="0.01" class="input" value="${x.valor}"></div><div><label>OBS AUDITORIA</label><textarea id="edO" class="input" style="height:60px">${x.observacao||''}</textarea></div>`;
        $('btnSaveEdit').onclick = async () => { await db.collection('solicitacoes_diaria').doc(id).update({ valor: parseFloat($('edV').value), observacao: $('edO').value }); closeEdit(); };
      }
    }

    function openEditHE(id) {
      const x = cacheHE.find(d => d._id === id);
      $('modalEdit').style.display = 'flex'; $('editTitle').textContent = 'Reprovar HE #' + (x.numero||'');
      $('editBody').innerHTML = `<p style="font-size:11px">Justificativa Index: <b>${x.justificativa||'-'}</b></p><textarea id="heObs" class="input" style="height:100px" placeholder="Informe o motivo..."></textarea>`;
      $('btnSaveEdit').onclick = async () => { const obs = $('heObs').value.trim(); if(!obs) return; const _nm = (userProfile && userProfile.nome) || (auth.currentUser && auth.currentUser.email) || ''; await db.collection('solicitacoes_hora_extra').doc(id).update({ status: 'Reprovado', observacao: obs, statusBy: _nm, statusAt: new Date().toISOString() }); closeEdit(); };
    }

    // [EDIT] editor de Observação (HE Lançamentos) – não altera status
function openEditHELanca(id) {
  const x = cacheHE.find(d => d._id === id);
  if(!x) return;
  $('modalEdit').style.display = 'flex';
  $('editTitle').textContent = 'Editar HE #' + (x.numero || '');

  $('editBody').innerHTML = `
    <div>
      <label>OBS AUDITORIA</label>
      <textarea id="heEdObs" class="input" style="height:80px">${x.observacao || ''}</textarea>
    </div>`;

  $('btnSaveEdit').onclick = async () => {
    const _nm = (userProfile && userProfile.nome) || (auth.currentUser && auth.currentUser.email) || '';
    await db.collection('solicitacoes_hora_extra').doc(id).update({
      observacao: $('heEdObs').value,
      statusBy: _nm,
      statusAt: new Date().toISOString()
    });

    // Atualiza cache local para refletir imediatamente na lista
    x.observacao = $('heEdObs').value;
    x.statusBy = _nm;
    x.statusAt = new Date().toISOString();

    closeEdit();
    renderHELista();
    if(typeof showToast === 'function') showToast('Observação atualizada');
  };
}

function closeEdit() { $('modalEdit').style.display = 'none'; }
    function closeSpreadsheet() { $('modalSheet').style.display = 'none'; }
    function setModo(m){
      const isV = m === 'viagem';
      $('mViagem').classList.toggle('active', isV); $('mHE').classList.toggle('active', !isV);
      document.querySelectorAll('#nav a').forEach(a => { const t = a.dataset.tab; if(['dash','lanca','veic'].includes(t)) a.style.display = isV ? 'flex' : 'none'; if(t==='mass') a.style.display = (String((userProfile && (userProfile.funcao || userProfile.cargo)) || '').toLowerCase()==='dev') ? 'flex' : 'none'; if(['heDash','heLanca'].includes(t)) a.style.display = isV ? 'none' : 'flex'; });
      const target = isV ? document.querySelector('#nav a[data-tab="dash"]') : document.querySelector('#nav a[data-tab="heDash"]');
      if(target) target.click();
    }
    function ajustarLayoutAdmin(){ ['btnAplicaLanca','btnAplicaHEList'].forEach(id=>{const b=$(id);if(b&&b.parentElement)b.parentElement.classList.add('filter-actions');}); }
    ajustarLayoutAdmin();
    $('btnModeSwitch').onclick = () => setModo($('mViagem').classList.contains('active') ? 'he' : 'viagem');
    $('mViagem').onclick = () => setModo('viagem');
    $('mHE').onclick = () => setModo('he');


    function normalizaHeaderVeic(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase(); }
    function getValorColunaVeic(row, nomes) { const alvo = nomes.map(normalizaHeaderVeic); for (const k of Object.keys(row)) if (alvo.includes(normalizaHeaderVeic(k))) return row[k]; return ''; }
    function limparPlacaVeic(v) { return String(v || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); }
    function validarPlacaVeic(placa) { return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa) || /^[A-Z]{3}[0-9]{4}$/.test(placa); }
    async function handleImportVeiculos(e) {
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if(!json.length) return showToast('Excel vazio ou sem dados.', false);
        let total = 0, ignorados = 0;
        const batch = db.batch();
        json.forEach(row => {
          const placa = limparPlacaVeic(getValorColunaVeic(row, ['PLACA', 'Placa', 'placa']));
          const frota = String(getValorColunaVeic(row, ['FROTA', 'Frota', 'frota', 'Nº Frota', 'Numero de Frota', 'Número de Frota'])).trim();
          const utd = devMassUtd(getValorColunaVeic(row, ['UTD', 'Unidade', 'unidade']));
          if(!placa || !validarPlacaVeic(placa) || !utd) { ignorados++; return; }
          batch.set(db.collection('veiculos').doc(placa), { frota, utd, updatedAt: new Date().toISOString(), updatedBy: (userProfile && userProfile.nome) || (auth.currentUser && auth.currentUser.email) || '' }, { merge: true });
          total++;
        });
        if(total > 0) await batch.commit();
        showToast(total + ' veículos importados. ' + ignorados + ' linha(s) ignorada(s).', total > 0);
      } catch(err) { console.error(err); showToast('Erro ao importar Excel de veículos.', false); }
      finally { e.target.value = ''; }
    }
    function baixarModeloVeiculos() {
      const dados = [{ PLACA: 'ABC1234', FROTA: '001', UTD: 'IRECÊ' }, { PLACA: 'DEF1G23', FROTA: '002', UTD: 'SEABRA' }];
      const ws = XLSX.utils.json_to_sheet(dados), wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Veiculos');
      XLSX.writeFile(wb, 'modelo_importacao_veiculos.xlsx');
    }
    document.addEventListener('change', e => { if(e.target && e.target.id === 'fileVeic') handleImportVeiculos(e); });
    
function idsFiltrosOrganizacao(tipo){
  if(tipo==='dash')return {sup:'dFiltroSuperintendencia',setor:'dFiltroSetor',utd:'dFiltroUtd'};
  if(tipo==='heDash')return {sup:'heFiltroSuperintendencia',setor:'heFiltroSetor',utd:'heFiltroUtd'};
  if(tipo==='he')return {sup:'heLFiltroSuperintendencia',setor:'heLFiltroSetor',utd:'heLFiltroUtd'};
  return {sup:'lFiltroSuperintendencia',setor:'lFiltroSetor',utd:'lFiltroUtd'};
}
function popularFiltrosOrganizacaoLancamentos(){
  bloquearFiltrosUtd();
  const permitidas=obterUtdsPermitidas();
  const ativos=cacheUtds.filter(x=>x.ativo!==false&&(perfilGlobal()||permitidas.includes(admNorm(x.nome||x.utd||x._id))));
  const supers=[...new Set(ativos.map(x=>x.superintendencia).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  ['dash','viagem','heDash','he'].forEach(tipo=>{const ids=idsFiltrosOrganizacao(tipo),el=$(ids.sup);if(!el||el.disabled)return;const atual=el.value;el.innerHTML='<option value="">Todas</option>'+supers.map(v=>`<option value="${v}">${v}</option>`).join('');if(supers.includes(atual))el.value=atual;atualizarFiltrosOrganizacao(tipo);});
  bloquearFiltrosOrganizacaoLocal();
}
function atualizarFiltrosOrganizacao(tipo){
  const ids=idsFiltrosOrganizacao(tipo),sup=$(ids.sup),setor=$(ids.setor),utd=$(ids.utd);
  if(!sup||!setor||!utd||setor.disabled||utd.disabled)return;
  const setorAtual=setor.value,utdAtual=utd.value;
  const permitidas=obterUtdsPermitidas();
  let lista=cacheUtds.filter(x=>x.ativo!==false&&(perfilGlobal()||permitidas.includes(admNorm(x.nome||x.utd||x._id)))&&(!sup.value||admNorm(x.superintendencia)===admNorm(sup.value)));
  const setores=[...new Set(lista.map(x=>x.setor).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  setor.innerHTML='<option value="">Todos</option>'+setores.map(v=>`<option value="${v}">${v}</option>`).join('');setor.value=setores.includes(setorAtual)?setorAtual:'';
  lista=lista.filter(x=>!setor.value||admNorm(x.setor)===admNorm(setor.value));
  const utds=[...new Set(lista.map(x=>x.nome||x.utd||x._id).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  utd.innerHTML='<option value="">Todas</option>'+utds.map(v=>`<option value="${v}">${v}</option>`).join('');utd.value=utds.includes(utdAtual)?utdAtual:'';
}
function bloquearFiltrosOrganizacaoLocal(){
  if(perfilGlobal()||!userProfile)return;
  const permitidas=obterUtdsPermitidas();
  const orgs=permitidas.map(organizacaoDaUtd).filter(x=>x&&Object.keys(x).length);
  const setores=[...new Set(orgs.map(x=>x.setor).filter(Boolean))];
  const supers=[...new Set(orgs.map(x=>x.superintendencia).filter(Boolean))];
  ['dash','viagem','heDash','he'].forEach(tipo=>{
    const ids=idsFiltrosOrganizacao(tipo),setor=$(ids.setor),sup=$(ids.sup);
    if(setor){
      if(setores.length===1){setor.innerHTML=`<option value="${setores[0]}">${setores[0]}</option>`;setor.value=setores[0];setor.disabled=true;}
      else setor.disabled=false;
    }
    if(sup){
      if(supers.length===1){sup.innerHTML=`<option value="${supers[0]}">${supers[0]}</option>`;sup.value=supers[0];sup.disabled=true;}
      else sup.disabled=false;
    }
  });
}
function configurarFiltrosOrganizacao(){
  ['dash','viagem','heDash','he'].forEach(tipo=>{const ids=idsFiltrosOrganizacao(tipo);const sup=$(ids.sup),setor=$(ids.setor);if(sup)sup.addEventListener('change',()=>atualizarFiltrosOrganizacao(tipo));if(setor)setor.addEventListener('change',()=>atualizarFiltrosOrganizacao(tipo));});
}

function popularOrganizacaoAdmin(){
  const utds=cacheUtds.filter(x=>x.ativo!==false).sort((a,b)=>String(a.nome||a.utd||'').localeCompare(String(b.nome||b.utd||''),'pt-BR'));
  const su=$('devUtd'), ss=$('devSetor');
  if(su) su.innerHTML='<option value="">Selecione a UTD</option>'+utds.map(x=>{const nome=x.nome||x.utd||x._id;return `<option value="${nome}" data-setor="${x.setor||''}" data-superintendencia="${x.superintendencia||''}">${nome}</option>`;}).join('');
  if(ss) ss.innerHTML='<option value="">Selecione primeiro a UTD</option>';
  atualizarOrganizacaoUsuarioDev();
}
function atualizarOrganizacaoUsuarioDev(){
  const su=$('devUtd'),ss=$('devSetor'),sp=$('devSuperintendencia'); if(!su)return;
  const opt=su.options[su.selectedIndex]; const setor=(opt&&opt.dataset.setor)||''; const superintendencia=(opt&&opt.dataset.superintendencia)||'';
  if(ss){ss.innerHTML=setor?`<option value="${setor}">${setor}</option>`:'<option value="">Selecione primeiro a UTD</option>';ss.value=setor;}
  if(sp)sp.value=superintendencia;
}
if($('devUtd')) $('devUtd').addEventListener('change',atualizarOrganizacaoUsuarioDev);
function baixarModeloUtds(){
  if(!devMassGuard())return;
  devMassWorkbook([{UTD:'NOME DA UTD',SETOR:'NOME DO SETOR',SUPERINTENDENCIA:'NOME DA SUPERINTENDENCIA'}],'UTDs','modelo_cadastro_utds.xlsx');
}
async function importarUtds(e){
  const file=e.target.files&&e.target.files[0]; if(!file||!devMassGuard())return;
  try{
    const rows=await devMassReadFile(file),ops=[];let ignoradas=0;
    for(const r of rows){
      const nome=devMassText(r.UTD),setor=devMassText(r.SETOR),superintendencia=devMassText(r.SUPERINTENDENCIA);
      if(!nome||!setor||!superintendencia){ignoradas++;continue;}
      const id=admNorm(nome).replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
      ops.push({type:'set',ref:db.collection('utds').doc(id),data:{nome,utd:nome,setor,superintendencia,ativo:true,updatedAt:new Date().toISOString(),updatedBy:(userProfile&&userProfile.nome)||auth.currentUser.email}});
    }
    if(!ops.length)return devMassResult('Nenhuma UTD válida. Preencha UTD, SETOR e SUPERINTENDENCIA.',false);
    await devMassCommit(ops);devMassResult(`${ops.length} UTD(s) cadastrada(s)/atualizada(s). ${ignoradas} linha(s) ignorada(s).`);showToast('Estrutura de UTDs atualizada!');
  }catch(err){console.error(err);devMassResult('Erro ao importar UTDs: '+(err.message||err),false);}finally{e.target.value='';}
}
document.addEventListener('change',e=>{if(e.target&&e.target.id==='fileUtds')importarUtds(e);});

async function exportarPerfisAdmin(){
  if(!devMassGuard()) return;
  try{
    const snap=await db.collection('usuarios').get();
    const rows=snap.docs.map(d=>{const x=d.data();return {DOCUMENTO_ID:d.id,NOME:x.nome||'',EMAIL:x.email||'',PERFIL_ATUAL:x.nivelAcesso||x.funcao||x.cargo||'',UTD_ATUAL:x.utd||'',SETOR_ATUAL:x.setor||'',SUPERINTENDENCIA_ATUAL:x.superintendencia||'',NOVO_PERFIL:'',NOVA_UTD:'',NOVO_SETOR:'',NOVA_SUPERINTENDENCIA:''};});
    if(!rows.length)return showToast('Nenhum usuário Admin cadastrado.',false);
    const ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=[{wch:30},{wch:30},{wch:34},{wch:20},{wch:22},{wch:22},{wch:22},{wch:22},{wch:22}];
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Perfis Admin');XLSX.writeFile(wb,`perfis_admin_${new Date().toISOString().slice(0,10)}.xlsx`);
    devMassResult(`${rows.length} perfil(is) Admin exportado(s).`);
  }catch(err){console.error(err);devMassResult('Erro ao exportar perfis: '+(err.message||err),false);}
}
async function importarPerfisAdmin(e){
  const file=e.target.files&&e.target.files[0];if(!file||!devMassGuard())return;
  try{
    const rows=await devMassReadFile(file),ops=[];let ignoradas=0;
    const validos={BACKOFFICE:'backoffice',SUPERVISOR:'supervisor',GERENTE:'gerente',SUPERINTENDENTE:'superintendente',DEV:'dev'};
    for(const r of rows){
      const id=devMassText(r.DOCUMENTO_ID),perfil=validos[admNorm(r.NOVO_PERFIL)],utd=devMassText(r.NOVA_UTD),setor=devMassText(r.NOVO_SETOR),superintendencia=devMassText(r.NOVA_SUPERINTENDENCIA);
      if(!id||!perfil){ignoradas++;continue;}
      if(['supervisor','backoffice'].includes(perfil)&&!utd){ignoradas++;continue;}
      const org=cacheUtds.find(x=>admNorm(x.nome||x.utd||x._id)===admNorm(utd)); const data={funcao:perfil,nivelAcesso:perfil,utd:utd||'',setor:setor||(org&&org.setor)||'',superintendencia:superintendencia||(org&&org.superintendencia)||'',updatedAt:new Date().toISOString(),updatedBy:(userProfile&&userProfile.nome)||auth.currentUser.email};
      ops.push({type:'update',ref:db.collection('usuarios').doc(id),data});
    }
    if(!ops.length)return devMassResult('Nenhum perfil válido. Preencha DOCUMENTO_ID e NOVO_PERFIL. Supervisor/Backoffice exigem NOVA_UTD.',false);
    await devMassCommit(ops);devMassResult(`${ops.length} perfil(is) atualizado(s). ${ignoradas} linha(s) ignorada(s).`);showToast('Perfis Admin atualizados!');
  }catch(err){console.error(err);devMassResult('Erro ao atualizar perfis: '+(err.message||err),false);}finally{e.target.value='';}
}
document.addEventListener('change',e=>{if(e.target&&e.target.id==='filePerfisAdmin')importarPerfisAdmin(e);});

function baixarModeloColaboradores(){
  if(!devMassGuard())return;
  devMassWorkbook([{NOME:'NOME COMPLETO',MATRICULA:'123456',UTD:'NOME DA UTD',SETOR:'NOME DO SETOR',ATIVO:'SIM'}],'Colaboradores','modelo_colaboradores_utd.xlsx');
}
async function importarColaboradores(e){
  const file=e.target.files&&e.target.files[0]; if(!file||!devMassGuard())return;
  try{const rows=await devMassReadFile(file),ops=[];let ign=0;for(const r of rows){const nome=devMassText(r.NOME),mat=devMassText(r.MATRICULA),utd=devMassText(r.UTD),setor=devMassText(r.SETOR),ativo=!['NAO','NÃO','0','FALSE','INATIVO'].includes(admNorm(r.ATIVO));if(!nome||!mat||!utd){ign++;continue;}ops.push({type:'set',ref:db.collection('colaboradores').doc(mat),data:{nome,matricula:mat,utd,setor,ativo,updatedAt:new Date().toISOString(),updatedBy:(userProfile&&userProfile.nome)||auth.currentUser.email}});}await devMassCommit(ops);devMassResult(`${ops.length} colaborador(es) importado(s). ${ign} linha(s) ignorada(s).`);showToast('Colaboradores atualizados!');}catch(err){console.error(err);devMassResult('Erro ao importar colaboradores: '+(err.message||err),false);}finally{e.target.value='';}
}
document.addEventListener('change',e=>{if(e.target&&e.target.id==='fileColaboradores')importarColaboradores(e);});


function atualizarCamposPerfilDev(){
  const perfil=($('devFuncao')&&$('devFuncao').value)||'';const local=['supervisor','backoffice'].includes(perfil);
  if($('devUtd')){$('devUtd').disabled=!local;$('devUtd').required=local;if(!local)$('devUtd').value='';}
  if($('devSetor')){$('devSetor').disabled=!local;if(!local)$('devSetor').value='';} if($('devSuperintendencia')){if(!local)$('devSuperintendencia').value='';}
}
if($('devFuncao')){$('devFuncao').addEventListener('change',atualizarCamposPerfilDev);setTimeout(atualizarCamposPerfilDev,0);}

async function criarUsuarioDev() {
      const nome = ($('devNome') && $('devNome').value.trim()) || '';
      const email = ($('devEmail') && $('devEmail').value.trim()) || '';
      const senha = ($('devSenha') && $('devSenha').value) || '';
      const funcao = ($('devFuncao') && $('devFuncao').value) || 'backoffice'; const setor=($('devSetor')&&$('devSetor').value)||''; const utd=($('devUtd')&&$('devUtd').value)||''; const superintendencia=($('devSuperintendencia')&&$('devSuperintendencia').value)||'';
      if(!nome || !email || !senha) return showToast('Preencha nome, e-mail e senha.', false); if(['supervisor','backoffice'].includes(funcao)&&!utd)return showToast('Supervisor e Backoffice precisam de uma UTD.',false);
      if(String(userProfile && userProfile.funcao || '').toLowerCase() !== 'dev') return showToast('Acesso restrito ao usuário DEV.', false);
      try {
        const secondaryAppName = 'SecondaryUserCreateApp';
        let secondaryApp; try { secondaryApp = firebase.app(secondaryAppName); } catch(e) { secondaryApp = firebase.initializeApp(firebaseConfig, secondaryAppName); }
        const secondaryAuth = secondaryApp.auth();
        const cred = await secondaryAuth.createUserWithEmailAndPassword(email, senha);
        await db.collection('usuarios').doc(cred.user.uid).set({ nome, email, funcao, nivelAcesso: funcao, setor, utd, superintendencia, criadoPor: (userProfile && userProfile.nome) || (auth.currentUser && auth.currentUser.email) || '', criadoEm: new Date().toISOString() });
        await secondaryAuth.signOut();
        ['devNome','devEmail','devSenha'].forEach(id => { if($(id)) $(id).value = ''; });
        if($('devFuncao')) $('devFuncao').value = 'backoffice'; if($('devSetor')) $('devSetor').value=''; if($('devUtd')) $('devUtd').value=''; if($('devSuperintendencia')) $('devSuperintendencia').value='';
        showToast('Usuário criado com sucesso!');
      } catch(err) {
        console.error(err);
        let msg = 'Erro ao criar usuário.';
        if(err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está cadastrado.';
        if(err.code === 'auth/weak-password') msg = 'Senha fraca. Use pelo menos 6 caracteres.';
        if(err.code === 'auth/invalid-email') msg = 'E-mail inválido.';
        showToast(msg, false);
      }
    }

    function renderVeiculos() {
      const rows = cacheVeic.map(v => `<tr><td><b>${v._id}</b></td><td>${v.frota || '-'}</td><td>${v.utd || '-'}</td><td><button class="btn btn-danger" onclick="askDelete('veic','${v._id}')" style="padding:5px"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
      $('tblVeicContainer').innerHTML = `<table><thead><tr><th>Placa</th><th>Frota</th><th>UTD</th><th>Ação</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Vazio</td></tr>'}</tbody></table>`;
    }
    function askDelete(t, id) { delType = t; delId = id; $('modalConfirm').style.display = 'flex'; }
    function closeConfirm() { $('modalConfirm').style.display = 'none'; }
    $('btnDeleteConfirm').onclick = async () => { if(delType==='veic') await db.collection('veiculos').doc(delId).delete(); else await db.collection('solicitacoes_diaria').doc(delId).delete(); closeConfirm(); };
    function showToast(msg, ok=true){ const t=$('toast'); if(!t) return; t.textContent=msg; t.classList.toggle('error', !ok); t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
    function massaEscape(v) {
      return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function massaStatusSelect(valor) {
      const atual = valor || 'Pendente';
      return `<select class="mass-status-select"><option value="">Manter atual</option><option value="Pendente" ${atual==='Pendente'?'selected':''}>Pendente</option><option value="Aprovado" ${atual==='Aprovado'?'selected':''}>Aprovado</option><option value="Reprovado" ${atual==='Reprovado'?'selected':''}>Reprovado</option></select>`;
    }
    function preencherPlanilhaMassa(tipo) {
      const isHE = tipo === 'mass-he';
      const dados = (isHE ? cacheHE : cacheSolic).slice();
      const body = $('sheetBody');
      body.innerHTML = '';
      dados.forEach((x, i) => {
        const tr = document.createElement('tr');
        tr.dataset.id = x._id;
        tr.dataset.collection = isHE ? 'solicitacoes_hora_extra' : 'solicitacoes_diaria';
        tr.dataset.statusOriginal = x.status || 'Pendente';
        const data = isHE ? x.data : x.dataSaida;
        const justificativa = x.justificativa || x.numeroNotaAtividade || '-';
        tr.innerHTML = `<td class="row-num">${i+1}</td><td class="mass-readonly"><b>#${massaEscape(x.numero)}</b></td><td class="mass-readonly">${massaEscape(x.colaborador || '-')}</td><td class="mass-readonly">${massaEscape(x.utd || '-')}</td><td class="mass-readonly">${massaEscape(data || '-')}</td><td class="mass-justificativa">${massaEscape(justificativa)}</td><td class="mass-readonly">${massaEscape(x.status || 'Pendente')}</td><td>${massaStatusSelect(x.status)}</td>`;
        body.appendChild(tr);
      });
      $('sheetSummary').textContent = `${dados.length} lançamento(s) carregado(s). Altere somente o campo Novo Status e clique em Salvar Alterações.`;
    }
    function openSpreadsheet(t) {
      activeSheetType = t;
      $('modalSheet').style.display = 'flex';
      $('sheetBody').innerHTML = '';
      const massa = t === 'mass-viagem' || t === 'mass-he';
      $('btnAddSheetRows').style.display = massa ? 'none' : 'inline-flex';
      $('sheetSummary').textContent = '';
      if(massa) {
        $('sheetTitle').textContent = t === 'mass-he' ? 'Status em Massa - Hora Extra' : 'Status em Massa - Viagens';
        $('sheetHead').innerHTML = '<tr><th>#</th><th>Nº</th><th>Colaborador</th><th>UTD</th><th>Data</th><th>Justificativa Index</th><th>Status Atual</th><th>Novo Status</th></tr>';
        preencherPlanilhaMassa(t);
      } else {
        $('sheetTitle').textContent = 'Gestão Frota';
        $('sheetHead').innerHTML = '<tr><th>#</th><th>Placa</th><th>Frota</th><th>UTD</th></tr>';
        addRows(50);
      }
    }
    function addRows(n) {
      if(activeSheetType !== 'veic') return;
      const b = $('sheetBody');
      for(let i=0; i<n; i++) {
        const tr = document.createElement('tr');
        const num = b.children.length + 1;
        tr.innerHTML = `<td class="row-num">${num}</td><td><div class="cell" contenteditable="true"></div></td><td><div class="cell" contenteditable="true"></div></td><td><div class="cell" contenteditable="true"></div></td>`;
        b.appendChild(tr);
      }
    }
    $('btnSaveSheet').onclick = async () => {
      const rows = Array.from($('sheetBody').rows);
      let salvos = 0, ignorados = 0;
      const nomeAlterador = (userProfile && userProfile.nome) || (auth.currentUser && auth.currentUser.email) || '';
      if(activeSheetType === 'mass-viagem' || activeSheetType === 'mass-he') {
        const operacoes = [];
        rows.forEach(r => {
          const novoStatus = r.querySelector('.mass-status-select').value;
          if(!novoStatus || novoStatus === r.dataset.statusOriginal) { ignorados++; return; }
          operacoes.push({ ref: db.collection(r.dataset.collection).doc(r.dataset.id), status: novoStatus });
        });
        for(let i=0; i<operacoes.length; i+=400) {
          const batch = db.batch();
          operacoes.slice(i,i+400).forEach(op => batch.update(op.ref, { status: op.status, statusBy: nomeAlterador, statusAt: new Date().toISOString() }));
          await batch.commit();
        }
        salvos = operacoes.length;
      } else {
        for(const r of rows) {
          const placa = limparPlacaVeic(r.cells[1].querySelector('div').innerText.trim());
          const frota = r.cells[2].querySelector('div').innerText.trim();
          const utd = devMassUtd(r.cells[3].querySelector('div').innerText.trim());
          if(!placa) continue;
          if(!validarPlacaVeic(placa) || !utd) { ignorados++; continue; }
          await db.collection('veiculos').doc(placa).set({ frota, utd, updatedAt: new Date().toISOString(), updatedBy: nomeAlterador }, { merge: true });
          salvos++;
        }
      }
      closeSpreadsheet();
      showToast(`${salvos} registro(s) atualizado(s). ${ignorados} mantido(s)/ignorado(s).`, salvos > 0);
    };


// ===== DEV: STATUS EM MASSA VIA EXCEL =====
function statusMassaDevGuard(){
  const dev = String((userProfile && (userProfile.funcao || userProfile.cargo)) || '').toLowerCase() === 'dev';
  if(!dev) showToast('Acesso restrito ao perfil DEV.', false);
  return dev;
}
function statusMassaNorm(v){ return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase(); }
function statusMassaData(x, modulo){ return modulo === 'HE' ? (x.data || '') : (x.dataSaida || ''); }
function obterDadosStatusMassaFiltrados(){
  const modulo = $('massFiltroModulo').value;
  const ini = $('massFiltroIni').value;
  const fim = $('massFiltroFim').value;
  const utd = $('massFiltroUtd').value;
  const status = $('massFiltroStatus').value;
  const colab = statusMassaNorm($('massFiltroColab').value);
  const origem = modulo === 'HE' ? cacheHE : cacheSolic;
  return origem.filter(x => {
    const data = statusMassaData(x, modulo);
    if(ini && data < ini) return false;
    if(fim && data > fim) return false;
    if(utd && statusMassaNorm(x.utd) !== statusMassaNorm(utd)) return false;
    if(status && (x.status || 'Pendente') !== status) return false;
    if(colab && !statusMassaNorm(x.colaborador).includes(colab)) return false;
    return true;
  }).map(x => ({ modulo, x }));
}
function exportarStatusMassaExcel(){
  if(!statusMassaDevGuard()) return;
  const dados = obterDadosStatusMassaFiltrados();
  if(!dados.length) return showToast('Nenhum lançamento encontrado com os filtros informados.', false);
  const linhas = dados.map(({modulo,x}) => ({
    MODULO: modulo,
    DOCUMENTO_ID: x._id,
    NUMERO: x.numero || '',
    COLABORADOR: x.colaborador || '',
    UTD: x.utd || '',
    DATA: statusMassaData(x, modulo),
    JUSTIFICATIVA_INDEX: x.justificativa || x.numeroNotaAtividade || '',
    STATUS_ATUAL: x.status || 'Pendente',
    NOVO_STATUS: '',
    OBSERVACAO_AUDITORIA: x.observacao || '',
    ALTERADO_POR: x.statusBy || '',
    ALTERADO_EM: x.statusAt || ''
  }));
  const ws = XLSX.utils.json_to_sheet(linhas);
  ws['!cols'] = [{wch:11},{wch:28},{wch:12},{wch:32},{wch:14},{wch:13},{wch:65},{wch:16},{wch:16},{wch:50},{wch:28},{wch:24}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Atualizar Status');
  const modulo = $('massFiltroModulo').value.toLowerCase();
  XLSX.writeFile(wb, `status_massa_${modulo}_${new Date().toISOString().slice(0,10)}.xlsx`);
  const el=$('massExcelResult'); el.textContent=`${linhas.length} lançamento(s) exportado(s).`; el.classList.remove('error'); el.style.display='block';
}
function limparFiltrosStatusMassa(){
  ['massFiltroIni','massFiltroFim','massFiltroUtd','massFiltroStatus','massFiltroColab'].forEach(id => $(id).value='');
  $('massFiltroModulo').value='VIAGEM';
  const el=$('massExcelResult'); if(el) el.style.display='none';
}
async function importarStatusMassaExcel(e){
  const file=e.target.files && e.target.files[0];
  if(!file || !statusMassaDevGuard()) return;
  const result=$('massExcelResult');
  try{
    const ab=await file.arrayBuffer();
    const wb=XLSX.read(ab,{type:'array'});
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''}).map(devMassRow);
    const alterador=(userProfile&&userProfile.nome)||(auth.currentUser&&auth.currentUser.email)||'';
    const ops=[]; let ignoradas=0;
    for(const r of rows){
      const modulo=statusMassaNorm(r.MODULO), id=devMassText(r.DOCUMENTO_ID), novo=statusMassaNorm(r.NOVO_STATUS);
      const statusMap={PENDENTE:'Pendente',APROVADO:'Aprovado',REPROVADO:'Reprovado'};
      if(!['VIAGEM','HE'].includes(modulo) || !id || !statusMap[novo]) { ignoradas++; continue; }
      const collection=modulo==='HE'?'solicitacoes_hora_extra':'solicitacoes_diaria';
      const data={status:statusMap[novo],statusBy:alterador,statusAt:new Date().toISOString()};
      const obs=devMassText(r.OBSERVACAO_AUDITORIA); if(obs) data.observacao=obs;
      ops.push({ref:db.collection(collection).doc(id),data});
    }
    for(let i=0;i<ops.length;i+=400){ const batch=db.batch(); ops.slice(i,i+400).forEach(op=>batch.update(op.ref,op.data)); await batch.commit(); }
    result.textContent=`${ops.length} registro(s) atualizado(s). ${ignoradas} linha(s) ignorada(s).`; result.classList.toggle('error',!ops.length); result.style.display='block';
    showToast(ops.length ? 'Status em massa atualizado com sucesso!' : 'Nenhuma linha válida para atualizar.', !!ops.length);
  }catch(err){ console.error(err); result.textContent='Erro ao importar: '+(err.message||err); result.classList.add('error'); result.style.display='block'; }
  finally{ e.target.value=''; }
}
document.addEventListener('change',e=>{ if(e.target && e.target.id==='fileStatusMassa') importarStatusMassaExcel(e); });

// ===== DEV: ATUALIZACAO DE UTD E INCLUSAO EM MASSA =====
function devMassIsDev(){
  return String((userProfile && (userProfile.funcao || userProfile.cargo)) || '').toLowerCase() === 'dev';
}
function devMassGuard(){
  if(devMassIsDev()) return true;
  showToast('Acesso restrito ao perfil DEV.', false);
  return false;
}
function devMassText(v){ return String(v == null ? '' : v).trim(); }
function devMassHeader(v){ return devMassText(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,''); }
function devMassRow(row){ const o={}; Object.keys(row || {}).forEach(k=>o[devMassHeader(k)]=row[k]); return o; }
function devMassUtd(v){
  const raw=devMassText(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const map={'IRECE':'IRECÊ','ITABERABA':'ITABERABA','JEQUIE':'JEQUIÉ','LIVRAMENTO NS':'LIVRAMENTO NS','SEABRA':'SEABRA','BRUMADO':'BRUMADO','GUANAMBI':'GUANAMBI','ITAPETINGA':'ITAPETINGA','VITORIA DA CONQUISTA':'VITORIA DA CONQUISTA','BARREIRAS':'BARREIRAS','BOM JESUS DA LAPA':'BOM JESUS DA LAPA','IBOTIRAMA':'IBOTIRAMA','LUIS EDUARDO MAGALHAES':'LUIS EDUARDO MAGALHAES','SANTA MARIA DA VITORIA':'SANTA MARIA DA VITORIA'};
  return map[raw] || '';
}
function devMassDate(v){
  if(!v) return '';
  if(typeof v === 'number'){
    const d=XLSX.SSF.parse_date_code(v); if(d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  const t=devMassText(v); if(/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m=t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` : t;
}
function devMassTime(v){
  if(typeof v === 'number'){ const total=Math.round(v*24*60); return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`; }
  return devMassText(v).slice(0,5);
}
function devMassNumero(v){ const n=parseInt(v,10); return Number.isFinite(n) ? n : Math.floor(100000+Math.random()*900000); }
function devMassResult(msg, ok=true){
  const el=$('devMassResult'); if(!el) return; el.textContent=msg; el.classList.toggle('error',!ok); el.style.display='block';
}
function devMassWorkbook(rows, sheet, file){
  const ws=XLSX.utils.json_to_sheet(rows); ws['!cols']=Object.keys(rows[0]||{}).map(k=>({wch:Math.min(42,Math.max(14,k.length+3))}));
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,sheet); XLSX.writeFile(wb,file);
}
function baixarModeloAtualizacaoUTD(){
  if(!devMassGuard()) return;
  const viagens=cacheSolic.map(x=>({MODULO:'VIAGEM',DOCUMENTO_ID:x._id,NUMERO:x.numero||'',COLABORADOR:x.colaborador||'',DATA:x.dataSaida||'',UTD_ATUAL:x.utd||'',NOVA_UTD:''}));
  const hes=cacheHE.map(x=>({MODULO:'HE',DOCUMENTO_ID:x._id,NUMERO:x.numero||'',COLABORADOR:x.colaborador||'',DATA:x.data||'',UTD_ATUAL:x.utd||'',NOVA_UTD:''}));
  const rows=[...viagens,...hes]; if(!rows.length) return showToast('Não há registros para exportar.',false);
  devMassWorkbook(rows,'Atualizar UTD',`modelo_atualizacao_utd_${new Date().toISOString().slice(0,10)}.xlsx`);
  devMassResult(`${rows.length} registro(s) exportado(s). Preencha NOVA_UTD e importe o arquivo.`);
}
function baixarModeloNovosDados(tipo){
  if(!devMassGuard()) return;
  if(tipo==='viagem'){
    devMassWorkbook([{MODULO:'VIAGEM',NUMERO:'',COLABORADOR:'',UTD:'',DATA_SAIDA:'2026-01-01',HORA_SAIDA:'08:00',DATA_RETORNO:'2026-01-01',HORA_RETORNO:'18:00',NOTA_ATIVIDADE:'',DESTINO:'',PLACA:'',FROTA:'',VALOR:'',STATUS:'Pendente',OBSERVACAO:''}], 'Novas Viagens','modelo_novos_dados_viagens.xlsx');
  }else{
    devMassWorkbook([{MODULO:'HE',NUMERO:'',COLABORADOR:'',UTD:'',TIPO_ESCALA:'5x2',DATA:'2026-01-01',TIPO_HORA_EXTRA:'dia de turno',ACIONADO_POR:'SUPERVISOR',AUTORIZADO_SUPERVISOR:'SIM',HORA_INICIO:'18:00',HORA_FIM:'20:00',JUSTIFICATIVA:'',BENEFICIO_TIPO:'',BENEFICIO_VALOR:'',STATUS:'Pendente',OBSERVACAO:''}], 'Novas HE','modelo_novos_dados_hora_extra.xlsx');
  }
}
async function devMassReadFile(file){ const ab=await file.arrayBuffer(); const wb=XLSX.read(ab,{type:'array',cellDates:false}); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:'',raw:true}).map(devMassRow); }
async function devMassCommit(ops){
  for(let i=0;i<ops.length;i+=400){ const batch=db.batch(); ops.slice(i,i+400).forEach(o=>o.type==='set'?batch.set(o.ref,o.data):batch.update(o.ref,o.data)); await batch.commit(); }
}
async function importarAtualizacaoUTD(e){
  const file=e.target.files&&e.target.files[0]; if(!file||!devMassGuard()) return;
  try{
    const rows=await devMassReadFile(file), ops=[]; let ignoradas=0;
    for(const r of rows){
      const modulo=devMassText(r.MODULO).toUpperCase(), id=devMassText(r.DOCUMENTO_ID), utd=devMassUtd(r.NOVA_UTD);
      if(!['VIAGEM','HE'].includes(modulo)||!id||!utd){ignoradas++;continue;}
      const col=modulo==='VIAGEM'?'solicitacoes_diaria':'solicitacoes_hora_extra';
      ops.push({type:'update',ref:db.collection(col).doc(id),data:{utd,updatedAt:new Date().toISOString(),updatedBy:(userProfile&&userProfile.nome)||auth.currentUser.email}});
    }
    if(!ops.length) return devMassResult('Nenhuma linha válida. Preencha MODULO, DOCUMENTO_ID e NOVA_UTD.',false);
    await devMassCommit(ops); devMassResult(`${ops.length} registro(s) atualizado(s). ${ignoradas} linha(s) ignorada(s).`); showToast('Atualização de UTD concluída!');
  }catch(err){console.error(err);devMassResult('Erro na atualização: '+(err.message||err),false);}finally{e.target.value='';}
}
function devMassMinutos(data, hi, hf){ let a=new Date(`${data}T${hi}`),b=new Date(`${data}T${hf}`); if(b<=a)b=new Date(b.getTime()+86400000); return Math.max(0,Math.floor((b-a)/60000)); }
function devMassValorViagem(min){ const D=96.78,M=48.39;if(min<360)return 0;const dias=Math.floor(min/1440),resto=min%1440;return dias*D+(resto>=720?D:(resto>=360?M:0)); }
function devMassFaixa(min){return min>=10&&min<=15?'10-15':min>=16&&min<=30?'16-30':min>=31&&min<=60?'31-60':min>60?'>60':'-';}
async function importarNovosDados(e){
  const file=e.target.files&&e.target.files[0]; if(!file||!devMassGuard()) return;
  try{
    const rows=await devMassReadFile(file),ops=[];let ignoradas=0;
    for(const r of rows){
      const modulo=devMassText(r.MODULO).toUpperCase(),utd=devMassUtd(r.UTD),colab=devMassText(r.COLABORADOR);
      if(!['VIAGEM','HE'].includes(modulo)||!utd||!colab){ignoradas++;continue;}
      const now=new Date().toISOString(),numero=devMassNumero(r.NUMERO),status=devMassText(r.STATUS)||'Pendente';
      if(modulo==='VIAGEM'){
        const ds=devMassDate(r.DATA_SAIDA),dr=devMassDate(r.DATA_RETORNO),hs=devMassTime(r.HORA_SAIDA),hr=devMassTime(r.HORA_RETORNO);
        if(!ds||!dr||!hs||!hr||!devMassText(r.DESTINO)){ignoradas++;continue;}
        const min=Math.max(0,Math.floor((new Date(`${dr}T${hr}`)-new Date(`${ds}T${hs}`))/60000)); if(!min){ignoradas++;continue;}
        const valor=devMassText(r.VALOR)!==''?Number(r.VALOR):devMassValorViagem(min);
        ops.push({type:'set',ref:db.collection('solicitacoes_diaria').doc(),data:{numero,colaborador:colab,utd,dataSaida:ds,horaSaida:hs,dataRetorno:dr,horaRetorno:hr,numeroNotaAtividade:devMassText(r.NOTA_ATIVIDADE),destino:devMassText(r.DESTINO),placa:devMassText(r.PLACA).toUpperCase(),frota:devMassText(r.FROTA),duracaoMinutos:min,duracaoTexto:`${Math.floor(min/60)}h ${min%60}m`,valor:Number(valor)||0,status,observacao:devMassText(r.OBSERVACAO),createdAt:now,createdBy:(userProfile&&userProfile.nome)||auth.currentUser.email,origem:'importacao_dev'}});
      }else{
        const data=devMassDate(r.DATA),hi=devMassTime(r.HORA_INICIO),hf=devMassTime(r.HORA_FIM); if(!data||!hi||!hf||!devMassText(r.JUSTIFICATIVA)){ignoradas++;continue;}
        const min=devMassMinutos(data,hi,hf); if(!min){ignoradas++;continue;}
        ops.push({type:'set',ref:db.collection('solicitacoes_hora_extra').doc(),data:{numero,colaborador:colab,utd,tipoEscala:devMassText(r.TIPO_ESCALA),data,tipoHoraExtra:devMassText(r.TIPO_HORA_EXTRA),acionadoPor:devMassText(r.ACIONADO_POR),autorizadoSupervisor:devMassText(r.AUTORIZADO_SUPERVISOR).toUpperCase(),horaInicio:hi,horaFim:hf,justificativa:devMassText(r.JUSTIFICATIVA),duracaoMinutos:min,faixaMinutos:devMassFaixa(min),beneficio_tipo:devMassText(r.BENEFICIO_TIPO).toLowerCase()||null,beneficio_valor:Number(r.BENEFICIO_VALOR)||0,status,observacao:devMassText(r.OBSERVACAO),createdAt:now,createdBy:(userProfile&&userProfile.nome)||auth.currentUser.email,origem:'importacao_dev'}});
      }
    }
    if(!ops.length)return devMassResult('Nenhuma linha válida. Confira MODULO, COLABORADOR, UTD e campos obrigatórios.',false);
    await devMassCommit(ops);devMassResult(`${ops.length} novo(s) registro(s) criado(s). ${ignoradas} linha(s) ignorada(s).`);showToast('Importação concluída!');
  }catch(err){console.error(err);devMassResult('Erro na importação: '+(err.message||err),false);}finally{e.target.value='';}
}
document.addEventListener('change',e=>{if(e.target&&e.target.id==='fileAtualizaUTD')importarAtualizacaoUTD(e);if(e.target&&e.target.id==='fileNovosDados')importarNovosDados(e);});
