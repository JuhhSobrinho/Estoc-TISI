export let graficoVendas, graficoVencer, graficoBaixoEstoque, graficoPlatUtilizados, graficoPlatNUtilizados, graficoPrinMatBaixoIndicie;
let plataformaSelecionada = null;


export function montarTabGrafico() {
  return fetch('/material-embarque')
    .then(res => res.json())
    .then(dados => {
      const tbody = document.querySelector('.tabela-wrapper tbody');
      if (!tbody) return;

      tbody.innerHTML = '';

      dados.forEach((item, index) => {
        const mat = item.material;
        const emb = item.embarque;
        const tipo = mat.tipo;

        const validadeISO = mat.data_validade_mat || null;
        const validadeFormatada = validadeISO ? parseISODateLocal(validadeISO).toLocaleDateString() : '—';
        const datEmbarque = item.data_mat_emb
          ? parseISODateLocal(item.data_mat_emb).toLocaleDateString()
          : '—';


        let classeValidade = '';
        if (validadeISO) {
          const hoje = new Date();
          const dtVal = new Date(validadeISO);
          if (dtVal < hoje) {
            classeValidade = 'vencido'; // 👈 classe CSS que vamos criar
          }
        }
        const row = document.createElement('tr');
        row.innerHTML = `
  <th scope="row">${index + 1}</th>
  <td>${mat.qtd_mat}</td>
  <td>${mat.nome_material}</td>
  <td>${mat.tipo_contagem_mat}</td>
  <td>${mat.unidade_medida}</td>
  <td>${mat.valor_unidade_mat.toFixed(2)}</td>
  <td>${mat.kardex_mat}</td>
  <td data-validade-iso="${validadeISO || ''}" class="${classeValidade}">
    ${validadeFormatada}
  </td>
  <td>${tipo.description_tip}</td>
  <td>${mat.status_mat}</td>
  <td>${item.rt_emb}</td>
  <td>${datEmbarque}</td>
  <td>${emb.plataforma_origem.nome_plat}</td>
  <td>${emb.plataforma_destino.nome_plat}</td>
  <td>${emb.plataforma_origem.cliente_plat}</td>
`;
        tbody.appendChild(row);
      });

      return true; // indica que terminou
    })
    .catch(err => {
      console.error('Erro ao carregar tabela:', err);
      return false;
    });
}

/**
 * Coleta dados da tabela
 */
export function coletarDadosTabela() {

  const linhas = document.querySelectorAll('table tbody tr');
  const dados = [];

  linhas.forEach(linha => {
    const colunas = linha.querySelectorAll('td');

    const quantidade = parseInt(colunas[0]?.textContent.trim(), 10);
    const descricao = colunas[1]?.textContent.trim();
    const kardex = colunas[5]?.textContent.trim();
    const tipo = colunas[7]?.textContent.trim();
    const unidadeMedida = colunas[3]?.textContent.trim();
    const status = colunas[8]?.textContent.trim();
    const platOrigen = colunas[11]?.textContent.trim();
    const platDestino = colunas[12]?.textContent.trim();
    const validadeCell = colunas[6];
    const validadeISO = validadeCell?.getAttribute('data-validade-iso')?.trim();
    const validade = validadeISO || null;


    const rtEmbarque = colunas[9]?.textContent.trim();     // Embarque RT
    const dtEmbarqueStr = colunas[10]?.textContent.trim();     // Embarque RT
    const dtEmbarque = dtEmbarqueStr ? parseBRDateToISO(dtEmbarqueStr) : null;     // Embarque RT
    const cliente = colunas[13]?.textContent.trim();         // Tip. Cont. (ou ajuste se cliente estiver em outra coluna)


    if (descricao && !isNaN(quantidade)) {
      dados.push({
        quantidade,
        descricao,
        kardex,
        tipo,
        unidadeMedida,
        status,
        platOrigen,
        platDestino,
        validade,
        rtEmbarque,
        dtEmbarque,
        cliente
      });
    }
  });


  console.log(dados, "dados tabela");
  return dados;
}


