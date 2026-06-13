const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

module.exports = {
    name: 'campo',
    description: '🏟️ Mostra o campo de futebol',
    aliases: ['field', 'estadio'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        // Se não houver partida, mostra só a imagem do campo
        if (!partida || !partida.ativa) {
            const embed = new EmbedBuilder()
                .setColor('#2E86C1')
                .setTitle('🏟️ CAMPO DE FUTEBOL')
                .setDescription('⚽ Use `c!partida iniciar` para começar uma partida!')
                .setImage('https://cdn.discordapp.com/attachments/1471676738672267446/1510506479554134176/Screenshot_2025-06-28-19-08-25-919_com.discord-edit.jpg')
                .setFooter({ text: 'Blue Lock • Sistema de Futebol' });
            
            return message.reply({ embeds: [embed] });
        }

        // Se houver partida, mostra com informações básicas
        const minuto = Math.floor(partida.minuto || 0);
        const tempo = partida.tempo || "1º Tempo";
        
        const embed = new EmbedBuilder()
            .setColor('#2E86C1')
            .setTitle(`🏟️ ${partida.timeCasa || 'Casa'} vs ${partida.timeFora || 'Fora'}`)
            .setDescription(`⏰ ${minuto}' ${tempo}\n\n🏠 ${partida.golsCasa || 0} - ${partida.golsFora || 0} ✈️`)
            .setImage('https://cdn.discordapp.com/attachments/1471676738672267446/1510506479554134176/Screenshot_2025-06-28-19-08-25-919_com.discord-edit.jpg')
            .setFooter({ text: `👥 ${Object.keys(partida.jogadores || {}).length} jogadores em campo` })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};