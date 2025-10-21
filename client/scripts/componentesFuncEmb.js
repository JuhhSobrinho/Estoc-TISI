function parseUSDateToISO(str) {
    // "MM/dd/yyyy" -> "yyyy-MM-dd"
    const [ano, mes, dia] = str.split('-');
    return `${dia}/${mes}/${ano}`;
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


let dadosGlobais = [];  // Variável para armazenar os dados coletados


export function geral() {

    montarGraficoUser();


    function montarGraficoUser() {
        fetch('/plataformas')
            .then(res => res.json())
            .then(plataformas => {
                const selectUnidade = document.getElementById('Unidade');
                const selectUnidadeEmbTec = document.getElementById('UnidadeEmbTecnico');

                // Limpa opções antigas
                selectUnidade.innerHTML = '';
                selectUnidadeEmbTec.innerHTML = '';

                // Adiciona a opção "Todas"
                const opcaoTodas = document.createElement('option');
                opcaoTodas.value = '';
                opcaoTodas.textContent = 'Todas';
                selectUnidade.appendChild(opcaoTodas);
                selectUnidadeEmbTec.appendChild(opcaoTodas.cloneNode(true));

                // Adiciona opções vindas do banco
                plataformas.forEach(p => {
                    const opcao = document.createElement('option');
                    opcao.value = p.nome_plat;
                    opcao.textContent = p.nome_plat;
                    selectUnidade.appendChild(opcao);
                    selectUnidadeEmbTec.appendChild(opcao.cloneNode(true));
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

        fetch('/funcionario-embarque')
            .then(res => res.json())
            .then(dados => {
                const tbody = document.querySelector('.tabela-wrapper tbody');
                if (!tbody) return;

                tbody.innerHTML = '';  // Limpa a tabela

                dados.forEach((item, index) => {
                    const funcionario = item.funcionario;
                    const embarque = item.embarque;
                    const origem = embarque?.plataforma_origem;
                    const destino = embarque?.plataforma_destino;

                    const dtEmbarque = item.dt_embarque
                        ? parseISODateLocal(item.dt_embarque).toLocaleDateString()
                        : '—';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                <th scope="row" data-id="${item.id_func_emb}">${index + 1}</th>
                <td>${funcionario?.nome_func || '—'}</td>
                <td>${funcionario?.status_func || '—'}</td>
                <td>${funcionario?.contato_func || '—'}</td>
                <td>${dtEmbarque}</td>
                <td>${origem?.nome_plat || '—'}</td>
                <td>${destino?.nome_plat || '—'}</td>
                <td>${item.description || '—'}</td>
            `;
                    tbody.appendChild(row);
                });

                // Espera o DOM renderizar corretamente
                requestAnimationFrame(() => {
                    console.log('DOM renderizado, chamando coletarDadosTabela() e montando gráfico');
                    coletarDadosTabela();  // Coleta dados
                    montarGraficoComDados();  // Cria o gráfico inicial
                    selecionarLinhaTabela();  // 👈 ATIVA CLIQUES NA TABELA INICIAL
                });

            })
            .catch(err => {
                console.error('Erro ao carregar funcionário embarque:', err);
            });


        document.getElementById('btnAplicarFiltros')
            .addEventListener('click', aplicarFiltrosEGrafico);

        document.getElementById('btnCadastroGeral')
            .addEventListener('click', salvarTudo);
    }




















    function coletarDadosTabela() {
        const linhas = document.querySelectorAll('.card-grafico-filtro .tabela-wrapper table tbody tr');
        console.log('Número de linhas encontradas:', linhas.length);
        const dados = [];

        linhas.forEach(linha => {
            const colunas = linha.querySelectorAll('td');
            console.log('Colunas na linha:', colunas.length);
            console.log('Conteúdo das colunas:', Array.from(colunas).map(td => td.textContent.trim()));

            const tecnico = colunas[0]?.textContent.trim();
            const status = colunas[1]?.textContent.trim();
            const contato = colunas[2]?.textContent.trim();
            const dtEmbarqueStr = colunas[3]?.textContent.trim();
            const platOrigen = colunas[4]?.textContent.trim();
            const platDestino = colunas[5]?.textContent.trim();
            const descricao = colunas[6]?.textContent.trim();

            let dtEmbarque = null;
            if (dtEmbarqueStr) {
                const isoDateStr = parseBRDateToISO(dtEmbarqueStr);
                const dtObj = new Date(isoDateStr);
                if (dtObj instanceof Date && !isNaN(dtObj)) {
                    dtEmbarque = dtObj.toISOString().split('T')[0];
                }
            }

            console.log('Dados extraídos:', { tecnico, dtEmbarque });

            if (tecnico && dtEmbarque) {
                dados.push({
                    tecnico,
                    status,
                    contato,
                    dtEmbarque,
                    platOrigen,
                    platDestino,
                    descricao
                });
            }
        });
        dadosGlobais = dados;  // Atualiza a variável global
        console.log(dados, 'dados finais');
        return dados;  // Continua retornando, se necessário
    }






















    function aplicarFiltrosEGrafico() {
        if (!dadosGlobais || dadosGlobais.length === 0) {
            console.warn("Nenhum dado disponível para aplicar filtros.");
            return;
        }

        let dadosFiltradosPorTempoReal = dadosGlobais;



        const busca = document.getElementById('busca').value.toLowerCase();  // Busca no nome do técnico
        const status = document.getElementById('status').value.toLowerCase();  // Status com case-insensitive
        const base = document.getElementById('base')?.checked || false;
        const tempoReal = document.getElementById('tempoReal')?.checked || false;
        const unidade = document.getElementById('Unidade')?.value || '';
        const buscaDtEmbStr = document.getElementById('buscaDtEmb')?.value;  // String no formato "YYYY-MM-DD"

        console.log('Valores dos filtros:', { busca, status, base, tempoReal, unidade, buscaDtEmbStr });

        if (tempoReal) {
            const mapaMaisRecente = new Map();

            dadosGlobais.forEach(d => {
                const tecnico = d.tecnico;
                const dataAtual = new Date(d.dtEmbarque);

                if (!mapaMaisRecente.has(tecnico)) {
                    mapaMaisRecente.set(tecnico, d);
                } else {
                    const dataExistente = new Date(mapaMaisRecente.get(tecnico).dtEmbarque);
                    if (dataAtual > dataExistente) {
                        mapaMaisRecente.set(tecnico, d);
                    }
                }
            });

            dadosFiltradosPorTempoReal = Array.from(mapaMaisRecente.values());
        }
        const filtrados = dadosFiltradosPorTempoReal.filter(d => {

            const nomeMatch = busca ? d.tecnico.toLowerCase().includes(busca) : true;
            console.log('Verificando se "' + d.tecnico.toLowerCase() + '" inclui "' + busca + '":', nomeMatch);

            const statusMatch = status ? d.status.toLowerCase() === status : true;
            console.log('Verificando status: "' + d.status.toLowerCase() + '" === "' + status + '":', statusMatch);

            const baseMatch = base ? d.platDestino === 'BASE' : true;
            const unidadeMatch = unidade && unidade !== 'Todas' ? d.platDestino === unidade : true;

            let embarqueMatch = true;
            if (buscaDtEmbStr) {
                const [anoBusca, mesBusca] = buscaDtEmbStr.split('-');  // Extrai ano e mês da string "YYYY-MM-DD"
                const [anoItem, mesItem] = d.dtEmbarque.split('-');  // Extrai ano e mês de d.dtEmbarque
                embarqueMatch = (anoItem === anoBusca) && (mesItem === mesBusca);  // Compara strings diretamente
                console.log('Verificando data: Ano/Mês de busca (' + anoBusca + '-' + mesBusca + ') vs Item (' + anoItem + '-' + mesItem + '):', embarqueMatch);
            }

            const result = nomeMatch && statusMatch && baseMatch && unidadeMatch && embarqueMatch;
            console.log('Resultado final para o item:', result);
            return result;
        });

        console.log('Dados filtrados finais:', filtrados);

        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = ''; // Limpa todas as linhas da tabela

        filtrados.forEach((d, index) => {
            const linha = document.createElement('tr');

            // Coluna: Número da linha
            const thLine = document.createElement('th');
            thLine.scope = 'row';
            thLine.textContent = index + 1;
            linha.appendChild(thLine);

            const tdTecnico = document.createElement('td');
            tdTecnico.textContent = d.tecnico;
            linha.appendChild(tdTecnico);

            const tdStatus = document.createElement('td');
            tdStatus.textContent = d.status;
            linha.appendChild(tdStatus);

            const tdContato = document.createElement('td');
            tdContato.textContent = d.contato || '-';
            linha.appendChild(tdContato);

            const tdDtEmbarque = document.createElement('td');
            tdDtEmbarque.textContent = parseUSDateToISO(d.dtEmbarque);
            linha.appendChild(tdDtEmbarque);

            const tdOrigem = document.createElement('td');
            tdOrigem.textContent = d.platOrigen || '-';
            linha.appendChild(tdOrigem);

            const tdDestino = document.createElement('td');
            tdDestino.textContent = d.platDestino || '-';
            linha.appendChild(tdDestino);

            const description = document.createElement('td');
            description.textContent = d.descricao || '-';
            linha.appendChild(description);

            tbody.appendChild(linha);
        });
        selecionarLinhaTabela();



        const canvas = document.getElementById('meuGrafico');
        const grafico = Chart.getChart(canvas);  // Pega o gráfico existente
        if (grafico) {
            grafico.data.labels = filtrados.map(d => d.tecnico);  // Usa o nome do técnico como label
            grafico.data.datasets[0].data = filtrados.map(d => 1);  // Ou use um contador, como o número de itens
            grafico.update();  // Atualiza o gráfico
        } else {
            console.warn('Gráfico não encontrado; crie-o primeiro.');
            montarGraficoComDados();  // Cria se não existir
        }
    }




    function selecionarLinhaTabela() {
        const linhas = document.querySelectorAll("table tbody tr");

        linhas.forEach(function (row) {
            row.addEventListener("click", function () {
                const th = row.querySelector("th[scope='row']");
                const idFuncEmb = th?.getAttribute("data-id"); // 👈 pega o id único

                const colunas = row.querySelectorAll("td");

                const tecnico = colunas[0]?.textContent.trim();
                const status = colunas[1]?.textContent.trim();
                const contato = colunas[2]?.textContent.trim();
                const dtEmbarqueStr = colunas[3]?.textContent.trim();
                const platDestino = colunas[5]?.textContent.trim();
                const descricao = colunas[6]?.textContent.trim();

                // Preenche os inputs
                document.getElementById("nomeFuncionario").value = tecnico;
                document.getElementById("statusFuncionario").value = status;
                document.getElementById("contato").value = contato;
                document.getElementById("dtEmbTecnico").value = parseBRDateToISO(dtEmbarqueStr);
                document.getElementById("UnidadeEmbTecnico").value = platDestino;
                document.getElementById("observacoes").value = descricao;

                // 👇 guarda o id único em um campo hidden
                document.getElementById("idFuncEmb").value = idFuncEmb;
            });
        });
    }







    document.getElementById("btnDelete").addEventListener("click", async () => {
        const idFuncEmb = document.getElementById("idFuncEmb").value;

        if (!idFuncEmb) {
            alert("Selecione uma linha antes de deletar.");
            return;
        }

        try {
            const res = await fetch("/funcionario-embarque/deletar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_func_emb: idFuncEmb })
            });

            if (!res.ok) throw new Error("Erro ao deletar embarque");

            alert("✅ Embarque deletado com sucesso!");
            console.log("🗑️ Embarque deletado:", idFuncEmb);
        } catch (err) {
            console.error("❌ Erro ao deletar embarque:", err);
            alert("Erro ao deletar embarque.");
        }
    });












    async function salvarTudo() {
        const nome = document.getElementById("nomeFuncionario").value.trim();
        const status = document.getElementById("statusFuncionario").value.trim();
        const contato = document.getElementById("contato").value.trim();
        const dtEmbarque = document.getElementById("dtEmbTecnico").value.trim(); // ISO format
        const destino = document.getElementById("UnidadeEmbTecnico").value.trim();
        const descricao = document.getElementById("observacoes").value.trim();

        if (!nome || !status || !contato || !dtEmbarque || !destino) {
            alert("Preencha todos os campos antes de salvar.");
            return;
        }

        const funcionarioPayload = {
            nome_func: nome,
            status_func: status,
            contato_func: contato
        };

        try {
            // 1. Verifica se o funcionário já existe
            const verificarRes = await fetch(`/funcionario/verificar?nome=${encodeURIComponent(nome)}`);
            const funcionarioExiste = verificarRes.ok ? await verificarRes.json() : null;

            let idFuncionario;

            // 2. Se não existe, cria o funcionário
            if (!funcionarioExiste || !funcionarioExiste.id_func) {
                const resFunc = await fetch("/funcionario", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(funcionarioPayload)
                });

                if (!resFunc.ok) throw new Error("Erro ao salvar funcionário");

                const novoFuncionario = await resFunc.json();
                idFuncionario = novoFuncionario.funcionario.id_func;

                console.log("✅ Funcionário criado com sucesso!");
            } else {
                idFuncionario = funcionarioExiste.id_func;
                // 2b. Atualiza dados do funcionário existente
                const atualizarRes = await fetch(`/funcionario/${idFuncionario}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(funcionarioPayload)
                });

                if (!atualizarRes.ok) throw new Error("Erro ao atualizar funcionário");

                console.log("🔄 Funcionário atualizado com sucesso!");

                console.log("ℹ️ Funcionário já existe, ID:", idFuncionario);
            }

            // 3. Cria o embarque
            const embarquePayload = {
                id_funcionario: idFuncionario,
                plataforma_origem: "BASE",
                plataforma_destino: destino,
                dt_embarque: dtEmbarque,
                description: descricao
            };

            console.log("📦 Payload enviado para funcionario-embarque:", embarquePayload);

            const resEmb = await fetch("/funcionario-embarque", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(embarquePayload)
            });

            if (!resEmb.ok) throw new Error("Erro ao salvar embarque");

            console.log("✅ Embarque salvo com sucesso!");
            alert("✅ Funcionário e embarque salvos com sucesso!");

        } catch (err) {
            console.error("❌ Erro ao salvar:", err);
            alert("Erro ao salvar dados.");
        }
    }











    function montarGraficoComDados() {
        const ctx = document.getElementById('meuGrafico');
        if (!ctx) return console.error('Elemento do gráfico não encontrado.');

        const dados = dadosGlobais;  // Usa os dados globais iniciais
        console.log(dados, 'Dados para o gráfico');

        const contagemPorTecnico = {};
        dados.forEach(d => {
            contagemPorTecnico[d.tecnico] = (contagemPorTecnico[d.tecnico] || 0) + 1;
        });

        const labels = Object.keys(contagemPorTecnico);
        const valores = Object.values(contagemPorTecnico);





        new Chart(ctx.getContext('2d'), {
            type: 'bar',  // Mantém como bar, ou mude se quiser
            data: {
                labels: labels,  // Ex.: ['Jorge Noel', 'Bruno', ...]
                datasets: [{
                    label: 'Número de Técnicos',  // Mude para algo que faça sentido
                    data: valores,  // Ex.: [1, 1, ...] para cada item
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
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade'
                        },
                        ticks: {
                            stepSize: 1, // 👈 força o eixo Y a pular de 1 em 1
                            callback: function (value) {
                                return Number.isInteger(value) ? value : null;
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Técnicos'
                        }
                    }
                }
            }
        });
    }




}
