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

app.get("/eventosdesfiles", async (req, res) => {
  try {
    const eventosD = await pool.query(
      "SELECT ca.id_calen_eve, ca.nombre, EXTRACT(YEAR FROM ca.ano) ano, to_char(fecha_evento :: DATE, 'dd/mm/yyyy') fecha_evento FROM  jml_calendario_eventos ca WHERE ca.tipo_evento = 'D' and ca.nombre <> 'Desfile de los Campeones' and ca.nombre <> 'Desfile de las escuelas de samba en el Grupo B'and ca.nombre <> 'Desfile de las Escuelas de Samba Infantiles'"
    );
    res.json(eventosD.rows);
  } catch (error) {
    console.log(error.message);
  }
});

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

  app.get("/autorizados", async (req, res) => {
    try {
      const autorizados = await pool.query(
        `SELECT en.id_entrada, au.num_rif, e.nombre, en.tipo_entrada, au.cant_max, h.monto
        FROM jml_empresa_vendedora e, jml_autorizado au, 
        jml_hist_precio_entrada h,
        jml_entrada_tipo en, jml_calendario_eventos c
        WHERE e.num_rif = au.num_rif 
        and en.id_entrada = au.id_entrada
        and h.id_entrada = en.id_entrada
        and h.fecha_final IS NULL
        and h.id_calen_eve = c.id_calen_eve
        and h.ano = c.ano
        and c.tipo_evento = 'D'
        group by en.id_entrada, au.num_rif, 
        e.nombre, en.tipo_entrada, au.cant_max, h.monto
          order by nombre`
      );
      res.json(autorizados.rows);
    } catch (error) {
      console.log(error.message);
    }
  });


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
  app.post("/agregarreservas", async (req, res) => {
    try {
      const entradasAgregadas = [];
      const entradasAgregadas2 = [];
      autorizadoUpdate = [];
      const { num_rif, cantidades, totales, id_entradas } = req.body;
      const totales_r = totales.filter(
        (total) => total !== null && total !== undefined && total !== 0
      );
      const id_entradas_r = id_entradas.filter(
        (entrada) => entrada !== null && entrada !== undefined && entrada !== 0
      );
      const cantidades_r = cantidades.filter(
        (cantidad) =>
          cantidad !== null && cantidad !== undefined && cantidad !== 0
      );
  
      console.log(cantidades_r);
      console.log(id_entradas_r);
      console.log(totales_r);
      let total = 0;
      for (i = 0; i < totales_r.length; i++) {
        console.log(totales_r[i], cantidades_r[i]);
        total = totales_r[i] + total;
      }
      console.log(num_rif);
      console.log(total);
      const query1 = await pool.query(
        `INSERT INTO jml_reserva (num_reserva, 
            num_rif, id_cliente, status, 
            fecha_emision, hora_emision, fecha_cancelacion, total) 
            VALUES (nextval('JML_num_reserva'),
            $1, 1, 'P', 
            current_date, current_time, NULL, $2) 
            RETURNING *`,
        [num_rif, total]
      );
      entradasAgregadas.push(query1.rows[0]);
  
      const query_select = await pool.query(`select num_reserva from jml_reserva
                                      order by num_reserva desc
                                      limit 1`);
      const num_reserva = query_select.rows[0].num_reserva;
      console.log(num_reserva);
  
      for (i = 0; i < totales_r.length; i++) {
        const query2 = await pool.query(
          `INSERT INTO jml_detalle_reserva (num_rif_reserva, 
              num_rif_autorizado, num_reserva, id_entrada, 
              cantidad_entradas) 
              VALUES ($1, $1, $2, $3, $4) 
              RETURNING *`,
          [num_rif, num_reserva, id_entradas_r[i], cantidades_r[i]]
        );
  
        const query3 = await pool.query(
          `update jml_autorizado
                set cant_max = cant_max - $1
                where num_rif = $2
                and id_entrada = $3`,
          [cantidades_r[i], num_rif, id_entradas_r[i]]
        );
        entradasAgregadas2.push(query2.rows[0]);
        autorizadoUpdate.push(query3.rows[0]);
      }
      res.json({
        entradasAgregadas: entradasAgregadas,
        entradasAgregadas2: entradasAgregadas2,
        autorizadoUpdate: autorizadoUpdate,
      });
    } catch (error) {
      console.log(error.message);
    }
  });

//------------------------UPDATES---------------------------//
app.put("/updatepos", async (req, res) => {
  posiciones_update = [];
  grupo_update = [];
  try {
    const { escuelas_pos, posiciones, id_evento } = req.body;
    const escuelas_pos_r = escuelas_pos.filter(
      (escuela) => escuela !== null && escuela !== undefined && escuela !== 0
    );
    const posiciones_r = posiciones.filter(
      (posicion) =>
        posicion !== null && posicion !== undefined && posicion !== 0
    );
    console.log(escuelas_pos_r);
    console.log(posiciones_r);
    for (i = 0; i < posiciones_r.length; i++) {
      const updatePos = await pool.query(
        `UPDATE jml_participacion SET posicion_resultado = $1 
      Where posicion_resultado is null and id_escuela = $2 and id_calen_eve = $3`,
        [posiciones_r[i], escuelas_pos_r[i], id_evento]
      );
      posiciones_update.push(updatePos.rows[0]);
    }

    const posiciones_num = posiciones_r.map((posicion) => parseInt(posicion));
    const ultimo = Math.max(...posiciones_num);
    const indice = posiciones_num.indexOf(ultimo);
    const id_esc = escuelas_pos_r[indice];
    console.log(id_esc);
    const query_select = await pool.query(
      `select grupo from jml_historico_escuela_grupo
        where id_escuela = $1
        and fecha_fin is null`,
      [id_esc]
    );
    const grupo = query_select.rows[0].grupo;
    console.log(grupo);
    if (grupo == "E") {
      const updateGrupo = await pool.query(
        `UPDATE jml_historico_escuela_grupo SET fecha_fin = current_date 
      Where id_escuela = $1`,
        [id_esc]
      );
      posiciones_update.push(updateGrupo.rows[0]);

      const query1 = await pool.query(
        `INSERT INTO jml_historico_escuela_grupo (fecha_inicio, 
            id_escuela, grupo, fecha_fin) 
            VALUES (current_date,
            $1, 'A', NULL) 
            RETURNING *`,
        [id_esc]
      );
      posiciones_update.push(query1.rows[0]);
    } else {
      const primero = Math.min(...posiciones_num);
      const indice = posiciones_num.indexOf(primero);
      const id_esc = escuelas_pos_r[indice];
      console.log(id_esc);
      const updateGrupo = await pool.query(
        `UPDATE jml_historico_escuela_grupo SET fecha_fin = current_date 
      Where id_escuela = $1`,
        [id_esc]
      );
      posiciones_update.push(updateGrupo.rows[0]);

      const query1 = await pool.query(
        `INSERT INTO jml_historico_escuela_grupo (fecha_inicio, 
            id_escuela, grupo, fecha_fin) 
            VALUES (current_date,
            $1, 'E', NULL) 
            RETURNING *`,
        [id_esc]
      );
      posiciones_update.push(query1.rows[0]);
    }

    res.json({
      posiciones_update: posiciones_update,
    });
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(5000, () => {
    console.log("server running on port 5000");
})

