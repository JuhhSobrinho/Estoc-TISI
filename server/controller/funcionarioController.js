const supabase = require('../config/config');

exports.getFuncionario = async (req, res) => {
  const { data, error } = await supabase.from('funcionario').select('*');

  if (error) {
    console.error('Erro ao buscar funcionario:', error);
    return res.status(500).send('Erro ao buscar funcionario');
  }

  //console.log('funcionario recebidas do Supabase:', data); // ← Aqui está o log!

  res.json(data);
};





exports.setFuncionario = async (req, res) => {
  const { nome_func, contato_func, status_func } = req.body;

  try {
    const { data, error } = await supabase
      .from('funcionario')
      .insert([
        {
          nome_func,
          contato_func,
          status_func
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ status: 'ok', funcionario: data });
  } catch (err) {
    console.error('❌ Erro ao cadastrar funcionário:', err);
    res.status(500).json({ error: 'Erro ao cadastrar funcionário' });
  }
};


exports.verificarFuncionario = async (req, res) => {
  const nome = req.query.nome;
  if (!nome) return res.status(400).json({ error: 'Nome não fornecido' });

  try {
    const { data, error } = await supabase
      .from('funcionario')
      .select('id_func, nome_func')
      .eq('nome_func', nome)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // ignora erro de "not found"

    if (!data) {
      return res.status(200).json(null); // funcionário não existe
    }

    res.status(200).json(data); // funcionário existe
  } catch (err) {
    console.error('Erro ao verificar funcionário:', err);
    res.status(500).json({ error: 'Erro ao verificar funcionário' });
  }
};


exports.atualizarFuncionario = async (req, res) => {
  const id = req.params.id;
  const { nome_func, status_func, contato_func } = req.body;

  const { error } = await supabase
    .from('funcionario')
    .update({
      nome_func,
      status_func,
      contato_func
    })
    .eq('id_func', id);

  if (error) {
    console.error("❌ Erro ao atualizar funcionário:", error);
    return res.status(500).json({ error: 'Erro ao atualizar funcionário' });
  }

  res.status(200).json({ message: 'Funcionário atualizado com sucesso!' });
};
