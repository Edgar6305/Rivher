const express = require('express');
const router = express.Router();
const axios = require('axios');
const colors = require('colors');
const sql = require('mssql');
const bot = require("./telegram.js")

// Base de Datos SQL SERVER
const config = {
    user: 'sa',
    password: 'A$123bcd',
    database: 'BASEUNO',
    server: 'localhost',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 1000
    },
    options: {
        encrypt: true, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
};

router.post('/apoyo', async (req, res) => {
    var newData = req.body;
    if (await CreateActividad(newData)) {
        const response = { status: "success" }
        return res.json(response);
    } else {
        const response = { status: "Maquina NO figura en Modulo" }
        return res.status(500).json(response);
    }
});

async function CreateActividad(newData) {
    console.log(newData)
    var hoy=new Date(parseInt(newData.myDate, 10))
    var fecha= hoy.getDate() + '/' +(hoy.getMonth()+1) +'/' + hoy.getFullYear()
    var hora= hoy.getHours()+':'+hoy.getMinutes()+':'+hoy.getSeconds()
    var fechahora=fecha+' '+hora
    console.log(fechahora)
   
    try {
        await sql.connect(config)

        // Finaliza Paro, si lo hay
        result = await sql.query`Select dbo.MaquinaParada(${newData.maquina}) As id`
        var id=result.recordset[0].id
        if (id > 0){
            console.log("Finaliza Paro ==>", result.recordset[0])
            result = await sql.query`Set DateFormat DMY Exec dbo.GrabaFinalParo ${id}, ${fechahora}`
        } 

        // Finaliza Actividad, si lo hay
        result = await sql.query`Select dbo.ApoyoMaquina(${newData.maquina}) As id`
        var id=result.recordset[0].id
        if (id > 0){
            console.log("Finaliza Actividad ==>", result.recordset[0])
            result = await sql.query`Set DateFormat DMY Exec dbo.GrabaFinalApoyo ${id}, ${fechahora},1`
        } 

        // Datos generales del turno
        result = await sql.query`Select TOP 1 * From ModuloDetalle`
        if (result.rowsAffected[0] > 0){
            var fechaT=result.recordset[0].FechaTurno
            var turno=result.recordset[0].Turno
            var fechaI=fechahora
            var act=newData.actividad
            var ope='01'
            var usu='APP_SISMA'
            var opeC=newData.operador   

            result = await sql.query`Set DateFormat DMY Exec dbo.GrabaInicioApoyo ${newData.maquina}, ${fechaT}, ${turno},${newData.actividad}, ${fechahora}, ${newData.operador}, 'APP_SISMA',0,0,'000000'`
            console.log("==Inicio Apoyo GrabaInicioApoyo==")    

            return true
        }

        var botMessage ="Error Apoyo Actividad " + newData.actividad + " Maquina " + newData.maquina + " Operadpr " + newData.operador  + " Fecha Hora " + fechahora 
        console.log(botMessage)
        bot.sendBot(bot.idChatBaseUno, botMessage)

   } catch (err) {
        console.log(err.message.red);
        return false
    }
}

module.exports = router;