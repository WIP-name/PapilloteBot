const Commando = require("discord.js-commando");
const path = require("path");
const config = require("./config.json");
//const configg = require("./config.1.json");
var secondes = 0;
var minutes = 0;
var heures = 0;
var fs = require("fs");
fs.writeFileSync("commands/help/seconde.json", secondes);
fs.writeFileSync("commands/help/minute.json", minutes);
fs.writeFileSync("commands/help/heure.json", heures);


const client = new Commando.Client({
  commandPrefix: config.prefix,
  owner: [config.owner1, config.owner2],
  disableEveryone: false
});

client.registry
    .registerDefaultTypes()
    .registerGroups([
        ["citations", "Citations Commands"],
        ["images", "Images Commands"],
        ["info", "info commandes"],
        ["utile", "commandes utiles"],
        ["games", "commandes jeux"],
        ["music", "commandes pour écouter de la musique"]
    ])
    .registerDefaultGroups()
    .registerDefaultCommands({
      help: true
    })
    .registerCommandsIn(path.join(__dirname, "commands"));

function uptime() {
  secondes++;
  fs.writeFileSync("commands/help/seconde.json", secondes);
  
  if (secondes === 60) {
    secondes = 0;
    minutes++;
    fs.writeFileSync("commands/help/seconde.json", secondes);
    fs.writeFileSync("commands/help/minute.json", minutes);
    
  }
  if (minutes === 60) {
    minutes = 0;
    heures++;
    fs.writeFileSync("commands/help/minute.json", minutes);
    fs.writeFileSync("commands/help/heure.json", heures);
    
  }
}

client.on("ready", () => {
      console.log("Logged in!");
      client.user.setPresence({
       game: {
       name: `${config.prefix}help`,
       type: 0
      
   }
  });
      var uptimeinterval = setInterval(uptime, 1000 * 1);
      uptime();
});

client.login(process.env.BOT_TOKEN);

const sqlite = require("sqlite");

client.setProvider(
    sqlite.open(path.join(__dirname, "settings.sqlite3")).then((db) => new Commando.SQLiteProvider(db))
).catch(console.error);

const Discord = require("discord.js");
const clientt = new Discord.Client();
const ytdl = require("ytdl-core");
const request = require("request");
const getYouTubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");

var prefix = config.prefix
var guilds = {};

clientt.login(process.env.BOT_TOKEN);

clientt.on("message", function (message) {
    const member = message.member;
    const mess = message.content.toLowerCase();
    const args = message.content.split(" ").slice(1).join(" ");

    if (!guilds[message.guild.id]) {
        guilds[message.guild.id] = {
            queue: [],
            queueNames: [],
            isPlaying: false,
            dispatcher: null,
            voiceChannel: null,
            skipReq: 0,
            skippers: []
        }
    }

    if (mess.startsWith(prefix + "play")) {
        if (guilds[message.guild.id].queue.length > 0 || guilds[message.guild.id].isPlaying) {
            getID(args, function (id) {
                add_to_queue(id, message);
                fetchVideoInfo(id, function(err, videoInfo) {
                    if (err) throw new Error(err);
                    message.reply(" Ajoutée à la queue : " + videoInfo.title);
                    guilds[message.guild.id].queueNames.push(videoInfo.title)
                })
            });
        } else {
            guilds[message.guild.id].isPlaying = true;
            getID(args, function(id) {
                guilds[message.guild.id].queue.push("placeholder");
                playMusic(id, message);
                fetchVideoInfo(id, function(err, videoInfo) {
                    if (err) throw new Error(err);
                    console.log(videoInfo)
                    message.reply(" Joue maintenant : " + videoInfo.title);
                    guilds[message.guild.id].queueNames.push(videoInfo.title)
                })
            })
        }
    } else if (mess.startsWith(prefix + "skip")) {
        if (guilds[message.guild.id].skippers.indexOf(message.author.id) === -1) {
            guilds[message.guild.id].skippers.push(message.author.id);
            guilds[message.guild.id].skipReq++;
            skip_song(message);
            message.reply("Skip en cours !")
        } else {
            message.reply("Vous avez déjà voté pour un skip !")
        }
    } else if (mess.startsWith(prefix + "queue")) {
        var message2 = "```";
        for (var i = 0; i < guilds[message.guild.id].queueNames.length; i++) {
            var temp = (i + 1) + ": " + guilds[message.guild.id].queueNames[i] + (i === 0 ? "**(Musique actuelle)**" : "") + "\n";
            if ((message2 + temp).length <= 2000 - 3) {
                message2 += temp;
            } else {
                message2 += "```";
                message.channel.send(message2)
                message2 = "```";
            }
        }
        message2 += "```";
        message.channel.send(message2)
    }
});

