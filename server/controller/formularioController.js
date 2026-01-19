const supabase = require('../config/config');

exports.criarFormulario = async (req, res) => {
  const {
    nomeReq,
    description,
    id_funcionario,
    id_embarque,
    materiais // array de objetos: [{ id_material, qtd_mat }]
  } = req.body;

  //console.log("embarques", id_embarque);
  //console.log("mat", materiais);



  if (!description || !id_funcionario || !id_embarque || !materiais || materiais.length === 0) {
    return res.status(400).json({ error: 'Dados obrigatórios ausentes.' });
  }

  // Calcular total de materiais
  const qtdTotal = materiais.reduce((acc, mat) => acc + Number(mat.qtd_mat), 0);

  // Criar formulário
  const { data: formData, error: formError } = await supabase
    .from('formulario')
    .insert([{
      nome_form: nomeReq,
      qtd_mat: qtdTotal,
      description,
      id_funcionario,
      id_embarque
    }])
    .select('id_form')
    .single();

  if (formError || !formData) {
    console.error("❌ Erro ao criar formulário:", formError);
    return res.status(500).json({ error: 'Erro ao criar formulário' });
  }

  const idFormulario = formData.id_form;

  // Criar itens do formulário
  const itens = materiais.map(mat => ({
    qtd_mat: mat.qtd_mat,
    satus: 'Pendente',
    id_mat_embarque: mat.id_mat_emb,
    id_formulario: idFormulario
  }));

  const { error: itensError } = await supabase
    .from('item_formulario')
    .insert(itens);

  if (itensError) {
    console.error("❌ Erro ao criar itens:", itensError);
    return res.status(500).json({ error: 'Erro ao salvar itens do formulário' });
  }

  res.status(201).json({ message: 'Formulário e itens cadastrados com sucesso!' });
};








exports.getFormulario = async (req, res) => {
  const { data, error } = await supabase
    .from('formulario')
    .select(`
      id_form,
      description,
      aprovado,
      qtd_mat,
      dt_form,
      funcionario (
        id_func,
        nome_func
      ),
      embarque: id_embarque (
        plataforma_origem:plataforma_origem_id_emb (
          nome_plat
        ),
        plataforma_destino:plataforma_destino_id_emb (
          nome_plat
        )
      )
    `);

  if (error) {
    console.error('❌ Erro ao buscar dados do Supabase:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados' });
  }

  res.json(data);
};





// ✅ Mantém e corrige campo
exports.getFormularioNomes = async (req, res) => {
  const { data, error } = await supabase
    .from('formulario')
    .select('id_form, description, nome_form');

  if (error) {
    console.error('❌ Erro ao buscar nomes:', error);
    return res.status(500).json({ error: 'Erro ao buscar nomes' });
  }

  res.json(data);
};


exports.getFormularioId = async (req, res) => {
  const { id } = req.params;

  //console.log("dadosID", id);

  const { data, error } = await supabase
    .from('formulario')
    .select(`
    id_form,
    nome_form,
    description,
    aprovado,
    id_funcionario,
    id_embarque,
    embarque: id_embarque (
      plataforma_origem:plataforma_origem_id_emb (
        nome_plat,
        cliente_plat
      ),
      plataforma_destino:plataforma_destino_id_emb (
        nome_plat
      )
    ),
    dt_form,
    item_formulario (
      id_form_item,
      qtd_mat,
      satus,
      material_embarque: id_mat_embarque (
        id_mat_emb,
        data_mat_emb,
        material: id_material (
          id_mat,
          kardex_mat,
          nome_material,
          data_validade_mat
        )
      )
    )
  `)
    .eq('id_form', id)
    .single();


  // 🔑 Aqui estava o erro: a variável é "data", não "dados"
  //console.log("dados", data);

  if (error) {
    console.error("Erro Supabase:", error);
    return res.status(400).json({ error });
  }

  if (!data) {
    console.warn("Nenhum formulário encontrado com esse ID:", id);
    return res.status(404).json({ error: "Formulário não encontrado" });
  }

  res.json(data);
};



// PATCH /item_formulario/:id
exports.atualizarStatusItem = async (req, res) => {
  const { id } = req.params; // id_form_item
  const { satus } = req.body; // cuidado: no banco está escrito "satus"

  if (!satus) {
    return res.status(400).json({ error: 'Campo "satus" é obrigatório' });
  }

  const { data, error } = await supabase
    .from('item_formulario')
    .update({ satus }) // usa o nome da coluna do banco
    .eq('id_form_item', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar status:', error);
    return res.status(400).json({ error });
  }

  res.json(data);
};



// PATCH /formulario/:id/confirmar
exports.confirmarRequisicao = async (req, res) => {
  const { id } = req.params; // id_form
  const { destino, data_embarque } = req.body;

  //console.log("➡️ Confirmação iniciada | destino:", destino, "| data:", data_embarque);

  // Busca os itens aprovados do formulário
  const { data: itens, error } = await supabase
    .from('item_formulario')
    .select(`
      id_form_item,
      qtd_mat,
      satus,
      material_embarque: id_mat_embarque (
        id_mat_emb,
        id_material,
        quantidade,
        id_embarque
      )
    `)
    .eq('id_formulario', id)
    .eq('satus', 'Aprovado');

  if (error) {
    console.error("❌ Erro ao buscar itens aprovados:", error);
    return res.status(400).json({ error });
  }

  //console.log(`📦 Itens aprovados encontrados: ${itens.length}`);

  for (const item of itens) {
    const origem = item.material_embarque;


    // Calcula nova quantidade
    const novaQtd = origem.quantidade - item.qtd_mat;
    //console.log(`   ➡️ Nova quantidade na origem: ${novaQtd}`);

    // Atualiza origem → subtrai quantidade
    const { error: updateError } = await supabase
      .from('material_embarque')
      .update({
        quantidade: novaQtd,
        status_mat_emb: novaQtd <= 0 ? 'Enviado' : 'Parcial'
      })
      .eq('id_mat_emb', origem.id_mat_emb);

    if (updateError) {
      console.error("❌ Erro ao atualizar origem:", updateError);
      return res.status(400).json({ error: updateError });
    }

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');       // 16
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');  // 12
    const ano = String(hoje.getFullYear()).slice(-2);          // 25

    const dataCompacta = `${dia}${mes}${ano}`;
    // Cria destino → mesma qtd transferida, novo embarque
    const { error: insertError } = await supabase
      .from('material_embarque')
      .insert({
        rt_emb: destino + "-" + dataCompacta,
        id_material: origem.id_material,   // FK correta
        id_embarque: destino,              // embarque de destino
        frete_mat_emb: 0,
        quantidade: item.qtd_mat,          // quantidade transferida
        data_mat_emb: data_embarque,
        status_mat_emb: 'N. Utilizado'
      });

    if (insertError) {
      console.error("❌ Erro ao inserir destino:", insertError);
      return res.status(400).json({ error: insertError });
    }
  }

  // Marca o formulário como concluído
  const { error: formError } = await supabase
    .from('formulario')
    .update({ aprovado: true })
    .eq('id_form', id);

  if (formError) {
    console.error("❌ Erro ao atualizar formulário:", formError);
    return res.status(400).json({ error: formError });
  }

  //console.log(`✔️ Formulário ${id} marcado como concluído`);

  res.json({ message: 'Requisição confirmada com sucesso!' });
};
