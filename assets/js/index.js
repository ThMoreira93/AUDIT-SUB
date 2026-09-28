const COLABS = ["ADAILTON PORTO PIRES - U461752",
 "ALAILTON SOUZA DOS SANTOS - 625800",
 "ALENILDO REIS SILVA DOS SANTOS - 469189",
 "ANAIVAN SANTOS QUEIROZ - 349011",
 "ANDERSON RICARDO NASCIMENTO ALMEIDA SANTOS - 469181",
 "ANDRE SILVA CORREIA - U464780",
 "APARECIDO DE SOUZA SILVA - U464781",
 "ARNALDO ANTONIO LIMA SANTOS - U345343",
 "ARTHUR NEWITON SANTOS DE SOUZA - 627069",
 "CAIQUE JANERSON MEIRA ALVES - 351063",
 "CICERO DUARTE SILVA - 615535",
 "DALMO FERNANDES DE SOUZA - 345251",
 "DANIEL REBOUCAS DA SILVA MATOS - 345254",
 "DHERFERSON OLIVEIRA DOS SANTOS - 626804",
 "DORIOLANO LIMA SOUZA - U345263",
 "EDIMILTON NOVAIS ROCHA - U464791",
 "EDMAR ANTONIO DA SILVA - U462058",
 "EDSON SOUZA COSTA JUNIOR - 356754",
 "EDVANDO SANTOS SOARES - 362903",
 "ELVIS SENECA RIBEIRO DOS SANTOS - U464789",
 "EMILLY VITORIA SILVA MONTEIRO - 618260",
 "ERIVALDO DE OLIVEIRA SOUZA VIEIRA - U462059",
 "ESLI SADOQUE CARVALHO ALMEIDA - U345293",
 "EURISVALDO DE JESUS MACEDO - U464790",
 "FABIO LIMA DIAS - U462798",
 "FREDSON DA SILVA ROCHA - 629328",
 "FELIPE APARECIDO DA SILVA NUNES - 357700",
 "FILIPE DIAS DA SILVA - 618522",
 "FRANCIELE VIEIRA DUTRA - U344165",
 "FRANCISCO MARTINS DA SILVA NETO - 618567",
 "FRED WESLEY BORGES DE OLIVEIRA - 355180",
 "GEAN SILVA ROCHA - U345168",
 "GEOVANE LUIS DA SILVA SOUZA - U351242",
 "GEOVANE SILVA MESQUITA - U464796",
 "GERALDO ALMEIDA DA SILVA - U627231",
 "GILDOMAR SANTANA SANTOS - U345170",
 "GILMAR DE OLIVEIRA TEIXEIRA - 349445",
 "GILMARIO SANTOS SENA - 620011",
 "GILSON DOS ANJOS SANTOS - U464795",
 "GILSON GONCALVES PORTO - U464798",
 "GISELE MARIA NASCIMENTO VENTURA - 352401",
 "GUILHERME OLIVEIRA DANTAS - U627265",
 "GUSTAVO MAGALHAES SALES PINA - U621251",
 "HERNANDO DA SILVA LIMA - 469157",
 "HIAGO MATEUS BRAGA DE SOUZA - 344051",
 "IGOR NEVES NOVAIS - U464800",
 "JAIR JOSE BARBOSA SILVA - U464801",
 "JAIR VINICIUS BATISTA DOS SANTOS - 356768",
 "JANCICLEYDSON SANTOS NUNES - U363645",
 "JOABE SILVA SOARES - U468404",
 "JOAO PAULO SANTOS RIBEIRO - U464802",
 "JOAO PAULO SANTOS SOUZA - 627068",
 "JOELIO CASTRO RODRIGUES - U464804",
 "JOSE INACIO HIAGO TEIXEIRA DEFENSOR - U360999",
 "JOSE MARCIO LIMA DA SILVA - U345854",
 "JOSIMAR DE SOUZA FRANCA - U356367",
 "KLEBER MATOS DE ANDRADE - U350180",
 "LUCAS DE PINA ROCHA - U345155",
 "LUCAS MEDEIROS DOS SANTOS NASCIMENTO - 345156",
 "LUCIO ADRIANO ALMEIDA SILVA - U353041",
 "MANUELA PAUFERRO DOS SANTOS - U360669",
 "MÁRCIO JOSÉ PIRES DIAS - 961111",
 "MARCIO SILVA OLIVEIRA - U354678",
 "MATEUS DE OLIVEIRA SOUZA - 353904",
 "NILDO NOVAIS SILVA - 620010",
 "PAULO JUNIOR SILVA TRINDADE - U461004",
 "PAULO LOPES DA SILVA - U348457",
 "RALF TORRES DIAS - 465304",
 "RICARDO DA SILVA ARAUJO - 340444",
 "ROBERTO ECA DE ARAUJO ANDRADE - 961146",
 "ROBERTO LEAO DA SILVA - U461854",
 "ROGERIO SANTOS DE JESUS - 340455",
 "ROSANGELA PIRES RIBEIRO - 344047",
 "THAILLAN LIMA CANGUCU DA ROCHA - U464822",
 "TIAGO LEITE LIMA - 962043",
 "TIAGO SOUZA LIMA - 626910",
 "UILSON SANTOS DA SILVA - U469441",
 "VAGNER OLIVEIRA QUEIROZ - 625433",
 "WANDERLEI COSTA FREITAS - 349441",
 "WILLIAM BRITO DA CONCEICAO - U345141",
 "ZELY PAIVA DA SILVA - U345142"];
