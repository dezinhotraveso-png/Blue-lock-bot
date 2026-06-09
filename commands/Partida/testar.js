const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { listarHabilidadesPorTipo, usarHabilidade, aplicarBonusHabilidade, listarTodasHabilidades } = require('../../utils/habilidades.js');
const gifs = require('../../utils/gifs.js');

// ==========================================
// 📋 CONSTANTES E DEFINIÇÕES
// ==========================================

// 🎨 MOLDE DE PREPARAÇÃO
function criarMoldePreparacao(icone, titulo, descricao, informativos, resultado) {
    let texto = `﹒ ⟢ ${icone} ﹒ ${titulo} !\n\n`;
    texto += `𖦹 ${descricao}\n\n`;
    texto += `ㅤㅤ⌞ 📊 ⌝\n\n`;
    
    informativos.forEach(info => {
        texto += `⤷ ${info.emoji} ${info.label} · \`${info.valor}\`\n`;
    });
    
    texto += `\n◞⚡ ${resultado}\n\n`;
    texto += `﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    
    return texto;
}

// 🎨 MOLDE DE RESULTADO
function criarMoldeResultado(icone, titulo, descricao, dadosArray, resultado, tempoAcao = null, comandoDefesa = null, comandoInterceptar = null) {
    let texto = `﹒ ⟢ ${icone} ﹒ ${titulo} !\n\n`;
    texto += `𖦹 ${descricao}\n\n`;
    texto += `ㅤㅤ⌞ 📊 ⌝\n\n`;
    
    dadosArray.forEach(dado => {
        texto += `⤷ ${dado.emoji} ${dado.label} · \`${dado.valor}\`\n`;
    });
    
    texto += `\n◞⚡ ${resultado}\n`;
    
    if (tempoAcao) {
        texto += `\n⏳ ${tempoAcao}\n`;
    }
    
    if (comandoDefesa) {
        texto += `\n🧤 Defesa · \`${comandoDefesa}\``;
    }
    
    if (comandoInterceptar) {
        texto += `\n🚧 Interceptação · \`${comandoInterceptar}\``;
    }
    
    texto += `\n\n﹋﹋﹋﹋﹋﹋﹋﹋﹋﹋`;
    
    return texto;
}

function getGifHabilidade(habInfo, tipoPadrao) {
    if (habInfo && habInfo.gif) return habInfo.gif;
    if (tipoPadrao) return tipoPadrao;
    return null;
}

