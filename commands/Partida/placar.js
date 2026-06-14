const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

module.exports = {
    name: 'placar',
    description: '📊 Mostra o placar atual da partida',
    aliases: ['score', 'placa'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) {
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ NENHUMA PARTIDA ATIVA')
                .setDescription(`﹒ ⟢ 🏟️ ﹒\n\n𖦹 Não há partida ativa neste canal!\n\n◞⚡ Use \`c!partida iniciar\` para começar um jogo.`)
                .setFooter({ text: '⚽ Blue Lock • Sistema de Partidas' })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const minuto = Math.floor(partida.minuto || 0);
        const tempo = partida.tempo || "1º Tempo";
        const totalJogadores = Object.keys(partida.jogadores || {}).length;
        
        // Determina quem está na posse
        let posseNome = "Ninguém";
        if (partida.posse && partida.jogadores[partida.posse]) {
            posseNome = partida.jogadores[partida.posse].nome;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('📊 PLACAR DO JOGO')
            .setDescription(
                `﹒ ⟢ 🏆 ﹒\n\n` +
                `ㅤㅤ⌞ 🏠 ⌝\n` +
                `⤷ **${partida.timeCasa}**\n` +
                `⤷ \`⭐ ${partida.golsCasa || 0} GOLS\`\n\n` +
                `ㅤㅤ⌞ ✈️ ⌝\n` +
                `⤷ **${partida.timeFora}**\n` +
                `⤷ \`⭐ ${partida.golsFora || 0} GOLS\`\n\n` +
                `ㅤㅤ⌞ ⏰ ⌝\n` +
                `⤷ **Tempo:** \`${minuto}' ${tempo}\`\n` +
                `⤷ **Jogadores:** \`${totalJogadores}\`\n` +
                `⤷ **Posse:** \`${posseNome}\`\n\n` +
                `◞⚡ Use \`c!campo\` para ver o campo completo!`
            )
            .setFooter({ text: '⚽ Blue Lock' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};