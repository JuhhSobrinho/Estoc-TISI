const supabase = require('../config/config');

exports.buscarEmbarque = async (req, res) => {
    const { origem, destino } = req.query;

    const { data, error } = await supabase
        .from('embarque')
        .select('id_emb')
        .eq('plataforma_origem_id_emb', origem)
        .eq('plataforma_destino_id_emb', destino)
        .single();

    if (error || !data) return res.status(404).json({ error: 'Embarque não encontrado' });
    res.json(data);
};

exports.criarEmbarque = async (req, res) => {
    const { origem, destino } = req.body;

    console.log(origem, destino);
    

    if (!origem || !destino || isNaN(origem) || isNaN(destino)) {
        return res.status(400).json({ error: 'IDs inválidos de origem ou destino.' });
    }

    const { data, error } = await supabase
        .from('embarque')
        .insert([{
            plataforma_origem_id_emb: origem,
            plataforma_destino_id_emb: destino
        }])
        .select('id_emb')
        .single();

    if (error || !data) {
        console.error("❌ Erro ao criar embarque:", error);
        return res.status(500).json({ error: 'Erro ao criar embarque' });
    }

    res.json(data);
};

