function parseUSDateToISO(str) {
    // "MM/dd/yyyy" -> "yyyy-MM-dd"
    const [mes, dia, ano] = str.split('/');
    return `${ano}-${mes}-${dia}`;
}

function parseISODateToDateObject(isoDateStr) {
    const [ano, mes, dia] = isoDateStr.split('-');
    return new Date(ano, mes - 1, dia); // mês começa do zero
}

function parseISODateToDateObjectEmb(isoDateStr) {
    const [ano, mes, dia] = isoDateStr.split('-');
    return new Date(ano, dia - 1, mes); // mês começa do zero
}

function parseBRDateToISO(str) {
    // "dd/MM/yyyy" -> "yyyy-MM-dd"
    const [dia, mes, ano] = str.split('/');
    return `${ano}-${mes}-${dia}`;
}

function parseISODateLocal(isoDateStr) {
    if (!isoDateStr || typeof isoDateStr !== 'string') return null;

    const [ano, mes, dia] = isoDateStr.split('-');
    return new Date(ano, mes - 1, dia);
}



function coletarDadosTabela() {
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
        const validadeStr = colunas[6]?.textContent.trim();
        const validade = validadeStr ? parseBRDateToISO(validadeStr) : null;

        const rtEmbarque = colunas[9]?.textContent.trim();     // Embarque RT
        const dtEmbarqueStr = colunas[10]?.textContent.trim();     // Embarque RT
        const dtEmbarque = dtEmbarqueStr ? parseUSDateToISO(dtEmbarqueStr) : null;     // Embarque RT
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
    return dados;
}







function aplicarFiltrosEGrafico() {
    const dados = coletarDadosTabela();
    // Certifique-se de que os dados compartilhados estão disponíveis
    if (!dados || dados.length === 0) {
        console.warn("Nenhum dado disponível para aplicar filtros.");
        return;
    }

    // Coleta os valores dos filtros
    const busca = document.getElementById('busca').value.toLowerCase();
    const buscaKd = document.getElementById('buscaKd').value.toLowerCase();
    const status = document.getElementById('status').value;
    const vencidosStr = document.getElementById('vencidos').checked;
    const vencidos = vencidosStr ? new Date(vencidosStr) : null;
    const tipos = document.getElementById('tipo').value;
    const rtBusca = document.getElementById('buscaRT')?.value.toLowerCase() || '';
    const cliente = document.getElementById('cliente')?.value || '';
    const base = document.getElementById('base')?.checked || false;
    const unidade = document.getElementById('Unidade')?.value || '';
    const buscaDtEmbStr = document.getElementById('buscaDtEmb')?.value;
    const buscaDtEmb = buscaDtEmbStr
        ? new Date(buscaDtEmbStr + 'T00:00:00') // força horário local
        : null;

    const hoje = new Date();

    // Filtra os dados compartilhados com base nos critérios
    const filtrados = dados.filter(d => {
        const nomeMatch = d.descricao.toLowerCase().includes(busca);
        const kardexMatch = d.kardex.toLowerCase().includes(buscaKd);
        const statusMatch = status ? d.status === status : true;
        const tipoMatch = tipos ? d.tipo === tipos : true;
        const vencidoMatch = vencidos
            ? d.validade && parseISODateToDateObject(d.validade) < hoje
            : true;
        const rtMatch = rtBusca ? d.rtEmbarque?.toLowerCase().includes(rtBusca) : true;
        const clienteMatch = cliente && cliente !== 'Todos' ? d.cliente === cliente : true;
        const baseMatch = base ? d.platDestino === 'BASE' : true;
        const unidadeMatch = unidade && unidade !== 'Todas' ? d.platDestino === unidade : true;

        // Função auxiliar para comparar datas
        function isSameDay(date1, date2) {
            return (
                date1.getFullYear() === date2.getFullYear() &&
                date1.getMonth() === date2.getMonth() &&
                date1.getDate() === date2.getDate()
            );
        }

        const embarqueMatch = buscaDtEmb instanceof Date && !isNaN(buscaDtEmb)
            ? d.dtEmbarque && isSameDay(parseISODateToDateObjectEmb(d.dtEmbarque), buscaDtEmb)
            : true;

        return nomeMatch && kardexMatch && statusMatch && tipoMatch && vencidoMatch &&
            rtMatch && clienteMatch && baseMatch && unidadeMatch && embarqueMatch;
    });

    // Atualiza a tabela visualmente
    const linhas = document.querySelectorAll('table tbody tr');
    linhas.forEach(linha => {
        const descricaoLinha = linha.querySelectorAll('td')[1]?.textContent.trim().toLowerCase();
        const mostrar = filtrados.some(d => d.descricao.toLowerCase() === descricaoLinha);
        linha.style.display = mostrar ? '' : 'none';
    });

    // Atualiza o gráfico
    const canvas = document.getElementById('meuGrafico');
    const grafico = Chart.getChart(canvas);
    if (grafico) {
        grafico.data.labels = filtrados.map(d => d.descricao);
        grafico.data.datasets[0].data = filtrados.map(d => d.quantidade);
        grafico.update();
    }
}





