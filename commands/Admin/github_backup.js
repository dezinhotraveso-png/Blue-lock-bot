// Importa o módulo 'path' primeiro para poder ser usado na configuração do dotenv
const path = require('path');
// Força o carregamento do ficheiro .env na pasta raiz do projeto
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const { execSync } = require('child_process');

// Lista de pastas e ficheiros que o bot deve ignorar ao fazer o upload para o GitHub
const IGNORED_PATHS = [
    'node_modules',
    '.git',
    '.env',
    'package-lock.json',
    '.DS_Store'
];

/**
 * Função recursiva para analisar o diretório do projeto e listar os ficheiros elegíveis para backup
 */
function obterArquivosRecursivo(dir, listaArquivos = []) {
    const arquivos = fs.readdirSync(dir);

    for (const arquivo of arquivos) {
        const caminhoCompleto = path.join(dir, arquivo);
        const relativo = path.relative(process.cwd(), caminhoCompleto);

        // Verifica se o caminho ou o ficheiro atual deve ser ignorado
        if (IGNORED_PATHS.some(ignorado => relativo.startsWith(ignorado) || arquivo === ignorado)) {
            continue;
        }

        if (fs.statSync(caminhoCompleto).isDirectory()) {
            obterArquivosRecursivo(caminhoCompleto, listaArquivos);
        } else {
            listaArquivos.push({
                caminhoAbsoluto: caminhoCompleto,
                caminhoRelativo: relativo.replace(/\\/g, '/') // Padroniza barras para o padrão do GitHub (/)
            });
        }
    }
    return listaArquivos;
}

