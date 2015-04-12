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

1. porting to io.js, use koa
2. setup.js 做成 npm cli tool
3. support Postgres, SQLite, MSSQL (use Sequelize)
4. search 優化(use ElasticSearch)