function parseUSDateToISO(str) {
  // "MM/dd/yyyy" -> "yyyy-MM-dd"
  const [mes, dia, ano] = str.split('/');
  return `${ano}-${mes}-${dia}`;
}


function parseBRDateToISO(str) {
  // "dd/MM/yyyy" -> "yyyy-MM-dd"
  const [dia, mes, ano] = str.split('/');
  return `${ano}-${mes}-${dia}`;
}




/**
 * Atualiza um gráfico existente
 */
function atualizarGrafico(grafico, dados) {
  if (!grafico || !grafico.data || !grafico.data.datasets || !grafico.data.datasets[0]) {
    console.warn("Gráfico não está corretamente inicializado");
    return;
  }

  grafico.data.labels = dados.map(d => d.descricao);
  grafico.data.datasets[0].data = dados.map(d => d.quantidade);
  grafico.update();
}










function aplicarFiltroTabela(grafico, valorFiltro, filtroStatus = null, tipoFiltro = 'plataforma') {
  const linhas = document.querySelectorAll('table tbody tr');
  const dados = [];

  linhas.forEach(linha => {
    const colunas = linha.querySelectorAll('td');
    const quantidade = parseInt(colunas[0]?.textContent);
    const descricao = colunas[1]?.textContent.trim();
    const status = colunas[8]?.textContent.trim();
    const platDestino = colunas[12]?.textContent.trim();

    let mostrar = false;

    if (tipoFiltro === 'plataforma') {
      mostrar = platDestino === valorFiltro;
    } else if (tipoFiltro === 'descricao') {
      mostrar = descricao === valorFiltro;
    }

    if (filtroStatus) {
      mostrar = mostrar && status === filtroStatus;
    }

    linha.style.display = mostrar ? '' : 'none';

    if (mostrar && descricao && !isNaN(quantidade)) {
      dados.push({ descricao, quantidade });
    }
  });

  // Atualiza o gráfico com os dados filtrados
  const agrupado = {};
  dados.forEach(d => {
    agrupado[d.descricao] = (agrupado[d.descricao] || 0) + d.quantidade;
  });

  const labels = Object.keys(agrupado);
  const valores = Object.values(agrupado);

  grafico.data.labels = labels;
  grafico.data.datasets[0].data = valores;
  grafico.update();
  atualizarTodosGraficos();
}





function aplicarFiltroTabelaCombinado(grafico, descricaoFiltro, plataformaFiltro, filtroStatus = null) {
  const linhas = document.querySelectorAll('table tbody tr');
  const dados = [];

  linhas.forEach(linha => {
    const colunas = linha.querySelectorAll('td');
    const quantidade = parseInt(colunas[0]?.textContent);
    const descricao = colunas[1]?.textContent.trim();
    const status = colunas[8]?.textContent.trim();
    const platDestino = colunas[12]?.textContent.trim();

    let mostrar =
      descricao === descricaoFiltro &&
      platDestino === plataformaFiltro;

    if (filtroStatus) {
      mostrar = mostrar && status === filtroStatus;
    }

    linha.style.display = mostrar ? '' : 'none';

    if (mostrar && descricao && !isNaN(quantidade)) {
      dados.push({ descricao, quantidade });
    }
  });

  const agrupado = {};
  dados.forEach(d => {
    agrupado[d.descricao] = (agrupado[d.descricao] || 0) + d.quantidade;
  });

  grafico.data.labels = Object.keys(agrupado);
  grafico.data.datasets[0].data = Object.values(agrupado);
  grafico.update();
  atualizarTodosGraficos();
}



function filtrarTabelaPorPlataformaEStatus(plataforma, status) {
  const linhas = document.querySelectorAll('table tbody tr');

  linhas.forEach(linha => {
    const colunas = linha.querySelectorAll('td');
    const platDestino = colunas[12]?.textContent.trim();
    const statusLinha = colunas[8]?.textContent.trim();

    const mostrar = platDestino === plataforma && statusLinha === status;
    linha.style.display = mostrar ? '' : 'none';
  });
}










