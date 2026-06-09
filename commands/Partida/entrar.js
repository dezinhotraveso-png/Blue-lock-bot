const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// ==========================================
// 📍 SETORES POR POSIÇÃO (C1 a C18)
// ==========================================
const setoresPorPosicao = {
    // Setores defensivos (C1 a C6)
    "Goleiro": { casa: "C17", fora: "C2", zona: "defensiva" },
    "Zagueiro": { casa: "C14", fora: "C5", zona: "defensiva" },
    "Lateral": { casa: "C13", fora: "C4", zona: "defensiva" },
    "Volante": { casa: "C14", fora: "C5", zona: "defensiva" },
    "Meio Defensivo": { casa: "C14", fora: "C5", zona: "meio_campo" },
    
    // Setores do meio-campo (C7 a C12)
    "Meio Ofensivo": { casa: "C8", fora: "C11", zona: "meio_campo" },
    "Ponta": { casa: "C7", fora: "C10", zona: "ataque" },
    
    // Setores de ataque (C13 a C18)
    "Centro Avante": { casa: "C11", fora: "C8", zona: "ataque" },
    "Segundo Atacante": { casa: "C8", fora: "C11", zona: "ataque" }
};

// Nomes dos setores para exibição
const nomesSetores = {
    "C1": "Ponta Esquerda (Ataque)",
    "C2": "Goleiro",
    "C3": "Ponta Direita (Ataque)",
    "C4": "Lateral Esquerdo",
    "C5": "Zagueiro/Volante",
    "C6": "Lateral Direito",
    "C7": "Ponta Esquerda",
    "C8": "Meio Ofensivo",
    "C9": "Ponta Direita",
    "C10": "Ponta Esquerda",
    "C11": "Centro Avante",
    "C12": "Ponta Direita",
    "C13": "Lateral Esquerdo",
    "C14": "Zagueiro/Volante",
    "C15": "Lateral Direito",
    "C16": "Ponta Esquerda",
    "C17": "Goleiro",
    "C18": "Ponta Direita"
};

// Descrição das posições
const posicoesDescricao = {
    "Goleiro": "🧤 Última linha de defesa, protege o gol. Fica na área.",
    "Zagueiro": "🛡️ Defesa central, marca os atacantes. Fica na defesa.",
    "Lateral": "⚡ Joga pelas laterais, apoia ataque e defesa. Sobe ao meio-campo.",
    "Volante": "💠 Controla o meio-campo, recupera bolas. Atua na transição.",
    "Meio Defensivo": "❄️ Organiza a defesa, intercepta passes. Zona de contenção.",
    "Meio Ofensivo": "🎭 Cria jogadas, articula o ataque. Coração do meio-campo.",
    "Ponta": "🌀 Velocidade pelas pontas, cruzamentos. Ataca pelas laterais.",
    "Centro Avante": "💫 Finalizador, busca fazer gols. Sempre na área adversária.",
    "Segundo Atacante": "2️⃣ Acompanha o centro avante, cria espaços. Movimentação livre."
};

// Zonas do campo
const zonasCampo = {
    "defensiva": { cor: "#3498DB", nome: "🛡️ Zona Defensiva" },
    "meio_campo": { cor: "#F1C40F", nome: "⚡ Meio de Campo" },
    "ataque": { cor: "#E74C3C", nome: "⚽ Zona de Ataque" }
};