clientt.on("ready", function () {
    console.log("Je suis prêt !")
})

function skip_song(message) {
    guilds[message.guild.id].dispatcher.end();
    if (guilds[message.guild.id].queue.length > 1) {
        playMusic(guilds[message.guild.id].queue[0].message);
    } else {
        guilds[message.guild.id].skipReq = 0;
        guilds[message.guild.id].skippers = [];
    }
}

function playMusic(id, message) {
    voiceChannel = message.member.voiceChannel;

    voiceChannel.join().then(function (connection) {
        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            filter: "audioonly"
        });
        guilds[message.guild.id].skipReq = 0;
        guilds[message.guild.id].skippers = [];

        guilds[message.guild.id].dispatcher = connection.playStream(stream);
        guilds[message.guild.id].dispatcher.on("end", function () {
            guilds[message.guild.id].skipReq = 0;
            guilds[message.guild.id].skippers = [];
            guilds[message.guild.id].queue.shift();
            guilds[message.guild.id].queueNames.shift()
            if (guilds[message.guild.id].queue.length === 0) {
                guilds[message.guild.id].queue = [];
                guilds[message.guild.id].queueNames = [];
                guilds[message.guild.id].isPlaying = false;
            } else {
                setTimeout(function () {
                    playMusic(guilds[message.guild.id].queue[0], message)
                }, 500)
            }
        })
    })
}

function getID(str, cb) {
    if (isYoutube(str)) {
        cb(getYouTubeID(str));
    } else {
        search_video(str, function (id) {
            cb(id);
        })
    }
}

function add_to_queue(strID, message) {
    if (isYoutube(strID)) {
        guilds[message.guild.id].queue.push(getYouTubeID(strID));
    } else {
        guilds[message.guild.id].queue.push(strID);
    }
}

function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + process.env.YT_KEY, function(error, response, body) {
       var json = JSON.parse(body);
       console.log(json);
       if (!json.items[0]) callback("3_-a9nVZYjk");
       else {
        callback(json.items[0].id.videoId)
       }
    })
}

function isYoutube(str) {
    return str.toLowerCase().indexOf("youtube.com") > -1;
}

//client.setProvider(
  //sqlite.open(path.join(__dirname, '.db.sqlite3')).then(db => new Commando.SQLiteProvider(db))
//).catch(console.error);

// const Discord = require("discord.js");
// const schedule = require("node-schedule");
// const config = require("./config.json");
// const configg = require("./config.1.json");
// const prefix = config.prefix;
// const addcitation = require("./src/commands/addcitations");
// const help = require("./src/commands/help");
// const tellCitation = require("./src/commands/tellcitation");
// const addanniversaire = require("./src/commands/addanniversaire");
// const annivlist = require("./src/commands/annivlist");
// const info = require("./src/commands/info");
// const weather = require("weather-js");
// const meteo = require("./src/commands/meteo");
// const bot = new Discord.Client();
// const superagent = require("superagent");
// const uptimebase = Date();
// const osuInfo = require("./src/commands/osu_info");
// const ovInfo = require("./src/commands/overwatch_info");
// const recettes = require("./recettes.json");

// async function cat() {
  
//   const { body } = await superagent
//      .get("http://random.cat/meow");
//      //.setImage();
     
//      bot.guilds.find("name", "Villageoiscraft").channels.find("name", "cat-spam").send(body.file);
     
