const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { perfil_padrao } = require('../../utils/gifs.js');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// ==========================================
// LISTAS DE CARGOS
// ==========================================
const estilosNomes = [
    "Individualista", "Artilheiro", "Velocista", "Garçom", "Marcador", 
    "Muralha", "Biológico", "Zumbi", "Maestro", "Imperador", 
    "Demônio", "Áureo", "Rei", "Servo", "Driblador", "Urso"
];

const monstroNomes = ["Monstro Despertado", "Monstro Adormecido"];

const dominanciaNomes = ["Ambidestria Forçada", "Ambidestro", "Destro", "Canhoto"];

const posicaoNomes = [
    "Segundo Atacante", "Meia Defensivo", "Meio Ofensivo", "Centro Avante", 
    "Goleiro", "Lateral", "Zagueiro", "Volante", "Pontas"
];

const nacionalidadeNomes = [
    "Brasileiro", "Alemão", "Italiano", "Argentino", 
    "Espanhol", "Francês", "Japonês"
];

const universidadeNomes = [
    "Kurogane", "Seiryu", "Raiden", "Genshō", "Tenshō", 
    "Arashi", "Shiden", "Ryuketsu", "Hakuryu"
];

const rankNomes = [
    "New Gen", "Mundial", "Continental", "Nacional", 
    "Regional", "Estadual", "Municipal", "Anônimo"
];

const familiaNomes = [
    "Iglesias", "Lorenzo", "Kunigami", "Tokimitsu", "Yukimiya", "Chevalier",
    "Gagamaru", "Kurona", "Chigiri", "Mikage", "Shidou", "Bachira", "Itoshi",
    "Otoya", "Hiori", "Darai", "Onazi", "Kaiser", "Isagi", "Barou", "Naruhaya",
    "Fukaku", "Igaguri", "Ness", "Karasu", "Kiyora", "Aiku", "Nagi", "Hugo", 
    "Loki", "Ikki", "Agi", "Aryu"
];

const maestriaNomes = [
    "Interceptação", "Finalização", "Velocidade", "Desarme", 
    "Domínio", "Força", "Passe", "Defesa", "Drible"
];

// ==========================================
// CARGOS EXATOS DE TALENTO NO DISCORD
// ==========================================
const talentoCargos = [
    { cargo: "๑˚ ꒱꒱ Aprendiz Talentoso ⏜ ︵ ₊⊹", tipo: "aprendiz" },
    { cargo: "๑˚ ꒱꒱ Prodigio ⏜ ︵ ₊⊹", tipo: "prodígio" },
    { cargo: "๑˚ ꒱꒱ Genio ⏜ ︵ ₊⊹", tipo: "gênio" }
];

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

// Status padrão para novo jogador
const STATUS_PADRAO = {
    finalizacao: 0,
    drible: 0,
    passe: 0,
    desarme: 0,
    velocidade: 0,
    fisico: 0,
    interceptacao: 0,
    defesaGk: 0,
    dominio: 0
};

// Função para criar jogador automaticamente
function criarJogador(id, nome) {
    return {
        id: id,
        nome: nome,
        posicao: null,
        talento: {
            tipo: "nenhum",
            atributoPrincipal: "finalizacao"
        },
        status: { ...STATUS_PADRAO },
        estatisticas: {
            gols: 0,
            assistencias: 0,
            passes: 0,
            dribles: 0,
            desarmes: 0,
            interceptacoes: 0,
            defesas: 0,
            bloqueios: 0,
            partidas: 0,
            vitorias: 0
        },
        habilidades: {},
        rolls: {},
        rollsDisponiveis: {},
        imagem: null
    };
}

// Função para encontrar UM cargo de uma lista
function encontrarCargo(membro, lista) {
    if (!membro) return null;
    const listaOrdenada = [...lista].sort((a, b) => b.length - a.length);
    for (const nome of listaOrdenada) {
        const cargoEncontrado = membro.roles.cache.find(r => 
            r.name.toLowerCase().includes(nome.toLowerCase())
        );
        if (cargoEncontrado) return nome;
    }
    return null;
}

// Função específica para encontrar talento por cargo EXATO do Discord
function encontrarTalentoPorCargo(membro) {
    if (!membro) return null;
    
    for (const talento of talentoCargos) {
        const cargoEncontrado = membro.roles.cache.find(r => 
            r.name === talento.cargo
        );
        if (cargoEncontrado) {
            return talento.tipo;
        }
    }
    return null;
}

