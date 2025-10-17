export function iniciarConferenciaMaterial() {
  const botao = document.getElementById("btnConfirmarConferencia");
  if (!botao) return;

  botao.addEventListener("click", () => {
    const kardexDigitado = document.getElementById("codigoBarras").value.trim();
    const qtdDigitada = parseInt(document.getElementById("quantidadeConferida").value.trim());
    const resultado = document.getElementById("resultadoConferencia");

    let encontrado = false;
    let conferidoCorretamente = false;

    const linhas = document.querySelectorAll("#tabelaRequisicao tr");
    linhas.forEach(linha => {
      const kardexTabela = linha.cells[1].textContent.trim();
      const qtdTabela = parseInt(linha.cells[2].textContent.trim());

      if (kardexTabela === kardexDigitado) {
        encontrado = true;

        // Só marca se ainda não foi conferido
        if (!linha.classList.contains("table-success") && !linha.classList.contains("table-warning")) {
          if (qtdTabela === qtdDigitada) {
            conferidoCorretamente = true;
            linha.classList.add("table-success");
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
}
