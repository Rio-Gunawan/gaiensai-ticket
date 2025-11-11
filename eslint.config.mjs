import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

// 推奨設定（ブラウザ + Node 対応、一般的なベストプラクティス）
export default defineConfig([
  // 無視パターン
  { ignores: ["node_modules/**", "dist/**", "build/**", "jquery-3.7.1.min.js"] },

  // 一般的な JS ファイル向け設定
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
        // jQuery・QRCodeなどCDNグローバル変数を有効化
        $: "readonly",
        jQuery: "readonly",
        QRCode: "readonly",
        Html5Qrcode: "readonly",
        Html5QrcodeSupportedFormats: "readonly",
        Html5QrcodeScannerState: "readonly",
      },
    },
    rules: {
      // セミコロン強制
      "semi": ["error", "always"],

      // 開発時に便利な警告
      "no-console": "warn",
      "no-debugger": "warn",

      // コード品質
      "no-var": "error",
      "prefer-const": "warn",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],

      // 未使用変数は警告（先頭に _ があるものは無視）
      "no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }
      ],
    },
  },

  // テストファイルなどの例外ルール（必要に応じて拡張）
  {
    files: ["**/*.test.{js,mjs,cjs}", "test/**"],
    rules: {
      // テストでは表現式の未使用を許容することがある
      "no-unused-expressions": "off",
    },
  },
]);
