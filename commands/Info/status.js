const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { perfil_padrao } = require('../../utils/gifs.js');
const { listarTodasHabilidades } = require('../../utils/habilidades.js');

const blueLockPath = path.join(__dirname, '../../blueLock.json');

// ==========================================
// BÔNUS POR POSIÇÃO
// ==========================================
const bonusPosicao = {
    "Goleiro": { defesaGk: 4, interceptacao: 2 },
    "Lateral": { velocidade: 3, drible: 3, passe: 2 },
    "Zagueiro": { desarme: 4, fisico: 4, interceptacao: 2 },
    "Volante": { velocidade: 3, fisico: 3, desarme: 2 },
    "Meia Defensivo": { passe: 4, interceptacao: 4 },
    "Meio Ofensivo": { dominio: 4, passe: 4, drible: 2 },
    "Centro Avante": { finalizacao: 5, fisico: 4, dominio: 2 },
    "Segundo Atacante": { finalizacao: 4, dominio: 3, drible: 3, velocidade: 3 },
    "Pontas": { drible: 5, velocidade: 4, finalizacao: 2 }
};

const bonusUniversidade = {
    "Kurogane": { velocidade: 3, fisico: 3 },
    "Seiryu": { passe: 3, drible: 3 },
    "Raiden": { finalizacao: 3, interceptacao: 3 },
    "Genshō": { defesaGk: 3, fisico: 3 },
    "Tenshō": { finalizacao: 3, dominio: 3 },
    "Arashi": { drible: 3, desarme: 3 },
    "Shiden": { velocidade: 3, drible: 3 },
    "Ryuketsu": { finalizacao: 3, fisico: 3 },
    "Hakuryu": { passe: 3, defesaGk: 3 }
};

const bonusNacionalidade = {
    "Japonês": { dominio: 4, passe: 4 },
    "Francês": { drible: 5, velocidade: 4, finalizacao: 2 },
    "Espanhol": { finalizacao: 5, drible: 3, passe: 2 },
    "Argentino": { passe: 4, desarme: 3 },
    "Italiano": { finalizacao: 2, drible: 2, passe: 2, desarme: 2 },
    "Alemão": { finalizacao: 4, dominio: 3, desarme: 3, interceptacao: 2 },
    "Brasileiro": { drible: 5, velocidade: 4, finalizacao: 2 }
};

const bonusDominancia = {
    "Destro": { finalizacao: 2, velocidade: 2, drible: 2 },
    "Canhoto": { finalizacao: 3, passe: 3, dominio: 3 },
    "Ambidestria Forçada": { finalizacao: 4, velocidade: 4, fisico: 4, desarme: 4 },
    "Ambidestro": { finalizacao: 4, drible: 4, passe: 4, desarme: 4, velocidade: 4, fisico: 4, interceptacao: 4, defesaGk: 4, dominio: 4 }
};

const bonusMaestria = {
    "Interceptação": { interceptacao: 4 },
    "Desarme": { desarme: 4 },
    "Passe": { passe: 4 },
    "Defesa": { defesaGk: 4 },
    "Força": { fisico: 4 },
    "Drible": { drible: 4 },
    "Domínio": { dominio: 4 },
    "Velocidade": { velocidade: 4 },
    "Finalização": { finalizacao: 4 }
};

const posicaoNomes = Object.keys(bonusPosicao);
const nacionalidadeNomes = Object.keys(bonusNacionalidade);
const universidadeNomes = Object.keys(bonusUniversidade);
const dominanciaNomes = Object.keys(bonusDominancia);
const maestriaNomes = Object.keys(bonusMaestria);

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
        posicao: "Meio Ofensivo",
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
        imagem: null
    };
}

