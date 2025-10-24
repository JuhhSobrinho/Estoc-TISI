export function iniciarConferenciaMaterial(id) {
  if (!id) {
    console.warn("Nenhum ID de formulário recebido.");
    return;
  }

  let dadosFormulario = null; // 🔑 declara aqui, acessível em toda a função
  let destinoEmbarque = null;

  fetch(`/formulario/${id}`)
    .then(res => res.json())
    .then(dados => {
      dadosFormulario = dados; // agora sim, atribui corretamente
      console.log("📄 Dados carregados:", dados);

      // Cabeçalho
      document.getElementById("relNomeRequisicao").textContent = dados.nome_form;
      document.getElementById("relDataRequisicao").textContent = dados.dt_form;
      document.getElementById("relSolicitante").textContent = dados.id_funcionario;
      document.getElementById("relStatus").textContent = dados.aprovado ? "Aprovado" : "Pendente";
      document.getElementById("relDestino").textContent = (dados.embarque.plataforma_origem.nome_plat) + '/' + (dados.embarque.plataforma_destino.nome_plat);

      destinoEmbarque = dados.id_embarque;
      document.getElementById("relObservacoes").textContent = dados.description;

      // Itens
      const tbody = document.getElementById("tabelaRequisicao");
      tbody.innerHTML = "";
      if (dados.item_formulario && Array.isArray(dados.item_formulario)) {
        dados.item_formulario.forEach(item => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
      <td>${item.material_embarque.material.nome_material}</td>
      <td>${item.material_embarque.material.kardex_mat}</td>
      <td>${item.qtd_mat}</td>
      <td>${item.material_embarque.material.data_validade_mat}</td>
    `;

          // pinta conforme status já salvo no banco
          if (item.satus === "Aprovado") {
            tr.classList.add("table-success");
          } else if (item.satus === "Reprovado") {
            tr.classList.add("table-danger");
          } else if (item.satus === "Pendente") {
            tr.classList.add("table-light");
          }

          tbody.appendChild(tr);
        });
      }

    });

  const botao = document.getElementById("btnConfirmarConferencia");
  if (!botao) return;

  botao.addEventListener("click", () => {
    if (!dadosFormulario) {
      console.warn("⚠️ Dados ainda não carregados.");
      return;
    }

    const kardexDigitado = document.getElementById("codigoBarras").value.trim();
    const qtdDigitada = parseInt(document.getElementById("quantidadeConferida").value.trim());
    const resultado = document.getElementById("resultadoConferencia");

    let encontrado = false;
    let conferidoCorretamente = false;

    const linhas = document.querySelectorAll("#tabelaRequisicao tr");
    linhas.forEach((linha, index) => {
      const kardexTabela = linha.cells[1].textContent.trim();
      const qtdTabela = parseInt(linha.cells[2].textContent.trim());

      if (kardexTabela === kardexDigitado) {
        encontrado = true;

        // sempre limpa antes
        linha.classList.remove("table-success", "table-warning", "table-danger", "table-light");

        if (!linha.classList.contains("table-success") && !linha.classList.contains("table-warning")) {
          if (qtdTabela === qtdDigitada) {
            conferidoCorretamente = true;
            linha.classList.add("table-success");

            const item = dadosFormulario.item_formulario[index];
            fetch(`/formulario/item_formulario/${item.id_form_item}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ satus: "Aprovado" })
            })
              .then(res => res.json())
              .then(resp => console.log("✅ Status atualizado:", resp))
              .catch(err => console.error("❌ Erro ao atualizar status:", err));

          } else {
            linha.classList.add("table-warning");
          }
        }
      }

    });

    if (!encontrado) {
      resultado.innerHTML = `<div class="alert alert-danger">❌ Kardex <strong>${kardexDigitado}</strong> não encontrado na requisição.</div>`;
    } else if (conferidoCorretamente) {
      resultado.innerHTML = `<div class="alert alert-success">✅ Material conferido com sucesso!</div>`;
    } else {
      resultado.innerHTML = `<div class="alert alert-warning">⚠️ Quantidade diferente da esperada. Verifique o Kardex <strong>${kardexDigitado}</strong>.</div>`;
    }

    document.getElementById("codigoBarras").value = "";
    document.getElementById("quantidadeConferida").value = "";

    setTimeout(() => {
      resultado.innerHTML = "";
    }, 5000);
  });


  document.getElementById("btnConfirmarForm").addEventListener("click", () => {
    fetch(`/formulario/${dadosFormulario.id_form}/confirmar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destino: destinoEmbarque, // 👈 se existir no formulário
        data_embarque: new Date().toISOString().split("T")[0]
      })
    })
      .then(res => res.json())
      .then(resp => {
        console.log("✅ Requisição confirmada:", resp);
        alert("Requisição confirmada com sucesso!");
      })
      .catch(err => console.error("❌ Erro ao confirmar requisição:", err));
  });


}
