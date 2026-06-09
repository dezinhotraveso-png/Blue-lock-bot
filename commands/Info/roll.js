const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

const gifRoll = "https://i.pinimg.com/originals/16/50/76/165076da0295092260bba9f9ddd2e720.gif";

// Listas para revelação
const estilosComuns = [
    { nome: "Individualista", emoji: "🎭", bonus: "Adaptável", passiva: "Se adapta a qualquer situação em campo" },
    { nome: "Artilheiro", emoji: "⚽", bonus: "Finalização +5", passiva: "Instinto de Gol: +4 ao chutar após dominar" },
    { nome: "Velocista", emoji: "💨", bonus: "Velocidade +4", passiva: "Arrancada Relâmpago: Prioridade ao vencer velocidade" },
    { nome: "Garçom", emoji: "☄️", bonus: "Passe +5", passiva: "Visão de Campo: +3 em passes para aliados livres" },
    { nome: "Marcador", emoji: "🛡️", bonus: "Marcação +5", passiva: "Pressão Constante: -3 Drible para marcados" },
    { nome: "Muralha", emoji: "🧱", bonus: "Defesa +4 e Interceptação +4", passiva: "Corpo Fechado: +5 após interceptar" },
    { nome: "Urso", emoji: "🐻", bonus: "Defesa +6", passiva: "Peso Brutal: +4 em disputas físicas" },
    { nome: "Driblador", emoji: "✨", bonus: "Drible +5", passiva: "Gingado Natural: Adversário perde prioridade" },
    { nome: "Biológico", emoji: "🧬", bonus: "Finalização +5", passiva: "Adaptação Corporal: +5 após errar chute" },
    { nome: "Zumbi", emoji: "🧟", bonus: "Marcação +4 e Desarme +4", passiva: "Persistência Mortal: Tenta desarme novamente" },
    { nome: "Maestro", emoji: "🎭", bonus: "Drible +4 e Passe +4", passiva: "Ritmo Perfeito: +6 após 2 passes" }
];

const estilosExclusivos = [
    { nome: "Imperador", emoji: "👑", bonus: "Finalização +14", passiva: "Domínio Absoluto: +10 ao receber passe direto" },
    { nome: "Demônio", emoji: "👹", bonus: "Chutes Acrobáticos +12", passiva: "Ego Insano: +3 Finalização por gol" },
    { nome: "Áureo", emoji: "✨", bonus: "Passe +10, Drible +10", passiva: "Perfeição Natural: -6 para adversários" },
    { nome: "Rei", emoji: "🤴", bonus: "Finalização +13 e Força +9", passiva: "Autoridade Suprema: Aliados +3 Passe" },
    { nome: "Servo", emoji: "🙏", bonus: "Passe +12 e Drible +10", passiva: "Devoção Absoluta: +15 para aliado escolhido" }
];

const dominancias = {
    "Destro": { emoji: "👉", desc: "Perna direita dominante" },
    "Canhoto": { emoji: "👈", desc: "Perna esquerda dominante" },
    "Ambidestro": { emoji: "🤝", desc: "Usa ambas as pernas com maestria" }
};

const talentosInfo = {
    "Gênio": { emoji: "⭐", desc: "Nasceu acima da média, leitura de jogo absurda", passiva: "-60% treinos, +6 pontos, +2 por vitória", ativa: "Leitura Genial: Preve ação adversária 1x por partida" },
    "Aprendiz Talentoso": { emoji: "🧩", desc: "Evolui através das derrotas", passiva: "-45% treinos, +2 pontos por derrota", ativa: "Evolução Instantânea: Repete ação com +10" },
    "Prodígio": { emoji: "🧬", desc: "Anomalia genética, corpo desenvolvido", passiva: "-35% treinos, maior atributo +8", ativa: "Mutação: Dobra bônus por 2 turnos" }
};

