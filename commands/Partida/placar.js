const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

module.exports = {
    name: 'placar',
    description: 'Mostra o placar atual da partida',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida) {
            return message.reply('❌ Não há partida ativa neste canal!');
        }

        const tempo = partida.ativa ? `${partida.minuto?.toFixed(1) || 0}'` : 'FIM DE JOGO';
        const status = partida.ativa ? '🟢 Em andamento' : '🔴 Finalizada';
        const cor = partida.ativa ? '#00BFFF' : '#808080';

        const texto = 
            `˚ ˳ ﹙⚽﹚***__PLACAR DO JOGO__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏠 ⦘**  **__${partida.timeCasa || 'Casa'}__**  vs  **__${partida.timeFora || 'Fora'}__**\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙🏆﹚***__Placar__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__${partida.timeCasa || 'Casa'}__** —  \`${partida.golsCasa || 0}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__${partida.timeFora || 'Fora'}__** —  \`${partida.golsFora || 0}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> ˚ ˳ ﹙📊﹚***__Informações__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⏱️ ⦘**  **__Tempo__** —  \`${tempo}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📊 ⦘**  **__Status__** —  \`${status}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Posse__** —  \`${partida.posseNome || 'Ninguém'}\`\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use c!campo para ver o mapa!***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

        const embed = new EmbedBuilder()
            .setColor(cor)
            .setAuthor({ name: `⚽ ${partida.timeCasa || 'Casa'} vs ${partida.timeFora || 'Fora'}`, iconURL: message.guild?.iconURL() })
            .setTitle('⚽ PLACAR DO JOGO')
            .setDescription(texto)
            .setFooter({ text: '⚽ Blue Lock RPG' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};