const SUBS = ["SUDOESTE", "CENTRO", "OESTE", "METROPOLITANAOLITANA", "NORTE", "SUL"];
    
    const firebaseConfig = {"apiKey": "AIzaSyCR0qW19cxd3eoCB0Vy-jj5MMVgGvExBcE",

  authDomain: "audit-sub-80cc8.firebaseapp.com",

  projectId: "audit-sub-80cc8",

  storageBucket: "audit-sub-80cc8.firebasestorage.app",

  messagingSenderId: "723771331916",

  appId: "1:723771331916:web:3e08ba453157f016702be9",

  measurementId: "G-MJR92411SV"

};
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const $ = (id) => document.getElementById(id);

    function toast(msg, type='info') {
      const t = $('toast'); t.textContent = msg;
      t.style.borderLeft = `5px solid ${type==='error'?'#ef4444':'#10b981'}`;
      t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000);
    }


    // ===== CADASTRO DINAMICO DE SUB E COLABORADORES =====
    let colaboradoresCache = [];
    let utdsCache = [];
    function normOrg(v){ return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase(); }
    function renderUtdOptions(){
      const valores = [...new Set((utdsCache.length ? utdsCache : SUBS).map(x => typeof x === 'string' ? x : x.nome).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
      const html = '<option value="" disabled selected>Selecione a SUB</option>' + valores.map(u=>`<option value="${u}">${u}</option>`).join('');
      $('utd').innerHTML=html; $('heUtd').innerHTML=html;
    }
    function renderColaboradoresPorUtd(selectUtdId, selectColabId){
      const utd=$(selectUtdId).value, sel=$(selectColabId);
      if(!utd){ sel.disabled=true; sel.innerHTML='<option value="">Selecione primeiro a SUB</option>'; return; }
      const lista=colaboradoresCache.filter(c=>c.ativo!==false && normOrg(c.utd)===normOrg(utd)).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
      sel.disabled=false;
      sel.innerHTML='<option value="" disabled selected>Escolha o colaborador</option>'+lista.map(c=>{const valor=c.matricula?`${c.nome} - ${c.matricula}`:c.nome;return `<option value="${valor}">${valor}</option>`;}).join('');
      if(!lista.length) sel.innerHTML=`<option value="" disabled selected>Nenhum colaborador cadastrado para ${utd}</option>`;
      if(selectColabId==='colaborador') $('consultaColab').innerHTML=sel.innerHTML;
    }
    function watchOrganizacao(){
      db.collection('utds').where('ativo','==',true).onSnapshot(snap=>{utdsCache=snap.docs.map(d=>({id:d.id,...d.data()}));renderUtdOptions();},()=>renderUtdOptions());
      db.collection('colaboradores').onSnapshot(snap=>{colaboradoresCache=snap.docs.map(d=>({id:d.id,...d.data()}));renderColaboradoresPorUtd('utd','colaborador');renderColaboradoresPorUtd('heUtd','heColaborador');},err=>{console.error('Erro ao carregar colaboradores:',err);toast('Erro ao carregar colaboradores por SUB.','error');});
    }
    $('utd').addEventListener('change',()=>{renderColaboradoresPorUtd('utd','colaborador');renderVehicleOptions();});
    $('heUtd').addEventListener('change',()=>renderColaboradoresPorUtd('heUtd','heColaborador'));
    // --- CORREÇÃO DA LISTAGEM DE VEÍCULOS ---
    let vehiclesCache = [];
    function renderVehicleOptions() {
      const sel = $('placa');
      const utdSelecionada = $('utd').value;
      $('frota').value = '';
      if(!utdSelecionada) {
        sel.innerHTML = '<option value="" disabled selected>Selecione primeiro a SUB</option>';
        sel.disabled = true;
        return;
      }
      const filtrados = vehiclesCache.filter(v => v.utd === utdSelecionada).sort((a,b) => a.placa.localeCompare(b.placa));
      sel.disabled = false;
      let options = '<option value="" disabled selected>Selecione a Placa</option>';
      filtrados.forEach(v => { options += `<option value="${v.placa}" data-frota="${v.frota || '-'}">${v.placa}</option>`; });
      if(!filtrados.length) options = `<option value="" disabled selected>Nenhum veículo cadastrado para ${utdSelecionada}</option>`;
      sel.innerHTML = options;
    }
    function watchVehicles() {
      db.collection('veiculos').onSnapshot(snap => {
        vehiclesCache = snap.docs.map(doc => ({ placa: doc.id, frota: doc.data().frota || '-', utd: doc.data().utd || '' }));
        renderVehicleOptions();
      }, err => {
        console.error("Erro ao carregar veículos:", err);
        $('placa').innerHTML = '<option>Erro ao carregar</option>';
      });
    }

    $('placa').onchange = () => {
      const opt = $('placa').options[$('placa').selectedIndex];
      $('frota').value = opt.dataset.frota || '';
    }


    // --- CÁLCULO E ENVIO ---
    function updateElegibility() {
      const d1 = $('dataSaida').value, h1 = $('horaSaida').value;
      const d2 = $('dataRet').value, h2 = $('horaRet').value;
      if(!d1 || !h1 || !d2 || !h2) return;
      const s = new Date(`${d1}T${h1}`), r = new Date(`${d2}T${h2}`);
      if(r <= s) { $('pillTempo').textContent = "Erro: Data Inválida"; $('btnEnviar').disabled = true; return; }

      const minutos = Math.floor((r - s) / 60000);
      const DIARIA = 96.78, MEIA = 48.39;
      let valor = 0, ok = false;
      if (minutos >= 360) {
        ok = true;
        const dias = Math.floor(minutos / 1440);
        const resto = minutos % 1440;
        valor = dias * DIARIA;
        if(resto >= 720) valor += DIARIA; else if(resto >= 360) valor += MEIA;
      }
      $('pillTempo').textContent = `Tempo: ${Math.floor(minutos/60)}h ${minutos%60}m`;
      $('pillValor').textContent = `Valor: R$ ${valor.toFixed(2).replace('.', ',')}`;
      const ps = $('pillStatus');
      if(ok) { ps.textContent = "Elegível"; ps.className = "pill ok"; $('btnEnviar').disabled = false; }
      else { ps.textContent = "Não elegível (<6h)"; ps.className = "pill bad"; $('btnEnviar').disabled = true; }
      return { minutos, valor, ok };
    }

    ['dataSaida','horaSaida','dataRet','horaRet'].forEach(id => $(id).onchange = updateElegibility);

    $('formSolicitacao').onsubmit = async (e) => {
      e.preventDefault();
      const info = updateElegibility();
      const num = Math.floor(100000 + Math.random() * 900000);
      const doc = {
        numero: num, colaborador: $('colaborador').value,
        utd: $('utd').value,
        dataSaida: $('dataSaida').value, horaSaida: $('horaSaida').value,
        dataRetorno: $('dataRet').value, horaRetorno: $('horaRet').value,
        numeroNotaAtividade: $('numNota').value, destino: $('destino').value,
        placa: $('placa').value, frota: $('frota').value,
        duracaoMinutos: info.minutos, duracaoTexto: `${Math.floor(info.minutos/60)}h ${info.minutos%60}m`,
        valor: info.valor, status: 'Pendente', createdAt: new Date().toISOString()
      };
      try {
        await db.collection('solicitacoes_diaria').add(doc);
        toast(`Solicitação #${num} enviada!`, "success");
        e.target.reset(); updateElegibility();
      } catch(err) { toast("Erro ao enviar.", "error"); }
    };

    // --- UI TABS & CONSULTA ---
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('.tab-btn, .tab-pane').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); $(b.dataset.tab).classList.add('active');
      }
    });

    function renderCard(d) {
      return `<div style="background:#fff; border:1px solid #e2e8e0; border-radius:16px; padding:15px; margin-bottom:10px; font-size:13px; box-shadow: 0 2px 4px rgba(0,0,0,0.05)">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px"><span style="font-weight:800">#${d.numero}</span><span class="pill ${d.status==='Aprovado'?'ok':(d.status==='Reprovado'?'bad':'')}">${d.status}</span></div>
          <div>Destino: <b>${d.destino}</b></div><div>Data: ${d.dataSaida.split('-').reverse().join('/')}</div><div style="margin-top:5px; font-weight:700">Valor: R$ ${d.valor.toFixed(2).replace('.',',')}</div>
          ${d.observacao ? `<div style="margin-top:5px; font-size:11px; color:var(--danger)"><b>Obs:</b> ${d.observacao}</div>` : ''}
        </div>`;
    }

    $('btnConsultar').onclick = async () => {
      const n = Number($('consultaNum').value); if(!n) return;
      const snap = await db.collection('solicitacoes_diaria').where('numero', '==', n).limit(1).get();
      $('resultado').innerHTML = snap.empty ? "Não encontrado." : renderCard(snap.docs[0].data());
    };

    $('btnConsultarColab').onclick = async () => {
      const c = $('consultaColab').value; if(!c) return;
      const snap = await db.collection('solicitacoes_diaria').where('colaborador', '==', c).orderBy('createdAt', 'desc').limit(5).get();
      $('resultado').innerHTML = snap.empty ? "Sem registros." : snap.docs.map(d => renderCard(d.data())).join('');
    };

    

