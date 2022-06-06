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

router.post('/viaje-esteril', async (req, res) => {
    var newData = req.body;
    if (await CreateViajes(newData)) {
        const response = { status: "success" }
        return res.json(response);
    } else {
        const response = { status: "Maquina NO figura en Modulo" }
        return res.status(500).json(response);
    }
});

async function CreateViajes(newData) {
    console.log(newData)
    var hoy=new Date(parseInt(newData.myDate, 10))
    var fecha= hoy.getDate() + '/' +(hoy.getMonth()+1) +'/' + hoy.getFullYear()
    var hora= (hoy.getHours())+':'+hoy.getMinutes()+':'+hoy.getSeconds()
    var fechahora=fecha+' '+hora
    //console.log(fechahora)
    try {
        await sql.connect(config)
        
        if(newData.tipoModulo<=2){ // ESTERIL o CARBON
            // Finaliza Paro de Pala o Apoyo, si lo hay
            var result = await sql.query`Select dbo.MaquinaParada(${newData.pala}) As id`
            var id=result.recordset[0].id
            if (id > 0) {
                console.log("Finaliza Paro Pala==>", result.recordset[0])
                result = await sql.query`Set DateFormat DMY Exec dbo.GrabaFinalParo ${id}, ${fechahora}`
            }  
            
            // Finaliza Paro de Camion, si lo hay
            result = await sql.query`Select dbo.MaquinaParada(${newData.camion}) As id`
            var id=result.recordset[0].id
            if (id > 0){
                console.log("Finaliza Paro Camion==>", result.recordset[0])
                result = await sql.query`Set DateFormat DMY Exec dbo.GrabaFinalParo ${id}, ${fechahora}`
            } 

            // Finaliza Viaje, si lo hay
            result = await sql.query`Select dbo.ViajeMaquina(${newData.camion}) As id`
            id=result.recordset[0].id
            if (id > 0){
                console.log("Finaliza Viaje==> ", result.recordset[0])
                result = await sql.query`Set DateFormat DMY Exec dbo.GrabaFinalViaje ${id}, ${fechahora},1,1,1`
            } 

            // Leemos la capacidad del camion
            var Capacidad=0
            result = await sql.query`Select Capacidad From Capacidades Where CodigoActividad=${newData.actividad} And CodigoMaquina=${newData.camion}`
            if (result.rowsAffected[0] > 0){
                Capacidad=result.recordset[0].Capacidad
                console.log("Capacidad==> " + Capacidad)
            } 
        }

        var idModulo=newData.tipoModulo
        // Modulo de esteril 1, leemos ModulosDetalle para obtener los datos
        result = await sql.query`Select * From ModuloDetalle Where IDModulo=${idModulo} And CodigoPala=${newData.pala}`
        if (result.rowsAffected[0] > 0){
            var maqC=newData.pala
            var maqA=newData.camion
            var fechaT=result.recordset[0].FechaTurno
            var turno=result.recordset[0].Turno
            var fechaI=fechahora
            var act=newData.actividad
            var ope='01'
            var manto=result.recordset[0].Manto
            var tajo=result.recordset[0].Tajo
            var des=result.recordset[0].Destino
            var viaje=1
            var dis=result.recordset[0].Distancia
            var mcb=Capacidad
            var usu='APP_SISMA'
            var valC=0
            var est=0
            var opeC=newData.operador    

            if (newData.tipoModulo<=2){
               //Graba Inicio de Viaje
                result = await sql.query`Set DateFormat DMY Exec dbo.GrabaInicioViaje ${maqC}, ${maqA}, ${fechaT}, ${turno}, ${fechaI}, ${act}, ${ope}, ${manto}, ${tajo}, ${des}, ${viaje}, ${dis}, ${mcb}, ${usu}, ${valC}, ${est},${opeC}`
                console.log("==Inicio Viaje Grabado==")    
            }

            if (newData.tipoModulo!=2){ // CARBON
                //Finaliza Actividad, si lo hay e Inicia actividad de cargue
                result = await sql.query`Select dbo.ApoyoMaquina(${newData.pala}) As id`
                id=result.recordset[0].id
                if (id > 0){
                    console.log("Final de actividad==> ", id)
                    result = await sql.query`Set DateFormat DMY Exec dbo.GrabaFinalApoyo ${id}, ${fechahora},1`
                } 
                result = await sql.query`Set DateFormat DMY Exec dbo.GrabaInicioApoyo ${maqC}, ${fechaT}, ${turno}, ${act}, ${fechaI},  ${ope}, ${usu}, 0, 0,'000000'`
                console.log("==Inicio Actividad Grabada==") 
            }
            return true
        }
        var botMessage ="Error Viaje Actividad " + newData.actividad + " Pala " + newData.pala + " Camion " + newData.camion + " Operadpr " + newData.operador  + " Fecha Hora " + fechahora 
        console.log(botMessage)
        bot.sendBot(bot.idChatBaseUno, botMessage)
        return false
    } catch (err) {
        console.log(err.message.red);
        return false
    }
}

router.post('/viajes-esteril', async (req, res) => {
    var newData = req.body;
    if (await VerifyViajes(newData)) {
        const response = { status: "success" }
        return res.json(response);
    } else {
        const response = { status: "error" }
        return res.status(500).json(response);
    }
})

/*async function VerifyViajes(newData) {
    sql.connect(config, err => {
        if (err != null) {
            console.log(err.message.red);
            return false
        }
        const xsql = "Select *  From Produccion Where MaquinaAcarreo='" + newData.camion + "' And MaquinaCargue='" + newData.pala + "'"
        new sql.Request().query(xsql, (err, result) => {
            if (err != null) {
                console.log(err.message);
                return false
            }
            console.log("Filas Grabadas ->" + result.rowsAffected);
            return true
        })
    })
}*/

async function VerifyViajes(newData) {
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await sql.connect(config)
        const result = await sql.query`Select TOP 20 * From Produccion Where MaquinaAcarreo = ${newData.camion} ` //and MaquinaCargue = ${newData.pala}
        if (result.rowsAffected[0] == 0) {
            console.log("No hay data para -> " + newData.camion + "/" + newData.pala) 
            return false
        }
        console.log(result.recordset[0])
        return true
    } catch (err) {
        console.log(err.message.red);
        return false
    }
}

module.exports = router;