const supabase = require('../config/config');

exports.criarFormulario = async (req, res) => {
  const {
    description,
    id_funcionario,
    id_embarque,
    materiais // array de objetos: [{ id_material, qtd_mat }]
  } = req.body;

  if (!description || !id_funcionario || !id_embarque || !materiais || materiais.length === 0) {
    return res.status(400).json({ error: 'Dados obrigatórios ausentes.' });
  }

  // Calcular total de materiais
  const qtdTotal = materiais.reduce((acc, mat) => acc + Number(mat.qtd_mat), 0);

  // Criar formulário
  const { data: formData, error: formError } = await supabase
    .from('formulario')
    .insert([{
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
    id_material: mat.id_material,
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
    .select('id_form, description');

  if (error) {
    console.error('❌ Erro ao buscar nomes:', error);
    return res.status(500).json({ error: 'Erro ao buscar nomes' });
  }

  res.json(data);
};