// ======= MODO (VIAGEM x HORA EXTRA) =======
function setMode(mode){
  const isV = mode === 'viagem';
  document.body.classList.toggle('mode-he', !isV);
  $('optViagem').classList.toggle('active', isV);
  $('optHE').classList.toggle('active', !isV);
  $('secViagem').classList.toggle('hidden', !isV);
  $('secHE').classList.toggle('hidden', isV);
  $('secHE').setAttribute('aria-hidden', isV ? 'true' : 'false');
  $('optViagem').setAttribute('aria-pressed', isV ? 'true' : 'false');
  $('optHE').setAttribute('aria-pressed', isV ? 'false' : 'true');
  $('btnSwitch').innerHTML = isV ? '<i class="fa-solid fa-repeat"></i> Alternar para Hora Extra' : '<i class="fa-solid fa-repeat"></i> Alternar para Viagem';
}
$('optViagem').onclick = () => setMode('viagem');
  // valida HE inicialmente
  try{ heValidate(); }catch(e){}
$('optHE').onclick = () => setMode('he');
$('btnSwitch').onclick = () => {
  const showingV = !$('secViagem').classList.contains('hidden');
  setMode(showingV ? 'he' : 'viagem');
};

// ======= ALERTA: AUTORIZADO = NÃO (permite envio) =======
$('heAutorizado').addEventListener('change', () => {
  const v = $('heAutorizado').value;
  $('heWarn').style.display = (v === 'NÃO') ? 'block' : 'none';
  heValidate();
});


