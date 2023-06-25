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
        const allEventos = await pool.query("SELECT id_calen_eve, nombre, EXTRACT(YEAR FROM ano) ano, to_char(fecha_evento :: DATE, 'dd/mm/yyyy') fecha_evento, hora_inicio, descripcion FROM jml_calendario_eventos");
        res.json(allEventos.rows);
    } catch (error) { 
        console.log(error.message);
    }
})

app.get ("/eventosdesfiles", async (req, res) => {
    try {
        const eventosD = await pool.query("SELECT ca.nombre, EXTRACT(YEAR FROM ca.ano) ano, to_char(fecha_evento :: DATE, 'dd/mm/yyyy') fecha_evento FROM  jml_calendario_eventos ca WHERE ca.tipo_evento = 'D' and ca.nombre <> 'Desfile de los Campeones' and ca.nombre <> 'Desfile de las escuelas de samba en el Grupo B'and ca.nombre <> 'Desfile de las Escuelas de Samba Infantiles'");
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

  app.get("/eventosgeneralespagos", async (req, res) => {
    try {
      const eventosD = await pool.query(
        "SELECT c.id_calen_eve, c.nombre nombre, c.costo, EXTRACT(YEAR FROM c.fecha_evento) fecha_evento FROM jml_calendario_eventos c WHERE c.tipo_evento = 'G' and c.gratis_pago = 'P' order by fecha_evento, nombre asc "
      );
      res.json(eventosD.rows);
    } catch (error) {
      console.log(error.message);
    }
  });

  app.get ("/escuelaspos", async (req, res) => {
    try {
      const escuelasPos = await pool.query(
        "SELECT e.id_escuela, e.nombre, par.posicion_resultado, ca.id_calen_eve FROM jml_escuela_de_samba e, jml_participacion par, jml_calendario_eventos ca WHERE e.id_escuela = par.id_escuela and ca.id_calen_eve = par.id_calen_eve and ca.tipo_evento = 'D' and ca.nombre <> 'Desfile de los Campeones' and ca.nombre <> 'Desfile de las escuelas de samba en el Grupo B'and ca.nombre <> 'Desfile de las Escuelas de Samba Infantiles'"
      );
      res.json(escuelasPos.rows);
    } catch (error) {
      console.log(error.message);
    }
  })


//--------------------------INSERTS----------------------------//

app.post ("/agregarevento", async (req, res) => {
  try {
        const { ano, id_lugar_eventog, nombre, fecha_evento, hora_inicio, tipo_evento, tipo_audiencia, gratis_pago, descripcion } = req.body;
        const agregarEvento = await pool.query(
            "INSERT INTO JML_calendario_eventos (id_calen_eve, ano, id_lugar_eventog, nombre, fecha_evento, hora_inicio, tipo_evento, tipo_audiencia, gratis_pago, descripcion) VALUES(nextval('JML_id_calen_eve'), $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
            [ano, id_lugar_eventog, nombre, fecha_evento, hora_inicio, tipo_evento, tipo_audiencia, gratis_pago, descripcion]);
        res.json(agregarEvento.rows[0]);
  } catch (error) {
      console.log(error.message);
  }
})

app.post("/agregarentradas", async (req, res) => {
    try {
        const entradasAgregadas = [];
        const { id_calen_eve, ano, costo, cantidad } = req.body;
        console.log(cantidad);
        for (i = 1; i <= cantidad; i++) {
            const agregarEvento = await pool.query(
            "INSERT INTO JML_entrada_ev_general (id_entrada_eveng, id_calen_eve, ano, fecha_emision, hora_emision, costo) VALUES (nextval('JML_id_entrada_eveng'), $1, make_date($2,1,1), current_date, current_time, $3) RETURNING *",
            [id_calen_eve, ano, costo]
            );
            entradasAgregadas.push(agregarEvento.rows[0]);
        }
        res.json(entradasAgregadas);
        } catch (error) {
        console.log(error.message);
    } 
  });

//------------------------UPDATES---------------------------//

app.put ("/updatepos/:id", async (req, res) => {
    try {
        const { posicion_resultado } = req.body;
        const updatePos = await pool.query(
            "UPDATE jml_participacion SET posicion_resultado = $1 Where posicion_resultado is null and id_escuela = $2 and id_calen_eve = $3",
            [posicion_resultado, id_escuela, id_calen_eve]
            );
        res.json(updatePos.rows);
  } catch (error) {
      console.log(error.message);
  }
})

app.listen(5000, () => {
    console.log("server running on port 5000");
})

