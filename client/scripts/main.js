import { montarTabGrafico, listarGraficos, coletarDadosTabela } from "./componentesGrafico.js";
import { montarGrafico } from "./componentesTab.js";
import { montarTab } from "./componenteCadastro.js";
import { inicializarFormularioDeRequisicao } from "./componenteAddForm.js";
import { iniciarConferenciaMaterial } from "./componenteFormVer.js";
import { geral } from "./componentesFuncEmb.js";




async function carregarMenuFormularios() {
  const res = await fetch('/formulario/nomes');
  const formularios = await res.json();

  const menu = document.querySelector('#sidebar ul.nav');

  // Separador visual
  const hr = document.createElement('hr');
  menu.appendChild(hr);

  formularios.forEach(form => {
    const li = document.createElement('li');
    li.className = 'nav-item mb-2';

    const link = document.createElement('a');
    link.className = 'nav-link text-white';
    link.href = `./formVer.html?id=${form.id_form}`;
    link.innerHTML = `
      <i class="bi bi-input-cursor"></i>
      <span class="text-label">${form.nome_form}</span>
    `;

    li.appendChild(link);
    menu.appendChild(li);
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
  fetch(pagina)
    .then(res => res.text())
    .then(html => {
      document.getElementById('conteudo').innerHTML = html;

      // Chama o gráfico da aba Tab
      if (pagina === './tab.html') {
        coletarDadosGlobais(); // garante que os dados estejam atualizados
        montarGrafico(dadosCompartilhados); // ✅ passa os dados
      }


      // Chama os gráficos da aba Grafico
      else if (pagina === './grafico.html') {
        console.log("grafico");

        montarTabGrafico()
          .then(() => {
            // Coleta os dados globais após montar a tabela
            coletarDadosGlobais();

            // Passa os dados globais para listarGraficos
            listarGraficos(dadosCompartilhados);
          })
          .catch(err => {
            console.error("Erro ao carregar gráficos:", err);
          });
      }

      else if (pagina === './tab-user.html') {
        geral(); // chama tudo de uma vez, na ordem certa
      }





      // Chama os editar da aba Cadastro
      else if (pagina === './cadastro.html') {
        console.log("Cadastro");
        montarTab();
      }

      else if (pagina === './form.html') {
        console.log("form");
        inicializarFormularioDeRequisicao();
      }

      else if (pagina === './formVer.html') {
        console.log("formVer");
        iniciarConferenciaMaterial();
      }
    });
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
  sidebar.classList.toggle('collapsed');

  // Aguarda a transição e força redimensionamento dos gráficos
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 350);
}


document.addEventListener('DOMContentLoaded', () => {
  // Links do menu com atributo data-pagina
  document.querySelectorAll('[data-pagina]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const pagina = link.getAttribute('data-pagina');
      carregarConteudo(pagina);
    });
  });

  // Botão de toggle do sidebar
  const btn = document.querySelector('#btnToggleSidebar');
  if (btn) {
    btn.addEventListener('click', toggleSidebar);
  }
});