// ================= BENEFÍCIO HORA EXTRA (TABELA) =================
function calcularBeneficioHE(tipoDia, escala, minutos){
  const horas = Number(minutos || 0) / 60;

  // normaliza entradas (remove espaços, aceita 'X' e '×')
  const tp = String(tipoDia || '').toLowerCase().replace(/\s+/g,' ').trim();
  const esc = String(escala || '').toLowerCase().replace(/\s+/g,'').replace('×','x');

  let beneficio = { tipo: null, valor: 0 };

  // DIA DE TURNO (5x2 ou 6x3)
  if(tp === 'dia de turno' && (esc === '5x2' || esc === '6x3')){
    if(horas >= 3){
      beneficio = { tipo: 'refeicao', valor: 57.28 };
    }else if(horas >= 2 && horas < 3){
      beneficio = { tipo: 'lanche', valor: 28.64 };
    }
  }

  // 5x2 (folga do meio, feriado, final de semana) a partir de 3h
  if(esc === '5x2' && (tp === 'folga do meio' || tp === 'feriado' || tp === 'final de semana') && horas >= 3){
    beneficio = { tipo: 'acumulativo', valor: 85.92 };
  }

  // 6x3 (somente folga do meio) a partir de 3h
  if(esc === '6x3' && tp === 'folga do meio' && horas >= 3){
    beneficio = { tipo: 'acumulativo', valor: 85.92 };
  }

  return beneficio;
}

