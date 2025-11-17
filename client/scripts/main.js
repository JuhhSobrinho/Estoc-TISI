import { montarTabGrafico, listarGraficos, coletarDadosTabela } from "./componentesGrafico.js";
import { montarGrafico } from "./componentesTab.js";
import { montarTab } from "./componenteCadastro.js";
import { inicializarFormularioDeRequisicao } from "./componenteAddForm.js";
import { iniciarConferenciaMaterial } from "./componenteFormVer.js";
import { geral } from "./componentesFuncEmb.js";


let idFormSelecionado = null;


async function carregarMenuFormularios() {
  const res = await fetch('/formulario/nomes');
  const formularios = await res.json();

  const menu = document.querySelector('#sidebar ul.nav');


  formularios.forEach(form => {
    const li = document.createElement('li');
    li.className = 'nav-item mb-2';

    const link = document.createElement('a');
    link.className = 'nav-link text-white';
    link.dataset.pagina = `./formVer.html?id=${form.id_form}`;
    link.href = "#";
    link.innerHTML = `
    <i class="bi bi-input-cursor"></i>
    <span class="text-label">${form.nome_form}</span>
  `;

    li.appendChild(link);
    menu.appendChild(li);

    // 🔑 adiciona o listener aqui também
    link.addEventListener('click', e => {
      e.preventDefault();
      const pagina = link.getAttribute('data-pagina');
      carregarConteudo(pagina);
    });
  });

}

carregarMenuFormularios();

let dadosCompartilhados = []; // Constante global para armazenar os dados

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

function coletarDadosGlobais() {
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

    const rtEmbarque = colunas[9]?.textContent.trim();
    const dtEmbarqueStr = colunas[10]?.textContent.trim();
    const dtEmbarque = dtEmbarqueStr ? parseUSDateToISO(dtEmbarqueStr) : null;
    const cliente = colunas[13]?.textContent.trim();

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

  dadosCompartilhados = dados; // Atualiza a constante global
  console.log("Dados coletados:", dadosCompartilhados);
}







function carregarConteudo(pagina) {
  const url = new URL(pagina, window.location.origin);
  const id = url.searchParams.get("id");

  fetch(pagina) // ← aqui é a diferença!
    .then(res => res.text())
    .then(html => {
      document.getElementById('conteudo').innerHTML = html;

      setTimeout(() => {
        if (pagina.includes('tab.html')) {
          coletarDadosGlobais();
          montarGrafico(dadosCompartilhados);
        }
        else if (pagina.includes('grafico.html')) {
          montarTabGrafico()
            .then(() => {
              coletarDadosGlobais();
              listarGraficos(dadosCompartilhados);
            });
        }
        else if (pagina.includes('tab-user.html')) {
          geral();
        }
        else if (pagina.includes('cadastro.html')) {
          montarTab();
        }
        else if (pagina.includes('form.html')) {
          inicializarFormularioDeRequisicao();
        }
        else if (pagina.includes('formVer.html')) {
          const id = new URL(pagina, window.location.origin).searchParams.get("id");
          iniciarConferenciaMaterial(id);
        }


      }, 100);
    })
    .catch(err => console.error("❌ Erro ao carregar conteúdo:", err));
}



window.limparFiltroGrafico = function () {
  carregarConteudo('./grafico.html');
};

window.limparFiltroTabela = function () {
  carregarConteudo('./tab.html');
};

window.limparFiltroCadastro = function () {
  carregarConteudo('./cadastro.html');
};

window.limparfiltroTabelaUser = function () {
  carregarConteudo('./tab-user.html');
};


function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('show');
  sidebar.classList.toggle('collapsed');

  // Aguarda a transição e força redimensionamento dos gráficos
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 350);
}


document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-pagina]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const pagina = link.getAttribute('data-pagina');
      carregarConteudo(pagina); // passa a URL completa (com ?id=...)
    });
  });

  const btn = document.querySelector('#btnToggleSidebar');
  if (btn) {
    btn.addEventListener('click', toggleSidebar);
  }
});


const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const btnOpen = document.getElementById("btnOpenSidebar");
const btnToggle = document.getElementById("btnToggleSidebar");

btnOpen.addEventListener("click", () => {
  sidebar.classList.add("show");
  overlay.classList.add("show");
});

btnToggle.addEventListener("click", () => {
  sidebar.classList.remove("show");
  overlay.classList.remove("show");
});

overlay.addEventListener("click", () => {
  sidebar.classList.remove("show");
  overlay.classList.remove("show");
});