// }

// function citationRandom() {
//   const min = Math.ceil(0);
//   const max = Math.floor(db.getCountOfCitations());

//   return Math.floor(Math.random() * (max - min) + min);
// }

// function tellcitation() {
//   const randnum = citationRandom();

//   const citation = db.getOneCitationById(randnum);
//   const citationValue = citation.citation_value;
//   const contributorCitation = citation.citation_contributor;

//   const tellcitationEmbed = new Discord.RichEmbed()
//     .setColor("#D9F200")
//     .setImage("https://omnilogie.fr/images/O/e239ced74cfc679e987778a89a95ebe0.jpg")
//     .addField("Citation de l'heure :", `${citationValue}`)
//     .addField("Contributeur :", `${contributorCitation}`)
//     .setTimestamp();
//     //bot.guilds.find("name", "Break Star")
//        //bot.channels.find("name", "bot-spam")
//        //.send(tellcitation_embed);
//     bot.guilds.find("name", "Villageoiscraft")
//        .channels.find("name", "bot-spam")
//        .send(tellcitationEmbed);
// }

// function onLogin() {
//   bot.generateInvite(["ADMINISTRATOR"]).then((link) => {
//     var ilink = link;
  
//   var interval = setInterval(tellcitation, 1000 * 60 * 60 * 1);
//   tellcitation();
//   var catinterval = setInterval(cat, 1000 * 60 * 1);
//   cat();

//   bot.on("message", async (message) => {
//     const guildname = message.guild.name;
//     const guildid = message.guild.id;
//     const guildregion = message.guild.region;
//     console.log(guildregion);
//     console.log(message.guild.roles);
    
//     db.addGuild({
//         nom: guildname,
//         id: guildid,
//         region: guildregion
      
//     });
    
//     if (message.author.bot) {
//       return;
//     }

//const speaking = require("./speak");
//       speaking(message);
//     if(!message.content.startsWith(prefix)) {
//       return;
//     }
//     var args = message.content.substring(prefix.length).split(" ");
//     if (message.content === prefix + "help") {
//       message.delete()
//   .then((msg) => console.log(`Deleted message from ${msg.author}`))
//   .catch(console.error);  
      
//       help(db,message);
//     }
//     var i = 0;
//     console.log(recettes.recette);
//     console.log(i);
//     do {
      
//     console.log(i);
//     console.log(recettes.recette[i].name);

//       if (message.content === prefix + recettes.recette[i].name) {
        
//         message.delete()
//         .then((msg) => console.log(`Deleted message from ${msg.author}`))
//         .catch(console.error);
//         var recetteEmbed = new Discord.RichEmbed()
//           .setTitle(recettes.recette[i].name)
//           .addField("Ingrédients", recettes.recette[i].ingrédients);
//           let ii = 0;
//           do {
//             //console.log(ii);
//             recetteEmbed
//             .addField(`Etape ${ii + 1}`, recettes.recette[i].étapes[ii]);
            
//             ii++;
//           } while (ii < recettes.recette[i].étapes.length);
//           message.channel.send(recetteEmbed);
//           if (recettes.recette[i].options) {
//           var recetteEmbede = new Discord.RichEmbed()
//             .setTitle("Options facultatives de cette recette");
//             let iii = 0;
//             do {
//               //console.log(ii);
//               recetteEmbede
//               .addField(`Option ${iii + 1}, Nom`, recettes.recette[i].options[iii].name)
//               .addField("Information de cette option", recettes.recette[i].options[iii].ingrédients);
              
//               iii++;
//             } while (iii < recettes.recette[i].options.length);
//             message.channel.send(recetteEmbede);}
//         }
//         i++;
//         console.log(i);
//         } while (i < recettes.recette.length + 1);

//     switch (args[0].toLowerCase()) {

//       case "addcitation":
//       message.delete()
//       .then((msg) => console.log(`Deleted message from ${msg.author}`))
//       .catch(console.error);
//         addcitation(db, message);
//         break;

