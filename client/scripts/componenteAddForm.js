
export function adicionarMaterial() {
    console.log("testttttttttttttt");

    if (!validarQuantidades()) return;


    const lista = document.getElementById("listaMateriais");
    const novoItem = lista.firstElementChild.cloneNode(true);

    // Limpa os campos do novo item
    novoItem.querySelectorAll("input, select, textarea").forEach(el => el.value = "");

    // Adiciona o listener de kardex → validade
    const materialSelect = novoItem.querySelector("select[name='material[]']");
    const kardexInput = novoItem.querySelector("input[name='kardex[]']");
    const validadeInput = novoItem.querySelector("input[name='validade[]']");

    kardexInput.addEventListener("blur", () => {
        const material = materialSelect.value;
        const kardex = kardexInput.value;

        if (material && kardex) {
            buscarValidade(material, kardex).then(dataValidade => {
                validadeInput.value = dataValidade;
            });
        }
    });

    lista.appendChild(novoItem);

    console.log("teste");
}

export function inicializarFormularioDeRequisicao() {
    const botao = document.getElementById("btnAdicionarMaterial");
    if (botao) {
        botao.addEventListener("click", adicionarMaterial);
    }

    document.getElementById("origem").addEventListener("change", async (e) => {
        const plataformaSelecionada = e.target.value;
        console.log(plataformaSelecionada);


        try {
            const res = await fetch(`/material-embarque/filtrar?plataforma=${encodeURIComponent(plataformaSelecionada)}`);
            const materiais = await res.json();

            atualizarListaDeMateriais(materiais);
        } catch (err) {
            console.error("❌ Erro ao carregar materiais:", err);
        }
    });


    let materiaisMapeados = {}; // chave: nome_material, valor: dados completos

    function atualizarListaDeMateriais(materiais) {
        materiaisMapeados = {}; // limpa antes de popular

        const selects = document.querySelectorAll('select[name="material[]"]');

        selects.forEach(select => {
            select.innerHTML = '<option value="">Selecione</option>';
            materiais.forEach(mat => {
                const nome = mat.material.nome_material;
                materiaisMapeados[nome] = {
                    ...mat.material,
                    quantidadeDisponivel: mat.quantidade
                };


                const option = document.createElement("option");
                option.value = nome;
                option.textContent = nome;
                select.appendChild(option);
            });
        });
    }

    document.addEventListener("change", function (e) {
        if (e.target.matches('select[name="material[]"]')) {
            const nomeSelecionado = e.target.value;
            const dados = materiaisMapeados[nomeSelecionado];
            if (!dados) return;

            const container = e.target.closest('.material-item');
            if (!container) return;

            container.querySelector('input[name="kardex[]"]').value = dados.kardex_mat || '';
            container.querySelector('input[name="validade[]"]').value = dados.data_validade_mat || '';

            const qtdInput = container.querySelector('input[name="quantidade[]"]');
            qtdInput.value = '';
            qtdInput.max = dados.quantidadeDisponivel;
            qtdInput.placeholder = `Máx: ${dados.quantidadeDisponivel}`;
        }
    });


    document.getElementById("btnSalvarRequisicao").addEventListener("click", async function (e) {
        if (!validarQuantidades()) {
            e.preventDefault();
            alert("⚠️ Quantidade inválida em um dos materiais.");
            return;
        }

        // 1. Captura dos dados principais
        const description = document.getElementById("observacoes").value;
        const id_funcionario = 1; // ← você pode puxar isso dinamicamente
        const origem = document.getElementById("origem").value;
        const destino = document.getElementById("destino").value;

        // 2. Buscar embarque correspondente (ex: via fetch ou já ter o ID)
        const id_embarque = await buscarOuCriarEmbarque(origem, destino); // ← você pode implementar isso

        // 3. Captura dos materiais
        const materiais = [];
        document.querySelectorAll(".material-item").forEach(item => {
            const nome = item.querySelector('select[name="material[]"]').value;
            const qtd = parseFloat(item.querySelector('input[name="quantidade[]"]').value);

            const dados = materiaisMapeados[nome];
            if (dados && qtd > 0) {
                materiais.push({
                    id_material: dados.id_mat,
                    qtd_mat: qtd
                });
            }
        });

        // 4. Envio via fetch
        try {
            const res = await fetch("/formulario", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    description,
                    id_funcionario,
                    id_embarque,
                    materiais
                })
            });

            const resultado = await res.json();
            if (res.ok) {
                alert("✅ Requisição salva com sucesso!");
            } else {
                alert("❌ Erro ao salvar: " + resultado.error);
            }
        } catch (err) {
            console.error("❌ Erro no envio:", err);
            alert("❌ Falha ao enviar requisição.");
        }
    });




}


async function buscarOuCriarEmbarque(origem, destino) {
    try {
        console.log(origem,destino);
        
        const resBusca = await fetch(`/embarque/buscar?origem=${encodeURIComponent(origem)}&destino=${encodeURIComponent(destino)}`);
        const embarque = await resBusca.json();

        if (resBusca.ok && embarque && embarque.id_emb) {
            return embarque.id_emb; // embarque já existe
        }

        // 2. Criar novo embarque
        const resNovo = await fetch(`/embarque/criar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ origem, destino })
        });

        const novoEmbarque = await resNovo.json();
        if (resNovo.ok && novoEmbarque.id_emb) {
            return novoEmbarque.id_emb;
        }

        throw new Error("Erro ao criar embarque");
    } catch (err) {
        console.error("❌ Erro ao buscar/criar embarque:", err);
        throw err;
    }
}



function validarQuantidades() {
    const materiais = document.querySelectorAll('.material-item');
    for (const item of materiais) {
        const nome = item.querySelector('select[name="material[]"]').value;
        const qtd = parseFloat(item.querySelector('input[name="quantidade[]"]').value);
        const max = parseFloat(item.querySelector('input[name="quantidade[]"]').max);

        if (qtd > max) {
            alert(`Quantidade de "${nome}" excede o disponível (${max}).`);
            return false;
        }
    }
    return true;
}



document.querySelectorAll(".material-item").forEach(item => {
    const materialSelect = item.querySelector("select[name='material[]']");
    const kardexInput = item.querySelector("input[name='kardex[]']");
    const validadeInput = item.querySelector("input[name='validade[]']");

    kardexInput.addEventListener("blur", () => {
        const material = materialSelect.value;
        const kardex = kardexInput.value;

        if (material && kardex) {
            // Simulação de busca no banco
            buscarValidade(material, kardex).then(dataValidade => {
                validadeInput.value = dataValidade;
            });
        }
    });
});




function buscarValidade(material, kardex) {
    return fetch(`/material-embarque/validade?material=${encodeURIComponent(material)}&kardex=${encodeURIComponent(kardex)}`)
        .then(res => res.json())
        .then(data => data.validade || "")
        .catch(() => "");
}