export function montarGrafico(dados) {
    fetch('/plataformas')
        .then(res => res.json())
        .then(plataformas => {
            const selectUnidade = document.getElementById('Unidade');
            const selectCliente = document.getElementById('cliente');

            // Limpa opções antigas
            selectCliente.innerHTML = '';

            // Adiciona a opção "Todos"
            const opcaoTodosCliente = document.createElement('option');
            opcaoTodosCliente.value = '';
            opcaoTodosCliente.textContent = 'Todos';
            selectCliente.appendChild(opcaoTodosCliente);

            // Extrai clientes únicos
            const clientesUnicos = [...new Set(plataformas.map(p => p.cliente_plat))];

            // Adiciona opções de cliente
            clientesUnicos.forEach(cliente => {
                const opcao = document.createElement('option');
                opcao.value = cliente;
                opcao.textContent = cliente;
                selectCliente.appendChild(opcao);
            });

            // Limpa opções antigas
            selectUnidade.innerHTML = '';

            // Adiciona a opção "Todas"
            const opcaoTodas = document.createElement('option');
            opcaoTodas.value = '';
            opcaoTodas.textContent = 'Todas';
            selectUnidade.appendChild(opcaoTodas);

            // Adiciona opções vindas do banco
            plataformas.forEach(p => {
                const opcao = document.createElement('option');
                opcao.value = p.nome_plat;
                opcao.textContent = p.nome_plat;
                selectUnidade.appendChild(opcao);
            });


            const lista = document.createElement('ul');
            plataformas.forEach(p => {
                const item = document.createElement('li');
                item.textContent = `${p.nome_plat} - ${p.cliente_plat}`;
                lista.appendChild(item);
            });
            document.body.appendChild(lista);
        })
        .catch(err => console.error('Erro ao buscar plataformas:', err));

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
                row.innerHTML = `
                    <th scope="row">${index + 1}</th>
                    <td>${mat.qtd_mat}</td>
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
                `;
                tbody.appendChild(row);
            });

            // ✅ Só monta o gráfico depois que a tabela estiver pronta
            montarGraficoComDados();
        })
        .catch(err => {
            console.error('Erro ao carregar tabela:', err);
        });

    document.getElementById('btnAplicarFiltros')
        .addEventListener('click', aplicarFiltrosEGrafico);


}

function montarGraficoComDados() {
    const ctx = document.getElementById('meuGrafico');
    if (!ctx) return;

    const dados = coletarDadosTabela();
    const labels = dados.map(d => d.descricao);
    const valores = dados.map(d => d.quantidade);

    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Material/Estoque',
                data: valores,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'logarithmic',
                    beginAtZero: true,
                    min: 1, // evita que valores muito pequenos fiquem achatados
                    max: 1000, // ajusta o topo para não exagerar
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
