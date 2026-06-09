// Sistema de segurança para evitar que o bot quebre na inicialização se o dotenv não estiver instalado
try {
    require('dotenv').config();
} catch (e) {
    console.log('[Backup GitHub] Biblioteca "dotenv" não encontrada. Tentando instalar dinamicamente...');
    try {
        const { execSync } = require('child_process');
        execSync('npm install dotenv --no-save', { stdio: 'ignore' });
        require('dotenv').config();
        console.log('[Backup GitHub] "dotenv" instalado e carregado com sucesso!');
    } catch (err) {
        console.error('[Backup GitHub] Erro ao carregar ou instalar o dotenv automaticamente:', err.message);
    }
}

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
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
        // Tenta ler as variáveis do .env; se não existirem, usa os dados padrão definidos
        const OWNER = process.env.GITHUB_OWNER || 'dezinhotraveso-png';
        const REPO = process.env.GITHUB_REPO || 'Blue-lock-bot';
        const TOKEN = process.env.GITHUB_TOKEN;

        // 1. Verificação de segurança para garantir que o Token existe no .env
        if (!TOKEN || TOKEN.includes('COLOQUE_SEU_NOVO_TOKEN_AQUI')) {
            return message.reply({
                content: '❌ **Falta o teu token válido do GitHub no ficheiro `.env`!** \nComo os teus tokens antigos foram partilhados no chat, eles foram desativados por segurança.\n\n**Como resolver:**\n1. Cria um novo token em `github.com/settings/tokens`.\n2. Edita o teu ficheiro `.env` e coloca o token correto na linha `GITHUB_TOKEN=ghp_...\`.\n3. **Reinicia** o teu bot no painel da Square Cloud.'
            });
        }

        const msgStatus = await message.reply('🔍 A verificar o ambiente e a testar a ligação com o GitHub...');

        // 2. Garante a instalação automática da biblioteca oficial do GitHub caso falte na Square Cloud
        let Octokit;
        try {
            Octokit = require('@octokit/rest').Octokit;
        } catch (e) {
            await msgStatus.edit('📦 A instalar a biblioteca `@octokit/rest` na Square Cloud, aguarda um momento...');
            try {
                execSync('npm install @octokit/rest --no-save', { stdio: 'ignore' });
                Octokit = require('@octokit/rest').Octokit;
                await msgStatus.edit('✅ Biblioteca instalada com sucesso! A testar a ligação...');
            } catch (err) {
                console.error(err);
                return msgStatus.edit('❌ Falha ao tentar instalar automaticamente a dependência `@octokit/rest`. Tenta instalá-la no teu package.json.');
            }
        }

        const octokit = new Octokit({
            auth: TOKEN 
        });

        // 3. Valida se o repositório existe e se o bot tem permissão de escrita
        try {
            await octokit.repos.get({
                owner: OWNER,
                repo: REPO
            });
        } catch (error) {
            let descErro = 'Não foi possível aceder ao teu repositório no GitHub.';
            if (error.status === 404) {
                descErro = `O repositório \`${OWNER}/${REPO}\` não foi encontrado.\n\n**O que verificar:**\n- Tens a certeza de que criaste o repositório com o nome exato \`Blue-lock-bot\` no teu GitHub?\n- O teu nome de utilizador está correto no ficheiro \`.env\`?`;
            } else if (error.status === 401) {
                descErro = 'O teu `GITHUB_TOKEN` é inválido ou já expirou. Cria um novo Token Classic no GitHub com acesso de escrita a repositórios (`repo`).';
            }
            
            const embedErroConexao = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erro de Autenticação / Conexão')
                .setDescription(descErro)
                .addFields({ name: 'Detalhes Técnicos', value: `\`\`\`js\nStatus: ${error.status}\nErro: ${error.message}\n\`\`\`` });

            return msgStatus.edit({ content: null, embeds: [embedErroConexao] });
        }

        try {
            // 4. Mapeia e analisa os ficheiros do bot localmente
            const diretorioRaiz = process.cwd();
            const arquivosParaEnviar = obterArquivosRecursivo(diretorioRaiz);

            if (arquivosParaEnviar.length === 0) {
                return msgStatus.edit('❌ Nenhum ficheiro elegível para backup foi encontrado.');
            }

            await msgStatus.edit(`🚀 A preparar o envio de **${arquivosParaEnviar.length} ficheiros** para o teu repositório \`${OWNER}/${REPO}\`...`);

            let arquivosEnviados = 0;
            let arquivosAtualizados = 0;

            // 5. Envia cada ficheiro para o repositório no GitHub
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
                    // Ignora erro 404 porque significa que o ficheiro ainda não existe no repositório remoto (ficheiro novo)
                    if (err.status !== 404) throw err;
                }

                await octokit.repos.createOrUpdateFileContents({
                    owner: OWNER,
                    repo: REPO,
                    path: arquivo.caminhoRelativo,
                    message: `Backup automático: ${arquivo.caminhoRelativo}`,
                    content: conteudoBase64,
                    sha: shaExistente || undefined // Se o ficheiro já existia, fornece o sha para atualizar, se não, cria-o
                });

                if (shaExistente) {
                    arquivosAtualizados++;
                } else {
                    arquivosEnviados++;
                }
            }

            // 6. Envia a resposta final de sucesso ao utilizador
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
                .setFooter({ text: '⚽ Blue Lock System • Segurança e Proteção' })
                .setTimestamp();

            await msgStatus.edit({ content: null, embeds: [embedSucesso] });

        } catch (error) {
            console.error(error);
            
            let extraDica = '';
            if (error.message.includes('empty repository') || error.message.includes('branch')) {
                extraDica = '\n\n💡 **Dica:** O teu repositório no GitHub parece estar vazio. Acede ao site do GitHub, cria um ficheiro rápido com o nome `README.md` lá no teu repositório para ativar a branch inicial e tenta usar o comando novamente!';
            }

            const embedErro = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Falha ao Enviar Ficheiros')
                .setDescription(`Ocorreu um erro ao realizar o upload para o GitHub.${extraDica}`)
                .addFields({ name: 'Detalhe Técnico', value: `\`\`\`js\n${error.message.substring(0, 500)}\n\`\`\`` });

            await msgStatus.edit({ content: null, embeds: [embedErro] });
        }
    }
};