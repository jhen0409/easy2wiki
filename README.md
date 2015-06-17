Easy2Wiki
===

使用 Node.js 寫成的一個簡易 Wiki Framework, 使用 MySQL 作為 Database, Redis 作為 Session store

### Install: (open config page)

```
npm install
node setup.js		
```

會打開一個設定頁面，完成設定之後，會產生一個 config.json，並依照設定產生頁面。

Start Server: (listening port 3000)

```
node app.js		
```

接下來可以造訪 [http://localhost:3000](http://localhost:3000) 使用

### TODO

1. NPM global comand run setup.js
2. Rewrite all code with LiveScript
3. Rewrite front-end logic with React.js
4. Replace web framework (use koa)
5. Support Postgres, SQLite, MSSQL (use Sequelize)
6. Search optimization (use ElasticSearch)
7. Write testing
8. Integrate Travis CI