// ======= HORA EXTRA =======
function heHoraInicio(){ return $('heModalidade').value==='EXTENSAO_TURNO' ? $('heIniPadrao').value : $('heIni').value; }
function heHoraFim(){ return $('heModalidade').value==='ANTECIPACAO_TURNO' ? $('heFimPadrao').value : $('heFim').value; }
function aplicarRegraModalidadeHE(){
 const m=$('heModalidade').value, ti=m==='EXTENSAO_TURNO', tf=m==='ANTECIPACAO_TURNO';
 $('heIniLivreWrap').hidden=ti; $('heIni').disabled=ti; $('heIni').required=!ti; $('heIniPadraoWrap').hidden=!ti; $('heIniPadrao').disabled=!ti; $('heIniPadrao').required=ti;
 $('heFimLivreWrap').hidden=tf; $('heFim').disabled=tf; $('heFim').required=!tf; $('heFimPadraoWrap').hidden=!tf; $('heFimPadrao').disabled=!tf; $('heFimPadrao').required=tf;
 if(ti){$('heIni').value='';$('heModalidadeAjuda').textContent='Horário inicial limitado às saídas padrão: 00:00, 14:00, 15:00, 16:00 ou 17:00.';}
 else if(tf){$('heFim').value='';$('heModalidadeAjuda').textContent='Horário final limitado às entradas padrão: 06:00, 07:00, 08:00 ou 16:00.';}
 else if(m==='FOLGA_FERIADO')$('heModalidadeAjuda').textContent='Horários inicial e final liberados para preenchimento.';
 else $('heModalidadeAjuda').textContent='Selecione a modalidade para aplicar a regra dos horários.';
 heValidate();
}

function heCalc(){
  const d = $('heData').value, hi = heHoraInicio(), hf = heHoraFim();
  if(!d || !hi || !hf){ $('heBtnEnviar').disabled = true; return null; }
  let start = new Date(`${d}T${hi}`);
  let end = new Date(`${d}T${hf}`);
  if(end <= start) end = new Date(end.getTime() + 24*60*60*1000);
  const minutos = Math.max(0, Math.floor((end-start)/60000));
  let faixa = '-';
  if(minutos >= 10 && minutos <= 15) faixa = '10-15';
  else if(minutos >= 16 && minutos <= 30) faixa = '16-30';
  else if(minutos >= 31 && minutos <= 60) faixa = '31-60';
  else if(minutos > 60) faixa = '>60';

  $('hePillMin').textContent = `Duração: ${minutos} min`;
  const contabil = heMinContabilizados(minutos, $('heEscala').value, $('heTipo').value);
  if(document.getElementById('hePillCont')) document.getElementById('hePillCont').textContent = `Contabilizado: ${contabil} min`;

  const beneficio = calcularBeneficioHE($('heTipo').value, $('heEscala').value, contabil);
  const benefLabel = { refeicao: 'Refeição', lanche: 'Lanche', acumulativo: 'Acumulativo' };
  if(document.getElementById('hePillBeneficio')) document.getElementById('hePillBeneficio').textContent = `Benefício: ${beneficio.tipo ? (benefLabel[beneficio.tipo] || beneficio.tipo) : '-'}`;
  if(document.getElementById('hePillValor')) document.getElementById('hePillValor').textContent = `Valor: R$ ${Number(beneficio.valor || 0).toFixed(2).replace('.', ',')}`;

  $('hePillFaixa').textContent = `Faixa: ${faixa}`;
  const ps = $('hePillStatus');
  if(minutos > 0){ ps.textContent='Pronto para enviar'; ps.className='pill ok'; $('heBtnEnviar').disabled=false; }
  else { ps.textContent='Aguardando dados'; ps.className='pill bad'; $('heBtnEnviar').disabled=true; }
  return { minutos, contabil, faixa, beneficio };
}

