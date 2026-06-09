const { EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../../utils/permissions.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

module.exports = {
    name: 'finalizar',
    description: 'Encerra a partida atual',
    async execute(message, args, client, context) {
        // 🔒 VERIFICA PERMISSÃO AUTOMATICAMENTE
        if (!isAdmin(message.member)) {
            const embed = new EmbedBuilder()
                .setColor('#DC143C')
                .setAuthor({ name: `⛔ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTitle('❌ ACESSO NEGADO')
                .setDescription('Apenas **Administradores** podem finalizar partidas.')
                .setFooter({ text: '⚽ Blue Lock' });
            return message.reply({ embeds: [embed] });
        }

        let dados = {};
        if (fs.existsSync(blueLockPath)) {
            dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        }
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) {
            return message.reply('❌ Não há partida ativa para finalizar!');
        }

        partida.ativa = false;

        let vencedor = '';
        let iconeVencedor = '';
        
        if (partida.golsCasa > partida.golsFora) {
            vencedor = partida.timeCasa;
            iconeVencedor = '🏆';
        } else if (partida.golsFora > partida.golsCasa) {
            vencedor = partida.timeFora;
            iconeVencedor = '🏆';
        } else {
            vencedor = 'EMPATE';
            iconeVencedor = '🤝';
        }

        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTitle(`🏆 ${partida.timeCasa} ${partida.golsCasa} x ${partida.golsFora} ${partida.timeFora}`)
            .setDescription(`## ${iconeVencedor} ${vencedor} ${iconeVencedor}`)
            .addFields(
                { name: '📊 ESTATÍSTICAS FINAIS', value: 'Use `c!estatisticas` para ver os números da partida!', inline: false },
                { name: '⏱️ TEMPO TOTAL', value: `${Math.floor(partida.minuto)} minutos`, inline: true },
                { name: '🏆 CAMPEÃO', value: vencedor, inline: true }
            )
            .setFooter({ text: '⚽ Blue Lock' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};