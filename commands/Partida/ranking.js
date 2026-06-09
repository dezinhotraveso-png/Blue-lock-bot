const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'ranking',
    description: 'Mostra o ranking geral de todos os jogadores',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync('./blueLock.json')) {
            dados = JSON.parse(fs.readFileSync('./blueLock.json', 'utf8'));
        }
        if (!dados.rankingGeral) dados.rankingGeral = {};

        // Atualiza ranking baseado nas estatísticas das partidas
        if (dados.partidas) {
            for (const [idPartida, partida] of Object.entries(dados.partidas)) {
                if (partida.estatisticas) {
                    for (const [playerId, stats] of Object.entries(partida.estatisticas)) {
                        if (!dados.rankingGeral[playerId]) {
                            dados.rankingGeral[playerId] = { passes: 0, chutes: 0, gols: 0, cruzamentos: 0, partidas: 0 };
                        }
                        dados.rankingGeral[playerId].passes += stats.passes || 0;
                        dados.rankingGeral[playerId].chutes += stats.chutes || 0;
                        dados.rankingGeral[playerId].gols += stats.gols || 0;
                        dados.rankingGeral[playerId].cruzamentos += stats.cruzamentos || 0;
                        if (stats.passes > 0 || stats.chutes > 0 || stats.gols > 0 || stats.cruzamentos > 0) {
                            dados.rankingGeral[playerId].partidas++;
                        }
                    }
                }
            }
            fs.writeFileSync('./blueLock.json', JSON.stringify(dados, null, 2));
        }

        // Monta ranking
        let ranking = [];
        for (const [id, stats] of Object.entries(dados.rankingGeral)) {
            const member = await message.guild.members.fetch(id).catch(() => null);
            const nome = member ? member.displayName : `Jogador ${id.slice(0, 6)}`;
            ranking.push({ nome, ...stats });
        }

        ranking.sort((a, b) => b.gols - a.gols);
        const top10 = ranking.slice(0, 10);

        let texto = top10.map((j, i) => {
            const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⚽';
            return `${medalha} **${j.nome}**\n▫️ Gols: ${j.gols} | Partidas: ${j.partidas} | Chutes: ${j.chutes}`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 RANKING GERAL BLUE LOCK 🏆')
            .setDescription(texto || 'Nenhum jogador registrado ainda.')
            .setFooter({ text: '⚽ Use c!estatisticas para ver detalhes da partida' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};