module.exports = {
    name: 'status',
    description: 'Mostra os status do jogador com todos os bônus (armas calculadas, não mostradas)',
    aliases: ['stats', 'perfil'],
    async execute(message, args, client, context) {
        let dados = {};
        if (fs.existsSync(blueLockPath)) dados = JSON.parse(fs.readFileSync(blueLockPath, 'utf8'));
        if (!dados.jogadores) dados.jogadores = {};
        
        const target = message.mentions.users.first() || message.author;
        
        // CRIA O JOGADOR AUTOMATICAMENTE SE NÃO EXISTIR
        if (!dados.jogadores[target.id]) {
            dados.jogadores[target.id] = criarJogador(target.id, target.username);
            fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));
            console.log(`✅ Jogador ${target.username} (${target.id}) criado automaticamente!`);
        }
        
        const jogador = dados.jogadores[target.id];
        
        // Garante que o status existe
        if (!jogador.status) {
            jogador.status = { ...STATUS_PADRAO };
        }
        
        // Garante que as estatísticas existem
        if (!jogador.estatisticas) {
            jogador.estatisticas = {
                gols: 0, assistencias: 0, passes: 0, dribles: 0,
                desarmes: 0, interceptacoes: 0, defesas: 0, bloqueios: 0,
                partidas: 0, vitorias: 0
            };
        }
        
        // Garante que as habilidades existem
        if (!jogador.habilidades) {
            jogador.habilidades = {};
        }
        
        const membro = await message.guild.members.fetch(target.id).catch(() => null);
        
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
        
        const posicao = encontrarCargo(posicaoNomes);
        const nacionalidade = encontrarCargo(nacionalidadeNomes);
        const universidade = encontrarCargo(universidadeNomes);
        const dominancia = encontrarCargo(dominanciaNomes);
        const maestria = encontrarCargo(maestriaNomes);
        
        // Buscar armas (para calcular bônus, mas não mostrar)
        const todasHabilidades = listarTodasHabilidades();
        const todosNomesArmas = Object.values(todasHabilidades).map(h => h.nome);
        const armasCargo = encontrarTodosCargos(todosNomesArmas);
        
        const statusBase = {
            finalizacao: jogador.status.finalizacao || 0,
            drible: jogador.status.drible || 0,
            passe: jogador.status.passe || 0,
            desarme: jogador.status.desarme || 0,
            velocidade: jogador.status.velocidade || 0,
            fisico: jogador.status.fisico || 0,
            interceptacao: jogador.status.interceptacao || 0,
            defesaGk: jogador.status.defesaGk || 0,
            dominio: jogador.status.dominio || 0
        };
        
        const bonusTotal = { 
            finalizacao: 0, drible: 0, passe: 0, desarme: 0, 
            velocidade: 0, fisico: 0, interceptacao: 0, defesaGk: 0, dominio: 0 
        };
        
        function somarBonus(bonus) {
            for (const [attr, val] of Object.entries(bonus)) {
                if (bonusTotal[attr] !== undefined) bonusTotal[attr] += val;
            }
        }
        
        if (posicao && bonusPosicao[posicao]) somarBonus(bonusPosicao[posicao]);
        if (nacionalidade && bonusNacionalidade[nacionalidade]) somarBonus(bonusNacionalidade[nacionalidade]);
        if (universidade && bonusUniversidade[universidade]) somarBonus(bonusUniversidade[universidade]);
        if (dominancia && bonusDominancia[dominancia]) somarBonus(bonusDominancia[dominancia]);
        if (maestria && bonusMaestria[maestria]) somarBonus(bonusMaestria[maestria]);
        
        // Somar bônus de TODAS as armas (calcula mas não mostra)
        for (const armaNome of armasCargo) {
            const habInfo = Object.values(todasHabilidades).find(h => h.nome === armaNome);
            if (habInfo && habInfo.bonus) {
                somarBonus(habInfo.bonus);
            }
        }
        
        const statusTotal = {};
        for (const attr of Object.keys(statusBase)) {
            statusTotal[attr] = statusBase[attr] + (bonusTotal[attr] || 0);
        }
        
        const statusArray = Object.values(statusTotal);
        const statusMedio = Math.floor(statusArray.reduce((a, b) => a + b, 0) / statusArray.length);
        const imagemStatus = jogador.imagem || perfil_padrao;
        
        let bonusAtivos = '';
        if (posicao) bonusAtivos += `⚽ Posição: ${posicao}\n`;
        if (nacionalidade) bonusAtivos += `🌍 Nacionalidade: ${nacionalidade}\n`;
        if (universidade) bonusAtivos += `🏫 Universidade: ${universidade}\n`;
        if (dominancia) bonusAtivos += `🦶 Dominância: ${dominancia}\n`;
        if (maestria) bonusAtivos += `📜 Maestria: ${maestria}\n`;
        if (armasCargo.length > 0) bonusAtivos += `⚔️ Armas: ${armasCargo.length} equipada(s)\n`;
        if (!bonusAtivos) bonusAtivos = 'Nenhum bônus ativo';
        
        let texto = 
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 👤 ⦘**  **__Jogador__** —  \`${jogador.nome || target.username}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📈 ⦘**  **__Status Médio__** —  \`${statusMedio}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            `> ˚ ˳ ﹙🎁﹚***__Bônus Ativos__***\n\n` +
            `> \`${bonusAtivos.trim().split('\n').join('`\n> `')}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            `> ˚ ˳ ﹙📊﹚***__Status__*** *(Base + Bônus = Total)*\n\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🦵 ⦘**  **__Finalização__** —  \`${statusBase.finalizacao} + ${bonusTotal.finalizacao} = ${statusTotal.finalizacao}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ✨ ⦘**  **__Drible__** —  \`${statusBase.drible} + ${bonusTotal.drible} = ${statusTotal.drible}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ☄️ ⦘**  **__Passe__** —  \`${statusBase.passe} + ${bonusTotal.passe} = ${statusTotal.passe}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🛡️ ⦘**  **__Desarme__** —  \`${statusBase.desarme} + ${bonusTotal.desarme} = ${statusTotal.desarme}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚡ ⦘**  **__Velocidade__** —  \`${statusBase.velocidade} + ${bonusTotal.velocidade} = ${statusTotal.velocidade}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 💪 ⦘**  **__Físico__** —  \`${statusBase.fisico} + ${bonusTotal.fisico} = ${statusTotal.fisico}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🎯 ⦘**  **__Interceptação__** —  \`${statusBase.interceptacao} + ${bonusTotal.interceptacao} = ${statusTotal.interceptacao}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 🧱 ⦘**  **__Defesa GK__** —  \`${statusBase.defesaGk} + ${bonusTotal.defesaGk} = ${statusTotal.defesaGk}\`\n` +
            `> **𓂂𝅙ֺ𝅙ִ ⦗ ⚽ ⦘**  **__Domínio__** —  \`${statusBase.dominio} + ${bonusTotal.dominio} = ${statusTotal.dominio}\`\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑\n\n` +
            
            `> **𓂂𝅙ֺ𝅙ִ ⦗ 📛 ⦘**  **__Geral__** —  __***Use c!armas para ver detalhes das suas armas!***__\n\n` +
            `⭑ ₊ ˚ 𖦹 ────────────⊱﹝⚽﹞⊰──────────── 𖦹 ˚ ₊ ⭑`;

        // Salva apenas se houve modificações
        fs.writeFileSync(blueLockPath, JSON.stringify(dados, null, 2));

        const embed = new EmbedBuilder()
            .setColor('#00BFFF')
            .setAuthor({ name: `⚽ ${jogador.nome || target.username} • Blue Lock`, iconURL: target.displayAvatarURL() })
            .setTitle('˚ ˳ ﹙📊﹚ATRIBUTOS DE JOGO')
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(texto)
            .setImage(imagemStatus)
            .setFooter({ text: '⚽ Blue Lock • Base + Bônus = Total | Armas em c!armas' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};