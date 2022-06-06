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

router.post('/paros-palas', async (req, res) => {
    var newData = req.body
    if (await createParosPalas(newData)) {
        const response = { status: "success" }
        return res.json(response)
    } else {
        const response = { status: "No hay data en Modulos"}
        return res.status(500).json(response)
    }
})

router.post('/paros-camiones', async (req, res) => {
    var newData = req.body
    if (await createParosCamiones(newData)) {
        const response = { status: "success" }
        return res.json(response)
    } else {
        const response = { status: "No hay data en Modulos"}
        return res.status(500).json(response)
    }
})

async function createParosPalas(newData) {
    console.log(newData)
    var hoy=new Date(parseInt(newData.myDate, 10))
    var fecha= hoy.getDate() + '/' +(hoy.getMonth()+1) +'/' + hoy.getFullYear()
    var hora= hoy.getHours()+':'+hoy.getMinutes()+':'+hoy.getSeconds()
    var fechahora=fecha+' '+hora
        
    try {
        await sql.connect(config)
        // Modulo de esteril 1, leemos ModulosDetalle para obtener los datos
        var result = await sql.query`Select Top 1 * From ModuloDetalle`
        if (result.rowsAffected[0] == 0){
            console.log("No hay data en Modulos -> " + newData.maquina) 
            return false
        }    
        var fechaT=result.recordset[0].FechaTurno
        var turno=result.recordset[0].Turno

        // Finaliza Paro, si lo hay
        result = await sql.query`Select dbo.MaquinaParada(${newData.maquina}) As id`
        if (result.rowsAffected[0] > 0) {
            var id=result.recordset[0].id
            result = await sql.query`Set DateFormat DMY Exec dbo.GrabaFinalParo ${id}, ${fechahora}`
            console.log("==Final Paro Grabado== " + id)    
        }

        // Finaliza Actividad, si lo hay
        result = await sql.query`Select dbo.ApoyoMaquina(${newData.maquina}) As id`
        if (result.rowsAffected[0] > 0) {
            var id=result.recordset[0].id
            result = await sql.query`Set DateFormat DMY Exec dbo.GrabaFinalApoyo ${id}, ${fechahora}, 1`
            console.log("==Final Apoyo Grabado== " + id)  
        }

        result = await sql.query`Set DateFormat DMY Exec dbo.GrabaInicioParo ${newData.maquina}, ${fechaT}, ${turno}, ${fechahora}, ${newData.codigoParo}, ${newData.codDetalle}, 'APP_SISMA',0,1`
        console.log("==Inicio Paro Grabado==")    
        return true

    } catch (err) {
        console.log(err.message.red);
        var botMessage ="Error Paros  " + newData.maquina  + newData.maquina + "  Codigo Paro " + newData.codigoParo  + "  Codigo Paro Detalle " + newData.codDetalle + " Fecha Hora " + fechahora 
        console.log(botMessage)
        bot.sendBot(bot.idChatBaseUno, botMessage)
        return false
    }
}


async function createParosCamiones(newData){
    console.log(newData)
    var hoy=new Date(parseInt(newData.myDate, 10))
    var fecha= hoy.getDate() + '/' +(hoy.getMonth()+1) +'/' + hoy.getFullYear()
    var hora= hoy.getHours()+':'+hoy.getMinutes()+':'+hoy.getSeconds()
    var fechahora=fecha+' '+hora
        
    try {
        await sql.connect(config)
        // Modulo de esteril 1, leemos ModulosDetalle para obtener los datos
        var result = await sql.query`Select Top 1 * From ModuloDetalle`
        if (result.rowsAffected[0] == 0){
            console.log("No hay data en Modulos -> " + newData.maquina) 
            return false
        }    
        var fechaT=result.recordset[0].FechaTurno
        var turno=result.recordset[0].Turno
        var fechahora=fechahora

        // Finaliza Paro, si lo hay
        result = await sql.query`Select dbo.MaquinaParada(${newData.maquina}) As id`
        if (result.rowsAffected[0] > 0) {
            var id=result.recordset[0].id
            result = await sql.query`Set DateFormat DMY Exec dbo.GrabaFinalParo ${id}, ${fechahora}`
            console.log("==Final Paro Grabado== " + id)    
        }

        // Finaliza viaje, si lo hay
        result = await sql.query`Select dbo.ViajeMaquina(${newData.maquina}) As id`
        if (result.rowsAffected[0] > 0) {
            var id=result.recordset[0].id
            result = await sql.query`Set DateFormat DMY Exec dbo.GrabaFinalViaje ${id}, ${fechahora},1,0,1 `
            console.log("==Final Viaje Grabado== " + id)  
        }

        result = await sql.query`Set DateFormat DMY Exec dbo.GrabaInicioParo ${newData.maquina}, ${fechaT}, ${turno}, ${fechahora}, ${newData.codigoParo}, ${newData.codDetalle}, 'APP_SISMA',0,1`
        console.log("==Inicio Paro Grabado==")    
        return true

    } catch (err) {
        var botMessage ="Error Paros  " + newData.maquina  + newData.maquina + "  Codigo Paro " + newData.codigoParo  + "  Codigo Paro Detalle " + newData.codDetalle + " Fecha Hora " + fechahora 
        console.log(botMessage)
        bot.sendBot(bot.idChatBaseUno, botMessage)

        console.log(err.message.red);
        return false
    }
}

module.exports = router;