// 💪 FORÇAS DE DEFESA
const forcasDefesa = [
    { nome: "🟢 Defesa Leve", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Defesa suave. Segura, mas pouco efetiva contra chutes fortes." },
    { nome: "🟡 Defesa Média", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Defesa equilibrada. Boa relação entre segurança e eficácia." },
    { nome: "🔴 Defesa Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Defesa potente. Arriscada, mas pode defender chutes difíceis." }
];

// ⚽ FORÇAS DE CHUTE
const forcasChute = [
    { nome: "🟢 Fraco", bonus: 0, penalidade: 0, multiplicador: 0.8, fatal: 2, desc: "Chute com pouca força. Seguro, mas facilmente defensável." },
    { nome: "🟡 Médio", bonus: 5, penalidade: 0, multiplicador: 1.0, fatal: 5, desc: "Chute equilibrado. Boa relação entre força e precisão." },
    { nome: "🔴 Forte", bonus: 10, penalidade: -3, multiplicador: 1.2, fatal: 8, desc: "Chute com máxima potência. Difícil de defender, mas erra mais fácil." }
];

// 🧤 ESTILOS DE DEFESA
const estilosDefesa = [
    { nome: "🧤 Defesa Normal", bonus: 0, penalidade: 0, fatal: 3, desc: "Defesa padrão, sem bônus especiais. Posição neutra." },
    { nome: "⚡ Defesa Rápida", bonus: 5, penalidade: -2, fatal: 6, desc: "Reação rápida, mas menos firmeza. Bom contra chutes colocados." },
    { nome: "💪 Defesa Forte", bonus: 8, penalidade: -5, fatal: 9, desc: "Força bruta, mas perde agilidade. Eficaz contra chutes potentes." },
    { nome: "🎭 Espalmada", bonus: 3, penalidade: 0, fatal: 4, desc: "Espalma a bola para escanteio. Seguro, mas não segura a bola." },
    { nome: "🦵 Defesa com Pé", bonus: 4, penalidade: -1, fatal: 5, desc: "Defesa usando os pés. Eficaz contra chutes rasteiros." }
];

// ⚽ TIPOS DE CHUTE
const tiposChute = [
    { nome: "chute", emoji: "⚽", label: "CHUTE PADRÃO", fatal: 3, desc: "Finalização padrão, equilibrada entre força e precisão.", gifKey: "chute_normal", bonus: 0, penalidade: 0, multiplicador: 1.0 },
    { nome: "voleio", emoji: "🦶", label: "VOLEIO", fatal: 8, desc: "Chute de primeira, sem deixar a bola cair. Alto risco, alta recompensa.", gifKey: "voleio", bonus: 8, penalidade: -4, multiplicador: 1.2 },
    { nome: "bicicleta", emoji: "🚲", label: "BICICLETA", fatal: 12, desc: "Chute acrobático com as pernas para trás. Muito plástico, mas extremamente arriscado.", gifKey: "bicicleta", bonus: 12, penalidade: -8, multiplicador: 1.3 },
    { nome: "cavadinha", emoji: "🧠", label: "CAVADINHA", fatal: 5, desc: "Toque sutil por cima do goleiro. Requer precisão e calma.", gifKey: "cavadinha", bonus: 4, penalidade: 2, multiplicador: 0.9 }
];

// ✨ TIPOS DE DRIBLE
const tiposDrible = [
    { nome: "✨ Drible Simples", bonus: 0, penalidade: 0, fatal: 3, desc: "Drible básico e seguro. Ideal para começar.", emoji: "✨" },
    { nome: "⚡ Drible Rápido", bonus: 5, penalidade: -2, fatal: 6, desc: "Drible rápido na velocidade. Use sua agilidade!", emoji: "⚡" },
    { nome: "🎭 Drible Fantasia", bonus: 8, penalidade: -5, fatal: 10, desc: "Drible com firula. Arriscado, mas lindo de ver!", emoji: "🎭" },
    { nome: "🔄 Drible Elástico", bonus: 6, penalidade: -3, fatal: 7, desc: "Drible elástico. Alonga a perna para passar.", emoji: "🔄" },
    { nome: "💨 Arrancada", bonus: 4, penalidade: -1, fatal: 5, desc: "Explosão de velocidade. Saia na frente!", emoji: "💨" }
];

// ☄️ TIPOS DE PASSE
const tiposPasse = [
    { nome: "⚡ Passe Rápido", bonus: 0, penalidade: 0, fatal: 3, desc: "Passe rápido e rasteiro. Simples e eficaz.", emoji: "⚡", dificuldadeMin: 10 },
    { nome: "🎯 Passe Colocado", bonus: 4, penalidade: 0, fatal: 4, desc: "Passe milimétrico no pé do companheiro.", emoji: "🎯", dificuldadeMin: 12 },
    { nome: "🦶 Passe Trivela", bonus: 6, penalidade: -2, fatal: 6, desc: "Passe com efeito de trivela. Curva incrível!", emoji: "🦶", dificuldadeMin: 14 },
    { nome: "🧠 Passe de Calcanhar", bonus: 8, penalidade: -4, fatal: 8, desc: "Passe de calcanhar. Inteligente e imprevisível.", emoji: "🧠", dificuldadeMin: 16 },
    { nome: "🔄 Passe de Primeira", bonus: 5, penalidade: -2, fatal: 5, desc: "Passe sem dominar. Rápido, mas requer precisão.", emoji: "🔄", dificuldadeMin: 13 }
];

// 🛡️ TIPOS DE INTERCEPTAÇÃO
const tiposInterceptacao = [
    { nome: "🛡️ Interceptação Segura", bonus: 0, penalidade: 0, fatal: 3, desc: "Tenta cortar a linha do passe/chute de forma segura.", emoji: "🛡️" },
    { nome: "⚡ Interceptação Rápida", bonus: 5, penalidade: -2, fatal: 6, desc: "Acelera para cortar o passe/chute rapidamente.", emoji: "⚡" },
    { nome: "🎭 Interceptação Fantasia", bonus: 8, penalidade: -4, fatal: 9, desc: "Corta com estilo e classe.", emoji: "🎭" },
    { nome: "💪 Interceptação Física", bonus: 4, penalidade: -1, fatal: 5, desc: "Usa o corpo para interceptar a bola.", emoji: "💪" },
    { nome: "🎯 Leitura de Passe", bonus: 6, penalidade: 0, fatal: 4, desc: "Antecipa a trajetória da bola.", emoji: "🎯" }
];

// 🛡️ TIPOS DE DESARME
const tiposDesarme = [
    { nome: "🛡️ Desarme Simples", bonus: 0, penalidade: 0, fatal: 3, desc: "Tentativa básica de roubar a bola.", emoji: "🛡️" },
    { nome: "⚡ Desarme Rápido", bonus: 5, penalidade: -2, fatal: 6, desc: "Desarme na velocidade, usa agilidade.", emoji: "⚡" },
    { nome: "💪 Desarme Físico", bonus: 7, penalidade: -3, fatal: 8, desc: "Usa a força corporal para roubar.", emoji: "💪" },
    { nome: "🎭 Desarme de Classe", bonus: 4, penalidade: -1, fatal: 5, desc: "Desarme limpo e elegante.", emoji: "🎭" },
    { nome: "🦵 Carrinho", bonus: 6, penalidade: -4, fatal: 10, desc: "Carrinho de lado. Arriscado, mas eficaz.", emoji: "🦵" }
];

// 🎬 VARIÁVEIS GLOBAIS
let modoTesteAtivo = false;
let chuteSimulado = null;
let interceptacaoSimulada = null;
let testeConfig = { 
    setor: "C14",
    status: { 
        finalizacao: 0, defesaGk: 0, drible: 0, passe: 0,
        desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, dominio: 0
    } 
};

let jogadorTeste = {
    nome: "Jogador Teste",
    status: testeConfig.status,
    habilidades: {}
};

module.exports = {
    name: 'testar',
    description: '🧪 Modo de Teste do Blue Lock',
    async execute(message, args) {
        const subComando = args[0]?.toLowerCase();

        // ATIVAR
        if (subComando === 'ativar') {
            modoTesteAtivo = true;
            jogadorTeste.habilidades = {};
            Object.keys(testeConfig.status).forEach(k => testeConfig.status[k] = 0);
            chuteSimulado = null;
            interceptacaoSimulada = null;

            const informativos = [
                { emoji: "🎯", label: "Chute", valor: "c!testar chute" },
                { emoji: "🧤", label: "Defesa", valor: "c!testar defesa" },
                { emoji: "✨", label: "Drible", valor: "c!testar drible" },
                { emoji: "☄️", label: "Passe", valor: "c!testar passe" },
                { emoji: "🎯", label: "Interceptar", valor: "c!testar interceptar" },
                { emoji: "🛡️", label: "Desarmar", valor: "c!testar desarmar" },
                { emoji: "⚙️", label: "Config", valor: "c!testar config" },
                { emoji: "❌", label: "Desativar", valor: "c!testar desativar" }
            ];
            
            const texto = criarMoldePreparacao("⚡", "𝗦𝗜𝗦𝗧𝗘𝗠𝗔 𝗗𝗘 𝗦𝗜𝗠𝗨𝗟𝗔𝗖̧𝗔̃𝗢", `${message.author.username} ativou os hologramas de treinamento do Blue Lock!`, informativos, "A simulação é um ambiente fechado e não afeta o banco de dados oficial!");

            return message.reply({ embeds: [new EmbedBuilder()
                .setColor('#2ECC71')
                .setAuthor({ name: `Modo Treinamento`, iconURL: message.author.displayAvatarURL() })
                .setTitle('✅ AMBIENTE DE TESTES LIGADO!')
                .setDescription(texto)
                .setTimestamp()] });
        }

        if (!modoTesteAtivo) {
            return message.reply('❌ Modo Teste desativado! Use `c!testar ativar`');
        }

        if (subComando === 'desativar') {
            modoTesteAtivo = false;
            chuteSimulado = null;
            interceptacaoSimulada = null;
            jogadorTeste.habilidades = {};
            Object.keys(testeConfig.status).forEach(k => testeConfig.status[k] = 0);
            
            const texto = criarMoldePreparacao("🛑", "𝗦𝗜𝗦𝗧𝗘𝗠𝗔 𝗗𝗘 𝗗𝗘𝗦𝗟𝗜𝗚𝗔𝗠𝗘𝗡𝗧𝗢", `${message.author.username} encerrou a sessão de treinamento.`, [], "Os hologramas foram desativados.");
            
            return message.reply({ embeds: [new EmbedBuilder()
                .setColor('#E74C3C')
                .setAuthor({ name: `Modo Treinamento`, iconURL: message.author.displayAvatarURL() })
                .setTitle('🛑 SIMULAÇÃO ENCERRADA')
                .setDescription(texto)
                .setTimestamp()] });
        }

        // CONFIG
        if (subComando === 'config') {
            const informativos = [
                { emoji: "📍", label: "Setor Virtual", valor: `${testeConfig.setor}` },
                { emoji: "🦵", label: "Finalização", valor: `+${testeConfig.status.finalizacao}` },
                { emoji: "✨", label: "Drible", valor: `+${testeConfig.status.drible}` },
                { emoji: "☄️", label: "Passe", valor: `+${testeConfig.status.passe}` },
                { emoji: "🛡️", label: "Desarme", valor: `+${testeConfig.status.desarme}` },
                { emoji: "⚡", label: "Velocidade", valor: `+${testeConfig.status.velocidade}` },
                { emoji: "💪", label: "Físico", valor: `+${testeConfig.status.fisico}` },
                { emoji: "🎯", label: "Interceptação", valor: `+${testeConfig.status.interceptacao}` },
                { emoji: "🧤", label: "Defesa GK", valor: `+${testeConfig.status.defesaGk}` },
                { emoji: "⚽", label: "Domínio", valor: `+${testeConfig.status.dominio}` }
            ];
            const texto = criarMoldePreparacao("⚙️", "𝗣𝗔𝗥𝗔𝗠𝗘̂𝗧𝗥𝗢𝗦", "Inspecionando as variáveis virtuais...", informativos, "Use `c!testar set <atributo> <valor>`");
            
            return message.reply({ embeds: [new EmbedBuilder()
                .setColor('#3498DB')
                .setAuthor({ name: `Painel de Controle`, iconURL: message.author.displayAvatarURL() })
                .setTitle('📊 PARÂMETROS')
                .setDescription(texto)
                .setTimestamp()] });
        }

        if (subComando === 'set') {
            let stat = args[1]?.toLowerCase();
            const valor = parseInt(args[2]);
            
            if (stat === 'setor') {
                testeConfig.setor = args[2]?.toUpperCase() || "C14";
                return message.reply(`✅ Setor alterado para ${testeConfig.setor}`);
            }
            if (stat === 'defesa') stat = 'defesaGk';
            if (!isNaN(valor) && valor >= 0 && valor <= 100) {
                testeConfig.status[stat] = valor;
                jogadorTeste.status[stat] = valor;
                return message.reply(`✅ ${stat} alterado para +${valor}`);
            }
            return message.reply('❌ Valor inválido! Use 0-100');
        }

        // HABILIDADES
        if (subComando === 'hab') {
            const acao = args[1]?.toLowerCase();
            
            if (acao === 'listar') {
                const todas = listarTodasHabilidades();
                let textoHab = '';
                const porEstrela = { "★": [], "★★": [], "★★★": [], "★★★★": [], "★★★★★": [] };
                for (const [key, hab] of Object.entries(todas)) {
                    porEstrela[hab.estrelas].push(`${hab.emoji} ${hab.nome} (${hab.tipo})`);
                }
                for (const [estrela, habs] of Object.entries(porEstrela)) {
                    if (habs.length > 0) {
                        textoHab += `**${estrela}** (${habs.length})\n`;
                        textoHab += habs.slice(0, 8).join('\n') + (habs.length > 8 ? `\n...e mais ${habs.length - 8}` : '') + '\n\n';
                    }
                }
                const texto = criarMoldePreparacao("📖", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦", `Total: ${Object.keys(todas).length}`, [], "Use `c!testar hab add <nome>`") + `\n\n${textoHab}`;
                return message.reply({ embeds: [new EmbedBuilder().setColor('#9B59B6').setDescription(texto)] });
            }
            
            if (acao === 'add') {
                const nome = args.slice(2).join(' ');
                const todas = listarTodasHabilidades();
                let encontrada = null, key = null;
                for (const [k, hab] of Object.entries(todas)) {
                    if (hab.nome.toLowerCase().includes(nome.toLowerCase())) {
                        encontrada = hab; key = k; break;
                    }
                }
                if (!encontrada) return message.reply('❌ Habilidade não encontrada');
                if (jogadorTeste.habilidades[key]) return message.reply(`⚠️ Você já possui ${encontrada.nome}`);
                jogadorTeste.habilidades[key] = { usosRestantes: 999 };
                const informativos = [
                    { emoji: "⭐", label: "Estrelas", valor: encontrada.estrelas },
                    { emoji: "🎯", label: "Tipo", valor: encontrada.tipo },
                    { emoji: "📝", label: "Efeito", valor: encontrada.efeito }
                ];
                const texto = criarMoldePreparacao("✅", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘 𝗔𝗗𝗜𝗖𝗜𝗢𝗡𝗔𝗗𝗔", `${encontrada.emoji} ${encontrada.nome} foi adicionada!`, informativos, "Usos: Ilimitados no modo teste!");
                return message.reply({ embeds: [new EmbedBuilder().setColor('#2ECC71').setDescription(texto)] });
            }
            
            if (acao === 'remover') {
                const nome = args.slice(2).join(' ');
                let removida = null;
                for (const [key] of Object.entries(jogadorTeste.habilidades)) {
                    const hab = listarTodasHabilidades()[key];
                    if (hab && hab.nome.toLowerCase().includes(nome.toLowerCase())) {
                        removida = key; break;
                    }
                }
                if (!removida) return message.reply('❌ Você não possui essa habilidade');
                delete jogadorTeste.habilidades[removida];
                return message.reply(`✅ Habilidade removida!`);
            }
            
            const informativos = [
                { emoji: "📖", label: "Listar", valor: "c!testar hab listar" },
                { emoji: "➕", label: "Adicionar", valor: "c!testar hab add <nome>" },
                { emoji: "➖", label: "Remover", valor: "c!testar hab remover <nome>" },
                { emoji: "♾️", label: "Usos", valor: "Ilimitado" }
            ];
            const texto = criarMoldePreparacao("✨", "𝗚𝗘𝗥𝗘𝗡𝗖𝗜𝗔𝗥 𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦", "Gerencie suas habilidades!", informativos, "Use os comandos acima!");
            return message.reply({ embeds: [new EmbedBuilder().setColor('#9B59B6').setDescription(texto)] });
        }

        // CHUTE
        if (subComando === 'chute') {
            await mostrarTiposChute(message);
            return;
        }

        // DEFESA
        if (subComando === 'defesa') {
            if (!chuteSimulado) {
                return message.reply('❌ Não há chute para defender! Primeiro execute `c!testar chute`');
            }
            await mostrarEstilosDefesa(message);
            return;
        }

        // DRIBLE
        if (subComando === 'drible') {
            await mostrarTiposDrible(message);
            return;
        }

        // PASSE
        if (subComando === 'passe') {
            await mostrarTiposPasse(message);
            return;
        }

        // INTERCEPTAR
        if (subComando === 'interceptar') {
            if (!chuteSimulado && !interceptacaoSimulada) {
                return message.reply('❌ Não há chute ou passe para interceptar!');
            }
            await mostrarTiposInterceptacao(message);
            return;
        }

        // DESARMAR
        if (subComando === 'desarmar') {
            await mostrarTiposDesarme(message);
            return;
        }

        // HELP
        const informativos = [
            { emoji: "🎯", label: "Chute", valor: "c!testar chute" },
            { emoji: "🧤", label: "Defesa", valor: "c!testar defesa" },
            { emoji: "✨", label: "Drible", valor: "c!testar drible" },
            { emoji: "☄️", label: "Passe", valor: "c!testar passe" },
            { emoji: "🎯", label: "Interceptar", valor: "c!testar interceptar" },
            { emoji: "🛡️", label: "Desarmar", valor: "c!testar desarmar" },
            { emoji: "⚙️", label: "Config", valor: "c!testar config" },
            { emoji: "✨", label: "Habilidades", valor: "c!testar hab" },
            { emoji: "❌", label: "Desativar", valor: "c!testar desativar" }
        ];
        const texto = criarMoldePreparacao("📖", "𝗚𝗨𝗜𝗔 𝗗𝗘 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦", "Explore a matemática de combate do Blue Lock!", informativos, "Habilidades têm usos ilimitados no modo teste!");
        
        return message.reply({ embeds: [new EmbedBuilder()
            .setColor('#9B59B6')
            .setAuthor({ name: `Modo de Simulação`, iconURL: message.author.displayAvatarURL() })
            .setTitle('📋 GUIA DE COMANDOS')
            .setDescription(texto)
            .setTimestamp()] });
    }
};

// ==========================================
// 🎯 FUNÇÕES DE CHUTE
// ==========================================

async function mostrarTiposChute(message) {
    const tiposRow = new ActionRowBuilder();
    tiposChute.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "voleio") estilo = ButtonStyle.Success;
        if (t.nome === "bicicleta") estilo = ButtonStyle.Danger;
        if (t.nome === "cavadinha") estilo = ButtonStyle.Secondary;
        tiposRow.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome}`).setLabel(`${t.emoji} ${t.label}`).setStyle(estilo));
    });

    const informativos = [
        { emoji: "📍", label: "Setor", valor: `${testeConfig.setor}` },
        { emoji: "🦵", label: "Finalização Base", valor: `+${testeConfig.status.finalizacao}` },
        { emoji: "🎯", label: "Técnica", valor: "Escolha o tipo de finalização" }
    ];
    
    let descricaoTecnicas = `\nㅤㅤ⌞ 🎯 TÉCNICAS DISPONÍVEIS ⌝\n\n`;
    tiposChute.forEach(t => {
        descricaoTecnicas += `⤷ ${t.emoji} ${t.label}\n   Bônus: +${t.bonus} | Fatal: ≤${t.fatal} | Mult: x${t.multiplicador}\n   📝 ${t.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("⚽", "𝗦𝗘𝗟𝗘𝗖𝗜𝗢𝗡𝗘 𝗔 𝗧𝗘́𝗖𝗡𝗜𝗖𝗔", `${message.author.username} se prepara para finalizar!`, informativos, "Escolha a técnica nos botões abaixo.") + descricaoTecnicas;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 TIPO DE CHUTE')
        .setDescription(texto)
        .setFooter({ text: '30s para escolher' });

    const msg = await message.reply({ embeds: [embed], components: [tiposRow] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas quem iniciou o teste!', flags: 64 });
        collector.stop();
        const tipo = tiposChute.find(t => t.nome === i.customId.replace('tipo_', ''));
        await mostrarForcasChute(i, tipo);
    });
}

async function mostrarForcasChute(interaction, tipoInfo) {
    const forcaRow = new ActionRowBuilder();
    forcasChute.forEach(f => forcaRow.addComponents(new ButtonBuilder().setCustomId(`forca_${f.nome.replace(/ /g, '_')}`).setLabel(f.nome).setStyle(ButtonStyle.Secondary)));

    const informativos = [
        { emoji: "⚽", label: "Técnica", valor: `${tipoInfo.label}` },
        { emoji: "💪", label: "Força", valor: "Escolha a potência" }
    ];
    
    let descricaoForcas = `\nㅤㅤ⌞ 💪 FORÇAS DISPONÍVEIS ⌝\n\n`;
    forcasChute.forEach(f => {
        descricaoForcas += `⤷ ${f.nome}\n   Bônus: +${f.bonus} | Mult: x${f.multiplicador} | Fatal: ≤${f.fatal}\n   📝 ${f.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("⚖️", "𝗗𝗘𝗙𝗜𝗡𝗔 𝗔 𝗣𝗢𝗧𝗘̂𝗡𝗖𝗜𝗔", `${interaction.user.username} define a força do chute!`, informativos, "Escolha a força nos botões abaixo.") + descricaoForcas;

    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setAuthor({ name: `⚽ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('⚖️ DEFINIÇÃO DE POTÊNCIA')
        .setDescription(texto)
        .setFooter({ text: '30s para escolher' });

    await interaction.update({ embeds: [embed], components: [forcaRow] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Restrito ao criador!', flags: 64 });
        collector.stop();
        const forca = forcasChute.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogadorTeste, 'chute');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarChute(i, i.user.username, tipoInfo, forca, null)], components: [] });
        } else {
            await mostrarHabilidadesChute(i, tipoInfo, forca, habilidades);
        }
    });
}

