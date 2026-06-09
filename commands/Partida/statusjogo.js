const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

const setoresCampo = {
    "C1": "Ponta Esquerda", "C2": "Goleiro", "C3": "Ponta Direita",
    "C4": "Lateral Esquerdo", "C5": "Zagueiro", "C6": "Lateral Direito",
    "C7": "Ponta Esquerda", "C8": "Centro Avante", "C9": "Ponta Direita",
    "C10": "Ponta Esquerda", "C11": "Centro Avante", "C12": "Ponta Direita",
    "C13": "Lateral Esquerdo", "C14": "Zagueiro", "C15": "Lateral Direito",
    "C16": "Ponta Esquerda", "C17": "Goleiro", "C18": "Ponta Direita"
};

module.exports = {
    name: 'statusjogo',
    description: 'Mostra o status atual da partida',
    aliases: ['status', 'jogo'],
    async execute(message, args) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) {
            dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        }
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) {
            return message.reply('❌ Não há partida ativa neste canal!');
        }

        const posseInfo = partida.posse ? 
            `${partida.jogadores[partida.posse]?.nome || partida.posseNome || 'Alguém'} (${partida.bolaSetor || 'C13'})` : 
            "⚽ Ninguém (bola solta)";

        const jogadoresCasa = partida.times?.[partida.timeCasa]?.jogadores?.map(id => {
            const j = partida.jogadores[id];
            return `${j?.nome || 'Jogador'} (${j?.setor || 'C13'})`;
        }).join(', ') || "Nenhum";
        
        const jogadoresFora = partida.times?.[partida.timeFora]?.jogadores?.map(id => {
            const j = partida.jogadores[id];
            return `${j?.nome || 'Jogador'} (${j?.setor || 'C13'})`;
        }).join(', ') || "Nenhum";

        let estadoTexto = "";
        if (partida.aguardandoChute) {
            estadoTexto = "🟡 Aguardando defesa do chute!";
        } else if (partida.aguardandoPasse) {
            estadoTexto = "🟡 Aguardando domínio do passe!";
        } else if (partida.aguardandoDominio) {
            estadoTexto = "🟡 Aguardando domínio da bola!";
        } else if (partida.aguardandoPontapeAposGol) {
            estadoTexto = "🟡 Aguardando tiro de meta!";
        } else {
            estadoTexto = partida.ativa ? '🟢 EM ANDAMENTO' : '🔴 FINALIZADA';
        }

        const embed = new EmbedBuilder()
            .setColor('#00BFFF')
            .setTitle(`📊 ${partida.timeCasa} vs ${partida.timeFora}`)
            .setDescription(`**${partida.timeCasa}** 🆚 **${partida.timeFora}**`)
            .addFields(
                { name: '🏆 PLACAR', value: `## ${partida.golsCasa || 0} - ${partida.golsFora || 0}`, inline: false },
                { name: '⏱️ MINUTO', value: `${partida.minuto || 0}'`, inline: true },
                { name: '🎯 BOLA', value: `${partida.bolaSetor || 'C13'} (${setoresCampo[partida.bolaSetor] || 'Meio-Campo'})`, inline: true },
                { name: '🔄 POSSE', value: posseInfo, inline: true },
                { name: '📊 STATUS', value: estadoTexto, inline: true },
                { name: `👥 ${partida.timeCasa}`, value: jogadoresCasa || "Nenhum", inline: true },
                { name: `👥 ${partida.timeFora}`, value: jogadoresFora || "Nenhum", inline: true }
            )
            .setFooter({ text: '⚽ Blue Lock' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};