// Função para encontrar TODOS os cargos de uma lista
function encontrarTodosCargos(membro, lista) {
    if (!membro) return [];
    const encontrados = [];
    const listaOrdenada = [...lista].sort((a, b) => b.length - a.length);
    for (const nome of listaOrdenada) {
        const cargoEncontrado = membro.roles.cache.find(r => 
            r.name.toLowerCase().includes(nome.toLowerCase())
        );
        if (cargoEncontrado && !encontrados.includes(nome)) {
            encontrados.push(nome);
        }
    }
    return encontrados;
}

// Retorna nome, emoji e cor do talento
function obterInfoTalento(tipo) {
    switch(tipo) {
        case "gênio":
            return { nome: "Gênio", emoji: "⭐️", cor: "#F1C40F" };
        case "aprendiz":
            return { nome: "Aprendiz Talentoso", emoji: "🧩", cor: "#3498DB" };
        case "prodígio":
            return { nome: "Prodígio", emoji: "🧬", cor: "#E74C3C" };
        default:
            return { nome: "Nenhum", emoji: "⚽", cor: "#95A5A6" };
    }
}

// Função para formatar valor ou mostrar padrão
function mostrarValor(valor, padrao = '❌ Não possui') {
    if (valor && valor !== 'Nenhuma') return `\`${valor}\``;
    return `\`${padrao}\``;
}