function aplicarFiltroPorDescricao(descricao) {
  const linhas = document.querySelectorAll('table tbody tr');

  linhas.forEach(linha => {
    const colunas = linha.querySelectorAll('td');
    const descricaoLinha = colunas[1]?.textContent.trim(); // coluna da descrição


    const mostrar = descricaoLinha === descricao;
    linha.style.display = mostrar ? '' : 'none';
  });
  atualizarTodosGraficos();
}

function aplicarFiltroBaixoEstoque(descricaoSelecionada) {
  const linhas = document.querySelectorAll('table tbody tr');
  const dados = [];

  linhas.forEach(linha => {
    const colunas = linha.querySelectorAll('td');
    const descricao = colunas[1]?.textContent.trim();
    const quantidade = parseInt(colunas[0]?.textContent);

    if (!descricao || isNaN(quantidade)) {
      linha.style.display = 'none';
      return;
    }

    const mostrar = descricao === descricaoSelecionada;


    linha.style.display = mostrar ? '' : 'none';

    if (mostrar) {
      dados.push({ descricao, quantidade });
    }

  });

  console.log("Dados filtrados:", dados);
  atualizarTodosGraficos();
}

function normalizarDataBR(dataStr) {
  console.log(dataStr, "datytttttttttttttta");

  const partes = dataStr.split(/[\/\-]/); // aceita "/" ou "-"
  if (partes.length === 3) {
    const [dia, mes, ano] = partes;
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  return dataStr; // retorna original se não conseguir converter
}


function atualizarTodosGraficos() {
  const dados = coletarDadosTabela();

  console.log(dados, "dados da tabela");

  // 🔎 Se houver plataformaSelecionada, filtra só ela
  let dadosFiltrados = dados;
  if (plataformaSelecionada) {
    dadosFiltrados = dados.filter(d => d.platDestino === plataformaSelecionada);
  }

  // Atualiza gráfico de validade
  if (graficoVencer) {
    const dadosComValidade = dadosFiltrados.filter(d => d.validade);

    // Converte para Date e filtra inválidos
    const pontos = dadosComValidade
      .map(d => {
        const dt = new Date(d.validade); // d.validade em "yyyy-MM-dd"
        return (dt instanceof Date && !isNaN(dt)) ? { x: d.descricao, y: dt } : null;
      })
      .filter(Boolean);

    const datasValidas = pontos.map(p => p.y);
    if (datasValidas.length > 0) {
      const hoje = new Date();
      const inicioAno = new Date(hoje.getFullYear(), 0, 1);

      const minData = new Date(Math.min(...datasValidas));
      const maxData = new Date(Math.max(...datasValidas));
      const minFinal = minData < inicioAno ? inicioAno : minData;

      graficoVencer.data.datasets[0].data = pontos;
      graficoVencer.options.scales.y.min = minFinal;
      graficoVencer.options.scales.y.max = maxData;
      graficoVencer.update();
    } else {
      // Se não há datas válidas, evita cair para 1970
      graficoVencer.data.datasets[0].data = [];
      graficoVencer.options.scales.y.min = undefined;
      graficoVencer.options.scales.y.max = undefined;
      graficoVencer.update();
    }
  }

  // Atualiza gráfico de baixo estoque (mantém igual)
  if (graficoBaixoEstoque) {
    const agrupado = {};
    dadosFiltrados.forEach(d => {
      if (d.platDestino === "BASE") {
        agrupado[d.descricao] = (agrupado[d.descricao] || 0) + d.quantidade;
      }
    });

    const labels = Object.keys(agrupado);
    const valores = Object.values(agrupado);

    graficoBaixoEstoque.data.labels = labels;
    graficoBaixoEstoque.data.datasets[0].data = valores;
    graficoBaixoEstoque.update();
  }
}





function parseISODateLocal(isoDateStr) {
  if (!isoDateStr || typeof isoDateStr !== 'string') return null;

  const [ano, mes, dia] = isoDateStr.split('-');
  return new Date(ano, mes - 1, dia);
}














function aplicarFiltroPorTipo(tipoFiltro) {
  const dados = coletarDadosTabela();

  // 🔎 filtra só os materiais que batem com o tipo ou descrição
  let filtrados = dados.filter(d =>
    d.tipo.toLowerCase().includes(tipoFiltro) ||
    d.descricao.toLowerCase().includes(tipoFiltro)
  );

  // --- Atualiza tabela ---
  const linhas = document.querySelectorAll('table tbody tr');
  linhas.forEach(linha => {
    const cols = linha.querySelectorAll('td');
    const descricaoLinha = cols[1]?.textContent.trim().toLowerCase();
    const tipoLinha = cols[7]?.textContent.trim().toLowerCase();

    const mostrar = filtrados.some(d =>
      d.descricao.toLowerCase() === descricaoLinha ||
      d.tipo.toLowerCase() === tipoLinha
    );

    linha.style.display = mostrar ? '' : 'none';
  });

  // --- Agrupa por plataforma destino para o gráfico verde ---
  const agrupado = {};
  filtrados.forEach(d => {
    agrupado[d.platDestino] = (agrupado[d.platDestino] || 0) + d.quantidade;
  });

  const labels = Object.keys(agrupado);
  const valores = Object.values(agrupado);

  if (graficoPlatUtilizados) {
    graficoPlatUtilizados.data.labels = labels;
    graficoPlatUtilizados.data.datasets[0].data = valores;
    graficoPlatUtilizados.update();
  }

  // --- Atualiza gráfico de vencimento ---
  if (graficoVencer) {
    const dadosComValidade = filtrados.filter(d => d.validade && d.status !== "Utilizado");
    const pontos = dadosComValidade.map(d => ({
      x: d.descricao,
      y: new Date(d.validade)
    }));

    graficoVencer.data.datasets[0].data = pontos;
    graficoVencer.update();
  }

  // --- Atualiza gráfico de N. Utilizados ---
  if (graficoPlatNUtilizados) {
    const naoUtilizados = filtrados.filter(d => d.status !== "Utilizado");
    const agrupadoNU = {};
    naoUtilizados.forEach(d => {
      agrupadoNU[d.platDestino] = (agrupadoNU[d.platDestino] || 0) + d.quantidade;
    });

    graficoPlatNUtilizados.data.labels = Object.keys(agrupadoNU);
    graficoPlatNUtilizados.data.datasets[0].data = Object.values(agrupadoNU);
    graficoPlatNUtilizados.update();
  }
}












export function listarGraficos(dados) {


  document.getElementById("btn-busca-material").addEventListener("click", () => {
    const termo = document.getElementById("busca").value.trim().toLowerCase();
    aplicarFiltroPorTipo(termo);
  });



  // --- Materiais a vencer ---
  // --- Materiais a vencer ---
  const vencer = document.getElementById('meuGraficoVencer');
  if (vencer) {
    let dadosComValidade = dados.filter(d => d.validade && d.status !== "Utilizado");

    // 👇 se já tem plataforma selecionada, filtra só ela
    if (plataformaSelecionada) {
      dadosComValidade = dadosComValidade.filter(d => d.platDestino === plataformaSelecionada);
    }

    dadosComValidade.sort((a, b) => new Date(a.validade) - new Date(b.validade));

    const dadosGrafico = dadosComValidade.map(d => ({
      x: d.descricao,
      y: new Date(d.validade)
    }));

    const datasSomente = dadosComValidade.map(d => new Date(d.validade));
    const minData = new Date(Math.min(...datasSomente));
    const maxData = new Date(Math.max(...datasSomente));

    graficoVencer = new Chart(vencer.getContext('2d'), {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Validade',
          data: dadosGrafico,
          backgroundColor: 'rgba(255, 193, 7, 0.5)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const descricaoSelecionada = graficoVencer.data.datasets[0].data[index].x;

            const dados = coletarDadosTabela();

            let filtrados = dados.filter(d =>
              d.descricao === descricaoSelecionada &&
              d.status !== "Utilizado"
            );

            if (plataformaSelecionada) {
              filtrados = filtrados.filter(d => d.platDestino === plataformaSelecionada);
            }

            // Atualiza tabela
            const linhas = document.querySelectorAll('table tbody tr');
            linhas.forEach(linha => {
              const cols = linha.querySelectorAll('td');
              const descLinha = cols[1]?.textContent.trim();
              const platDestino = cols[12]?.textContent.trim();
              const mostrar = filtrados.some(d =>
                d.descricao === descLinha &&
                (!plataformaSelecionada || d.platDestino === plataformaSelecionada)
              );
              linha.style.display = mostrar ? '' : 'none';
            });

            // Atualiza gráfico de validade
            const dadosGrafico = filtrados.map(d => ({
              x: d.descricao,
              y: new Date(d.validade)
            }));

            graficoVencer.data.datasets[0].data = dadosGrafico;
            graficoVencer.update();
          }
        },
        scales: {
          x: { type: 'category', title: { display: true, text: 'Descrição do Material' } },
          y: {
            type: 'time',
            time: { unit: 'day', tooltipFormat: 'dd/MM/yyyy', displayFormats: { day: 'dd/MM/yyyy' } },
            min: minData,
            max: maxData,
            title: { display: true, text: 'Data de Validade' }
          }
        }
      }
    });
  }


  // --- Baixo estoque ---
  const baixoEstoque = document.getElementById('meuGraficoBaixoEstoque');
  if (baixoEstoque) {
    // Lista completa de materiais que você quer mostrar
    const todosMateriais = [...new Set(dados.map(d => d.descricao))];

    // Inicializa todos com 0
    const agrupado = {};
    todosMateriais.forEach(mat => {
      agrupado[mat] = 0;
    });

    dados.forEach(d => {
      if (d.platDestino === "BASE") {
        agrupado[d.descricao] += d.quantidade;
      }
    });

    const labels = Object.keys(agrupado);
    const valores = Object.values(agrupado);

    graficoBaixoEstoque = new Chart(baixoEstoque.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Baixo Estoque (Unidade Base)',
          data: valores,
          backgroundColor: labels.map((_, i) => i % 2 === 0 ? 'rgba(54, 162, 235, 0.7)' : 'rgba(54, 162, 235, 0.3)'),
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || '';
                let value = context.raw || 0;
                return `${label}: ${value}`;
              }
            }
          }
        },
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const label = graficoBaixoEstoque.data.labels[index];

            // Sempre filtra por material dentro da plataforma BASE
            aplicarFiltroTabelaCombinado(graficoBaixoEstoque, label, "BASE", "N. Utilizado");
          }
        },
        scales: {
          y: {
            type: 'logarithmic',
            beginAtZero: true,
            min: 0, // evita que valores muito pequenos fiquem achatados
            max: 350, // ajusta o topo para não exagerar
            title: {
              display: true,
              text: 'Quantidade'
            },
            ticks: {
              callback: value => Number(value).toLocaleString()
            }
          },
          x: {
            title: {
              display: true,
              text: 'Plataforma'
            }
          }
        }
      }
    });
  }




  // --- Plataformas utilizadas ---
  const platUtilizados = document.getElementById('meuGraficoPlatUTilizados');
  if (platUtilizados) {
    const dados = coletarDadosTabela(); // já retorna {descricao, quantidade, platDestino, ...}

    // Agrupar por platDestino e contar o número de itens
    const agrupado = {};
    dados.forEach(d => {
      if (!agrupado[d.platDestino]) {
        agrupado[d.platDestino] = 0;
      }
      agrupado[d.platDestino] += d.quantidade; // Soma a quantidade real
    });


    // Transformar em arrays para o gráfico
    const labels = Object.keys(agrupado); // Plataformas
    const valores = Object.values(agrupado); // Número de itens por plataforma
    let estadoGrafico = 'plataforma';

    graficoPlatUtilizados = new Chart(platUtilizados.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Número de Itens por Plataforma',
          data: valores,
          backgroundColor: 'rgba(40, 167, 69, 0.5)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const label = graficoPlatUtilizados.data.labels[index];

            if (estadoGrafico === 'plataforma') {
              plataformaSelecionada = label;
              aplicarFiltroTabela(graficoPlatUtilizados, label, null, "plataforma");
              estadoGrafico = 'descricao';
            } else {
              aplicarFiltroTabelaCombinado(graficoPlatUtilizados, label, plataformaSelecionada, "N. Utilizado");
              estadoGrafico = 'plataforma'; // opcional: alterna de volta
            }

            atualizarEscalaY(graficoPlatUtilizados, estadoGrafico);
          }
        },
        scales: {
          y: {
            type: 'logarithmic',
            beginAtZero: true,
            min: 10, // evita que valores muito pequenos fiquem achatados
            title: {
              display: true,
              text: 'Quantidade'
            },
            ticks: {
              callback: value => Number(value).toLocaleString()
            }
          },
          x: {
            title: {
              display: true,
              text: 'Plataforma'
            }
          }
        }
      }
    });
  }


  // --- Plataformas não utilizadas ---
  const platNUtilizados = document.getElementById('meuGraficoPlatNUtilizados');
  if (platNUtilizados) {
    const dados = coletarDadosTabela(); // retorna {descricao, quantidade, platDestino, status, ...}

    // Filtrar apenas os que têm status "N. Utilizados"
    const naoUtilizados = dados.filter(d => d.status !== "Utilizado");
    console.log(naoUtilizados, "nao utilizados")

    // Agrupar por plataforma
    const agrupado = {};
    naoUtilizados.forEach(d => {
      if (!agrupado[d.platDestino]) {
        agrupado[d.platDestino] = 0;
      }
      agrupado[d.platDestino] += d.quantidade;
    });

    // Transformar em arrays para o gráfico
    const labels = Object.keys(agrupado);
    const valores = Object.values(agrupado);
    let estadoGrafico = 'plataforma';


    graficoPlatNUtilizados = new Chart(platNUtilizados.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Materiais Não Utilizados',
          data: valores,
          backgroundColor: 'rgba(108, 117, 125, 0.5)',
          borderColor: 'rgba(108, 117, 125, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const label = graficoPlatNUtilizados.data.labels[index];

            if (estadoGrafico === 'plataforma') {
              plataformaSelecionada = label;
              aplicarFiltroTabela(graficoPlatNUtilizados, label, "N. Utilizado", "plataforma");
              estadoGrafico = 'descricao';
            } else {
              aplicarFiltroTabelaCombinado(graficoPlatNUtilizados, label, plataformaSelecionada, "N. Utilizado");
              estadoGrafico = 'plataforma'; // opcional: alterna de volta
            }

            atualizarEscalaY(graficoPlatNUtilizados, estadoGrafico);
          }
        },
        scales: {
          y: {
            type: 'logarithmic',
            beginAtZero: true,
            min: 10, // evita que valores muito pequenos fiquem achatados
            title: {
              display: true,
              text: 'Quantidade'
            },
            ticks: {
              callback: value => Number(value).toLocaleString()
            }
          },
          x: {
            title: {
              display: true,
              text: 'Plataforma'
            }
          }
        }

      }
    });
  }
}

function atualizarEscalaY(grafico, estado) {
  const valores = grafico.data.datasets[0].data;
  const maxValor = Math.max(...valores);

  grafico.options.scales.y.max = estado === 'descricao' ? 1000 : maxValor * 1.1;
  grafico.update();
}
