const funcionariosMap = {}; // nome_func → id_func



function parseISODateLocal(isoDateStr) {
  if (!isoDateStr || typeof isoDateStr !== 'string') return null;

  const [ano, mes, dia] = isoDateStr.split('-');
  return new Date(ano, mes - 1, dia);
}



export function ativarEdicaoMaterial() {
  document.querySelectorAll(".table tbody tr").forEach(function (row) {
    row.addEventListener("click", function () {
      const cells = row.querySelectorAll("td");

      // Material
      document.getElementById("descricao").value = cells[1].innerText;
      document.querySelector(".nome-equipamento-cautelado").value = cells[1].innerText;
      document.getElementById("quantidade").value = cells[0].innerText;
      document.getElementById("tipoContagem").value = cells[2].innerText;
      document.getElementById("unidadeMedida").value = cells[3].innerText;
      document.getElementById("valorUnitario").value = cells[4].innerText.replace(",", ".");

      document.getElementById("kardex").value = cells[5].innerText;
      document.getElementById("validade").value = formatarData(cells[6].innerText);
      document.getElementById("tipoMaterial").value = cells[7].innerText;
      document.getElementById("status").value = cells[8].innerText;
      document.getElementById("idMaterial").value = row.querySelector('th').dataset.id;
      document.getElementById("idCautelaMaterial").value = row.querySelector('td').dataset.id;


      // Funcionário vinculado
      document.getElementById("funcionarioVinculo").value = getFuncionarioId(cells[14].innerText);
      document.getElementById("dataCautelaVinculo").value = formatarData(cells[10].innerText);
      document.getElementById("equipamentoVinculo").value = getEquipamentoId(cells[2].innerText); // exemplo: vincular pelo tipo de contagem ou descrição
    });
  });
}


// Exemplo: converte nome do funcionário para ID
function getFuncionarioId(nome) {
  if (nome === "João Silva") return "1";
  if (nome === "Maria Souza") return "2";
  return "";
}

// Exemplo: converte nome do equipamento para ID
function getEquipamentoId(nome) {
  if (nome.includes("Multímetro")) return "10";
  if (nome.includes("Lanterna")) return "11";
  return "";
}

// Formata data para padrão ISO (input[type="date"])
function formatarData(data) {
  console.log(data, "dt teste");

  const partes = data.split("/");
  const dia = partes[0].padStart(2, "0");
  const mes = partes[1].padStart(2, "0");
  const ano = partes[2];

  return `${ano}-${mes}-${dia}`;
}

export function montarTab() {
  fetch('/funcionario')
    .then(res => res.json())
    .then(funcionarios => {
      const datalist = document.getElementById('listaFuncionarios');
      datalist.innerHTML = '';

      funcionarios.forEach(func => {
        const option = document.createElement('option');
        option.value = func.nome_func;
        datalist.appendChild(option);

        // ✅ Preenche o mapa global
        funcionariosMap[func.nome_func] = func.id_func;
      });
    });


  fetch('/material-embarque')
    .then(res => res.json())
    .then(dados => {
      const tbody = document.querySelector('.tabela-wrapper tbody');
      if (!tbody) return;

      tbody.innerHTML = ''; // limpa a tabela


      dados.forEach((item, index) => {
        const mat = item.material;
        const emb = item.embarque;
        const tipo = mat.tipo;

        const validadeFormatada = mat.data_validade_mat
          ? parseISODateLocal(mat.data_validade_mat).toLocaleDateString()
          : '—';
        const datEmbarque = item.data_mat_emb
          ? parseISODateLocal(item.data_mat_emb).toLocaleDateString()
          : '—';


        const row = document.createElement('tr');
        const funcionarioNome = item.cautela_material?.[0]?.funcionario?.nome_func || '—';

        row.innerHTML = `
  <th scope="row"  data-id="${mat.id_mat}">${index + 1}</th>
  <td data-id="${item.id_mat_emb}">${mat.qtd_mat}</td>
  <td>${mat.nome_material}</td>
  <td>${mat.tipo_contagem_mat}</td>
  <td>${mat.unidade_medida}</td>
  <td>${mat.valor_unidade_mat.toFixed(2)}</td>
  <td>${mat.kardex_mat}</td>
  <td>${validadeFormatada}</td>
  <td>${tipo.description_tip}</td>
  <td>${mat.status_mat}</td>
  <td>${item.rt_emb}</td>
  <td>${datEmbarque}</td>
  <td>${emb.plataforma_origem.nome_plat}</td>
  <td>${emb.plataforma_destino.nome_plat}</td>
  <td>${emb.plataforma_origem.cliente_plat}</td>
  <td>${funcionarioNome}</td>
`;

        tbody.appendChild(row);
      });
      ativarEdicaoMaterial();

      // ✅ Só monta o gráfico depois que a tabela estiver pronta
    })
    .catch(err => {
      console.error('Erro ao carregar tabela:', err);
    });
  document.getElementById('btnCadastroGeral')
    .addEventListener('click', salvarTudo);
}




