# Minecraft Server Manager Discord Bot 仕様書

## 1. システム概要
TypeScriptで実装されたDiscord Botで，Minecraftサーバーの管理とDiscordチャットとの連携を行うシステム．
Dockerコンテナ上で動作し，RCONプロトコルを使用してMinecraftサーバーと通信する．

## 2. 技術仕様
### 2.1 開発環境
- 言語: TypeScript
- 実行環境: Node.js
- コンテナ化: Docker
- 対象Minecraftバージョン: 1.20.1以降
- データストレージ: JSON形式（将来的なRDBMSへの移行を考慮した設計）

### 2.2 サーバー通信
#### 2.2.1 RCON通信
- プロトコル: RCON (Remote Console)
- 用途：
  - サーバーコマンドの実行
  - サーバーステータスの取得
  - プレイヤー情報の取得
- セキュリティ：
  - パスワード認証
  - 暗号化通信

#### 2.2.2 ログ監視
- WebSocketを使用したリアルタイムログ取得
- イベント検知：
  - プレイヤーのログイン/ログアウト
  - チャットメッセージ
  - サーバーステータスの変更
  - エラーや警告メッセージ

### 2.3 コンテナ構成
- Discord Bot コンテナ
  - Node.js実行環境
  - アプリケーションコード
  - 設定ファイル
  - データ永続化用ボリューム

### 2.4 ネットワーク構成
- RCON接続用ポート（デフォルト: 25575）
- Minecraftサーバーポート（デフォルト: 25565）
- WebSocket接続用ポート（カスタム設定）

### 2.5 マルチサーバー管理
- サーバーレジストリ機能
  - 複数サーバーの登録/削除
  - サーバー情報の永続化
  - サーバーごとの設定管理
- サーバー識別機能
  - ユニークなサーバーID
  - サーバー表示名
  - サーバータグ（カテゴリ分け用）

## 3. 機能要件
### 3.1 サーバー管理機能
#### 3.1.0 サーバー管理基盤
- サーバーの登録/削除
  - サーバー情報の登録
  - 接続情報の設定
  - Discordチャンネルとの紐付け

- サーバー一覧の表示
  - 登録済みサーバーの一覧
  - サーバーのステータス
  - 基本情報の表示

- サーバー切り替え
  - アクティブサーバーの選択
  - コマンド実行対象の切り替え

#### 3.1.1 基本管理
- 複数サーバーの一括管理
  - 選択したサーバーの起動/停止
  - 一括起動/停止機能
  - サーバーグループ管理

#### 3.1.2 モニタリング
- サーバーステータスの確認（オンデマンド）
  - RCON経由でのステータス取得
  - オンラインプレイヤー数
  - サーバーのTPS（Ticks Per Second）
  - メモリ使用状況

#### 3.1.3 コマンド実行
- RCON経由でのコマンド実行
- コマンド実行結果の取得と表示
- コマンド実行権限の管理

### 3.2 チャット連携機能
#### 3.2.1 マルチサーバーチャット連携
- サーバーごとのチャンネル設定
  - 個別チャンネルモード：サーバーごとに専用のDiscordチャンネルを使用
  - 統合チャンネルモード：複数サーバーのチャットを1つのチャンネルに統合
    - サーバー識別子の表示
    - メッセージのフォーマット設定

#### 3.2.2 プレイヤー関連通知
- プレイヤーのサーバー参加/退出通知
- プレイ時間の記録と集計
  - 集計期間
    - 日次集計
    - 週次集計
    - 月次集計
    - 累計プレイ時間
  - 表示形式
    - プレイヤー別の統計
    - ランキング形式での表示

## 4. 非機能要件
### 4.1 拡張性
- データストレージの実装を抽象化し，将来的なRDBMSへの移行を容易にする
- Minecraftバージョンの変更に対して柔軟に対応できる設計
- 複数サーバーへの対応を考慮した設計
- サーバー接続情報の抽象化
- コンテナ構成の柔軟な変更が可能な設計

### 4.2 信頼性
- 接続断時の自動再接続
- RCON接続のタイムアウト処理
- WebSocket接続の維持管理
- エラーハンドリングとリトライ機構
- コンテナの自動再起動設定

### 4.3 セキュリティ
- RCON通信の暗号化
- 接続認証情報の安全な管理
- 通信タイムアウトの設定
- Discordコマンドの実行権限管理
- センシティブなコマンドの実行制限
- コンテナ間通信の制限と適切なネットワーク設定

### 4.4 パフォーマンス
- 接続プールの管理
- 定期的なヘルスチェック
- 効率的なログ処理