//       case "tellcitation":
//       message.delete()
//       .then((msg) => console.log(`Deleted message from ${msg.author}`))
//       .catch(console.error);
//         const randnum = citationRandom();
//         tellCitation(db, message, randnum);
//         break;

//       case "addanniversaire":
//       message.delete()
//       .then((msg) => console.log(`Deleted message from ${msg.author}`))
//       .catch(console.error);
//         addanniversaire(db, message);
//         break;

//       case "annivlist":
//       message.delete()
//       .then((msg) => console.log(`Deleted message from ${msg.author}`))
//       .catch(console.error);
//         annivlist(db, message);
//         message.reply("Cette commande est en développement");
//         break;

//       case "info":
//       message.delete()
//       .then((msg) => console.log(`Deleted message from ${msg.author}`))
//       .catch(console.error);
//         var s = (Math.round(bot.uptime / 1000) % 60);
//         var m = (Math.round(bot.uptime / (1000 * 60)) % 60);
//         var h = (Math.round(bot.uptime / (1000 * 60 * 60)));
//         m = (m < 10) ? "0" + m : m;
//         s = (s < 10) ? "0" + s : s;
//         info(db,message,ilink,s, m, h);
//         break;

//       case "meteo":
//       message.delete()
//       .then((msg) => console.log(`Deleted message from ${msg.author}`))
//       .catch(console.error);
//       meteo(db,message, args);
//       break;

//       case "cat":
//       message.delete()
//       .then((msg) => console.log(`Deleted message from ${msg.author}`))
//       .catch(console.error);
//       const { body } = await superagent.get("http://random.cat/meow");
//      const embed = new Discord.RichEmbed().setColor(0x954D23).setTitle("Meow :cat:").setImage(body.file);
//      message.channel.send({embed});
//       break;

//       case "osu_info":
//       message.delete()
//       .then((msg) => console.log(`Deleted message from ${msg.author}`))
//       .catch(console.error);
//       console.log("tet");
//       osuInfo(message);
//       break;

//       case "ov_info":
//       message.delete()
//       .then((msg) => console.log(`Deleted message from ${msg.author}`))
//       .catch(console.error);
//       ovInfo(message);
//       break;

//       case "recettelist":
//       message.delete()
//       .then((msg) => console.log(`Deleted message from ${msg.author}`))
//       .catch(console.error);
//       message.channel.send(`Recettes chargées : ${recettes.recette.length + 1}`);
//       message.channel.send("La liste :");
//       var aa;
//       for (aa = 0; aa < recettes.recette.length + 1; aa++) {
//         message.channel.send(`${prefix}${recettes.recette[aa].name}`);
//       }
//       break;

//     }

//   });
// });
// }

// // const fs = require("fs");
// // bot.commands = new Discord.Collection();

// // fs.readdir("./src/commands", (err, files) => {
// //   if(err) console.error(err);

// //   let jsfiles = files.filter(f => f.split(".").pop() === "js");
// //   if(jsfiles.length <= 0) {
// //     console.log("Pas de commandes a charger");
// //     return;
// //   }

// //   console.log(`Nombre de commandes chargées: ${jsfiles.length} !`)

// //   jsfiles.forEach((f, i) => {
// //     let props = require(`./src/commands/${f}`);
// //     console.log(`${i + 1}: ${f} chargée !`);
// //     bot.commands.set(props.config.command, props);
// //   });
// // });

// bot.login(configg.token)
//   .then(() => {
//   console.log("Bot logged in");

//   //Guild = bot.guilds.find("name", "Break Star");
//      //bot.channels.find("name", "bot-spam").send("Je suis connecté vous pouvez désormais utiliser mes commandes :-)");
//   //Guild = bot.guilds.find("name", "Villageoiscraft");
//      bot.channels.find("name", "bot-spam").send("Je suis connecté vous pouvez désormais utiliser mes commandes :-)");

//  onLogin();
// })
// .catch((error) => {
//   console.log(error);
// });

// bot.on("ready", async () => {
  
//   
//   console.log("Bot Ready !");
//   //console.log(bot.commands)


// });