function heAllFilled(){
  const req = ['heColaborador','heUtd','heEscala','heData','heTipo','heAcionado','heAutorizado','heModalidade','heJust'];
  const baseOk = req.every(id => {
    const el = $(id);
    if(!el) return false;
    const v = (el.value || '').trim();
    return v.length > 0;
  });
  return baseOk && !!heHoraInicio() && !!heHoraFim();
}

function heValidate(){
  const calc = heCalc();
  const filled = heAllFilled();
  // permite envio somente quando todos os campos estão preenchidos e a duração é válida (>0)
  $('heBtnEnviar').disabled = !(filled && calc && calc.minutos > 0);
}

$('heModalidade').addEventListener('change', aplicarRegraModalidadeHE);
['heColaborador','heUtd','heEscala','heData','heTipo','heAcionado','heAutorizado','heModalidade','heIni','heFim','heIniPadrao','heFimPadrao','heJust'].forEach(id => {
  const el = $(id); if(!el) return;
  el.addEventListener('change', heValidate);
  el.addEventListener('input', heValidate);
});



// Regra de contabilização (5x2 + 100%: feriado/final de semana)
function heMinContabilizados(minutos, escala, tipo){
  const esc = String(escala||'').toLowerCase();
  const tp = String(tipo||'').toLowerCase();
  const is100 = (tp==='feriado' || tp==='final de semana');
  if(esc==='5x2' && is100){
    if(minutos <= 360) return minutos; // até 6h: integral (minutos reais)
    const horasCheias = Math.floor(minutos/60);
    if(horasCheias <= 6) return 360;   // entre 6:01 e 6:59 => 6h
    return (horasCheias - 1) * 60;     // >=7h => desconta 1h e considera horas cheias
  }
  return minutos;
}

$('formHoraExtra').onsubmit = async (e) => {
  e.preventDefault();
  const calc = heCalc();
  if(!calc) return;
  const num = Math.floor(100000 + Math.random() * 900000);
  const doc = {
    numero: num,
    colaborador: $('heColaborador').value,
    utd: $('heUtd').value,
    tipoEscala: $('heEscala').value,
    data: $('heData').value,
    tipoHoraExtra: $('heTipo').value,
    modalidadePeriodo: $('heModalidade').value,
    acionadoPor: $('heAcionado').value,
    autorizadoSupervisor: $('heAutorizado').value,
    horaInicio: heHoraInicio(),
    horaFim: heHoraFim(),
    justificativa: $('heJust').value,
    duracaoMinutos: calc.minutos,
    faixaMinutos: calc.faixa,

    beneficio_tipo: (calc.beneficio || {}).tipo || null,
    beneficio_valor: (calc.beneficio || {}).valor || 0,
    status: 'Pendente',
    observacao: '',
    createdAt: new Date().toISOString()
  };
  try{
    await db.collection('solicitacoes_hora_extra').add(doc);
    toast(`HE #${num} enviada!`, 'success');
    e.target.reset();
    aplicarRegraModalidadeHE();
    $('heWarn').style.display = 'none';
    $('hePillStatus').textContent='Aguardando dados'; $('hePillStatus').className='pill bad';
    $('hePillMin').textContent='Duração: -- min'; $('hePillFaixa').textContent='Faixa: -';
    $('hePillCont').textContent='Contabilizado: -- min';
    if(document.getElementById('hePillBeneficio')) document.getElementById('hePillBeneficio').textContent='Benefício: -';
    if(document.getElementById('hePillValor')) document.getElementById('hePillValor').textContent='Valor: R$ 0,00';
    $('heBtnEnviar').disabled=true;
  } catch(err){
    console.error(err);
    toast('Erro ao enviar HE.', 'error');
  }
};


// Inits
    (function init() {
      $('colaborador').innerHTML='<option value="">Selecione primeiro a SUB</option>'; $('colaborador').disabled=true;
      $('heColaborador').innerHTML='<option value="">Selecione primeiro a SUB</option>'; $('heColaborador').disabled=true;
      $('consultaColab').innerHTML='<option value="">Selecione a SUB no formulário</option>';
      renderUtdOptions(); watchOrganizacao(); watchVehicles(); setMode('viagem');
      try{ heValidate(); }catch(e){}
    })();
