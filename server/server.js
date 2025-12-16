const os = require('os');
const express = require('express');
const path = require('path');
const app = express();
const PORT = 8104;

const plataformaRoutes = require('./routes/plataforma.Routes.js');
const materialEmbarqueRoutes = require('./routes/materialEmbarque.Routes.js');
const itensFormularioRoutes = require('./routes/itensFormulario.Routes.js');
const formularioRoutes = require('./routes/formulario.Routes.js');
const CautelaMaterialRoutes = require('./routes/cautelaMaterial.Routes.js');
const funcionarioRoutes = require('./routes/funcionario.Routes.js');
const materialRoutes = require('./routes/material.Routes.js');
const FuncinarioEmbarqueRoutes = require('./routes/funcionarioEmbarque.Routes.js');
const embarqueRoutes = require('./routes/embarque.Routes.js');




app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json());

// Rota principal para plataformas
app.use('/plataformas', plataformaRoutes);
app.use('/material-embarque', materialEmbarqueRoutes);
app.use('/itens-formulario', itensFormularioRoutes);
app.use('/formulario', formularioRoutes);
app.use('/cautela-material', CautelaMaterialRoutes);
app.use('/funcionario', funcionarioRoutes);
app.use('/material-com-embarque', materialRoutes);
app.use('/funcionario-embarque', FuncinarioEmbarqueRoutes);
app.use('/embarque', embarqueRoutes);






function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        results.push({ name, address: iface.address });
      }
    }
  }
  return results;
}

app.listen(PORT, () => {
  const infos = getNetworkInfo();
  console.log(`Servidor rodando em:`);
  console.log(`- Localhost: http://localhost:${PORT}`);

  infos.forEach(info => {
    console.log(`- Rede "${info.name}": http://${info.address}:${PORT}`);
  });
});