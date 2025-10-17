const supabase = require('../config/config.js');

exports.listarFuncionarioEmbarques = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('funcionario_embarque')
      .select(`
        id_funcionario,
        funcionario (
          nome_func,
          status_func,
          contato_func
        ),
        id_embarque,
        embarque (
          plataforma_origem:plataforma_origem_id_emb (
            nome_plat,
            cliente_plat
          ),
          plataforma_destino:plataforma_destino_id_emb (
            nome_plat
          )
        ),
        description,
        dt_embarque
      `);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('❌ Erro ao listar embarques de funcionários:', err);
    res.status(500).json({ error: 'Erro ao buscar dados de embarque' });
  }
};


exports.criarFuncionarioEmbarque = async (req, res) => {
  const {
    id_funcionario,
    plataforma_origem,
    plataforma_destino,
    dt_embarque,
    description
  } = req.body;

  console.log("📥 Recebido:", req.body);

  if (!id_funcionario || !plataforma_origem || !plataforma_destino || !dt_embarque) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  // Buscar ID da plataforma origem
  const { data: origemData, error: origemError } = await supabase
    .from('plataforma')
    .select('id_plat')
    .eq('nome_plat', plataforma_origem)
    .single();

  if (origemError || !origemData) {
    return res.status(400).json({ error: 'Plataforma de origem inválida' });
  }
  console.log("🔍 Plataforma origem:", origemData);

  // Buscar ID da plataforma destino
  const { data: destinoData, error: destinoError } = await supabase
    .from('plataforma')
    .select('id_plat')
    .eq('nome_plat', plataforma_destino)
    .single();

  if (destinoError || !destinoData) {
    return res.status(400).json({ error: 'Plataforma de destino inválida' });
  }
  console.log("🔍 Plataforma destino:", destinoData);

  const origemId = origemData.id_plat;
  const destinoId = destinoData.id_plat;

  // Verificar se já existe embarque com mesma origem/destino
  const { data: embarqueExistente, error: erroBuscaEmb } = await supabase
    .from('embarque')
    .select('id_emb')
    .eq('plataforma_origem_id_emb', origemId)
    .eq('plataforma_destino_id_emb', destinoId)
    .limit(1);

  let embarqueId;

  if (embarqueExistente && embarqueExistente.length > 0) {
    embarqueId = embarqueExistente[0].id_emb;
    console.log("🔁 Reutilizando embarque existente:", embarqueId);
  } else {
    // Criar novo embarque
    const { data: novoEmbarque, error: erroNovoEmb } = await supabase
      .from('embarque')
      .insert([{
        plataforma_origem_id_emb: origemId,
        plataforma_destino_id_emb: destinoId
      }])
      .select('id_emb')
      .single();

    if (erroNovoEmb || !novoEmbarque) {
      return res.status(500).json({ error: 'Erro ao criar embarque' });
    }

    embarqueId = novoEmbarque.id_emb;
    console.log("📦 Embarque criado:", embarqueId);
  }

  // Criar vínculo com funcionário
  const { error: vinculoError } = await supabase
    .from('funcionario_embarque')
    .insert([{
      id_funcionario,
      id_embarque: embarqueId,
      dt_embarque,
      description
    }]);

  if (vinculoError) {
    return res.status(500).json({ error: 'Erro ao vincular embarque ao funcionário' });
  }

  res.status(201).json({ message: 'Embarque vinculado com sucesso!' });
};









exports.deletarFuncionarioEmbarque = async (req, res) => {
  const { id_funcionario, dt_embarque } = req.body;

  if (!id_funcionario || !dt_embarque) {
    return res.status(400).json({ error: 'Dados obrigatórios ausentes.' });
  }

  const { error } = await supabase
    .from('funcionario_embarque')
    .delete()
    .eq('id_funcionario', id_funcionario)
    .eq('dt_embarque', dt_embarque);

  if (error) {
    console.error("❌ Erro ao deletar embarque:", error);
    return res.status(500).json({ error: 'Erro ao deletar embarque' });
  }

  res.status(200).json({ message: 'Embarque deletado com sucesso!' });
};
