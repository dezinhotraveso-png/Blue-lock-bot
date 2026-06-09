const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { perfil_padrao } = require('../../utils/gifs.js');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

const estilosNomes = ["Individualista", "Artilheiro", "Velocista", "Garçom", "Marcador", "Muralha", "Biológico", "Zumbi", "Maestro", "Imperador", "Demônio", "Áureo", "Rei", "Servo", "Driblador", "Urso"];
const domNomes = ["Aprendiz Talentoso", "Gênio"]; // Prodígio é cargo separado
const monstroNomes = ["Monstro Despertado", "Monstro Adormecido"];
const dominanciaNomes = ["Ambidestria Forçada", "Ambidestro", "Destro", "Canhoto"];
const posicaoNomes = ["Segundo Atacante", "Meia Defensivo", "Meio Ofensivo", "Centro Avante", "Goleiro", "Lateral", "Zagueiro", "Volante", "Pontas"];
const nacionalidadeNomes = ["Brasileiro", "Alemão", "Italiano", "Argentino", "Espanhol", "Francês", "Japonês"];
const universidadeNomes = ["Kurogane", "Seiryu", "Raiden", "Genshō", "Tenshō", "Arashi", "Shiden", "Ryuketsu", "Hakuryu"];
const rankNomes = ["New Gen", "Mundial", "Continental", "Nacional", "Regional", "Estadual", "Municipal", "Anônimo"];
const familiaNomes = [
    "Iglesias", "Lorenzo", "Kunigami", "Tokimitsu", "Yukimiya", "Chevalier",
    "Gagamaru", "Kurona", "Chigiri", "Mikage", "Shidou", "Bachira", "Itoshi",
    "Otoya", "Hiori", "Darai", "Onazi", "Kaiser", "Isagi", "Barou", "Naruhaya",
    "Fukaku", "Igaguri", "Ness", "Karasu", "Kiyora", "Aiku", "Nagi", "Hugo", "Loki", "Ikki", "Agi", "Aryu"
];
const maestriaNomes = ["Interceptação", "Finalização", "Velocidade", "Desarme", "Domínio", "Força", "Passe", "Defesa", "Drible"];

module.exports = {
    name: 'perfil',
    description: 'Mostra o perfil completo do jogador (lê dos cargos do Discord)',
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const target = message.mentions.users.first() || message.author;
        
        if (!dados.jogadores[target.id]) {
            dados.jogadores[target.id] = {
                nome: target.username,
                status: { finalizacao: 0, drible: 0, passe: 0, desarme: 0, velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 },
                rolls: {},
                rollsDisponiveis: {}
            };
        }
        
        const jogador = dados.jogadores[target.id];
        if (!jogador.rolls) jogador.rolls = {};
        if (!jogador.rollsDisponiveis) jogador.rollsDisponiveis = {};
        
        if (!jogador.nome || jogador.nome === "Novato") {
            jogador.nome = target.username;
        }
        
        const membro = await message.guild.members.fetch(target.id).catch(() => null);
        const imagemPerfil = jogador.imagem || perfil_padrao;
        
        function encontrarCargo(lista) {
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
        
        // Função para encontrar TODOS os cargos de uma lista (para armas)
        function encontrarTodosCargos(lista) {
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
        
        // Armas - TODAS que a pessoa tiver
        const todasHabilidades = listarTodasHabilidades();
        const armasCargo = [];
        if (membro) {
            const todosNomesArmas = Object.values(todasHabilidades).map(h => h.nome);
            const armasEncontradas = encontrarTodosCargos(todosNomesArmas);
            armasCargo.push(...armasEncontradas);
        }
        
        const estiloCargo = encontrarCargo(estilosNomes);
        const domCargo = encontrarCargo(domNomes);
        const prodigioCargo = encontrarCargo(["Prodígio"]); // Cargo separado
        const monstroCargo = encontrarCargo(monstroNomes) ? "Sim" : null;
        const dominanciaCargo = encontrarCargo(dominanciaNomes);
        const posicaoCargo = encontrarCargo(posicaoNomes);
        const nacionalidadeCargo = encontrarCargo(nacionalidadeNomes);
        const universidadeCargo = encontrarCargo(universidadeNomes);
        const rankCargo = encontrarCargo(rankNomes);
        const familiaCargo = encontrarCargo(familiaNomes);
        const maestriaCargo = encontrarCargo(maestriaNomes);
        
        // Valor final
        const estilo = jogador.rolls.estilo || estiloCargo || null;
        const dom = jogador.rolls.talento || domCargo || null;
        const prodigio = jogador.rolls.prodigio || prodigioCargo || null;
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
        if (jogador.rolls.armas && jogador.rolls.armas !== "Nenhuma") todasArmas.add(jogador.rolls.armas);
        armasCargo.forEach(a => todasArmas.add(a));
        const armasArray = [...todasArmas];
        
        function mostrar(valor, padrao = '❌ Não possui') {
            if (valor) return `\`${valor}\``;
            return `\`${padrao}\``;
        }
        
        let texto = 
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ𝅙⊸𝅙愛﹕** *${jogador.nome || target.username} • Jogador do Blue Lock*\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            // ⚽ INFORMAÇÕES
            `> ˚ ˳ ﹙⚽﹚***__Informações__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Posição__** —  ${mostrar(posicao, '❌ Não definida')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏆 ⦘**  **__Rank__** —  ${mostrar(rank, '❌ Não definido')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🌍 ⦘**  **__Nacionalidade__** —  ${mostrar(nacionalidade, '❌ Não definida')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🏫 ⦘**  **__Universidade__** —  ${mostrar(universidade, '❌ Não definida')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🦶 ⦘**  **__Dominância__** —  ${mostrar(dominancia, '❌ Não definida')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👨‍👩‍👧 ⦘**  **__Família__** —  ${mostrar(familia, '❌ Não possui')}\n\n` +
            
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            // 🎲 ATRIBUTOS
            `> ˚ ˳ ﹙🎲﹚***__Atributos__***\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎭 ⦘**  **__Estilo de Jogo__** —  ${mostrar(estilo, '❌ Não possui')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⭐ ⦘**  **__Dom__** —  ${mostrar(dom, '❌ Não possui')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🧬 ⦘**  **__Prodígio__** —  ${prodigio ? '`✅ Sim`' : '`❌ Não`'}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📜 ⦘**  **__Maestria__** —  ${mostrar(maestria, '❌ Não possui')}\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👹 ⦘**  **__Monstro__** —  ${monstro === 'Sim' ? '`✅ Sim`' : '`❌ Não`'}\n`;
        
        // Armas (pode ter várias)
        if (armasArray.length > 0) {
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__Armas__** —  \`${armasArray.join(', ')}\`\n`;
        } else {
            texto += `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚔️ ⦘**  **__Armas__** —  \`❌ Não possui\`\n`;
        }
        
        texto += `\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use c!status para atributos | c!estatisticas para PDR!***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setAuthor({ name: `⚽ ${jogador.nome || target.username} • Blue Lock`, iconURL: target.displayAvatarURL() })
            .setTitle('˚ ˳ ﹙📜﹚PERFIL DO JOGADOR')
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(texto)
            .setImage(imagemPerfil)
            .setFooter({ text: '⚽ Blue Lock • Perfil do Jogador' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};