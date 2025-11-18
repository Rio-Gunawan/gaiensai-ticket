# Gaiensai-ticket

外苑祭のQRコードによる受付システムです。来場者はQRコードを提示し、スタッフがそれをスキャンすることでスムーズな受付を実現します。

## 機能 (Features)

* **QRコード受付:** スマートフォンやカメラでQRコードを読み取り、来場者の受付処理を行います。
* **受付状況の確認:** 管理画面で現在の受付人数や受付済みリストを確認できます。
* **QRコード発行機能:** 事前に来場者向けのQRコードを発行・管理します。

## 技術スタック (Tech Stack)

このプロジェクトで使用されている主な技術です。

* **フロントエンド:** HTML, CSS, JavaScript
* **バックエンド:** Node.js, Express.jsの予定
* **データベース:** MySQLの予定
* **その他:** jQuery、html5-qrcode.js, qrcode.jsなどのライブラリ

## セットアップ (Getting Started)

このプロジェクトをローカル環境で動かすための手順です。(未実装)

### 1. リポジトリをクローン

```bash
git clone https://github.com/[your-username]/gaiensai-ticket.git
cd gaiensai-ticket
```

### 2. 依存関係をインストール

```bash
# 例: Node.jsの場合
npm install
```

### 3. 環境変数の設定

`.env.example` ファイルをコピーして `.env` ファイルを作成し、必要な情報を追記してください。

```bash
cp .env.example .env
```

### 4. アプリケーションの起動

```bash
# 例: Node.jsの場合
npm start
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 使い方 (Usage)

1. 受付担当者は、指定されたURLにアクセスします。
2. [スキャン開始] ボタンをクリックし、カメラを起動します。
3. 来場者が提示するQRコードをカメラで読み取ります。
4. 受付結果（成功、失敗、重複など）が画面に表示されます。

## ライセンス (License)

このプロジェクトは MIT License のもとで公開されています。
