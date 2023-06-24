const express = require ("express");
const app = express();
const cors = require("cors");
const pool = require("./dbConfig")

//middleware
app.use(cors());
app.use(express.json())

//--------------------------CONSULTAS----------------------------//

app.get ("/eventos", async (req, res) => {
    try {
        const allEventos = await pool.query("SELECT id_calen_eve, nombre, to_char(fecha_evento :: DATE, 'dd/mm/yyyy') fecha_evento, hora_inicio, descripcion FROM jml_calendario_eventos");
        res.json(allEventos.rows);
    } catch (error) { 
        console.log(error.message);
    }
})

app.get ("/eventosdesfiles", async (req, res) => {
    try {
        const eventosD = await pool.query("SELECT * FROM  jml_calendario_eventos WHERE tipo_evento = 'D' ");
        res.json(eventosD.rows);
    } catch (error) {
        console.log(error.message);
    }
  })

  app.get ("/eventosgeneralespagos", async (req, res) => {
    try {
        const eventosD = await pool.query("SELECT * FROM  jml_calendario_eventos WHERE tipo_evento = 'G' AND gratis_pago = 'P' ");
        res.json(eventosD.rows);
    } catch (error) {
        console.log(error.message);
    }
  })

  app.get ("/autorizados", async (req, res) => {
    try {
        const autorizados = await pool.query(" SELECT e.nombre, en.tipo_entrada, au.cant_max  FROM jml_empresa_vendedora e, jml_autorizado au, jml_entrada_tipo en WHERE e.num_rif = au.num_rif and en.id_entrada = au.id_entrada");
        res.json(autorizados.rows);
    } catch (error) {
        console.log(error.message);
    }
  })

  app.get ("/direccion", async (req, res) => {
    try {
        const direccion= await pool.query("SELECT id_lugar_eventog, nombre from jml_lugar_evento_dir");
        res.json(direccion.rows);
    } catch (error) {
        console.log(error.message);
    }
  })


//--------------------------INSERTS----------------------------//

app.post ("/agregarevento", async (req, res) => {
  try {
        const { ano, nombre, fecha_evento, hora_inicio, tipo_evento, tipo_audiencia, gratis_pago, descripcion } = req.body;
        const agregarEvento = await pool.query(
            "INSERT INTO JML_calendario_eventos (id_calen_eve, ano, id_lugar_eventog, nombre, fecha_evento, hora_inicio, tipo_evento, tipo_audiencia, gratis_pago, descripcion) VALUES(nextval('JML_id_calen_eve'), $1, 14, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            [ano, nombre, fecha_evento, hora_inicio, tipo_evento, tipo_audiencia, gratis_pago, descripcion]);
        res.json(agregarEvento.rows[0]);
  } catch (error) {
      console.log(error.message);
  }
})


//------------------------UPDATES---------------------------//

app.put ("/updateresults", async (req, res) => {
    try {
        const { posicion_resultado } = req.body;
        const agregarDir = await pool.query(
            "UPDATE jml_participacion SET posicion_resultado is null ",
            [posicion_resultado]);
        res.json(agregarDir.rows[0]);
  } catch (error) {
      console.log(error.message);
  }
})

app.listen(5000, () => {
    console.log("server running on port 5000");
})

