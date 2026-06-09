const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

function criarMolde(icone, titulo, descricao, informativos, resultado, cor = '#FFD700') {
    let texto = `˚ ˳ ﹙${icone}﹚***__${titulo}__***\n\n`;
    texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
    texto += `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${descricao}*\n\n`;
    
    if (informativos && informativos.length > 0) {
        texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n`;
        texto += `> ˚ ˳ ﹙📊﹚***__Estatísticas__***\n\n`;
        
        informativos.forEach(info => {
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ${info.emoji} ⦘**  **__${info.label}__** —  ${info.valor}\n`;
        });
    }
    
    texto += `\n> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***${resultado}***__\n\n`;
    texto += `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
    
    return texto;
}

module.exports = {
    name: 'pontape',
    description: 'Inicia a partida ou recomeça após um gol',
    async execute(message, args, client, context) {
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

        // Verifica se o jogador está na partida
        if (!partida.jogadores[message.author.id]) {
            return message.reply('❌ Você não está na partida! Use `c!entrar casa` ou `c!entrar fora` primeiro.');
        }

        const jogador = partida.jogadores[message.author.id];
        const timeDoJogador = jogador.time;
        
        // 🔥 DETECTA SE É O PRIMEIRO PONTAPÉ OU APÓS GOL
        const isAposGol = partida.aguardandoPontapeAposGol === true;
        const isPrimeiroPontape = partida.posse === null && !isAposGol;

        // ⏰ SE FOR APÓS GOL, O TIME QUE SOFREU O GOL COMEÇA
        let quemComeca = '';
        let mensagemDados = '';
        let vencedorSorteio = '';

        if (isAposGol) {
            // Quem sofreu o gol começa com a bola
            const timeQueSofreuGol = partida.ultimoGol?.timeQueSofreu || 
                (partida.golsCasa > partida.golsFora ? partida.timeFora : partida.timeCasa);
            quemComeca = timeQueSofreuGol;
            mensagemDados = `Após o gol marcado, o time ${quemComeca} recomeça com a posse de bola!`;
            
            if (quemComeca === timeDoJogador) {
                vencedorSorteio = message.author.username;
                mensagemDados += ` ${message.author.username} irá cobrar o pontapé!`;
            } else {
                // Escolhe um jogador aleatório do time adversário
                const jogadoresTimeAdversario = partida.times[quemComeca]?.jogadores || [];
                if (jogadoresTimeAdversario.length > 0) {
                    const aleatorio = jogadoresTimeAdversario[Math.floor(Math.random() * jogadoresTimeAdversario.length)];
                    vencedorSorteio = partida.jogadores[aleatorio]?.nome || "Jogador";
                }
            }
        } else {
            // 🎲 SORTEIO INICIAL - quem deu o comando começa com vantagem
            const bonusComando = 5; // Bônus para quem digitou o comando
            const dadoCasa = Math.floor(Math.random() * 20) + 1;
            const dadoFora = Math.floor(Math.random() * 20) + 1;
            
            // Quem deu o comando ganha bônus
            let totalCasa = dadoCasa;
            let totalFora = dadoFora;
            
            if (timeDoJogador === partida.timeCasa) {
                totalCasa = dadoCasa + bonusComando;
                mensagemDados = `🎲 ${message.author.username} (${partida.timeCasa}) tem vantagem por ter iniciado o pontapé!`;
            } else {
                totalFora = dadoFora + bonusComando;
                mensagemDados = `🎲 ${message.author.username} (${partida.timeFora}) tem vantagem por ter iniciado o pontapé!`;
            }
            
            if (totalCasa > totalFora) {
                quemComeca = partida.timeCasa;
                mensagemDados += `\n📊 ${partida.timeCasa} tirou ${totalCasa} vs ${totalFora} do ${partida.timeFora}`;
                vencedorSorteio = message.author.username;
            } else if (totalFora > totalCasa) {
                quemComeca = partida.timeFora;
                mensagemDados += `\n📊 ${partida.timeFora} tirou ${totalFora} vs ${totalCasa} do ${partida.timeCasa}`;
                vencedorSorteio = message.author.username;
            } else {
                // Empate - desempate sem bônus
                const novoCasa = Math.floor(Math.random() * 20) + 1;
                const novoFora = Math.floor(Math.random() * 20) + 1;
                mensagemDados += `\n⚖️ EMPATE! Desempatando...`;
                if (novoCasa > novoFora) {
                    quemComeca = partida.timeCasa;
                    mensagemDados += `\n📊 ${partida.timeCasa} tirou ${novoCasa} vs ${novoFora}`;
                } else {
                    quemComeca = partida.timeFora;
                    mensagemDados += `\n📊 ${partida.timeFora} tirou ${novoFora} vs ${novoCasa}`;
                }
                vencedorSorteio = "Sorteio aleatório";
            }
        }

        // 🔥 ESCOLHE O JOGADOR QUE VAI INICIAR COM A BOLA
        let jogadorInicialId = message.author.id;
        let jogadorInicialNome = message.author.username;
        
        // Se o time que vai começar NÃO é o time do jogador que deu o comando
        if (quemComeca !== timeDoJogador && !isAposGol) {
            const jogadoresTime = partida.times[quemComeca]?.jogadores || [];
            if (jogadoresTime.length > 0) {
                jogadorInicialId = jogadoresTime[Math.floor(Math.random() * jogadoresTime.length)];
                jogadorInicialNome = partida.jogadores[jogadorInicialId]?.nome || "Jogador";
                vencedorSorteio = jogadorInicialNome;
            } else {
                return message.reply(`❌ O time ${quemComeca} não tem jogadores! Use \`c!entrar\` para entrar no time.`);
            }
        } else if (isAposGol && quemComeca !== timeDoJogador) {
            // Após gol, se o time do comando não é o que vai começar
            const jogadoresTime = partida.times[quemComeca]?.jogadores || [];
            if (jogadoresTime.length > 0) {
                jogadorInicialId = jogadoresTime[Math.floor(Math.random() * jogadoresTime.length)];
                jogadorInicialNome = partida.jogadores[jogadorInicialId]?.nome || "Jogador";
            }
        }

        // 🔄 ATUALIZA A PARTIDA
        partida.posse = jogadorInicialId;
        partida.posseNome = jogadorInicialNome;
        if (isPrimeiroPontape) partida.minuto = 1;
        partida.aguardandoPontapeAposGol = false;
        partida.ultimoGol = null;

        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

        // 📊 INFORMATIVOS
        const informativos = [
            { emoji: "🏆", label: "PLACAR", valor: `${partida.timeCasa}: ${partida.golsCasa} x ${partida.golsFora} ${partida.timeFora}` },
            { emoji: "⏱️", label: "MINUTO", valor: `${partida.minuto}'` },
            { emoji: "🔄", label: "POSSE", valor: `⚪ ${jogadorInicialNome}` },
            { emoji: "🎲", label: "SORTEIO", valor: vencedorSorteio }
        ];
        
        const resultado = `Use c!passe, c!chute, c!driblar ou c!1v1 para jogar!`;
        const icone = isAposGol ? "🔄" : "🚀";
        const titulo = isAposGol ? "RECOMEÇO APÓS GOL" : "PONTAPÉ INICIAL";
        const descricao = isAposGol ? `O time ${quemComeca} vai recomeçar a partida após o gol marcado!` : `A partida está oficialmente começando!`;
        const cor = isAposGol ? "#FFD700" : "#00FF00";
        
        const texto = criarMolde(icone, titulo, descricao, informativos, resultado, cor);

        const embed = new EmbedBuilder()
            .setColor(cor)
            .setAuthor({ name: `⚽ ${quemComeca}`, iconURL: message.guild.iconURL() })
            .setTitle(`${icone} ${titulo}`)
            .setDescription(texto)
            .setFooter({ text: `⚽ Blue Lock • Comando dado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};