### 4.5 運用性
- Docker Composeによる環境構築の自動化
- 環境変数による設定の外部化
- ログの集中管理
- コンテナのヘルスチェック
- 簡単なバックアップ/リストア手順

## 5. インターフェース
### 5.1 Discordコマンド
```
/server
  list          - 登録済みサーバー一覧を表示
  register      - 新しいサーバーを登録
  unregister    - サーバーの登録を削除
  select        - 操作対象のサーバーを選択
  start         - 選択したサーバーを起動
  stop          - 選択したサーバーを停止
  status        - 選択したサーバーの状態を確認
  command       - 選択したサーバーでコマンドを実行

/server-group
  create        - サーバーグループを作成
  delete        - サーバーグループを削除
  add           - グループにサーバーを追加
  remove        - グループからサーバーを削除
  list          - グループ一覧を表示
  start         - グループ内の全サーバーを起動
  stop          - グループ内の全サーバーを停止

/playtime
  daily         - 本日のプレイ時間を表示
  weekly        - 今週のプレイ時間を表示
  monthly       - 今月のプレイ時間を表示
  total         - 累計プレイ時間を表示
  ranking       - プレイ時間ランキングを表示
```

### 5.2 設定項目
#### 5.2.1 サーバーレジストリ設定
```typescript
interface ServerRegistryConfig {
  servers: {
    [serverId: string]: {
      name: string;                // サーバー表示名
      description: string;         // サーバーの説明
      tags: string[];             // サーバーのタグ（カテゴリ）
      connection: ServerConfig;    // サーバー接続設定
      discord: {
        channels: {
          chat: string;           // チャット用チャンネルID
          notification: string;   // 通知用チャンネルID
        };
        role: string;            // 管理者ロールID
      };
    };
  };
  groups: {
    [groupId: string]: {
      name: string;              // グループ名
      description: string;       // グループの説明
      serverIds: string[];      // グループに属するサーバーID
    };
  };
  defaultServer?: string;        // デフォルトで選択されるサーバーID
}
```

#### 5.2.2 サーバー接続設定
```typescript
interface ServerConfig {
  host: string;          // Minecraftサーバーのホスト名
  port: number;          // Minecraftサーバーのポート
  rcon: {
    port: number;        // RCONポート
    password: string;    // RCONパスワード
    timeout: number;     // 接続タイムアウト（ミリ秒）
  };
  websocket: {
    port: number;        // WebSocketポート
    path: string;        // WebSocketエンドポイント
  };
}
```

#### 5.2.3 監視設定
```typescript
interface MonitoringConfig {
  reconnectInterval: number;   // 再接続間隔
  healthCheckInterval: number; // ヘルスチェック間隔
  maxRetryAttempts: number;   // 最大リトライ回数
}
```

## 6. 開発環境構築
### 6.1 必要なツール
- Docker Engine
- Docker Compose
- Node.js (ローカル開発用)
- Git

### 6.2 ディレクトリ構造
```
minecraft-server-manager/
├── docker/
│   ├── bot/
│   │   └── Dockerfile
│   └── minecraft/
│       └── Dockerfile
├── docker-compose.yml
├── src/
│   └── [アプリケーションコード]
├── config/
│   ├── bot-config.json
│   └── server.properties
├── data/
│   ├── minecraft/
│   └── bot/
└── README.md
```

## 7. データモデル
### 7.1 サーバー情報
```typescript
interface MinecraftServer {
  id: string;                    // サーバーID
  name: string;                  // サーバー名
  description: string;           // 説明
  tags: string[];               // タグ
  status: ServerStatus;         // 現在のステータス
  players: {
    online: string[];           // オンラインプレイヤー
    playtime: Record<string, number>; // プレイ時間記録
  };
  lastStartTime?: Date;         // 最終起動時刻
  lastStopTime?: Date;          // 最終停止時刻
}

type ServerStatus = 'online' | 'offline' | 'starting' | 'stopping' | 'error';
```

### 7.2 プレイ時間管理
```typescript
interface PlaytimeRecord {
  serverId: string;             // サーバーID
  playerName: string;           // プレイヤー名
  sessionStart: Date;           // セッション開始時刻
  sessionEnd?: Date;            // セッション終了時刻
  duration: number;             // セッション時間（分）
}
```

## 8. エラーハンドリング
### 8.1 接続エラー
- 接続失敗時の再試行
- タイムアウト時の処理
- 認証エラーの処理

### 8.2 コマンド実行エラー
- コマンド実行失敗時のフィードバック
- 権限エラーの処理
- タイムアウト時の処理
