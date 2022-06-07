const express = require('express');
const router = express.Router();
const axios = require('axios');
const colors = require('colors');
const sql = require('mssql');
const bot = require("./telegram.js")
const jwt = require("jsonwebtoken")


// Base de Datos SQL SERVER
const config = {
    user: 'sa',
    password: 'A$123bcd',
    database: 'RIVHER',
    server: '127.0.0.1',
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


async function ActivacionRevision(fecha){
    try {
        await sql.connect(config)
        var result = await sql.query `Select DISTINCT Nit, CodigoAplicacion From Movimientos Where DATEDIFF(DAY, Fecha, Getdate())>15`
        //console.log(result)
        if (result.rowsAffected[0] != 0){
            var contador=result.rowsAffected[0] 
            for(i=0; i<contador ; i++ ){
                var resultupdate = await sql.query `UPDATE Avisos SET Estado='AC' WHERE Empresa=${result.recordset[i].Nit} AND CodigoAplicacion=${result.recordset[i].CodigoAplicacion} AND Tipo='REVISION'`
                if (resultupdate.rowsAffected[0] != 0){
                    var botMessage ="UPDATE Para Revision, Nit " + result.recordset[i].Nit + ' Aplicacion ' + result.recordset[i].CodigoAplicacion
                    bot.sendBot(bot.idChatBaseUno, botMessage)
                }else{
                    var botMessage ="ERROR UPDATE Para Revision, Nit " + result.recordset[i].Nit + ' Aplicacion ' + result.recordset[i].CodigoAplicacion
                    bot.sendBot(bot.idChatBaseUno, botMessage)
                }
            }
        }    
    } catch (err) {
        console.log('Error'+ err)
        var botMessage ="ERROR UPDATE Para Revision " + err
        bot.sendBot(bot.idChatBaseUno, botMessage)
    }
    return    
}

function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@*?%&$#" 
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  

module.exports={
    ActivacionRevision,
    makeid
}