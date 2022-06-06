const telegraf = require("telegraf")
const idChatBaseUno="1228075428"

// TELEGRAM
const bot = new telegraf("1952725201:AAFksA3nRto-cIncvbxGKkFFQslCgt0tKLU") //BaseUno
bot.launch()

bot.start((ctx) => {
    ctx.reply(`Welcome ${ctx.from.first_name} ${ctx.from.last_name}`)
    // ctx.reply('Welcome');
     // console.log(ctx)
     //console.table(ctx.from)
     // console.log(ctx.chat)
     // console.log(ctx.message)
     // console.log(ctx.updateSubTypes)
     //console.log(ctx.updateSubTypes[0])
   })

bot.on('newChatMembers', (ctx) =>{
    console.log(ctx)
    if (ctx.new_chat_member != undefined) {
        if(ctx.new_chat_member.username != undefined) {
            ctx.reply(`Welcome Nuevo Miembro ${ctx.new_chat_member.username}`)
        } else {
            ctx.reply(`Welcome ${ctx.from.first_name} ${ctx.from.last_name}`)
        }
    }
})

bot.telegram.sendMessage(idChatBaseUno, `Bienvenido Chat Base Uno`);   

function sendBot(idChad, message){
    bot.telegram.sendMessage(idChad,message);
}


module.exports={
    sendBot,
    idChatBaseUno
}
 