// Função para mostrar o mapa do campo
function mostrarMapaCampo(time, posicaoJogador = null) {
    const mapa = {
        "🏠 CASA": "⬅️",
        "🚀 FORA": "➡️"
    };
    
    const zonas = [
        { nome: "🧤 GOLEIRO", setor: time === "casa" ? "C17" : "C2", simbolo: "🧤" },
        { nome: "🛡️ DEFESA", setor: time === "casa" ? "C14" : "C5", simbolo: "🛡️" },
        { nome: "⚡ MEIO-CAMPO", setor: time === "casa" ? "C8" : "C11", simbolo: "⚡" },
        { nome: "⚽ ATAQUE", setor: time === "casa" ? "C11" : "C8", simbolo: "⚽" }
    ];
    
    let texto = `\n> ˚ ˳ ﹙🗺️﹚***__POSICIONAMENTO TÁTICO__***\n> │\n`;
    texto += `> │ ${mapa[`🏠 ${partida?.timeCasa || "CASA"}`]} Time da Casa\n`;
    texto += `> │ ${mapa[`🚀 ${partida?.timeFora || "FORA"}`]} Time Visitante\n> │\n`;
    
    for (const zona of zonas) {
        const setorNome = nomesSetores[zona.setor] || zona.setor;
        const destaque = posicaoJogador === zona.setor ? " ◀ VOCÊ ESTÁ AQUI" : "";
        texto += `> │ ${zona.simbolo} ${zona.nome}: \`${zona.setor}\` (${setorNome})${destaque}\n`;
    }
    
    texto += `> ╰───────────⁀🗺️⁀───────────╯`;
    return texto;
}

module.exports = {
    name: 'entrar',
    description: '⚽ Entra na partida como jogador',
    aliases: ['join', 'entrarpartida'],
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.partidas) dados.partidas = {};

        const partidaId = `partida_${message.channel.id}`;
        const partida = dados.partidas[partidaId];

        if (!partida || !partida.ativa) {
            return message.reply('❌ Não há partida ativa neste canal! Use `c!partida iniciar` para começar.');
        }

        if (partida.jogadores && partida.jogadores[message.author.id]) {
            return message.reply('❌ Você já está na partida!');
        }

        const time = args[0]?.toLowerCase();
        if (!time || (time !== 'casa' && time !== 'fora')) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('entrar_casa').setLabel(`🏠 ${partida.timeCasa || 'Casa'}`).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('entrar_fora').setLabel(`✈️ ${partida.timeFora || 'Fora'}`).setStyle(ButtonStyle.Danger)
            );
            
            const descricaoTimes = 
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏠 ⦘**  **__${partida.timeCasa || 'Time da Casa'}__** —  *Joga no lado esquerdo do campo (setores C1-C9)*\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ ✈️ ⦘**  **__${partida.timeFora || 'Time Visitante'}__** —  *Joga no lado direito do campo (setores C10-C18)*\n\n` +
                `> *Cada posição ocupa setores específicos no campo!*`;
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('⚽ ESCOLHA SEU TIME')
                .setDescription(
                    `˚ ˳ ﹙⚡﹚***__ENTRAR NA PARTIDA__***\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                    `${descricaoTimes}\n\n` +
                    `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`
                )
                .setFooter({ text: '⚽ Blue Lock' });
            
            const msg = await message.reply({ embeds: [embed], components: [row] });
            const collector = msg.createMessageComponentCollector({ time: 30000 });
            
            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) {
                    return i.reply({ content: '❌ Apenas você pode escolher seu time!', flags: 64 });
                }
                collector.stop();
                const timeEscolhido = i.customId === 'entrar_casa' ? 'casa' : 'fora';
                await mostrarPosicoes(i, message, timeEscolhido, dados, partida, partidaId);
            });
            
            collector.on('end', () => {
                msg.edit({ components: [] }).catch(() => {});
            });
            
            return;
        }

        await mostrarPosicoes(message, message, time, dados, partida, partidaId);
    }
};