async function mostrarHabilidadesChute(interaction, tipoInfo, forca, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => {
        let estilo = ButtonStyle.Primary;
        if (h.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (h.estrelas === "★★★★") estilo = ButtonStyle.Success;
        row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(estilo));
    });

    let habsTexto = `ㅤㅤ⌞ ✨ HABILIDADES DISPONÍVEIS ⌝\n\n`;
    habilidades.forEach(hab => {
        habsTexto += `⤷ ${hab.emoji} ${hab.nome} (${hab.estrelas})\n   📝 ${hab.efeito}\n`;
        if (hab.bonus?.finalizacao) habsTexto += `   🦵 +${hab.bonus.finalizacao} Finalização\n`;
        habsTexto += `\n`;
    });
    habsTexto += `⤷ 🚫 Nenhuma Habilidade\n   Executar sem bônus adicional\n`;

    const texto = criarMoldePreparacao("✨", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦", `${interaction.user.username}, ative uma habilidade para potencializar o chute!`, [], "Clique no botão para ativar.") + `\n\n${habsTexto}`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ SELECIONE UMA HABILIDADE')
        .setDescription(texto)
        .setFooter({ text: 'Clique na habilidade para ativar' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        let habUsada = null;
        if (habKey !== 'nenhuma') {
            const res = usarHabilidade(jogadorTeste, habKey);
            if (!res.sucesso) return i.reply({ content: res.mensagem, flags: 64 });
            habUsada = habKey;
        }
        await i.update({ embeds: [executarChute(i, i.user.username, tipoInfo, forca, habUsada)], components: [] });
    });
}