module.exports = {
    name: 'backupgithub',
    description: '💻 Envia os códigos atuais do bot para o repositório configurado no GitHub',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    
    async execute(message, args, client, context) {
        const OWNER = process.env.GITHUB_OWNER || 'dezinhotraveso-png';
        const REPO = process.env.GITHUB_REPO || 'Blue-lock-bot';
        const TOKEN = process.env.GITHUB_TOKEN;

        const msgStatus = await message.reply('🔍 A iniciar o diagnóstico do ambiente de backup...');

        // === PASSO 1: DIAGNÓSTICO DO FICHEIRO .ENV ===
        const caminhoEnv = path.resolve(process.cwd(), '.env');
        const envExiste = fs.existsSync(caminhoEnv);

        if (!envExiste) {
            const embedErroEnv = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ DIAGNÓSTICO: Ficheiro .env não encontrado!')
                .setDescription(`O bot não conseguiu encontrar o ficheiro \`.env\` na pasta raiz (\`${process.cwd()}\`).`)
                .addFields(
                    { name: '💡 Como Corrigir na Square Cloud:', value: '1. Abre o gestor de arquivos da Square Cloud.\n2. Verifica se o ficheiro se chama **exatamente** \`.env\` (não pode ser \`.evn\`, \`config.env\` ou \`.env.txt\`).\n3. Garante que ele está na pasta raiz (onde está o \`index.js\`), e não dentro de subpastas.' }
                );
            return msgStatus.edit({ content: null, embeds: [embedErroEnv] });
        }

        if (!TOKEN) {
            const conteudoEnv = fs.readFileSync(caminhoEnv, 'utf8');
            const contemToken = conteudoEnv.includes('GITHUB_TOKEN');
            
            const embedErroToken = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ DIAGNÓSTICO: Token do GitHub em falta!')
                .setDescription(`O ficheiro \`.env\` existe, mas o bot não conseguiu ler a variável \`GITHUB_TOKEN\`.`)
                .addFields(
                    { name: 'Leitura do ficheiro .env:', value: contemToken ? 'A variável `GITHUB_TOKEN` está escrita no ficheiro, mas pode estar mal formatada ou o bot precisa de ser reiniciado.' : 'A variável `GITHUB_TOKEN` **não** está presente dentro do ficheiro `.env`.' },
                    { name: '💡 Como Corrigir:', value: 'Garante que copiaste o token novo para o teu `.env` exatamente desta forma:\n`GITHUB_TOKEN=ghp_teuTokenAqui` (sem espaços extras).\n\nDepois, clica em **RESTART** no painel da Square Cloud.' }
                );
            return msgStatus.edit({ content: null, embeds: [embedErroToken] });
        }

        // === PASSO 2: TESTAR LIGAÇÃO À API DO GITHUB ===
        let Octokit;
        try {
            Octokit = require('@octokit/rest').Octokit;
        } catch (e) {
            await msgStatus.edit('📦 A instalar a biblioteca `@octokit/rest` na Square Cloud...');
            try {
                execSync('npm install @octokit/rest --no-save', { stdio: 'ignore' });
                Octokit = require('@octokit/rest').Octokit;
            } catch (err) {
                return msgStatus.edit('❌ Falha crítica ao instalar a dependência `@octokit/rest`. Adiciona-a ao `package.json`.');
            }
        }

        const octokit = new Octokit({ auth: TOKEN });

        try {
            await msgStatus.edit('📡 A testar permissões do Token com o GitHub...');
            await octokit.repos.get({
                owner: OWNER,
                repo: REPO
            });
        } catch (error) {
            let descErro = 'Erro ao aceder à API do GitHub.';
            
            if (error.status === 404) {
                descErro = `O repositório \`${OWNER}/${REPO}\` não foi encontrado.\n\n**Causas Prováveis:**\n1. O repositório com o nome exato \`Blue-lock-bot\` ainda não foi criado na tua conta do GitHub \`dezinhotraveso-png\`.\n2. O repositório é Privado e o teu Token não tem a permissão \`repo\` marcada para o ver.`;
            } else if (error.status === 401) {
                descErro = `O teu \`GITHUB_TOKEN\` é inválido ou foi cancelado pelo GitHub.\n\n**Como resolver:**\nComo enviaste os teus tokens no chat, o GitHub cancelou-os de imediato por segurança. Tens de ir a [github.com/settings/tokens](https://github.com/settings/tokens), gerar um **novo** token, colá-lo no teu \`.env\` e reiniciar o bot na Square Cloud sem enviar o código a ninguém!`;
            }

            const embedErroAPI = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ DIAGNÓSTICO: Falha na Conexão com o GitHub')
                .setDescription(descErro)
                .addFields({ name: 'Dados Utilizados:', value: `👤 **Dono:** \`${OWNER}\`\n📁 **Repositório:** \`${REPO}\`\n🔑 **Token (Primeiros digitos):** \`${TOKEN.substring(0, 10)}...\`` });

            return msgStatus.edit({ content: null, embeds: [embedErroAPI] });
        }

        // === PASSO 3: EFETUAR O UPLOAD DOS FICHEIROS ===
        try {
            const diretorioRaiz = process.cwd();
            const arquivosParaEnviar = obterArquivosRecursivo(diretorioRaiz);

            if (arquivosParaEnviar.length === 0) {
                return msgStatus.edit('❌ Nenhum ficheiro elegível para backup foi encontrado.');
            }

            await msgStatus.edit(`🚀 Ligação validada! A enviar **${arquivosParaEnviar.length} ficheiros** para \`${OWNER}/${REPO}\`...`);

            let arquivosEnviados = 0;
            let arquivosAtualizados = 0;

            for (const arquivo of arquivosParaEnviar) {
                const conteudoLocal = fs.readFileSync(arquivo.caminhoAbsoluto);
                const conteudoBase64 = conteudoLocal.toString('base64');
                
                let shaExistente = null;

                try {
                    const { data } = await octokit.repos.getContent({
                        owner: OWNER,
                        repo: REPO,
                        path: arquivo.caminhoRelativo,
                    });
                    
                    if (!Array.isArray(data)) {
                        shaExistente = data.sha;
                    }
                } catch (err) {
                    if (err.status !== 404) throw err;
                }

                await octokit.repos.createOrUpdateFileContents({
                    owner: OWNER,
                    repo: REPO,
                    path: arquivo.caminhoRelativo,
                    message: `Backup automático: ${arquivo.caminhoRelativo}`,
                    content: conteudoBase64,
                    sha: shaExistente || undefined
                });

                if (shaExistente) {
                    arquivosAtualizados++;
                } else {
                    arquivosEnviados++;
                }
            }

            const embedSucesso = new EmbedBuilder()
                .setColor('#2DBA4E')
                .setTitle('🚀 BACKUP CONCLUÍDO COM SUCESSO!')
                .setAuthor({ name: 'Integração GitHub', iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' })
                .setDescription(`Todos os teus ficheiros de código foram sincronizados com segurança no teu repositório **[${REPO}](https://github.com/${OWNER}/${REPO})**!`)
                .addFields(
                    { name: '📂 Repositório Alvo', value: `\`${OWNER}/${REPO}\``, inline: true },
                    { name: '✨ Novos Ficheiros', value: `${arquivosEnviados}`, inline: true },
                    { name: '🔄 Ficheiros Atualizados', value: `${arquivosAtualizados}`, inline: true },
                    { name: '📊 Total Processado', value: `${arquivosParaEnviar.length}`, inline: true }
                )
                .setFooter({ text: '⚽ Blue Lock System' })
                .setTimestamp();

            await msgStatus.edit({ content: null, embeds: [embedSucesso] });

        } catch (error) {
            console.error(error);
            
            let extraDica = '';
            if (error.message.includes('empty repository') || error.message.includes('branch')) {
                extraDica = '\n\n💡 **Dica:** O teu repositório no GitHub está vazio. Acede ao teu repositório no site do GitHub, cria um ficheiro rápido com o nome `README.md` por lá para ativares a branch inicial e tenta novamente!';
            }

            const embedErro = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Falha ao Enviar Ficheiros')
                .setDescription(`Ocorreu um erro ao realizar o upload dos ficheiros.${extraDica}`)
                .addFields({ name: 'Detalhe Técnico', value: `\`\`\`js\n${error.message.substring(0, 500)}\n\`\`\`` });

            await msgStatus.edit({ content: null, embeds: [embedErro] });
        }
    }
};