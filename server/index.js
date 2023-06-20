const express = require ("express");
const app = express();
const cors = require("cors");
const pool = require("./dbConfig")

//middleware
app.use(cors());
app.use(express.json())

//Ruta para probar si funciona en el front

app.get ("/eventos", async (req,res) => {
    try {
        const allEventos = await pool.query("SELECT * from jml_calendario_eventos");
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
        const autorizados = await pool.query("SELECT * FROM  jml_autorizado ");
        res.json(autorizados.rows);
    } catch (error) {
        console.log(error.message);
    }
  })

app.listen(5000, () => {
    console.log("server running on port 5000");
})


const vertabla = async () => {
    const query = {
      text: "SELECT * FROM jml_calendario_eventos WHERE tipo_evento = 'G' AND gratis_pago = 'P' ",
    };
  
    try {
      const { rows } = await pool.query(query);
      console.log(rows)
      
    } catch (error) {
      console.log("error")
    }
  };

  vertabla()
