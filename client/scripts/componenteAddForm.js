
export function adicionarMaterial() {

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











async function buscarIdPlataforma(nome) {
    const res = await fetch(`/plataformas/buscar?nome=${encodeURIComponent(nome)}`);
    const plataforma = await res.json();
    return plataforma.id_plat; // ← ajuste conforme o nome do campo
}












export async function inicializarFormularioDeRequisicao() {


    fetch('/plataformas')
        .then(res => res.json())
        .then(plataformas => {
            const selectOrigem = document.getElementById('origem');
            const selectDestino = document.getElementById('destino');

            // Limpa opções antigas
            selectOrigem.innerHTML = '<option value="">Selecione</option>';
            selectDestino.innerHTML = '<option value="">Selecione</option>';

            // Adiciona opções vindas do banco
            plataformas.forEach(p => {
                const opcaoOrigem = document.createElement('option');
                opcaoOrigem.value = p.nome_plat;
                opcaoOrigem.textContent = p.nome_plat;
                selectOrigem.appendChild(opcaoOrigem);

                const opcaoDestino = document.createElement('option');
                opcaoDestino.value = p.nome_plat;
                opcaoDestino.textContent = p.nome_plat;
                selectDestino.appendChild(opcaoDestino);
            });
        })
        .catch(err => console.error('❌ Erro ao carregar plataformas:', err));

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

        // 🔎 Ordena alfabeticamente pelo nome do material
        materiais.sort((a, b) =>
            a.material.nome_material.localeCompare(b.material.nome_material)
        );

        const selects = document.querySelectorAll('select[name="material[]"]');

        selects.forEach(select => {
            select.innerHTML = '<option value="">Selecione</option>';
            materiais.forEach(mat => {
                const nome = mat.material.nome_material;
                const kardex = mat.material.kardex_mat;
                const chave = mat.id_mat_emb; // 👈 usar id_mat_emb como chave única

                materiaisMapeados[chave] = {
                    ...mat.material,
                    quantidadeDisponivel: mat.quantidade,
                    id_mat_emb: mat.id_mat_emb
                };

                const option = document.createElement("option");
                option.value = chave;
                option.textContent = `${nome} (Qtd: ${mat.quantidade}) (Kdx: ${kardex})`;
                select.appendChild(option);
            });
        });
    }



    document.addEventListener("change", function (e) {
        if (e.target.matches('select[name="material[]"]')) {
            const chaveSelecionada = e.target.value; // agora é id_mat_emb
            const dados = materiaisMapeados[chaveSelecionada];
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
        const nomeReq = document.getElementById("nomeRequisicao").value.trim();
        const description = document.getElementById("observacoes").value;
        const id_funcionario = document.getElementById("solicitante").value;
        const origem = document.getElementById("origem").value;
        const destino = document.getElementById("destino").value;

        // 2. Buscar embarque correspondente (ex: via fetch ou já ter o ID)

        const idOrigem = await buscarIdPlataforma(origem);
        const idDestino = await buscarIdPlataforma(destino);

        console.log("IDs das plataformas:", idOrigem, idDestino);


        const id_embarque = await buscarOuCriarEmbarque(idOrigem, idDestino); // ← você pode implementar isso


        console.log("catatatu", id_embarque);

        // 3. Captura dos materiais
        const materiais = [];
        document.querySelectorAll(".material-item").forEach(item => {
            const chaveSelecionada = item.querySelector('select[name="material[]"]').value;
            const qtd = parseFloat(item.querySelector('input[name="quantidade[]"]').value);

            const dados = materiaisMapeados[chaveSelecionada];
            if (dados && qtd > 0) {
                materiais.push({
                    id_mat_emb: dados.id_mat_emb,
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
                    nomeReq,
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
        console.log(origem, destino);

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