async function salvarPlataforma() {
  const dados = {
    nome_plat: document.getElementById('nomePlataforma').value,
    cliente_plat: document.getElementById('clientePlataforma').value,
    contrato: document.getElementById('contratoPlataforma').value
  };

  const res = await fetch('/plataformas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });

  const resposta = await res.json();
  console.log(resposta);
}






export async function salvarTudo() {
  const nomeFuncionario = document.getElementById("funcionarioVinculo").value.trim();
  const idFuncionario = funcionariosMap[nomeFuncionario];

  if (!idFuncionario) {
    alert("Funcionário não encontrado. Verifique o nome digitado.");
    return;
  }

  // --- Captura campos de Material ---
  const idMaterial = document.getElementById("idMaterial").value;
  const tipoMaterial = parseInt(document.getElementById("tipoMaterial").value);

  const materialPayload = {
    nome_material: document.getElementById("descricao").value.trim(),
    qtd_mat: document.getElementById("quantidade").value.trim(),
    tipo_contagem_mat: document.getElementById("tipoContagem").value.trim(),
    unidade_medida: document.getElementById("unidadeMedida").value.trim(),
    valor_unidade_mat: document.getElementById("valorUnitario").value.trim(),
    kardex_mat: document.getElementById("kardex").value.trim(),
    data_validade_mat: document.getElementById("validade").value.trim(),
    tipo_mat: tipoMaterial,
    status_mat: document.getElementById("status").value.trim()
  };

  // --- Captura campos de Plataforma ---
  const plataformaPayload = {
    nome_plat: document.getElementById("nomePlataforma").value.trim(),
    cliente_plat: document.getElementById("clientePlataforma").value.trim(),
    contrato: document.getElementById("bacia").value.trim()
  };

  // --- Captura campos de Cautela de Material ---
  const idMatEmbarque = document.getElementById("idCautelaMaterial").value;

  const cautelaPayload = {
    id_funcionario: idFuncionario,
    id_mat_emb: parseInt(idMatEmbarque),
    quantidade: parseInt(document.getElementById("quantidadeCautela").value),
    data_cautela: document.getElementById("dataCautelaVinculo").value.trim(),
    status_cautela: document.getElementById("statusCautela").value.trim(),
    observacao: document.getElementById("observacoes").value.trim()
  };

  console.log(cautelaPayload, "esse aqui é a cautelaaa");

  // --- Verificações específicas ---
  const materialPreenchido =
    materialPayload.nome_material &&
    materialPayload.qtd_mat &&
    materialPayload.tipo_contagem_mat &&
    materialPayload.unidade_medida &&
    materialPayload.valor_unidade_mat &&
    materialPayload.kardex_mat &&
    materialPayload.data_validade_mat &&
    !isNaN(materialPayload.tipo_mat) &&
    materialPayload.status_mat;

  const plataformaPreenchida =
    plataformaPayload.nome_plat &&
    plataformaPayload.cliente_plat &&
    plataformaPayload.contrato;

  const cautelaPreenchida =
    cautelaPayload.id_funcionario &&
    cautelaPayload.id_mat_emb &&
    cautelaPayload.quantidade &&
    cautelaPayload.data_cautela;

  // --- Nenhum preenchido ---
  if (!materialPreenchido && !plataformaPreenchida && !cautelaPreenchida) {
    alert("Preencha os campos de Material, Plataforma e/ou Cautela antes de salvar.");
    return;
  }

  try {
    // --- Salva Material ---
    if (materialPreenchido) {
      const urlMat = idMaterial
        ? `/material-com-embarque/${idMaterial}`
        : `/material-com-embarque`;

      const methodMat = idMaterial ? "PUT" : "POST";

      const resMat = await fetch(urlMat, {
        method: methodMat,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialPayload)
      });

      if (!resMat.ok) throw new Error("Erro ao salvar material");
      console.log("✅ Material salvo com sucesso!");
    }

    // --- Salva Plataforma ---
    if (plataformaPreenchida) {
      const resPlat = await fetch("/plataformas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plataformaPayload)
      });

      if (!resPlat.ok) throw new Error("Erro ao salvar plataforma");
      console.log("✅ Plataforma salva com sucesso!");
    }

    // --- Salva Cautela ---
    if (cautelaPreenchida) {
      const resCautela = await fetch("/cautela-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cautelaPayload)
      });

      if (!resCautela.ok) throw new Error("Erro ao salvar cautela");
      console.log("✅ Cautela salva com sucesso!");
    }

    alert("✅ Dados salvos com sucesso!");
    montarTab();
    document.getElementById("idMaterial").value = "";

  } catch (err) {
    console.error("❌ Erro ao salvar:", err);
    alert("Erro ao salvar dados.");
  }
}




