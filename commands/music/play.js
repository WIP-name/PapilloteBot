const { Command } = require("discord.js-commando");
const { RichEmbed } = require("discord.js");

var servers = {}

function play(connection, msg) {
    var server = servers[msg.guild.id];
    server.dispatcher = connection.playArbitraryInput();
    server.queue.shift();
    server.dispatcher.on("end", function() {
        if (server.queue[0]) play(connection, msg);
        else connection.disconnect();
    })
}

module.exports = class PlayCommand extends Command {
    constructor(client) {
        super(client, {
            name: "play",
            aliases: ["p"],
            memberName: "play",
            group : "music",
            description: "",
            examples: [""],
            args: [
                {
                   key: "linkname",
                   prompt: "lien/nom de la music/playlist",
                   type: "string"
                }
            ]
        });    
    }

    run(msg, { linkname }) {
        if (!msg.member.voiceChannel) {
            return msg.say("Tu dois être dans un channel vocal !")
        };
        if (!servers[msg.guild.id]) servers[msg.guild.id] = {
            queue: []
        };
        var server = servers[msg.guild.id]

        server.queue.push(linkname);

        if (!msg.guild.voiceConnection) msg.member.voiceChannel.join().then(function(connection) {
            play(connection, msg)
        });
    }
};
