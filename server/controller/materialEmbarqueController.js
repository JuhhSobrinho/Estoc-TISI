const supabase = require('../config/config');

exports.getMaterialEmbarqueCompleto = async (req, res) => {
  const { data, error } = await supabase
    .from('material_embarque')
    .select(`
      id_mat_emb,
      rt_emb,
      frete_mat_emb,
      quantidade,
      data_mat_emb,
      status_mat_emb,
      material (
        id_mat,
        qtd_mat,
        nome_material,
        tipo_contagem_mat,
        valor_unidade_mat,
        kardex_mat,
        data_validade_mat,
        tipo (
          description_tip
        ),
        status_mat,
        unidade_medida
      ),
      embarque (
        plataforma_origem:plataforma_origem_id_emb (
          nome_plat,
          cliente_plat
        ),
        plataforma_destino:plataforma_destino_id_emb (
          nome_plat,
          cliente_plat
        )
      ),
      cautela_material (
        id_cautela,
        funcionario:id_funcionario (
          nome_func
        )
      )
    `)
    .gt('quantidade', 0);   // ← filtro para só trazer quantidade > 0

  if (error) {
    console.error('❌ Erro ao buscar dados do Supabase:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados' });
  }

  res.json(data);
};


exports.setMaterialEmbarque = async (req, res) => {
  const {
    idMaterial,
    descricao,
    quantidade,
    tipoContagem,
    valorUnitario,
    kardex,
    validade,
    tipoMaterial,
    status,
    dataMatEmb,
    nomePlataforma,
    clientePlataforma,
    bacia,
    funcionarioId,
    responsabilidade,
    dataCautela,
    equipamentoId
  } = req.body;

  try {
    // Se vier vazio ou undefined, força null
    const validadeFinal = validade && validade.trim() !== "" ? validade : null;

    const { data, error } = await supabase
      .from('material_embarque')
      .insert([
        {
          id_material: idMaterial,
          quantidade,
          frete_mat_emb: valorUnitario,
          rt_emb: kardex,
          data_validade_mat: validadeFinal, // agora nunca será ""
          status_mat: status,
        }
      ]);

    if (error) throw error;

    res.json({ status: 'ok', mensagem: 'Material embarcado com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao cadastrar material embarcado:', err);
    res.status(500).json({ error: 'Erro ao cadastrar material embarcado' });
  }
};




exports.getValidadePorMaterialEKardex = async (req, res) => {
  const { material, kardex } = req.query;

  try {
    const { data, error } = await supabase
      .from('material_embarque')
      .select('data_validade_mat')
      .eq('nome_material', material)
      .eq('kardex_mat', kardex)
      .single();

    if (error || !data) return res.json({ validade: "" });

    res.json({ validade: data.data_validade_mat });
  } catch (err) {
    console.error('❌ Erro ao buscar validade:', err);
    res.status(500).json({ validade: "" });
  }
};






exports.listarMateriaisPorPlataforma = async (req, res) => {
  const { plataforma } = req.query;

  console.log("📦 Plataforma selecionada:", plataforma);

  if (!plataforma) {
    return res.status(400).json({ error: 'Plataforma não informada.' });
  }

  const { data, error } = await supabase
    .from('material_embarque')
    .select(`
      id_mat_emb,
      status_mat_emb,
      quantidade,
      data_mat_emb,
      material (
        id_mat,
        nome_material,
        kardex_mat,
        data_validade_mat
      ),
      embarque (
        plataforma_origem:plataforma_destino_id_emb (
          nome_plat
        )
      )
    `)
    .neq('status_mat_emb', 'Utilizado');

  if (error) {
    console.error("❌ Erro ao buscar materiais:", error);
    return res.status(500).json({ error: 'Erro ao buscar materiais' });
  }

  // Filtrar manualmente os que têm plataforma de origem igual à selecionada
  const filtrados = data.filter(item =>
    item.embarque?.plataforma_origem?.nome_plat === plataforma
  );

  res.json(filtrados);
};

