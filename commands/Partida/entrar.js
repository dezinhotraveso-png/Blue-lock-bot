const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

function criarPartida(timeCasa, timeFora) {
    return {
        ativa: true,
        timeCasa: timeCasa,
        timeFora: timeFora,
        golsCasa: 0,
        golsFora: 0,
        jogadores: {},
        times: {
            [timeCasa]: { jogadores: [] },
            [timeFora]: { jogadores: [] }
        },
        posse: null,
        minuto: 0,
        tempo: "1º Tempo"
    };
}

module.exports = {
    name: 'partida',
    description: '⚽ Gerencia a partida',
    aliases: ['partidaadmin'],
    async execute(message, args) {
        const subComando = args[0]?.toLowerCase();
        
        // ==========================================
        // INICIAR PARTIDA
        // ==========================================
        if (subComando === 'iniciar') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};

            const partidaId = `partida_${message.channel.id}`;
            
            if (dados.partidas[partidaId] && dados.partidas[partidaId].ativa) {
                return message.reply('❌ Já há uma partida ativa neste canal!');
            }
            
            const timeCasa = args[1] || 'Time da Casa';
            const timeFora = args[2] || 'Time Visitante';
            
            dados.partidas[partidaId] = criarPartida(timeCasa, timeFora);
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('⚽ PARTIDA INICIADA!')
                .setDescription(
                    `🏠 **${timeCasa}** vs ✈️ **${timeFora}**\n\n` +
                    `Use \`c!entrar [casa/fora]\` para entrar no time!\n` +
                    `Use \`c!campo\` para ver o estado da partida!`
                )
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // ==========================================
        // ENCERRAR PARTIDA
        // ==========================================
        if (subComando === 'encerrar' || subComando === 'end') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};
            
            const partidaId = `partida_${message.channel.id}`;
            
            if (!dados.partidas[partidaId] || !dados.partidas[partidaId].ativa) {
                return message.reply('❌ Não há partida ativa neste canal!');
            }
            
            const partida = dados.partidas[partidaId];
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🏁 PARTIDA ENCERRADA!')
                .setDescription(
                    `**Placar final:**\n` +
                    `🏠 ${partida.timeCasa}: ${partida.golsCasa || 0}\n` +
                    `✈️ ${partida.timeFora}: ${partida.golsFora || 0}\n\n` +
                    `👥 Total de jogadores: ${Object.keys(partida.jogadores || {}).length}`
                )
                .setTimestamp();
            
            delete dados.partidas[partidaId];
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            
            return message.reply({ embeds: [embed] });
        }
        
        // ==========================================
        // GOL (marcar gol)
        // ==========================================
        if (subComando === 'gol') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};
            
            const partidaId = `partida_${message.channel.id}`;
            const partida = dados.partidas[partidaId];
            
            if (!partida || !partida.ativa) {
                return message.reply('❌ Não há partida ativa!');
            }
            
            const time = args[1]?.toLowerCase();
            
            if (time === 'casa') {
                partida.golsCasa = (partida.golsCasa || 0) + 1;
                fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
                return message.reply(`⚽ **GOL DO ${partida.timeCasa}!** Placar: ${partida.golsCasa} - ${partida.golsFora || 0}`);
            } else if (time === 'fora') {
                partida.golsFora = (partida.golsFora || 0) + 1;
                fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
                return message.reply(`⚽ **GOL DO ${partida.timeFora}!** Placar: ${partida.golsCasa || 0} - ${partida.golsFora}`);
            } else {
                return message.reply('❌ Use: `c!partida gol casa` ou `c!partida gol fora`');
            }
        }
        
        // ==========================================
        // PLACAR (ver ou setar)
        // ==========================================
        if (subComando === 'placar') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};
            
            const partidaId = `partida_${message.channel.id}`;
            const partida = dados.partidas[partidaId];
            
            if (!partida || !partida.ativa) {
                return message.reply('❌ Não há partida ativa!');
            }
            
            // Setar placar manualmente
            const golsCasa = parseInt(args[1]);
            const golsFora = parseInt(args[2]);
            
            if (!isNaN(golsCasa) && !isNaN(golsFora)) {
                partida.golsCasa = golsCasa;
                partida.golsFora = golsFora;
                fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
                return message.reply(`📊 **Placar alterado:** ${partida.timeCasa} ${golsCasa} - ${golsFora} ${partida.timeFora}`);
            }
            
            // Mostrar placar
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('📊 PLACAR')
                .setDescription(
                    `🏠 **${partida.timeCasa}:** ${partida.golsCasa || 0}\n` +
                    `✈️ **${partida.timeFora}:** ${partida.golsFora || 0}\n\n` +
                    `⏰ **Tempo:** ${Math.floor(partida.minuto || 0)}' ${partida.tempo || "1º Tempo"}`
                )
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // ==========================================
        // TEMPO (avançar ou setar)
        // ==========================================
        if (subComando === 'tempo') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};
            
            const partidaId = `partida_${message.channel.id}`;
            const partida = dados.partidas[partidaId];
            
            if (!partida || !partida.ativa) {
                return message.reply('❌ Não há partida ativa!');
            }
            
            const acrescimo = parseInt(args[1]);
            
            if (!isNaN(acrescimo) && acrescimo > 0) {
                const novoMinuto = (partida.minuto || 0) + acrescimo;
                partida.minuto = novoMinuto;
                
                if (novoMinuto >= 45 && partida.tempo === "1º Tempo") {
                    partida.tempo = "Intervalo";
                } else if (novoMinuto >= 90 && partida.tempo === "2º Tempo") {
                    partida.tempo = "Fim de Jogo";
                } else if (partida.tempo === "Intervalo" && args[2] === 'voltar') {
                    partida.tempo = "2º Tempo";
                    partida.minuto = 45;
                }
                
                fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
                return message.reply(`⏰ **Tempo avançado para ${Math.floor(partida.minuto)}' ${partida.tempo}**`);
            }
            
            return message.reply('❌ Use: `c!partida tempo <minutos>`');
        }
        
        // ==========================================
        // POSSE (trocar posse de bola)
        // ==========================================
        if (subComando === 'posse') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};
            
            const partidaId = `partida_${message.channel.id}`;
            const partida = dados.partidas[partidaId];
            
            if (!partida || !partida.ativa) {
                return message.reply('❌ Não há partida ativa!');
            }
            
            const alvo = message.mentions.users.first();
            if (!alvo) {
                return message.reply('❌ Mencione o jogador que ficará com a posse!');
            }
            
            if (!partida.jogadores[alvo.id]) {
                return message.reply(`❌ ${alvo.username} não está na partida!`);
            }
            
            partida.posse = alvo.id;
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            
            return message.reply(`⚽ **Posse de bola transferida para ${alvo.username}!**`);
        }
        
        // ==========================================
        // LISTAR JOGADORES
        // ==========================================
        if (subComando === 'jogadores') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};
            
            const partidaId = `partida_${message.channel.id}`;
            const partida = dados.partidas[partidaId];
            
            if (!partida || !partida.ativa) {
                return message.reply('❌ Não há partida ativa!');
            }
            
            const jogadoresCasa = [];
            const jogadoresFora = [];
            
            for (const [id, jogador] of Object.entries(partida.jogadores)) {
                if (jogador.time === partida.timeCasa) {
                    jogadoresCasa.push(`• ${jogador.nome}`);
                } else {
                    jogadoresFora.push(`• ${jogador.nome}`);
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('👥 JOGADORES NA PARTIDA')
                .setDescription(
                    `🏠 **${partida.timeCasa} (${jogadoresCasa.length})**\n${jogadoresCasa.join('\n') || 'Nenhum'}\n\n` +
                    `✈️ **${partida.timeFora} (${jogadoresFora.length})**\n${jogadoresFora.join('\n') || 'Nenhum'}`
                )
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // ==========================================
        // SAIR (sair da partida)
        // ==========================================
        if (subComando === 'sair') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};
            
            const partidaId = `partida_${message.channel.id}`;
            const partida = dados.partidas[partidaId];
            
            if (!partida || !partida.ativa) {
                return message.reply('❌ Não há partida ativa!');
            }
            
            if (!partida.jogadores[message.author.id]) {
                return message.reply('❌ Você não está na partida!');
            }
            
            const nomeTime = partida.jogadores[message.author.id].time;
            delete partida.jogadores[message.author.id];
            
            if (partida.times && partida.times[nomeTime]) {
                partida.times[nomeTime].jogadores = partida.times[nomeTime].jogadores.filter(id => id !== message.author.id);
            }
            
            if (partida.posse === message.author.id) {
                partida.posse = null;
            }
            
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            
            return message.reply(`👋 **${message.author.username} saiu da partida!**`);
        }
        
        // ==========================================
        // HELP
        // ==========================================
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('⚽ COMANDOS DE PARTIDA')
            .setDescription(
                `**Para jogadores:**\n` +
                `• \`c!entrar [casa/fora]\` - Entrar na partida\n` +
                `• \`c!sair\` - Sair da partida\n` +
                `• \`c!campo\` - Ver estado do campo\n\n` +
                `**Para administradores:**\n` +
                `• \`c!partida iniciar [timeCasa] [timeFora]\` - Iniciar partida\n` +
                `• \`c!partida encerrar\` - Encerrar partida\n` +
                `• \`c!partida gol [casa/fora]\` - Marcar gol\n` +
                `• \`c!partida placar [casa] [fora]\` - Ver/alterar placar\n` +
                `• \`c!partida tempo [minutos]\` - Avançar tempo\n` +
                `• \`c!partida posse @jogador\` - Trocar posse\n` +
                `• \`c!partida jogadores\` - Listar jogadores`
            )
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};