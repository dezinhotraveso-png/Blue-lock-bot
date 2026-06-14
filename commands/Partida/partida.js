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

function isAdmin(member) {
    if (!member) return false;
    return member.permissions.has('Administrator') || member.permissions.has('ManageGuild');
}

module.exports = {
    name: 'partida',
    description: '⚽ Gerencia a partida',
    aliases: ['partidaadmin', 'adminpartida'],
    async execute(message, args) {
        const subComando = args[0]?.toLowerCase();
        
        // Verifica se é admin para comandos administrativos
        const comandosAdmin = ['iniciar', 'encerrar', 'gol', 'tempo', 'posse', 'setplacar'];
        if (comandosAdmin.includes(subComando) && !isAdmin(message.member)) {
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ ACESSO NEGADO')
                .setDescription(`﹒ ⟢ 🔒 ﹒\n\n𖦹 ${message.author.username}, apenas administradores podem usar este comando!\n\n◞⚡ Você precisa do cargo de **Administrador** ou permissão de **Gerenciar Servidor**.`)
                .setFooter({ text: '⚽ Blue Lock • Permissões' })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
        
        // ==========================================
        // INICIAR PARTIDA
        // ==========================================
        if (subComando === 'iniciar') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};

            const partidaId = `partida_${message.channel.id}`;
            
            if (dados.partidas[partidaId] && dados.partidas[partidaId].ativa) {
                const embed = new EmbedBuilder()
                    .setColor('#F1C40F')
                    .setTitle('⚠️ PARTIDA JÁ ATIVA')
                    .setDescription(`﹒ ⟢ 🏟️ ﹒\n\n𖦹 Já há uma partida ativa neste canal!\n\n◞⚡ Use \`c!partida encerrar\` para terminar a atual.`)
                    .setFooter({ text: '⚽ Blue Lock' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            const timeCasa = args[1] || 'Time da Casa';
            const timeFora = args[2] || 'Time Visitante';
            
            dados.partidas[partidaId] = criarPartida(timeCasa, timeFora);
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('⚽ PARTIDA INICIADA!')
                .setDescription(
                    `﹒ ⟢ 🏆 ﹒\n\n` +
                    `𖦹 Uma nova partida começou!\n\n` +
                    `ㅤㅤ⌞ 🏠 ⌝\n` +
                    `⤷ **${timeCasa}**\n\n` +
                    `ㅤㅤ⌞ ✈️ ⌝\n` +
                    `⤷ **${timeFora}**\n\n` +
                    `◞⚡ Use \`c!entrar [casa/fora]\` para entrar no time!\n` +
                    `◞⚡ Use \`c!campo\` para ver o estado da partida!\n` +
                    `◞⚡ Use \`c!partida placar\` para ver o placar!`
                )
                .setFooter({ text: '⚽ Blue Lock • Boa sorte!' })
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
                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('❌ NENHUMA PARTIDA ATIVA')
                    .setDescription(`﹒ ⟢ 🏟️ ﹒\n\n𖦹 Não há partida ativa neste canal!\n\n◞⚡ Use \`c!partida iniciar\` para começar.`)
                    .setFooter({ text: '⚽ Blue Lock' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            const partida = dados.partidas[partidaId];
            const totalJogadores = Object.keys(partida.jogadores || {}).length;
            
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🏁 PARTIDA ENCERRADA!')
                .setDescription(
                    `﹒ ⟢ 📊 ﹒\n\n` +
                    `ㅤㅤ⌞ 📋 RESUMO ⌝\n` +
                    `⤷ 🏠 **${partida.timeCasa}:** ${partida.golsCasa || 0}\n` +
                    `⤷ ✈️ **${partida.timeFora}:** ${partida.golsFora || 0}\n` +
                    `⤷ 👥 **Total de jogadores:** ${totalJogadores}\n\n` +
                    `◞⚡ Partida encerrada por ${message.author.username}!`
                )
                .setFooter({ text: '⚽ Blue Lock' })
                .setTimestamp();
            
            delete dados.partidas[partidaId];
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            
            return message.reply({ embeds: [embed] });
        }
        
        // ==========================================
        // GOL
        // ==========================================
        if (subComando === 'gol') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};
            
            const partidaId = `partida_${message.channel.id}`;
            const partida = dados.partidas[partidaId];
            
            if (!partida || !partida.ativa) {
                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('❌ NENHUMA PARTIDA ATIVA')
                    .setDescription(`﹒ ⟢ 🏟️ ﹒\n\n𖦹 Não há partida ativa!\n\n◞⚡ Use \`c!partida iniciar\` para começar.`)
                    .setFooter({ text: '⚽ Blue Lock' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            const time = args[1]?.toLowerCase();
            const autorGol = args[2] ? message.mentions.users.first() : null;
            
            if (time === 'casa') {
                partida.golsCasa = (partida.golsCasa || 0) + 1;
                fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
                
                const embed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('⚽ GOL DO ' + partida.timeCasa.toUpperCase() + '!')
                    .setDescription(
                        `﹒ ⟢ ⚽ ﹒\n\n` +
                        `𖦹 **${partida.timeCasa}** marcou um golaço!\n\n` +
                        `ㅤㅤ⌞ 📊 PLACAR ⌝\n` +
                        `⤷ 🏠 **${partida.timeCasa}:** ${partida.golsCasa}\n` +
                        `⤷ ✈️ **${partida.timeFora}:** ${partida.golsFora || 0}\n\n` +
                        (autorGol ? `◞⚡ **Autor:** ${autorGol.username}\n` : '') +
                        `◞⚡ GOL GOL GOL!`
                    )
                    .setFooter({ text: '⚽ Blue Lock' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
                
            } else if (time === 'fora') {
                partida.golsFora = (partida.golsFora || 0) + 1;
                fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
                
                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('⚽ GOL DO ' + partida.timeFora.toUpperCase() + '!')
                    .setDescription(
                        `﹒ ⟢ ⚽ ﹒\n\n` +
                        `𖦹 **${partida.timeFora}** marcou um golaço!\n\n` +
                        `ㅤㅤ⌞ 📊 PLACAR ⌝\n` +
                        `⤷ 🏠 **${partida.timeCasa}:** ${partida.golsCasa || 0}\n` +
                        `⤷ ✈️ **${partida.timeFora}:** ${partida.golsFora}\n\n` +
                        (autorGol ? `◞⚡ **Autor:** ${autorGol.username}\n` : '') +
                        `◞⚡ GOL GOL GOL!`
                    )
                    .setFooter({ text: '⚽ Blue Lock' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#F1C40F')
                    .setTitle('⚠️ TIME INVÁLIDO')
                    .setDescription(`﹒ ⟢ ❓ ﹒\n\n𖦹 Use: \`c!partida gol casa\` ou \`c!partida gol fora\`\n\n◞⚡ Exemplo: \`c!partida gol casa @jogador\``)
                    .setFooter({ text: '⚽ Blue Lock' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
        }
        
        // ==========================================
        // PLACAR
        // ==========================================
        if (subComando === 'placar' || subComando === 'score') {
            let dados = {};
            if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
            if (!dados.partidas) dados.partidas = {};
            
            const partidaId = `partida_${message.channel.id}`;
            const partida = dados.partidas[partidaId];
            
            if (!partida || !partida.ativa) {
                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('❌ NENHUMA PARTIDA ATIVA')
                    .setDescription(`﹒ ⟢ 🏟️ ﹒\n\n𖦹 Não há partida ativa!\n\n◞⚡ Use \`c!partida iniciar\` para começar.`)
                    .setFooter({ text: '⚽ Blue Lock' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            // Setar placar manualmente
            const golsCasa = parseInt(args[1]);
            const golsFora = parseInt(args[2]);
            
            if (!isNaN(golsCasa) && !isNaN(golsFora) && isAdmin(message.member)) {
                partida.golsCasa = golsCasa;
                partida.golsFora = golsFora;
                fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
                
                const embed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('📊 PLACAR ALTERADO')
                    .setDescription(
                        `﹒ ⟢ 📝 ﹒\n\n` +
                        `𖦹 ${message.author.username} alterou o placar!\n\n` +
                        `ㅤㅤ⌞ 📊 NOVO PLACAR ⌝\n` +
                        `⤷ 🏠 **${partida.timeCasa}:** ${golsCasa}\n` +
                        `⤷ ✈️ **${partida.timeFora}:** ${golsFora}\n\n` +
                        `◞⚡ Placar atualizado com sucesso!`
                    )
                    .setFooter({ text: '⚽ Blue Lock' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            // Mostrar placar
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('📊 PLACAR ATUAL')
                .setDescription(
                    `﹒ ⟢ 🏆 ﹒\n\n` +
                    `ㅤㅤ⌞ 🏠 ⌝\n` +
                    `⤷ **${partida.timeCasa}**\n` +
                    `⤷ \`${partida.golsCasa || 0} gols\`\n\n` +
                    `ㅤㅤ⌞ ✈️ ⌝\n` +
                    `⤷ **${partida.timeFora}**\n` +
                    `⤷ \`${partida.golsFora || 0} gols\`\n\n` +
                    `ㅤㅤ⌞ ⏰ ⌝\n` +
                    `⤷ **Tempo:** \`${Math.floor(partida.minuto || 0)}' ${partida.tempo || "1º Tempo"}\`\n\n` +
                    `◞⚡ Use \`c!partida gol [casa/fora]\` para marcar um gol!`
                )
                .setFooter({ text: '⚽ Blue Lock' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // ==========================================
        // TEMPO
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
                
                const embed = new EmbedBuilder()
                    .setColor('#F1C40F')
                    .setTitle('⏰ TEMPO ATUALIZADO')
                    .setDescription(
                        `﹒ ⟢ ⏱️ ﹒\n\n` +
                        `𖦹 ${message.author.username} avançou o tempo!\n\n` +
                        `ㅤㅤ⌞ 📊 ⌝\n` +
                        `⤷ **Tempo:** \`${Math.floor(partida.minuto)}' ${partida.tempo}\`\n\n` +
                        `◞⚡ +${acrescimo} minuto(s) adicionado(s)!`
                    )
                    .setFooter({ text: '⚽ Blue Lock' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            return message.reply('❌ Use: `c!partida tempo <minutos>`');
        }
        
        // ==========================================
        // POSSE
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
                return message.reply('❌ Mencione o jogador que ficará com a posse! Ex: `c!partida posse @jogador`');
            }
            
            if (!partida.jogadores[alvo.id]) {
                return message.reply(`❌ ${alvo.username} não está na partida!`);
            }
            
            partida.posse = alvo.id;
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('⚽ POSSE TRANSFERIDA')
                .setDescription(
                    `﹒ ⟢ 🔄 ﹒\n\n` +
                    `𖦹 ${message.author.username} transferiu a posse!\n\n` +
                    `ㅤㅤ⌞ 📊 ⌝\n` +
                    `⤷ **Nova posse:** ${alvo.username}\n\n` +
                    `◞⚡ O jogo continua com ${alvo.username} no controle da bola!`
                )
                .setFooter({ text: '⚽ Blue Lock' })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
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
            
            for (const [id, jogador] of Object.entries(partida.jogadores || {})) {
                if (jogador.time === partida.timeCasa) {
                    jogadoresCasa.push(`⤷ <@${id}> (${jogador.nome})`);
                } else {
                    jogadoresFora.push(`⤷ <@${id}> (${jogador.nome})`);
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('👥 JOGADORES NA PARTIDA')
                .setDescription(
                    `﹒ ⟢ 👥 ﹒\n\n` +
                    `ㅤㅤ⌞ 🏠 ${partida.timeCasa} ⌝\n` +
                    `${jogadoresCasa.length > 0 ? jogadoresCasa.join('\n') : '⤷ *Nenhum jogador*'}\n\n` +
                    `ㅤㅤ⌞ ✈️ ${partida.timeFora} ⌝\n` +
                    `${jogadoresFora.length > 0 ? jogadoresFora.join('\n') : '⤷ *Nenhum jogador*'}\n\n` +
                    `◞⚡ Total: **${jogadoresCasa.length + jogadoresFora.length} jogadores**`
                )
                .setFooter({ text: '⚽ Blue Lock' })
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
            
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('👋 JOGADOR SAIU')
                .setDescription(
                    `﹒ ⟢ 🚪 ﹒\n\n` +
                    `𖦹 **${message.author.username}** saiu da partida!\n\n` +
                    `◞⚡ Ele foi removido do time **${nomeTime}**.\n` +
                    `◞⚡ A partida continua com os jogadores restantes!`
                )
                .setFooter({ text: '⚽ Blue Lock' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // ==========================================
        // HELP
        // ==========================================
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('⚽ COMANDOS DE PARTIDA')
            .setDescription(
                `﹒ ⟢ 📖 ﹒\n\n` +
                `ㅤㅤ⌞ 👤 PARA JOGADORES ⌝\n` +
                `⤷ \`c!entrar [casa/fora]\` - Entrar na partida\n` +
                `⤷ \`c!sair\` - Sair da partida\n` +
                `⤷ \`c!campo\` - Ver estado do campo\n\n` +
                `ㅤㅤ⌞ 👑 PARA ADMINISTRADORES ⌝\n` +
                `⤷ \`c!partida iniciar [casa] [fora]\` - Iniciar partida\n` +
                `⤷ \`c!partida encerrar\` - Encerrar partida\n` +
                `⤷ \`c!partida gol [casa/fora] [@jogador]\` - Marcar gol\n` +
                `⤷ \`c!partida placar [casa] [fora]\` - Ver/alterar placar\n` +
                `⤷ \`c!partida tempo [minutos]\` - Avançar tempo\n` +
                `⤷ \`c!partida posse @jogador\` - Trocar posse\n` +
                `⤷ \`c!partida jogadores\` - Listar jogadores\n\n` +
                `◞⚡ Utilize os comandos para gerenciar a partida!`
            )
            .setFooter({ text: '⚽ Blue Lock • Comandos' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};