function executarChute(interaction, username, tipoInfo, forca, habilidadeKey) {
    let bonusChute = testeConfig.status.finalizacao;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let multiplicador = forca.multiplicador;
    let chanceFatalFinal = Math.max(tipoInfo.fatal, forca.fatal);
    let podeRerrolar = false;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    const habBonus = habilidadeKey ? (listarTodasHabilidades()[habilidadeKey]?.bonus?.finalizacao || 0) : 0;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = habInfo.gif;
        const aplicado = aplicarBonusHabilidade(jogadorTeste, habilidadeKey, { bonusChute, multiplicador, chanceFatal: chanceFatalFinal });
        bonusChute = aplicado.bonusChute || bonusChute;
        multiplicador = aplicado.multiplicador || multiplicador;
        chanceFatalFinal = aplicado.chanceFatal || chanceFatalFinal;
        podeRerrolar = aplicado.podeRerrolar || false;
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    // HABILIDADE NÃO ENTRA NO BÔNUS! Só técnica e força
    let total = Math.floor((dado + bonusChute + bonusTipo + forca.bonus) * multiplicador);
    if (total < 1) total = 1;
    
    // Habilidade adiciona um extra separado (não no bônus principal)
    const habExtra = habBonus;
    const totalComHabilidade = total + habExtra;
    
    let erroFatal = dado <= chanceFatalFinal;
    let rerrolou = false;
    const dadoOriginal = dado;
    
    if (habilidadeKey === 'secondChance' && erroFatal && podeRerrolar) {
        const novoDado = Math.floor(Math.random() * 40) + 1;
        total = Math.floor((novoDado + bonusChute + bonusTipo + forca.bonus) * multiplicador);
        if (total < 1) total = 1;
        erroFatal = novoDado <= chanceFatalFinal;
        rerrolou = true;
    }
    
    const bonusTotal = bonusTipo + forca.bonus;
    
    if (erroFatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal} (FATAL! ≤${chanceFatalFinal})` },
            { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo + forca.penalidade}` }
        ];
        
        const texto = criarMoldeResultado("💥", "𝗘𝗥𝗥𝗢 𝗙𝗔𝗧𝗔𝗟", `${username} tentou finalizar com ${tipoInfo.label} ${forca.nome}${nomeHabilidade ? ` usando ${nomeHabilidade}` : ''}, mas errou feio!`, dadosArray, "A bola foi direto para fora de campo!", null, null, null);
        
        chuteSimulado = null;
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 ERRO CRÍTICO!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    }
    
    chuteSimulado = { 
        jogadorNome: username, 
        dado: totalComHabilidade, 
        setor: testeConfig.setor, 
        tipo: `${tipoInfo.label} ${forca.nome}`, 
        habilidade: nomeHabilidade,
        tecnica: tipoInfo.label,
        forca: forca.nome
    };
    
    const dadosArray = [
        { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
        { emoji: "🎲", label: "Rolagem", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}` },
        { emoji: "🦵", label: "Finalização", valor: `+${bonusChute}` },
        { emoji: "🎯", label: "Bônus", valor: `+${bonusTotal}` },
        { emoji: "✖️", label: "Multiplicador", valor: `x${multiplicador}` },
        { emoji: "💥", label: "Poder Final", valor: `${totalComHabilidade}` }
    ];
    if (habExtra > 0) dadosArray.splice(4, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habExtra}` });
    
    const texto = criarMoldeResultado("⚽", "𝗖𝗛𝗨𝗧𝗘 𝗘𝗫𝗘𝗖𝗨𝗧𝗔𝗗𝗢", `${username} encontrou o momento perfeito e disparou uma finalização poderosa em direção ao gol.`, dadosArray, "A bola atravessa o campo em alta velocidade, carregando uma ameaça real ao gol adversário.", `O goleiro possui até \`30 segundos\` para reagir.`, `c!testar defesa`, `c!testar interceptar`);
    
    return new EmbedBuilder()
        .setColor('#2ECC71')
        .setAuthor({ name: `🔥 ${username}`, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(texto)
        .setImage(gifHabilidade || gifs[tipoInfo.gifKey] || gifs.chute_normal)
        .setTimestamp();
}

// ==========================================
// 🧤 FUNÇÕES DE DEFESA
// ==========================================

async function mostrarEstilosDefesa(message) {
    const row = new ActionRowBuilder();
    estilosDefesa.forEach(e => row.addComponents(new ButtonBuilder().setCustomId(`estilo_${e.nome.replace(/ /g, '_')}`).setLabel(e.nome).setStyle(ButtonStyle.Primary)));

    const informativos = [
        { emoji: "🎯", label: "Poder do Chute", valor: `${chuteSimulado.dado}` },
        { emoji: "⚽", label: "Técnica", valor: `${chuteSimulado.tipo}` },
        { emoji: "📍", label: "Setor", valor: `${chuteSimulado.setor}` },
        { emoji: "🧤", label: "Defesa Base", valor: `+${testeConfig.status.defesaGk}` },
        { emoji: "🛡️", label: "Estilo", valor: "Escolha a postura defensiva" }
    ];
    if (chuteSimulado.habilidade) informativos.unshift({ emoji: "✨", label: "Habilidade", valor: chuteSimulado.habilidade });
    
    let descricaoEstilos = `\nㅤㅤ⌞ 🧤 ESTILOS DE DEFESA ⌝\n\n`;
    estilosDefesa.forEach(e => {
        descricaoEstilos += `⤷ ${e.nome}\n   Bônus: +${e.bonus} | Fatal: ≤${e.fatal}\n   📝 ${e.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("🧤", "𝗦𝗘𝗟𝗘𝗖𝗜𝗢𝗡𝗘 𝗔 𝗗𝗘𝗙𝗘𝗦𝗔", `O goleiro se prepara para defender o chute de ${chuteSimulado.jogadorNome}!`, informativos, "Escolha o estilo nos botões abaixo.") + descricaoEstilos;

    const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setAuthor({ name: `🧤 ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🧤 ESTILO DE DEFESA')
        .setDescription(texto)
        .setFooter({ text: '30s para escolher' });

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas o goleiro pode escolher!', flags: 64 });
        collector.stop();
        const estilo = estilosDefesa.find(e => e.nome === i.customId.replace('estilo_', '').replace(/_/g, ' '));
        await mostrarForcasDefesa(i, estilo);
    });
}

async function mostrarForcasDefesa(interaction, estilo) {
    const row = new ActionRowBuilder();
    forcasDefesa.forEach(f => row.addComponents(new ButtonBuilder().setCustomId(`forca_${f.nome.replace(/ /g, '_')}`).setLabel(f.nome).setStyle(ButtonStyle.Secondary)));

    const informativos = [
        { emoji: "🧤", label: "Estilo", valor: `${estilo.nome}` },
        { emoji: "💪", label: "Força", valor: "Escolha a intensidade" }
    ];
    
    let descricaoForcas = `\nㅤㅤ⌞ 💪 FORÇAS DE DEFESA ⌝\n\n`;
    forcasDefesa.forEach(f => {
        descricaoForcas += `⤷ ${f.nome}\n   Bônus: +${f.bonus} | Mult: x${f.multiplicador} | Fatal: ≤${f.fatal}\n   📝 ${f.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("⚖️", "𝗗𝗘𝗙𝗜𝗡𝗔 𝗔 𝗙𝗢𝗥𝗖̧𝗔", `${interaction.user.username} define a intensidade da defesa!`, informativos, "Escolha a força nos botões abaixo.") + descricaoForcas;

    const embed = new EmbedBuilder()
        .setColor('#F39C12')
        .setAuthor({ name: `🧤 ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('⚖️ DEFINIÇÃO DE FORÇA')
        .setDescription(texto)
        .setFooter({ text: '30s para escolher' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Restrito ao goleiro!', flags: 64 });
        collector.stop();
        const forca = forcasDefesa.find(f => f.nome === i.customId.replace('forca_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogadorTeste, 'defesa');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarDefesa(i, i.user.username, estilo, forca, null)], components: [] });
        } else {
            await mostrarHabilidadesDefesa(i, estilo, forca, habilidades);
        }
    });
}

async function mostrarHabilidadesDefesa(interaction, estilo, forca, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => {
        let estiloBtn = ButtonStyle.Primary;
        if (h.estrelas === "★★★★★") estiloBtn = ButtonStyle.Danger;
        else if (h.estrelas === "★★★★") estiloBtn = ButtonStyle.Success;
        row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(estiloBtn));
    });

    let habsTexto = `ㅤㅤ⌞ ✨ HABILIDADES DISPONÍVEIS ⌝\n\n`;
    habilidades.forEach(hab => {
        habsTexto += `⤷ ${hab.emoji} ${hab.nome} (${hab.estrelas})\n   📝 ${hab.efeito}\n`;
        if (hab.bonus?.defesaGk) habsTexto += `   🧤 +${hab.bonus.defesaGk} Defesa\n`;
        habsTexto += `\n`;
    });
    habsTexto += `⤷ 🚫 Nenhuma Habilidade\n   Executar sem bônus adicional\n`;

    const texto = criarMoldePreparacao("✨", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦", `${interaction.user.username}, ative uma habilidade para melhorar a defesa!`, [], "Clique no botão para ativar.") + `\n\n${habsTexto}`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ SELECIONE UMA HABILIDADE')
        .setDescription(texto)
        .setFooter({ text: 'Clique na habilidade para ativar' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Apenas você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        let habUsada = null;
        if (habKey !== 'nenhuma') {
            const res = usarHabilidade(jogadorTeste, habKey);
            if (!res.sucesso) return i.reply({ content: res.mensagem, flags: 64 });
            habUsada = habKey;
        }
        await i.update({ embeds: [executarDefesa(i, i.user.username, estilo, forca, habUsada)], components: [] });
        chuteSimulado = null;
    });
}

function executarDefesa(interaction, username, estilo, forca, habilidadeKey) {
    let bonusDefesa = testeConfig.status.defesaGk;
    const dificuldade = chuteSimulado.dado;
    let chanceFatalFinal = Math.max(estilo.fatal, forca.fatal);
    let multiplicador = forca.multiplicador;
    let podeRerrolar = false;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    const habBonus = habilidadeKey ? (listarTodasHabilidades()[habilidadeKey]?.bonus?.defesaGk || 0) : 0;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = habInfo.gif;
        const aplicado = aplicarBonusHabilidade(jogadorTeste, habilidadeKey, { bonusDefesa, multiplicador, chanceFatal: chanceFatalFinal });
        bonusDefesa = aplicado.bonusDefesa || bonusDefesa;
        multiplicador = aplicado.multiplicador || multiplicador;
        chanceFatalFinal = aplicado.chanceFatal || chanceFatalFinal;
        podeRerrolar = aplicado.podeRerrolarDefesa || false;
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = Math.floor((dado + bonusDefesa + estilo.bonus + forca.bonus) * multiplicador);
    if (total < 1) total = 1;
    const totalComHabilidade = total + habBonus;
    let erroFatal = dado <= chanceFatalFinal;
    let rerrolou = false;
    const dadoOriginal = dado;
    
    if (habilidadeKey === 'secondDefense' && erroFatal && podeRerrolar) {
        const novoDado = Math.floor(Math.random() * 40) + 1;
        total = Math.floor((novoDado + bonusDefesa + estilo.bonus + forca.bonus) * multiplicador);
        if (total < 1) total = 1;
        erroFatal = novoDado <= chanceFatalFinal;
        rerrolou = true;
    }
    
    const bonusTotal = estilo.bonus + forca.bonus;
    const diff = totalComHabilidade - dificuldade;
    
    if (erroFatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal} (FATAL! ≤${chanceFatalFinal})` },
            { emoji: "🧤", label: "Defesa", valor: `${totalComHabilidade} (ANULADA)` }
        ];
        
        const texto = criarMoldeResultado("💥", "𝗙𝗥𝗔𝗡𝗚𝗨𝗘𝗜𝗥𝗔 𝗙𝗔𝗧𝗔𝗟", `${username} tentou defender com ${estilo.nome} ${forca.nome}${nomeHabilidade ? ` usando ${nomeHabilidade}` : ''}, mas falhou miseravelmente!`, dadosArray, "GOL INCONTESTÁVEL!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 GOL!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    }
    
    const defendeu = totalComHabilidade >= dificuldade;
    
    const dadosArray = [
        { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
        { emoji: "🎲", label: "Rolagem", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}` },
        { emoji: "🧤", label: "Defesa Base", valor: `+${bonusDefesa}` },
        { emoji: "🎯", label: "Bônus", valor: `+${bonusTotal}` },
        { emoji: "✖️", label: "Multiplicador", valor: `x${multiplicador}` },
        { emoji: "📈", label: "Valor Final", valor: `${totalComHabilidade}` },
        { emoji: "🎯", label: "Força do Chute", valor: `${dificuldade}` }
    ];
    if (habBonus > 0) dadosArray.splice(5, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
    
    const resultado = defendeu ? `Defesa perfeita! O goleiro agarrou com ${diff} pontos de sobra!` : `O chute foi forte demais! A bola entra no gol!`;
    const texto = criarMoldeResultado(defendeu ? "🧤" : "⚽", defendeu ? "𝗗𝗘𝗙𝗘𝗦𝗔 𝗥𝗘𝗔𝗟𝗜𝗭𝗔𝗗𝗔" : "𝗚𝗢𝗟 𝗦𝗢𝗙𝗥𝗜𝗗𝗢", `${username} ${defendeu ? 'fez uma defesa incrível e evitou o gol!' : 'não conseguiu alcançar a bola!'}`, dadosArray, resultado, null, null, null);
    
    return new EmbedBuilder()
        .setColor(defendeu ? '#2ECC71' : '#E74C3C')
        .setAuthor({ name: defendeu ? `🧤 ${username}` : `⚽ ${username}`, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(texto)
        .setImage(gifHabilidade || gifs.defesa)
        .setTimestamp();
}

// ==========================================
// ✨ FUNÇÕES DE DRIBLE (simplificadas com novo molde)
// ==========================================

async function mostrarTiposDrible(message) {
    const row = new ActionRowBuilder();
    tiposDrible.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "⚡ Drible Rápido") estilo = ButtonStyle.Success;
        if (t.nome === "🎭 Drible Fantasia") estilo = ButtonStyle.Danger;
        row.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const informativos = [
        { emoji: "✨", label: "Drible Base", valor: `+${testeConfig.status.drible}` },
        { emoji: "🛡️", label: "Desarme Defensor", valor: `+${testeConfig.status.desarme}` },
        { emoji: "🎯", label: "Estilo", valor: "Escolha o movimento" }
    ];
    
    let descricaoEstilos = `\nㅤㅤ⌞ ✨ ESTILOS DE DRIBLE ⌝\n\n`;
    tiposDrible.forEach(t => {
        descricaoEstilos += `⤷ ${t.nome}\n   Bônus: +${t.bonus} | Fatal: ≤${t.fatal}\n   📝 ${t.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("✨", "𝗦𝗘𝗟𝗘𝗖𝗜𝗢𝗡𝗘 𝗢 𝗗𝗥𝗜𝗕𝗟𝗘", `${message.author.username} vai tentar passar pelo defensor!`, informativos, "Escolha o estilo nos botões abaixo.") + descricaoEstilos;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 ESTILO DE DRIBLE')
        .setDescription(texto)
        .setFooter({ text: '30s' });

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Não é você!', flags: 64 });
        collector.stop();
        const tipo = tiposDrible.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogadorTeste, 'drible');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarDrible(i, i.user.username, tipo, null)], components: [] });
        } else {
            await mostrarHabilidadesDrible(i, tipo, habilidades);
        }
    });
}

async function mostrarHabilidadesDrible(interaction, tipoInfo, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => {
        let estilo = ButtonStyle.Primary;
        if (h.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (h.estrelas === "★★★★") estilo = ButtonStyle.Success;
        row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(estilo));
    });

    let habsTexto = `ㅤㅤ⌞ ✨ HABILIDADES DISPONÍVEIS ⌝\n\n`;
    habilidades.forEach(hab => {
        habsTexto += `⤷ ${hab.emoji} ${hab.nome} (${hab.estrelas})\n   📝 ${hab.efeito}\n`;
        if (hab.bonus?.drible) habsTexto += `   ✨ +${hab.bonus.drible} Drible\n`;
        habsTexto += `\n`;
    });
    habsTexto += `⤷ 🚫 Nenhuma Habilidade\n   Executar sem bônus adicional\n`;

    const texto = criarMoldePreparacao("✨", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦", `${interaction.user.username}, ative uma habilidade para o drible!`, [], "Clique no botão para ativar.") + `\n\n${habsTexto}`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ SELECIONE UMA HABILIDADE')
        .setDescription(texto)
        .setFooter({ text: 'Clique na habilidade' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Não é você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        let habUsada = null;
        if (habKey !== 'nenhuma') {
            const res = usarHabilidade(jogadorTeste, habKey);
            if (!res.sucesso) return i.reply({ content: res.mensagem, flags: 64 });
            habUsada = habKey;
        }
        await i.update({ embeds: [executarDrible(i, i.user.username, tipoInfo, habUsada)], components: [] });
    });
}

function executarDrible(interaction, username, tipoInfo, habilidadeKey) {
    let bonusDrible = testeConfig.status.drible;
    let bonusDesarme = testeConfig.status.desarme;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let chanceFatalFinal = tipoInfo.fatal;
    let podeRerrolar = false;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    const habBonus = habilidadeKey ? (listarTodasHabilidades()[habilidadeKey]?.bonus?.drible || 0) : 0;

    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = habInfo.gif;
        const aplicado = aplicarBonusHabilidade(jogadorTeste, habilidadeKey, { bonusDrible, chanceFatal: chanceFatalFinal });
        bonusDrible = aplicado.bonusDrible || bonusDrible;
        chanceFatalFinal = aplicado.chanceFatal || chanceFatalFinal;
        podeRerrolar = aplicado.podeRerrolarDrible || false;
    }

    const dadoAtacante = Math.floor(Math.random() * 40) + 1;
    const dadoDefensor = Math.floor(Math.random() * 40) + 1;
    let totalAtacante = dadoAtacante + bonusDrible + bonusTipo;
    let totalDefensor = dadoDefensor + bonusDesarme;
    const totalAtacanteComHab = totalAtacante + habBonus;
    let erroFatal = dadoAtacante <= chanceFatalFinal;
    let rerrolou = false;
    const dadoOriginal = dadoAtacante;
    
    if (habilidadeKey === 'freestyle' && erroFatal && podeRerrolar) {
        const novoDado = Math.floor(Math.random() * 40) + 1;
        totalAtacante = novoDado + bonusDrible + bonusTipo;
        erroFatal = novoDado <= chanceFatalFinal;
        rerrolou = true;
    }
    
    const bonusTotal = bonusTipo;
    
    if (erroFatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal} (FATAL! ≤${chanceFatalFinal})` },
            { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo}` }
        ];
        
        const texto = criarMoldeResultado("💥", "𝗘𝗥𝗥𝗢 𝗙𝗔𝗧𝗔𝗟", `${username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` usando ${nomeHabilidade}` : ''}, mas perdeu o equilíbrio!`, dadosArray, "O defensor recupera a posse!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 FALHA!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    }
    
    if (totalAtacanteComHab > totalDefensor) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
            { emoji: "🎯", label: "Poder Drible", valor: `${totalAtacanteComHab}` },
            { emoji: "🛡️", label: "Poder Defensor", valor: `${totalDefensor}` }
        ];
        if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
        
        const texto = criarMoldeResultado("✨", "𝗗𝗥𝗜𝗕𝗟𝗘 𝗕𝗘𝗠-𝗦𝗨𝗖𝗘𝗗𝗜𝗗𝗢", `${username} passou pelo defensor com categoria!`, dadosArray, "Você venceu o duelo e avança com a bola!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `✨ ${username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifHabilidade || gifs.driblar)
            .setTimestamp();
    } else {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${rerrolou ? `${dadoOriginal} → rerrol` : dadoOriginal}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
            { emoji: "🎯", label: "Poder Drible", valor: `${totalAtacanteComHab}` },
            { emoji: "🛡️", label: "Poder Defensor", valor: `${totalDefensor}` }
        ];
        if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
        
        const texto = criarMoldeResultado("🛡️", "𝗗𝗘𝗦𝗔𝗥𝗠𝗔𝗗𝗢", `${username} tentou passar, mas foi desarmado!`, dadosArray, "O defensor recupera a posse da bola!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#FF0000')
            .setAuthor({ name: `🛡️ ${username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifHabilidade || gifs.driblar)
            .setTimestamp();
    }
}

// ==========================================
// ☄️ FUNÇÕES DE PASSE
// ==========================================

async function mostrarTiposPasse(message) {
    const row = new ActionRowBuilder();
    tiposPasse.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "🎯 Passe Colocado") estilo = ButtonStyle.Success;
        if (t.nome === "🦶 Passe Trivela") estilo = ButtonStyle.Danger;
        row.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const informativos = [
        { emoji: "☄️", label: "Passe Base", valor: `+${testeConfig.status.passe}` },
        { emoji: "🎯", label: "Tipo", valor: "Escolha o estilo do passe" }
    ];
    
    let descricaoTipos = `\nㅤㅤ⌞ ☄️ TIPOS DE PASSE ⌝\n\n`;
    tiposPasse.forEach(t => {
        descricaoTipos += `⤷ ${t.nome}\n   Bônus: +${t.bonus} | Dif.Mín: ${t.dificuldadeMin} | Fatal: ≤${t.fatal}\n   📝 ${t.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("☄️", "𝗦𝗘𝗟𝗘𝗖𝗜𝗢𝗡𝗘 𝗢 𝗣𝗔𝗦𝗦𝗘", `${message.author.username} vai distribuir a bola!`, informativos, "Escolha o estilo nos botões abaixo.") + descricaoTipos;

    const embed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setAuthor({ name: `⚽ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎯 ESTILO DE PASSE')
        .setDescription(texto)
        .setFooter({ text: '30s' });

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Não é você!', flags: 64 });
        collector.stop();
        const tipo = tiposPasse.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogadorTeste, 'passe');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarPasse(i, i.user.username, tipo, null)], components: [] });
        } else {
            await mostrarHabilidadesPasse(i, tipo, habilidades);
        }
    });
}

async function mostrarHabilidadesPasse(interaction, tipoInfo, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => {
        let estilo = ButtonStyle.Primary;
        if (h.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (h.estrelas === "★★★★") estilo = ButtonStyle.Success;
        row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(estilo));
    });

    let habsTexto = `ㅤㅤ⌞ ✨ HABILIDADES DISPONÍVEIS ⌝\n\n`;
    habilidades.forEach(hab => {
        habsTexto += `⤷ ${hab.emoji} ${hab.nome} (${hab.estrelas})\n   📝 ${hab.efeito}\n`;
        if (hab.bonus?.passe) habsTexto += `   ☄️ +${hab.bonus.passe} Passe\n`;
        habsTexto += `\n`;
    });
    habsTexto += `⤷ 🚫 Nenhuma Habilidade\n   Executar sem bônus adicional\n`;

    const texto = criarMoldePreparacao("✨", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦", `${interaction.user.username}, ative uma habilidade para o passe!`, [], "Clique no botão para ativar.") + `\n\n${habsTexto}`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ SELECIONE UMA HABILIDADE')
        .setDescription(texto)
        .setFooter({ text: 'Clique na habilidade' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Não é você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        let habUsada = null;
        if (habKey !== 'nenhuma') {
            const res = usarHabilidade(jogadorTeste, habKey);
            if (!res.sucesso) return i.reply({ content: res.mensagem, flags: 64 });
            habUsada = habKey;
        }
        await i.update({ embeds: [executarPasse(i, i.user.username, tipoInfo, habUsada)], components: [] });
    });
}

function executarPasse(interaction, username, tipoInfo, habilidadeKey) {
    let bonusPasse = testeConfig.status.passe;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let chanceFatalFinal = tipoInfo.fatal;
    let dificuldadeMin = tipoInfo.dificuldadeMin;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    const habBonus = habilidadeKey ? (listarTodasHabilidades()[habilidadeKey]?.bonus?.passe || 0) : 0;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = habInfo.gif;
        const aplicado = aplicarBonusHabilidade(jogadorTeste, habilidadeKey, { bonusPasse, chanceFatal: chanceFatalFinal });
        bonusPasse = aplicado.bonusPasse || bonusPasse;
        chanceFatalFinal = aplicado.chanceFatal || chanceFatalFinal;
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = dado + bonusPasse + bonusTipo;
    if (total < 1) total = 1;
    const totalComHabilidade = total + habBonus;
    let erroFatal = dado <= chanceFatalFinal;
    const bonusTotal = bonusTipo;
    
    if (erroFatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dado} (FATAL! ≤${chanceFatalFinal})` },
            { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo}` }
        ];
        
        const texto = criarMoldeResultado("💥", "𝗘𝗥𝗥𝗢 𝗙𝗔𝗧𝗔𝗟", `${username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` usando ${nomeHabilidade}` : ''}, mas isolou a bola!`, dadosArray, "A bola foi direto para fora!", null, null, null);
        
        interceptacaoSimulada = null;
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 ERRO!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    }
    
    interceptacaoSimulada = { 
        poderPasse: totalComHabilidade, 
        tipo: tipoInfo.nome, 
        setor: testeConfig.setor,
        passadorNome: username
    };
    
    const dadosArray = [
        { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
        { emoji: "🎲", label: "Rolagem", valor: `${dado}` },
        { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
        { emoji: "🎯", label: "Dificuldade", valor: `${dificuldadeMin}` },
        { emoji: "💥", label: "Poder Final", valor: `${totalComHabilidade}` }
    ];
    if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
    
    if (totalComHabilidade >= dificuldadeMin) {
        const texto = criarMoldeResultado("✅", "𝗣𝗔𝗦𝗦𝗘 𝗣𝗘𝗥𝗙𝗘𝗜𝗧𝗢", `${username} encontrou o companheiro com precisão cirúrgica!`, dadosArray, "O passe chega limpo nos pés do receptor!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `✅ ${username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifHabilidade || gifs.passe_normal)
            .setTimestamp();
    } else {
        const texto = criarMoldeResultado("⚠️", "𝗣𝗔𝗦𝗦𝗘 𝗣𝗘𝗥𝗜𝗚𝗢𝗦𝗢", `${username} fez um passe difícil de alcançar!`, dadosArray, "O companheiro precisa se esforçar para dominar!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#FFA500')
            .setAuthor({ name: `⚠️ ${username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifHabilidade || gifs.passe_normal)
            .setTimestamp();
    }
}

// ==========================================
// 🎯 FUNÇÕES DE INTERCEPTAÇÃO
// ==========================================

async function mostrarTiposInterceptacao(message) {
    let alvo = null;
    let tipoAlvo = null;
    
    if (chuteSimulado) {
        alvo = chuteSimulado;
        tipoAlvo = "chute";
    } else if (interceptacaoSimulada) {
        alvo = interceptacaoSimulada;
        tipoAlvo = "passe";
    } else {
        return message.reply('❌ Não há chute ou passe para interceptar!');
    }
    
    const row = new ActionRowBuilder();
    tiposInterceptacao.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "⚡ Interceptação Rápida") estilo = ButtonStyle.Success;
        if (t.nome === "🎭 Interceptação Fantasia") estilo = ButtonStyle.Danger;
        row.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    let poderAlvo = 0;
    let nomeAlvo = "";
    let tipoExibicao = tipoAlvo === "passe" ? "PASSE" : "CHUTE";
    
    if (tipoAlvo === "passe") {
        poderAlvo = alvo.poderPasse;
        nomeAlvo = alvo.passadorNome || "Holograma";
    } else {
        poderAlvo = alvo.dado;
        nomeAlvo = alvo.jogadorNome;
    }
    
    const informativos = [
        { emoji: "🎯", label: "Interceptação Base", valor: `+${testeConfig.status.interceptacao}` },
        { emoji: "💥", label: `Poder do ${tipoExibicao}`, valor: `${poderAlvo} (${nomeAlvo})` },
        { emoji: "📍", label: "Setor", valor: `${testeConfig.setor}` },
        { emoji: "🛡️", label: "Estilo", valor: "Escolha a abordagem" }
    ];
    
    let descricaoEstilos = `\nㅤㅤ⌞ 🛡️ ESTILOS DE INTERCEPTAÇÃO ⌝\n\n`;
    tiposInterceptacao.forEach(t => {
        descricaoEstilos += `⤷ ${t.nome}\n   Bônus: +${t.bonus} | Fatal: ≤${t.fatal}\n   📝 ${t.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("🎯", `𝗜𝗡𝗧𝗘𝗥𝗖𝗘𝗣𝗧𝗔𝗥 ${tipoExibicao}`, `${message.author.username} se posiciona para cortar a jogada!`, informativos, "Escolha o estilo nos botões abaixo.") + descricaoEstilos;

    const embed = new EmbedBuilder()
        .setColor('#E67E22')
        .setAuthor({ name: `🎯 ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle(`🎯 INTERCEPTAR ${tipoExibicao}`)
        .setDescription(texto)
        .setFooter({ text: '30s' });

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Não é você!', flags: 64 });
        collector.stop();
        const tipo = tiposInterceptacao.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogadorTeste, 'interceptacao');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarInterceptacao(i, i.user.username, tipo, null, alvo, tipoAlvo)], components: [] });
        } else {
            await mostrarHabilidadesInterceptacao(i, tipo, alvo, tipoAlvo, habilidades);
        }
    });
}

async function mostrarHabilidadesInterceptacao(interaction, tipoInfo, alvo, tipoAlvo, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => {
        let estilo = ButtonStyle.Primary;
        if (h.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (h.estrelas === "★★★★") estilo = ButtonStyle.Success;
        row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(estilo));
    });

    let habsTexto = `ㅤㅤ⌞ ✨ HABILIDADES DISPONÍVEIS ⌝\n\n`;
    habilidades.forEach(hab => {
        habsTexto += `⤷ ${hab.emoji} ${hab.nome} (${hab.estrelas})\n   📝 ${hab.efeito}\n`;
        if (hab.bonus?.interceptacao) habsTexto += `   🎯 +${hab.bonus.interceptacao} Interceptação\n`;
        habsTexto += `\n`;
    });
    habsTexto += `⤷ 🚫 Nenhuma Habilidade\n   Executar sem bônus adicional\n`;

    const tipoExibicao = tipoAlvo === "passe" ? "PASSE" : "CHUTE";
    const texto = criarMoldePreparacao("✨", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦", `${interaction.user.username}, ative uma habilidade para interceptar!`, [], "Clique no botão para ativar.") + `\n\n${habsTexto}`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ SELECIONE UMA HABILIDADE')
        .setDescription(texto)
        .setFooter({ text: 'Clique na habilidade' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Não é você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        let habUsada = null;
        if (habKey !== 'nenhuma') {
            const res = usarHabilidade(jogadorTeste, habKey);
            if (!res.sucesso) return i.reply({ content: res.mensagem, flags: 64 });
            habUsada = habKey;
        }
        await i.update({ embeds: [executarInterceptacao(i, i.user.username, tipoInfo, habUsada, alvo, tipoAlvo)], components: [] });
        
        if (tipoAlvo === "chute") {
            chuteSimulado = null;
        } else {
            interceptacaoSimulada = null;
        }
    });
}

function executarInterceptacao(interaction, username, tipoInfo, habilidadeKey, alvo, tipoAlvo) {
    let bonusInterceptacao = testeConfig.status.interceptacao;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let chanceFatalFinal = tipoInfo.fatal;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    const habBonus = habilidadeKey ? (listarTodasHabilidades()[habilidadeKey]?.bonus?.interceptacao || 0) : 0;
    
    let poderAlvo = 0;
    let nomeAtacante = "";
    let tipoExibicao = tipoAlvo === "passe" ? "passe" : "chute";
    
    if (tipoAlvo === "passe") {
        poderAlvo = alvo.poderPasse;
        nomeAtacante = alvo.passadorNome || "Holograma";
    } else {
        poderAlvo = alvo.dado;
        nomeAtacante = alvo.jogadorNome;
    }
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = habInfo.gif;
        const aplicado = aplicarBonusHabilidade(jogadorTeste, habilidadeKey, { bonusInterceptacao, chanceFatal: chanceFatalFinal });
        bonusInterceptacao = aplicado.bonusInterceptacao || bonusInterceptacao;
        chanceFatalFinal = aplicado.chanceFatal || chanceFatalFinal;
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = dado + bonusInterceptacao + bonusTipo;
    if (total < 1) total = 1;
    const totalComHabilidade = total + habBonus;
    let erroFatal = dado <= chanceFatalFinal;
    const bonusTotal = bonusTipo;
    const diferenca = totalComHabilidade - poderAlvo;
    
    if (erroFatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dado} (FATAL! ≤${chanceFatalFinal})` },
            { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo}` },
            { emoji: "💥", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` }
        ];
        
        const texto = criarMoldeResultado("💥", "𝗘𝗥𝗥𝗢 𝗙𝗔𝗧𝗔𝗟", `${username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` usando ${nomeHabilidade}` : ''}, mas falhou feio!`, dadosArray, `O ${tipoExibicao} continua sem problemas!`, null, null, null);
        
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 FALHA!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    }
    
    if (totalComHabilidade >= poderAlvo && diferenca >= 8) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
            { emoji: "🎯", label: "Poder Interceptação", valor: `${totalComHabilidade}` },
            { emoji: "💥", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` },
            { emoji: "⚡", label: "Diferença", valor: `+${diferenca} (INTERCEPTAÇÃO FORTE)` }
        ];
        if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
        
        const texto = criarMoldeResultado("✅", "𝗜𝗡𝗧𝗘𝗥𝗖𝗘𝗣𝗧𝗔𝗖̧𝗔̃𝗢 𝗣𝗘𝗥𝗙𝗘𝗜𝗧𝗔", `${username} leu a jogada e dominou a bola!`, dadosArray, "Você interceptou e agora tem a posse!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `✅ ${username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifHabilidade || gifs.interceptar)
            .setTimestamp();
    }
    
    if (totalComHabilidade >= poderAlvo && diferenca >= 3) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
            { emoji: "🎯", label: "Poder Interceptação", valor: `${totalComHabilidade}` },
            { emoji: "💥", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` },
            { emoji: "⚡", label: "Diferença", valor: `+${diferenca} (DESVIO)` }
        ];
        if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
        
        const texto = criarMoldeResultado("🟡", "𝗜𝗡𝗧𝗘𝗥𝗖𝗘𝗣𝗧𝗔𝗖̧𝗔̃𝗢 𝗖𝗢𝗠 𝗗𝗘𝗦𝗩𝗜𝗢", `${username} desviou a trajetória da bola!`, dadosArray, "A bola fica viva no setor!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#FFA500')
            .setAuthor({ name: `🟡 ${username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifHabilidade || gifs.interceptar)
            .setTimestamp();
    }
    
    if (totalComHabilidade >= poderAlvo) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
            { emoji: "🎯", label: "Poder Interceptação", valor: `${totalComHabilidade}` },
            { emoji: "💥", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` },
            { emoji: "⚡", label: "Diferença", valor: `+${diferenca} (APENAS TOCOU)` }
        ];
        if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
        
        const texto = criarMoldeResultado("🟢", "𝗧𝗢𝗖𝗢𝗨 𝗡𝗔 𝗕𝗢𝗟𝗔", `${username} conseguiu tocar, mas não dominou!`, dadosArray, `O ${tipoAlvo === "chute" ? "goleiro pode defender" : "receptor tenta dominar"}!`, null, null, null);
        
        return new EmbedBuilder()
            .setColor('#87CEEB')
            .setAuthor({ name: `🟢 ${username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifHabilidade || gifs.interceptar)
            .setTimestamp();
    }
    
    if (diferenca >= -3) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
            { emoji: "🎯", label: "Poder Interceptação", valor: `${totalComHabilidade}` },
            { emoji: "💥", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` },
            { emoji: "⚡", label: "Diferença", valor: `${diferenca} (FALHOU POR POUCO)` }
        ];
        if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
        
        const texto = criarMoldeResultado("❌", "𝗤𝗨𝗔𝗦𝗘 𝗜𝗡𝗧𝗘𝗥𝗖𝗘𝗣𝗧𝗢𝗨", `${username} quase pegou a bola!`, dadosArray, `O ${tipoExibicao} passou raspando!`, null, null, null);
        
        return new EmbedBuilder()
            .setColor('#FF6347')
            .setAuthor({ name: `❌ ${username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifHabilidade || gifs.interceptar)
            .setTimestamp();
    }
    
    const dadosArray = [
        { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
        { emoji: "🎲", label: "Rolagem", valor: `${dado}` },
        { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
        { emoji: "🎯", label: "Poder Interceptação", valor: `${totalComHabilidade}` },
        { emoji: "💥", label: `Poder do ${tipoExibicao.toUpperCase()}`, valor: `${poderAlvo}` },
        { emoji: "⚡", label: "Diferença", valor: `${diferenca} (FALHOU COMPLETO)` }
    ];
    if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
    
    const texto = criarMoldeResultado("❌", "𝗜𝗡𝗧𝗘𝗥𝗖𝗘𝗣𝗧𝗔𝗖̧𝗔̃𝗢 𝗙𝗔𝗟𝗛𝗢𝗨", `${username} tentou, mas não conseguiu chegar perto!`, dadosArray, `O ${tipoExibicao} continua sem problemas!`, null, null, null);
    
    return new EmbedBuilder()
        .setColor('#FF0000')
        .setAuthor({ name: `❌ ${username}`, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(texto)
        .setImage(gifHabilidade || gifs.interceptar)
        .setTimestamp();
}

// ==========================================
// 🛡️ FUNÇÕES DE DESARME
// ==========================================

async function mostrarTiposDesarme(message) {
    const row = new ActionRowBuilder();
    tiposDesarme.forEach(t => {
        let estilo = ButtonStyle.Primary;
        if (t.nome === "⚡ Desarme Rápido") estilo = ButtonStyle.Success;
        if (t.nome === "🦵 Carrinho") estilo = ButtonStyle.Danger;
        row.addComponents(new ButtonBuilder().setCustomId(`tipo_${t.nome.replace(/ /g, '_')}`).setLabel(t.nome).setStyle(estilo));
    });

    const dribladorVirtual = { nome: "Holograma Driblador", poderDrible: 10 + Math.floor(Math.random() * 40) + testeConfig.status.drible };

    const informativos = [
        { emoji: "🛡️", label: "Desarme Base", valor: `+${testeConfig.status.desarme}` },
        { emoji: "✨", label: "Poder Drible", valor: `${dribladorVirtual.poderDrible}` },
        { emoji: "⚔️", label: "Estilo", valor: "Escolha a técnica" }
    ];
    
    let descricaoEstilos = `\nㅤㅤ⌞ ⚔️ ESTILOS DE DESARME ⌝\n\n`;
    tiposDesarme.forEach(t => {
        descricaoEstilos += `⤷ ${t.nome}\n   Bônus: +${t.bonus} | Fatal: ≤${t.fatal}\n   📝 ${t.desc}\n\n`;
    });
    
    const texto = criarMoldePreparacao("🛡️", "𝗦𝗘𝗟𝗘𝗖𝗜𝗢𝗡𝗘 𝗢 𝗗𝗘𝗦𝗔𝗥𝗠𝗘", `${message.author.username} vai tentar roubar a bola do ${dribladorVirtual.nome}!`, informativos, "Escolha a técnica nos botões abaixo.") + descricaoEstilos;

    const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setAuthor({ name: `🛡️ ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle('🛡️ ESTILO DE DESARME')
        .setDescription(texto)
        .setFooter({ text: '30s' });

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Não é você!', flags: 64 });
        collector.stop();
        const tipo = tiposDesarme.find(t => t.nome === i.customId.replace('tipo_', '').replace(/_/g, ' '));
        const habilidades = listarHabilidadesPorTipo(jogadorTeste, 'desarme');
        
        if (habilidades.length === 0) {
            await i.update({ embeds: [executarDesarme(i, i.user.username, tipo, dribladorVirtual, null)], components: [] });
        } else {
            await mostrarHabilidadesDesarme(i, tipo, dribladorVirtual, habilidades);
        }
    });
}

async function mostrarHabilidadesDesarme(interaction, tipoInfo, driblador, habilidades) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder().setCustomId('hab_nenhuma').setLabel("🚫 Nenhuma").setStyle(ButtonStyle.Secondary));
    habilidades.slice(0, 4).forEach(h => {
        let estilo = ButtonStyle.Primary;
        if (h.estrelas === "★★★★★") estilo = ButtonStyle.Danger;
        else if (h.estrelas === "★★★★") estilo = ButtonStyle.Success;
        row.addComponents(new ButtonBuilder().setCustomId(`hab_${h.key}`).setLabel(`${h.emoji} ${h.nome}`).setStyle(estilo));
    });

    let habsTexto = `ㅤㅤ⌞ ✨ HABILIDADES DISPONÍVEIS ⌝\n\n`;
    habilidades.forEach(hab => {
        habsTexto += `⤷ ${hab.emoji} ${hab.nome} (${hab.estrelas})\n   📝 ${hab.efeito}\n`;
        if (hab.bonus?.desarme) habsTexto += `   🛡️ +${hab.bonus.desarme} Desarme\n`;
        habsTexto += `\n`;
    });
    habsTexto += `⤷ 🚫 Nenhuma Habilidade\n   Executar sem bônus adicional\n`;

    const texto = criarMoldePreparacao("✨", "𝗛𝗔𝗕𝗜𝗟𝗜𝗗𝗔𝗗𝗘𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗜𝗦", `${interaction.user.username}, ative uma habilidade para o desarme!`, [], "Clique no botão para ativar.") + `\n\n${habsTexto}`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setAuthor({ name: `✨ ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('✨ SELECIONE UMA HABILIDADE')
        .setDescription(texto)
        .setFooter({ text: 'Clique na habilidade' });

    await interaction.update({ embeds: [embed], components: [row] });
    
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Não é você!', flags: 64 });
        collector.stop();
        const habKey = i.customId.replace('hab_', '');
        let habUsada = null;
        if (habKey !== 'nenhuma') {
            const res = usarHabilidade(jogadorTeste, habKey);
            if (!res.sucesso) return i.reply({ content: res.mensagem, flags: 64 });
            habUsada = habKey;
        }
        await i.update({ embeds: [executarDesarme(i, i.user.username, tipoInfo, driblador, habUsada)], components: [] });
    });
}

function executarDesarme(interaction, username, tipoInfo, driblador, habilidadeKey) {
    let bonusDesarme = testeConfig.status.desarme;
    let bonusTipo = tipoInfo.bonus;
    let penalidadeTipo = tipoInfo.penalidade;
    let chanceFatalFinal = tipoInfo.fatal;
    const poderDrible = driblador.poderDrible;
    let gifHabilidade = null;
    const nomeHabilidade = habilidadeKey ? listarTodasHabilidades()[habilidadeKey]?.nome : null;
    const habBonus = habilidadeKey ? (listarTodasHabilidades()[habilidadeKey]?.bonus?.desarme || 0) : 0;
    
    if (habilidadeKey) {
        const habInfo = listarTodasHabilidades()[habilidadeKey];
        if (habInfo) gifHabilidade = habInfo.gif;
        const aplicado = aplicarBonusHabilidade(jogadorTeste, habilidadeKey, { bonusDesarme, chanceFatal: chanceFatalFinal });
        bonusDesarme = aplicado.bonusDesarme || bonusDesarme;
        chanceFatalFinal = aplicado.chanceFatal || chanceFatalFinal;
    }
    
    const dado = Math.floor(Math.random() * 40) + 1;
    let total = dado + bonusDesarme + bonusTipo;
    if (total < 1) total = 1;
    const totalComHabilidade = total + habBonus;
    let erroFatal = dado <= chanceFatalFinal;
    const bonusTotal = bonusTipo;
    
    if (erroFatal) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dado} (FATAL! ≤${chanceFatalFinal})` },
            { emoji: "💢", label: "Penalidade", valor: `${penalidadeTipo}` }
        ];
        
        const texto = criarMoldeResultado("💥", "𝗘𝗥𝗥𝗢 𝗙𝗔𝗧𝗔𝗟", `${username} tentou ${tipoInfo.nome}${nomeHabilidade ? ` usando ${nomeHabilidade}` : ''}, e cometeu falta!`, dadosArray, "FALTA! O adversário mantém a posse!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `💥 FALTA!`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifs.erro_fatal)
            .setTimestamp();
    }
    
    if (totalComHabilidade >= poderDrible) {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
            { emoji: "🛡️", label: "Poder Desarme", valor: `${totalComHabilidade}` },
            { emoji: "✨", label: "Poder Drible", valor: `${poderDrible}` }
        ];
        if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
        
        const texto = criarMoldeResultado("✅", "𝗗𝗘𝗦𝗔𝗥𝗠𝗘 𝗣𝗘𝗥𝗙𝗘𝗜𝗧𝗢", `${username} roubou a bola com maestria!`, dadosArray, "Você recuperou a posse da bola!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `✅ ${username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifHabilidade || gifs.desarmar)
            .setTimestamp();
    } else {
        const dadosArray = [
            { emoji: "✨", label: "Habilidade", valor: nomeHabilidade || "Nenhuma" },
            { emoji: "🎲", label: "Rolagem", valor: `${dado}` },
            { emoji: "🏅", label: "Bônus", valor: `+${bonusTotal}` },
            { emoji: "🛡️", label: "Poder Desarme", valor: `${totalComHabilidade}` },
            { emoji: "✨", label: "Poder Drible", valor: `${poderDrible}` }
        ];
        if (habBonus > 0) dadosArray.splice(3, 0, { emoji: "✨", label: "Extra Habilidade", valor: `+${habBonus}` });
        
        const texto = criarMoldeResultado("❌", "𝗗𝗘𝗦𝗔𝗥𝗠𝗘 𝗙𝗔𝗟𝗛𝗢𝗨", `${username} tentou, mas o adversário driblou!`, dadosArray, "O oponente mantém a posse!", null, null, null);
        
        return new EmbedBuilder()
            .setColor('#FF0000')
            .setAuthor({ name: `❌ ${username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(texto)
            .setImage(gifHabilidade || gifs.desarmar)
            .setTimestamp();
    }
}