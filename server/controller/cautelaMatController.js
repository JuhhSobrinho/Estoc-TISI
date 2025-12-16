const supabase = require('../config/config');

exports.getCautelaMaterial = async (req, res) => {
  const { data, error } = await supabase
    .from('cautela_material')
    .select(`
    id_cautela,
    aprovado,
    description,
    quantidade,
    data_cautela,
    status_cautela,
    observacao,
    funcionario:id_funcionario (
      id_func,
      nome_func,
      funcionario_embarque (
        id_embarque,
        embarque (
          nome_emb,
          data_emb
        )
      )
    ),
    material_embarque:id_mat_emb (
      id_matEmb,
      status_mat_emb,
      material (
        id_mat,
        nome_material
      ),
      embarque (
        id_emb,
        nome_emb
      )
    )
  `);


  if (error) {
    console.error('❌ Erro ao buscar dados do Supabase:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados' });
  }

  //console.log('✅ Dados recebidos do Supabase:', JSON.stringify(data, null, 2)); // ← Aqui está o log!

  res.json(data);

};



exports.setCautelaMaterial = async (req, res) => {
  const {
    id_funcionario,
    id_mat_emb,
    quantidade,
    data_cautela,
    status_cautela,
    observacao
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('cautela_material')
      .insert([
        {
          id_funcionario,
          id_mat_emb,
          quantidade,
          data_cautela,
          status_cautela,
          observacao
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ status: 'ok', cautela: data });
  } catch (err) {
    console.error('❌ Erro ao cadastrar cautela:', err);
    res.status(500).json({ error: 'Erro ao cadastrar cautela' });
  }
};
