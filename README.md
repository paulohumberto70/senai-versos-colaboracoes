# Lider Orçamentos Web

Este pequeno aplicativo gera orçamentos em PDF/impresso e agora conta com umackend Node.js que persiste produtos e clientes usando SQLite.

## Início rápido

1. **Instale dependências** (necessário ter Node.js):
   ```bash
   cd c:\Users\Admi5\Desktop\Lider_Orcamentos_Web
   npm install
   ```

2. **Inicie o servidor**:
   ```bash
   npm start
   ```
   O servidor ficará disponível em `http://localhost:3000` e também serve o
   front‑end (`index.html`).

3. **Abra o navegador** e acesse `http://localhost:3000`.

4. **Editar dados**
   - Use os editores JSON na barra lateral para enviar produtos ou clientes
     ao servidor. Clique em "Enviar para servidor" após fazer alterações.
   - Os dados são salvos no arquivo `data.sqlite` e serão recarregados na
     próxima vez que a página for aberta.

5. **Modo offline**
   - Se o servidor não estiver rodando, o app continuará funcionando com os
     arrays iniciais definidos em `dados.js`.
   - Ao iniciar o servidor mais tarde, ele não receberá automaticamente esses
     valores; use os editores para sincronizar.

## Estrutura do backend

## Build para mobile (sem rede)

O código web também pode ser empacotado como um aplicativo híbrido (Android/iOS)
usando Cordova ou Capacitor. O fluxo geral é:

1. Instalar Node.js e Capacitor (`npm install -g @capacitor/cli`).
2. No diretório do projeto executar:
   ```bash
   npx cap init LiderOrcamentos com.lider.orcamentos
   npx cap add android   # ou 'ios' em um Mac
   ```
3. Copiar `index.html`, `style.css`, `app.js`, etc. para a pasta `www` criada.
4. Ajustar o código se necessário (não há servidor local dentro do app; ele usa
   localStorage para persistência). O sistema já faz fallback automático quando
   não há conexão.
5. Abrir o projeto no Android Studio ou Xcode (`npx cap open android` / `ios`)
   e construir o APK/IPA.

O conteúdo de `data.sqlite` não é utilizado no modo híbrido; em vez disso os
dados são guardados pelo próprio WebView em `localStorage` (o que permite uso
offline total).  

Alternativamente, você pode simplesmente instalar Termux no Android e rodar o
servidor Node.js lá, acessando `http://localhost:3000` do próprio aparelho.


- `server.js` – servidor Express com endpoints REST (`/api/produtos` e
  `/api/clientes`).
- `data.sqlite` – banco SQLite criado automaticamente.
- `package.json` – lista de dependências e script de inicialização.

---

### Notas rápidas

- Os campos de produto/cliente enviados devem ser arrays JSON válidos.
- O frontend tenta carregar os dados do servidor ao abrir a página, mas
  falha silenciosamente (log no console) se o servidor não responder.
  Nesse caso o aplicativo recorre a dados armazenados em localStorage (ou seja,
  funciona offline) e também grava em localStorage sempre que você usa os
  editores.
