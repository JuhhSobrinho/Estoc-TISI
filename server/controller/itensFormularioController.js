const supabase = require('../config/config');

exports.getItemFormularioEspecifico = async (req, res) => {
    const { data, error } = await supabase
        .from('item_formulario')
        .select(`
    id_form_item,
    qtd_mat,
    status,
    id_mat_embarque,
    material_embarque (
      rt_emb,
      frete_mat_emb,
      quantidade,
      material (
        nome_material,
        tipo_contagem_mat,
        valor_unidade_mat,
        kardex_mat,
        data_validade_mat,
        tipo (
          description_tip
        ),
        unidade_medida
      ),
      status_mat_emb
    ),
    formulario (
      id_form,
      nome_form,
      aprovado,
      description,
      id_form_embarque,
      funcionario (
        id_func,
        nome_func
      ),
      embarque: id_form_embarque (
        plataforma_origem:plataforma_origem_id_emb (
          nome_plat,
          cliente_plat
        ),
        plataforma_destino:plataforma_destino_id_emb (
          nome_plat
        )
      )
    )
  `);


    if (error) {
        console.error('❌ Erro ao buscar dados do Supabase:', error);
        return res.status(500).json({ error: 'Erro ao buscar dados' });
    }


    res.json(data);

};