const tiposRoll = {
    arma: { nome: "Arma", emoji: "⚔️" },
    estilo: { nome: "Estilo de Jogo", emoji: "🎭" },
    dom: { nome: "Dom (Talento)", emoji: "⭐" },
    monstro: { nome: "Monstro", emoji: "👹" },
    dominancia: { nome: "Dominância", emoji: "👑" },
    familia: { nome: "Família", emoji: "👨‍👩‍👧" }
};

module.exports = {
    name: 'roll',
    description: '🎲 Revela seus atributos baseado nos cargos que você possui',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        if (!dados.jogadores[message.author.id]) {
            dados.jogadores[message.author.id] = {
                nome: message.author.username,
                status: { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 },
                rolls: {},
                rollsDisponiveis: {}
            };
        }
        
        const jogador = dados.jogadores[message.author.id];
        if (!jogador.rolls) jogador.rolls = {};
        
        const membro = await message.guild.members.fetch(message.author.id).catch(() => null);
        if (!membro) return message.reply('❌ Erro ao buscar seus cargos!');
        
        const tipo = args[0]?.toLowerCase();
        
        // Se não especificou tipo, mostra opções
        if (!tipo || !tiposRoll[tipo]) {
            let opcoes = '';
            for (const [key, info] of Object.entries(tiposRoll)) {
                opcoes += `> **𓂂𝅙ֺ𝅙ִ ⦗ ${info.emoji} ⦘**  **__${info.nome}__** —  \`c!roll ${key}\`\n`;
            }
            
            const texto = 
                `˚ ˳ ﹙🎲﹚***__REVELAR ATRIBUTOS__***\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                `> **𓂂𝅙ֺ𝅙ִ ⦗ 👤 ⦘**  **__Jogador__** —  \`${message.author.username}\`\n\n` +
                `> ˚ ˳ ﹙📊﹚***__Comandos__***\n\n` +
                opcoes +
                `\n> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use c!roll <tipo> para revelar o que você tem!***__\n\n` +
                `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
            
            return message.reply({ embeds: [new EmbedBuilder().setColor('#9B59B6').setAuthor({ name: `🎲 ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('🎲 REVELAR ATRIBUTOS').setDescription(texto).setFooter({ text: '⚽ Blue Lock • Revela o que seus cargos te dão!' })] });
        }
        
        function encontrarCargo(lista) {
            const listaOrdenada = [...lista].sort((a, b) => b.length - a.length);
            for (const nome of listaOrdenada) {
                const cargo = membro.roles.cache.find(r => r.name.toLowerCase().includes(nome.toLowerCase()));
                if (cargo) return nome;
            }
            return null;
        }
        
        let embed = null;
        let cor = '#9B59B6';
        
        switch(tipo) {
            case 'estilo': {
                const exclusivo = encontrarCargo(["Imperador", "Demônio", "Áureo", "Rei", "Servo"]);
                const comum = encontrarCargo(["Individualista", "Artilheiro", "Velocista", "Garçom", "Marcador", "Muralha", "Urso", "Driblador", "Biológico", "Zumbi", "Maestro"]);
                
                let estiloInfo = null;
                let raridade = '';
                
                if (exclusivo) {
                    estiloInfo = estilosExclusivos.find(e => e.nome === exclusivo);
                    raridade = '👑 Exclusivo';
                    cor = '#FFD700';
                } else if (comum) {
                    estiloInfo = estilosComuns.find(e => e.nome === comum);
                    raridade = '📘 Comum';
                    cor = '#00FF00';
                }
                
                if (estiloInfo) {
                    const texto = 
                        `˚ ˳ ﹙🎭﹚***__REVELAÇÃO DE ESTILO__***\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎭 ⦘**  **__Estilo__** —  \`${estiloInfo.emoji} ${estiloInfo.nome}\`\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏷️ ⦘**  **__Raridade__** —  \`${raridade}\`\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📝 ⦘**  **__Bônus__** —  \`${estiloInfo.bonus}\`\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 🔮 ⦘**  **__Passiva__** —  \`${estiloInfo.passiva}\`\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Este estilo veio do seu cargo no Discord!***__\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                    
                    embed = new EmbedBuilder().setColor(cor).setAuthor({ name: `🎭 ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('🎭 REVELAÇÃO DE ESTILO').setDescription(texto).setImage(gifRoll).setTimestamp();
                } else {
                    return message.reply('❌ Você não possui cargo de **Estilo de Jogo**!');
                }
                break;
            }
            
            case 'dom': {
                const domNome = encontrarCargo(["Aprendiz Talentoso", "Prodígio", "Gênio"]);
                
                if (domNome && talentosInfo[domNome]) {
                    const info = talentosInfo[domNome];
                    if (domNome === "Gênio") cor = '#FFD700';
                    else if (domNome === "Prodígio") cor = '#50C878';
                    else cor = '#4169E1';
                    
                    const texto = 
                        `˚ ˳ ﹙⭐﹚***__REVELAÇÃO DE DOM__***\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__Dom__** —  \`${info.emoji} ${domNome}\`\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📝 ⦘**  **__Descrição__** —  \`${info.desc}\`\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 🔮 ⦘**  **__Passiva__** —  \`${info.passiva}\`\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚡ ⦘**  **__Ativa__** —  \`${info.ativa}\`\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Este dom veio do seu cargo no Discord!***__\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                    
                    embed = new EmbedBuilder().setColor(cor).setAuthor({ name: `⭐ ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('⭐ REVELAÇÃO DE DOM').setDescription(texto).setImage(gifRoll).setTimestamp();
                } else {
                    return message.reply('❌ Você não possui cargo de **Dom (Talento)**!');
                }
                break;
            }
            
            case 'arma': {
                const todasHabilidades = listarTodasHabilidades();
                let armaInfo = null;
                
                const habsOrdenadas = Object.entries(todasHabilidades).sort((a, b) => b[1].nome.length - a[1].nome.length);
                for (const [key, hab] of habsOrdenadas) {
                    const cargo = membro.roles.cache.find(r => r.name.toLowerCase().includes(hab.nome.toLowerCase()));
                    if (cargo) { armaInfo = hab; break; }
                }
                
                if (armaInfo) {
                    if (armaInfo.estrelas === "★★★★★") cor = '#FFD700';
                    else if (armaInfo.estrelas === "★★★★") cor = '#C0A050';
                    else if (armaInfo.estrelas === "★★★") cor = '#50C878';
                    else if (armaInfo.estrelas === "★★") cor = '#4169E1';
                    else cor = '#808080';
                    
                    let bonusTexto = '';
                    if (armaInfo.bonus) {
                        if (armaInfo.bonus.finalizacao) bonusTexto += `> │   🦵 Finalização +${armaInfo.bonus.finalizacao}\n`;
                        if (armaInfo.bonus.drible) bonusTexto += `> │   ✨ Drible +${armaInfo.bonus.drible}\n`;
                        if (armaInfo.bonus.passe) bonusTexto += `> │   ☄️ Passe +${armaInfo.bonus.passe}\n`;
                        if (armaInfo.bonus.velocidade) bonusTexto += `> │   ⚡ Velocidade +${armaInfo.bonus.velocidade}\n`;
                        if (armaInfo.bonus.dominio) bonusTexto += `> │   ⚽ Domínio +${armaInfo.bonus.dominio}\n`;
                        if (armaInfo.bonus.fisico) bonusTexto += `> │   💪 Físico +${armaInfo.bonus.fisico}\n`;
                        if (armaInfo.bonus.interceptacao) bonusTexto += `> │   🎯 Interceptação +${armaInfo.bonus.interceptacao}\n`;
                        if (armaInfo.bonus.desarme) bonusTexto += `> │   🛡️ Desarme +${armaInfo.bonus.desarme}\n`;
                        if (armaInfo.bonus.defesaGk) bonusTexto += `> │   🧱 Defesa GK +${armaInfo.bonus.defesaGk}\n`;
                    }
                    
                    const texto = 
                        `˚ ˳ ﹙⚔️﹚***__REVELAÇÃO DE ARMA__***\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__Arma__** —  \`${armaInfo.emoji} ${armaInfo.nome}\`\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__Raridade__** —  \`${armaInfo.estrelas}\`\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📝 ⦘**  **__Efeito__** —  \`${armaInfo.efeito}\`\n` +
                        (bonusTexto ? `\n> ˚ ˳ ﹙📊﹚***__Bônus__***\n\n${bonusTexto}\n` : '\n') +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Esta arma veio do seu cargo no Discord!***__\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                    
                    embed = new EmbedBuilder().setColor(cor).setAuthor({ name: `⚔️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('⚔️ REVELAÇÃO DE ARMA').setDescription(texto).setImage(armaInfo.gif || gifRoll).setTimestamp();
                } else {
                    return message.reply('❌ Você não possui cargo de **Arma**!');
                }
                break;
            }
            
            case 'monstro': {
                const temMonstro = encontrarCargo(["Monstro Despertado", "Monstro Adormecido"]);
                
                if (temMonstro) {
                    cor = '#FFD700';
                    const texto = 
                        `˚ ˳ ﹙👹﹚***__REVELAÇÃO DE MONSTRO__***\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 👹 ⦘**  **__Monstro__** —  \`✅ Sim! Você possui um Monstro Interior!\`\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📝 ⦘**  **__Tipo__** —  \`${temMonstro}\`\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Este monstro veio do seu cargo no Discord!***__\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                    
                    embed = new EmbedBuilder().setColor(cor).setAuthor({ name: `👹 ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('👹 REVELAÇÃO DE MONSTRO').setDescription(texto).setImage(gifRoll).setTimestamp();
                } else {
                    return message.reply('❌ Você não possui cargo de **Monstro**!');
                }
                break;
            }
            
            case 'dominancia': {
                const dom = encontrarCargo(["Ambidestro", "Destro", "Canhoto"]);
                
                if (dom && dominancias[dom]) {
                    const info = dominancias[dom];
                    const texto = 
                        `˚ ˳ ﹙👑﹚***__REVELAÇÃO DE DOMINÂNCIA__***\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 👑 ⦘**  **__Dominância__** —  \`${info.emoji} ${dom}\`\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📝 ⦘**  **__Descrição__** —  \`${info.desc}\`\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Esta dominância veio do seu cargo no Discord!***__\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                    
                    embed = new EmbedBuilder().setColor('#9B59B6').setAuthor({ name: `👑 ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('👑 REVELAÇÃO DE DOMINÂNCIA').setDescription(texto).setImage(gifRoll).setTimestamp();
                } else {
                    return message.reply('❌ Você não possui cargo de **Dominância**!');
                }
                break;
            }
            
            case 'familia': {
                const familiaNome = encontrarCargo(["Iglesias", "Lorenzo", "Kunigami", "Tokimitsu", "Yukimiya", "Chevalier", "Gagamaru", "Kurona", "Chigiri", "Mikage", "Shidou", "Bachira", "Itoshi", "Otoya", "Hiori", "Darai", "Onazi", "Kaiser", "Isagi", "Barou", "Naruhaya", "Fukaku", "Igaguri", "Ness", "Karasu", "Kiyora", "Aiku", "Nagi", "Hugo", "Loki", "Ikki", "Agi", "Aryu"]);
                
                if (familiaNome) {
                    const texto = 
                        `˚ ˳ ﹙👨‍👩‍👧﹚***__REVELAÇÃO DE FAMÍLIA__***\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 👨‍👩‍👧 ⦘**  **__Família__** —  \`${familiaNome}\`\n\n` +
                        `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Esta família veio do seu cargo no Discord!***__\n\n` +
                        `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;
                    
                    embed = new EmbedBuilder().setColor('#9B59B6').setAuthor({ name: `👨‍👩‍👧 ${message.author.username}`, iconURL: message.author.displayAvatarURL() }).setTitle('👨‍👩‍👧 REVELAÇÃO DE FAMÍLIA').setDescription(texto).setImage(gifRoll).setTimestamp();
                } else {
                    return message.reply('❌ Você não possui cargo de **Família**!');
                }
                break;
            }
        }
        
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
        return message.reply({ embeds: [embed] });
    }
};