async function mostrarPosicoes(interaction, message, time, dados, partida, partidaId) {
    const posicoesLista = Object.keys(setoresPorPosicao);
    
    // Divide em 3 linhas de 3 botões
    const row1 = new ActionRowBuilder();
    const row2 = new ActionRowBuilder();
    const row3 = new ActionRowBuilder();
    
    posicoesLista.slice(0, 3).forEach(pos => {
        let estilo = ButtonStyle.Primary;
        if (pos === "Goleiro") estilo = ButtonStyle.Success;
        if (pos === "Centro Avante") estilo = ButtonStyle.Danger;
        if (pos === "Ponta") estilo = ButtonStyle.Danger;
        row1.addComponents(new ButtonBuilder().setCustomId(`pos_${pos}`).setLabel(`${pos}`).setStyle(estilo));
    });
    
    posicoesLista.slice(3, 6).forEach(pos => {
        let estilo = ButtonStyle.Primary;
        if (pos === "Volante") estilo = ButtonStyle.Success;
        row2.addComponents(new ButtonBuilder().setCustomId(`pos_${pos}`).setLabel(`${pos}`).setStyle(estilo));
    });
    
    posicoesLista.slice(6, 9).forEach(pos => {
        let estilo = ButtonStyle.Primary;
        if (pos === "Segundo Atacante") estilo = ButtonStyle.Success;
        if (pos === "Ponta") estilo = ButtonStyle.Danger;
        row3.addComponents(new ButtonBuilder().setCustomId(`pos_${pos}`).setLabel(`${pos}`).setStyle(estilo));
    });

    let posicoesTexto = '';
    for (const pos of posicoesLista) {
        const info = setoresPorPosicao[pos];
        const setorInicial = info[time];
        const setorNome = nomesSetores[setorInicial] || setorInicial;
        const zonaInfo = zonasCampo[info.zona];
        const desc = posicoesDescricao[pos] || "";
        posicoesTexto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ${desc.split(' ')[0]} ⦘**  **__${pos}__** —  \`Setor ${setorInicial}\` (${setorNome})\n`;
        posicoesTexto += `> │ *${desc}*\n`;
        posicoesTexto += `> │ 📍 Zona: ${zonaInfo?.nome || "⚡ Meio de Campo"}\n\n`;
    }

    const nomeTime = time === 'casa' ? partida.timeCasa : partida.timeFora;
    const ladoCampo = time === 'casa' ? 'esquerdo (setores C1-C9)' : 'direito (setores C10-C18)';
    
    const texto = 
        `˚ ˳ ﹙🗺️﹚***__ESCOLHA SUA POSIÇÃO__***\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 👤 ⦘**  **__Jogador__** —  \`${message.author.username}\`\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏠 ⦘**  **__Time__** —  \`${nomeTime}\`\n` +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 🗺️ ⦘**  **__Lado do Campo__** —  \`${ladoCampo}\`\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
        `> ˚ ˳ ﹙📍﹚***__Posições Disponíveis__***\n\n` +
        posicoesTexto +
        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Selecione sua posição nos botões abaixo!***__\n\n` +
        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `🗺️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('📍 ESCOLHA SUA POSIÇÃO')
        .setDescription(texto)
        .setFooter({ text: 'Tempo limite: 60 segundos' });

    const components = [row1, row2, row3];
    let msgRef;
    
    if (interaction.update) {
        await interaction.update({ embeds: [embed], components });
        msgRef = await interaction.fetchReply();
    } else {
        msgRef = await interaction.reply({ embeds: [embed], components });
    }
    
    const collector = msgRef.createMessageComponentCollector({ time: 60000 });
    
    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
            return i.reply({ content: '❌ Apenas você pode escolher sua posição!', flags: 64 });
        }
        
        const posicaoEscolhida = i.customId.replace('pos_', '');
        const infoPosicao = setoresPorPosicao[posicaoEscolhida];
        const setorInicial = infoPosicao[time];
        const zonaInfo = zonasCampo[infoPosicao.zona];
        const corTime = time === 'casa' ? '#00FF00' : '#FF0000';
        
        // Recarrega dados
        let dadosAtual = {};
        if (fs.existsSync(blueLockPath)) dadosAtual = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        const partidaAtual = dadosAtual.partidas[partidaId];
        
        if (!partidaAtual || !partidaAtual.ativa) {
            collector.stop();
            return i.update({ content: '❌ A partida não está mais ativa!', embeds: [], components: [] });
        }
        
        if (!partidaAtual.jogadores) partidaAtual.jogadores = {};
        
        // Mapeamento para o formato usado em outras partes
        const mapeamentoPosicao = {
            "Goleiro": "goleiro",
            "Zagueiro": "zagueiro",
            "Lateral": "lateral",
            "Volante": "volante",
            "Meio Defensivo": "meio_defensivo",
            "Meio Ofensivo": "meio_ofensivo",
            "Ponta": "ponta",
            "Centro Avante": "centro_avante",
            "Segundo Atacante": "segundo_atacante"
        };
        
        partidaAtual.jogadores[message.author.id] = {
            nome: message.author.username,
            setor: setorInicial,
            time: time === 'casa' ? partidaAtual.timeCasa : partidaAtual.timeFora,
            timeTipo: time,
            posicao: mapeamentoPosicao[posicaoEscolhida] || "meio_ofensivo",
            posicaoNome: posicaoEscolhida,
            zona: infoPosicao.zona
        };

        // Adiciona aos times
        if (!partidaAtual.times) partidaAtual.times = {};
        const nomeTime = time === 'casa' ? partidaAtual.timeCasa : partidaAtual.timeFora;
        if (!partidaAtual.times[nomeTime]) partidaAtual.times[nomeTime] = { jogadores: [] };
        if (!partidaAtual.times[nomeTime].jogadores.includes(message.author.id)) {
            partidaAtual.times[nomeTime].jogadores.push(message.author.id);
        }

        // Cria perfil se não existir
        if (!dadosAtual.jogadores) dadosAtual.jogadores = {};
        if (!dadosAtual.jogadores[message.author.id]) {
            dadosAtual.jogadores[message.author.id] = {
                id: message.author.id,
                nome: message.author.username,
                status: { 
                    finalizacao: 0, drible: 0, passe: 0, desarme: 0, 
                    velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, 
                    dominio: 0, marcacao: 0 
                },
                rolls: {},
                rollsDisponiveis: {},
                pontosBase: 0,
                estatisticas: { 
                    gols: 0, assistencias: 0, passes: 0, dribles: 0, 
                    desarmes: 0, interceptacoes: 0, defesas: 0, partidas: 0, 
                    vitorias: 0, pdr: 0 
                }
            };
        }

        fs.writeFileSync(blueLockPath, JSON.stringify(dadosAtual, null, 2));
        collector.stop();

        const setorNome = nomesSetores[setorInicial] || setorInicial;
        const mapaTexto = mostrarMapaCampo(time, setorInicial);
        
        const textoResultado = 
            `˚ ˳ ﹙✅﹚***__ENTROU NA PARTIDA!__***\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👤 ⦘**  **__Jogador__** —  \`${message.author.username}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏠 ⦘**  **__Time__** —  \`${nomeTime}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Posição__** —  \`${posicaoEscolhida}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🗺️ ⦘**  **__Zona__** —  \`${zonaInfo?.nome || "Meio de Campo"}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📍 ⦘**  **__Setor inicial__** —  \`${setorInicial} (${setorNome})\`\n\n` +
            `${mapaTexto}\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Você está posicionado! Aguarde o início da partida.***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

        const embedResultado = new EmbedBuilder()
            .setColor(corTime)
            .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTitle('✅ ENTROU NA PARTIDA!')
            .setDescription(textoResultado)
            .setFooter({ text: `⚽ Blue Lock • ${zonaInfo?.nome || "Meio de Campo"} • Setor ${setorInicial}` });

        await i.update({ embeds: [embedResultado], components: [] });
    });
    
    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            try { await msgRef.edit({ components: [] }); } catch(e) {}
        }
    });
}