module.exports = {
    name: 'perfil',
    description: 'Mostra o perfil completo do jogador (lê dos cargos do Discord)',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const target = message.mentions.users.first() || message.author;
        
        // CRIA O JOGADOR AUTOMATICAMENTE SE NÃO EXISTIR
        if (!dados.jogadores[target.id]) {
            dados.jogadores[target.id] = criarJogador(target.id, target.username);
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            console.log(`✅ Jogador ${target.username} (${target.id}) criado automaticamente pelo perfil!`);
        }
        
        const jogador = dados.jogadores[target.id];
        
        // Garantir estruturas
        if (!jogador.rolls) jogador.rolls = {};
        if (!jogador.rollsDisponiveis) jogador.rollsDisponiveis = {};
        if (!jogador.status) jogador.status = { ...STATUS_PADRAO };
        if (!jogador.talento) jogador.talento = { tipo: "nenhum", atributoPrincipal: "finalizacao" };
        if (!jogador.estatisticas) {
            jogador.estatisticas = {
                gols: 0, assistencias: 0, passes: 0, dribles: 0,
                desarmes: 0, interceptacoes: 0, defesas: 0, bloqueios: 0,
                partidas: 0, vitorias: 0
            };
        }
        if (!jogador.habilidades) jogador.habilidades = {};
        
        if (!jogador.nome || jogador.nome === "Novato") {
            jogador.nome = target.username;
        }
        
        const membro = await message.guild.members.fetch(target.id).catch(() => null);
        const imagemPerfil = jogador.imagem || perfil_padrao;
        
        const todasHabilidades = listarTodasHabilidades();
        
        // ==========================================
        // LER CARGOS DO DISCORD
        // ==========================================
        
        const estiloCargo = encontrarCargo(membro, estilosNomes);
        const monstroCargo = encontrarCargo(membro, monstroNomes);
        const dominanciaCargo = encontrarCargo(membro, dominanciaNomes);
        const posicaoCargo = encontrarCargo(membro, posicaoNomes);
        const nacionalidadeCargo = encontrarCargo(membro, nacionalidadeNomes);
        const universidadeCargo = encontrarCargo(membro, universidadeNomes);
        const rankCargo = encontrarCargo(membro, rankNomes);
        const familiaCargo = encontrarCargo(membro, familiaNomes);
        const maestriaCargo = encontrarCargo(membro, maestriaNomes);
        
        // 👑 DETECTAR TALENTO PELO CARGO EXATO
        const talentoDetectado = encontrarTalentoPorCargo(membro);
        
        // Armas - TODAS que a pessoa tiver
        const todosNomesArmas = Object.values(todasHabilidades).map(h => h.nome);
        const armasCargo = encontrarTodosCargos(membro, todosNomesArmas);
        
        // ==========================================
        // ATUALIZAR TALENTO NO JSON
        // ==========================================
        if (talentoDetectado) {
            jogador.talento.tipo = talentoDetectado;
        } else {
            jogador.talento.tipo = "nenhum";
        }
        
        const infoTalento = obterInfoTalento(jogador.talento.tipo);
        
        // ==========================================
        // VALORES FINAIS (roll do JSON OU cargo do Discord)
        // ==========================================
        const estilo = jogador.rolls.estilo || estiloCargo || null;
        const monstro = jogador.rolls.monstro || monstroCargo || null;
        const dominancia = jogador.rolls.dominancia || dominanciaCargo || null;
        const posicao = jogador.posicao || posicaoCargo || null;
        const nacionalidade = jogador.rolls.nacionalidade || nacionalidadeCargo || null;
        const universidade = jogador.rolls.universidade || universidadeCargo || null;
        const rank = jogador.rolls.rank || rankCargo || null;
        const familia = jogador.rolls.familia || familiaCargo || null;
        const maestria = jogador.rolls.maestria || maestriaCargo || null;
        
        // Armas - junta as do roll com as do cargo
        const todasArmas = new Set();
        if (jogador.rolls.armas && jogador.rolls.armas !== "Nenhuma") {
            if (Array.isArray(jogador.rolls.armas)) {
                jogador.rolls.armas.forEach(a => todasArmas.add(a));
            } else {
                todasArmas.add(jogador.rolls.armas);
            }
        }
        armasCargo.forEach(a => todasArmas.add(a));
        const armasArray = [...todasArmas];
        
        // ==========================================
        // MONTAR EMBED
        // ==========================================
        
        let texto = 
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${jogador.nome || target.username} • Jogador do Blue Lock*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            // 👑 TALENTO (DESTACADO NO TOPO)
            `> ˚ ˳ ﹙👑﹚***__Talento__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ${infoTalento.emoji} ⦘**  **__${infoTalento.nome}__**\n`;
        
        // Descrição do talento
        switch(jogador.talento.tipo) {
            case "gênio":
                texto += `> *Habilidade inata de adaptação e evolução instantânea*\n\n`;
                break;
            case "aprendiz":
                texto += `> *Crescimento acelerado e domínio de novas técnicas*\n\n`;
                break;
            case "prodígio":
                texto += `> *Talento único e especialização extrema em um atributo*\n\n`;
                break;
            default:
                texto += `> *Jogador comum, sem talento especial despertado*\n\n`;
        }
        
        texto += 
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            // ⚽ INFORMAÇÕES
            `> ˚ ˳ ﹙⚽﹚***__Informações__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Posição__** —  ${mostrarValor(posicao, '❌ Não definida')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏆 ⦘**  **__Rank__** —  ${mostrarValor(rank, '❌ Não definido')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🌍 ⦘**  **__Nacionalidade__** —  ${mostrarValor(nacionalidade, '❌ Não definida')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏫 ⦘**  **__Universidade__** —  ${mostrarValor(universidade, '❌ Não definida')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🦶 ⦘**  **__Dominância__** —  ${mostrarValor(dominancia, '❌ Não definida')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👨‍👩‍👧 ⦘**  **__Família__** —  ${mostrarValor(familia, '❌ Não possui')}\n\n` +
            
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            // 🎲 ATRIBUTOS
            `> ˚ ˳ ﹙🎲﹚***__Atributos__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎭 ⦘**  **__Estilo de Jogo__** —  ${mostrarValor(estilo, '❌ Não possui')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📜 ⦘**  **__Maestria__** —  ${mostrarValor(maestria, '❌ Não possui')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👹 ⦘**  **__Monstro__** —  ${monstro ? '`✅ Sim`' : '`❌ Não`'}\n`;
        
        // Armas (pode ter várias)
        if (armasArray.length > 0) {
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__Armas__** (${armasArray.length}) —  \`${armasArray.join('`, `')}\`\n`;
        } else {
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__Armas__** —  \`❌ Não possui\`\n`;
        }
        
        texto += `\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use c!status para atributos | c!estatisticas para PDR!***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

        // Salvar alterações
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

        const embed = new EmbedBuilder()
            .setColor(infoTalento.cor) // Cor baseada no talento
            .setAuthor({ name: `${infoTalento.emoji} ${jogador.nome || target.username} • Blue Lock`, iconURL: target.displayAvatarURL() })
            .setTitle(`˚ ˳ ﹙📜﹚PERFIL DO JOGADOR — ${infoTalento.nome}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(texto)
            .setImage(imagemPerfil)
            .setFooter({ text: `⚽ Blue Lock • Talento: ${infoTalento.nome} • Detectado via cargo do Discord` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};