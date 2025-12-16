const supabase = require('../config/config.js');

exports.setMaterialComEmbarque = async (req, res) => {
    const {
        nome_material,
        tipo_contagem_mat,
        unidade_medida,
        valor_unidade_mat,
        kardex_mat,
        data_validade_mat,
        tipo_mat,
        status_mat,
        qtd_mat
    } = req.body;

    try {
        // 1. Cadastrar material
        const { data: materialData, error: materialError } = await supabase
            .from('material')
            .insert([
                {
                    nome_material,
                    tipo_contagem_mat,
                    unidade_medida,
                    valor_unidade_mat,
                    kardex_mat,
                    data_validade_mat,
                    tipo_mat: tipo_mat,
                    status_mat,
                    qtd_mat
                }
            ])
            .select()
            .single();

        if (materialError) throw materialError;

        const idMaterial = materialData.id_mat;

        // 2. Cadastrar embarque padrão BASE → BASE
        const { data: embarqueData, error: embarqueError } = await supabase
            .from('material_embarque')
            .insert([
                {
                    id_material: idMaterial,
                    quantidade: qtd_mat,
                    frete_mat_emb: valor_unidade_mat,
                    rt_emb: kardex_mat,
                    status_mat_emb: status_mat,
                    id_embarque: 1, // ID da BASE
                    data_mat_emb: new Date().toISOString().split('T')[0]
                }
            ]);

        if (embarqueError) throw embarqueError;

        res.json({ status: 'ok', mensagem: 'Material e embarque cadastrados com sucesso' });
    } catch (err) {
        console.error('❌ Erro no cadastro completo:', err);
        res.status(500).json({ error: 'Erro ao cadastrar material e embarque' });
    }
};








exports.atualizarMaterialComEmbarque = async (req, res) => {
    const idMaterial = req.params.id; // ou req.body.idMaterial
    const {
        nome_material,
        tipo_contagem_mat,
        unidade_medida,
        valor_unidade_mat,
        kardex_mat,
        data_validade_mat,
        tipo_mat,
        status_mat,
        qtd_mat
    } = req.body;

    try {
        // 1. Atualizar material
        const { data: materialData, error: materialError } =
            await supabase.from('material')
                .update({
                    nome_material,
                    tipo_contagem_mat,
                    unidade_medida,
                    valor_unidade_mat,
                    kardex_mat,
                    data_validade_mat,
                    tipo_mat: tipo_mat,
                    status_mat, qtd_mat
                })
                .eq('id_mat', idMaterial).select().single();

        if (materialError) throw materialError;

        // 2. Atualizar embarque vinculado
        const { error: embarqueError } = await supabase
            .from('material_embarque')
            .update({
                quantidade: qtd_mat,
                frete_mat_emb: valor_unidade_mat,
                rt_emb: kardex_mat,
                status_mat_emb: status_mat,
                data_mat_emb: new Date().toISOString().split('T')[0]
            })
            .eq('id_material', idMaterial);

        if (embarqueError) throw embarqueError;

        res.json({ status: 'ok', mensagem: 'Material e embarque atualizados com sucesso' });
    } catch (err) {
        console.error('❌ Erro na atualização completa:', err);
        res.status(500).json({ error: 'Erro ao atualizar material e embarque' });
    }
};

exports.getMaterialComEmbarquePorId = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('material_embarque')
            .select('*')
            .eq('id_mat_emb', id) // ou id_material, dependendo do caso
            .maybeSingle();       // 👈 evita erro quando não encontra

        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Material embarque não encontrado" });

        res.json(data);
    } catch (err) {
        console.error('❌ Erro ao buscar material embarque:', err);
        res.status(500).json({ error: 'Erro ao buscar material embarque' });
    }
};



