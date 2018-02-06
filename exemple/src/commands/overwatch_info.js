const infoPlayer = (message) => {
    var owjs = require("overwatch-js");
    var Discord = require("discord.js");
    const value = message.content.substr(9);
    console.log(value);
    owjs.getAll("pc", "eu", `${value}`)
    .then((data) => {
        //console.dir(data, {depth : 2, colors : true})
        var ovInfoProfileEmbed = new Discord.RichEmbed()
        .setTitle("Profile")
        .addField("Pseudo : ", data.profile.nick)
        .addField("Niveau", data.profile.level)
        .setImage(data.profile.avatar)
        .setThumbnail(data.profile.rankPicture)
        .addField("Tier", data.profile.ranking)
        .addField("Rank", data.profile.rank)
        .addField("Lien vers le profile", data.profile.url);
        message.channel.send(ovInfoProfileEmbed); 

        var ovInfoCompGlobala = new Discord.RichEmbed()
        .setTitle("En compétition : Globale de cette saison première partie:")
        .addField("Parties jouées : ", data.competitive.global.games_played)
        .addField("Parties gagnées : ", data.competitive.global.games_won)
        .addField("Parties perdues : ", data.competitive.global.games_lost)
        .addField("Kills seul : ", data.competitive.global.solo_kills)
        .addField("Kills à plusieurs : ", data.competitive.global.multikill)
        .addField("Kills objectifs : ", data.competitive.global.objective_kills)
        .addField("Kills environement : ", data.competitive.global.environmental_kills)
        .addField("Eliminations : ", data.competitive.global.eliminations);
        message.channel.send(ovInfoCompGlobala);

        var ovInfoCompGlobalb = new Discord.RichEmbed()
        .setTitle("Globale de cette saison deuxième partie :")
        .addField("Nombre de morts : ", data.competitive.global.deaths)
        .addField("Morts par l environnement", data.competitive.global.environmental_kills)
        .addField("Médailles : ", `total : ${data.competitive.global.medals}\nen or : ${data.competitive.global.medals_gold}\nen argent : ${data.competitive.global.medals_silver}\nen bronze : ${data.competitive.global.medals_bronze}`)
        .addField("Dégats totaux : ", data.competitive.global.all_damage_done)
        .addField("Dégats de la barrière : ", data.competitive.global.barrier_damage_done)
        .addField("Tourelles détruites", data.competitive.global.turrets_destroyed)
        .addField("Healing total : ", data.competitive.global.healing_done);
        message.channel.send(ovInfoCompGlobalb);

        var ovInfoCompGlobalc = new Discord.RichEmbed()
        .setTitle("Globale de cette saison troisième partie :")
        .addField("Record d élimination dans une partie : ", data.competitive.global.eliminations_most_in_game)
        .addField("Record de dégats dans une partie : ", data.competitive.global.all_damage_done_most_in_game)
        .addField("Record de Healing dans une partie : ", data.competitive.global.healing_done_most_in_game)
        .addField("Record d assistance défencive dans une partie : ", data.competitive.global.defensive_assist_most_in_game)
        .addField("Record d assistance offensive ", data.competitive.global.offensive_assists_most_in_game)
        .addField("Record de tourrelles détruit au cours d une partie", data.competitive.global.turrets_destroyed_most_in_game)
        .addField("Record de kills pendant un objectif dans une partie", data.competitive.global.objective_kills_most_in_game)
        .addField("Record de kills en solo pendant une partie", data.competitive.global.solo_kills_most_in_game);
        message.channel.send(ovInfoCompGlobalc);
        var achievement = data.achievements;
        message.channel.send("Succès du joueur :");
        let i;
        for (i = 0; i < achievement.length; i++) {
            if (achievement[i].acquired === true) {
            message.channel.send(achievement[i].title);
            message.channel.send(achievement[i].description);
        }
    }})
    .catch((error) => {
        console.error(error);
        message.channel.send(`Il y a eu une erreur : ${error}`);
      });
      
};

module.exports = infoPlayer;