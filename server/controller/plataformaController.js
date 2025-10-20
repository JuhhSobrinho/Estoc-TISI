const supabase = require('../config/config');

exports.getPlataformas = async (req, res) => {
  const { data, error } = await supabase.from('plataforma').select('*');

  if (error) {
    console.error('Erro ao buscar plataformas:', error);
    return res.status(500).send('Erro ao buscar plataformas');
  }

  console.log('Plataformas recebidas do Supabase:', data); // ← Aqui está o log!

  res.json(data);
};


exports.cadastrarPlataforma = async (req, res) => {
  const { nome_plat, cliente_plat, contrato } = req.body;

  try {
    const { data, error } = await supabase
      .from('plataforma')
      .insert([
        {
          nome_plat,
          cliente_plat,
          contrato
        }
      ])
      .select()
      .single(); // retorna só o registro inserido

    if (error) throw error;

    res.json({
      status: 'ok',
      mensagem: 'Plataforma cadastrada com sucesso!',
      plataforma: data
    });
  } catch (err) {
    console.error('❌ Erro ao cadastrar plataforma:', err);
    res.status(500).json({ error: 'Erro ao cadastrar plataforma' });
  }
};


exports.buscarPlataformaPorNome = async (req, res) => {
  const { nome } = req.query;

  if (!nome) {
    return res.status(400).json({ error: 'Nome da plataforma não informado.' });
  }

  const { data, error } = await supabase
    .from('plataforma')
    .select('id_plat, nome_plat')
    .ilike('nome_plat', nome) // busca ignorando maiúsculas/minúsculas

  if (error || !data || data.length === 0) {
    return res.status(404).json({ error: 'Plataforma não encontrada.' });
  }

  res.json(data[0]); // retorna a primeira encontrada
};
