'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const DEFAULT_SYSTEM_PROMPT = `# 大学受験パートナーAI - システムプロンプト（共通テスト全教科＋岩手大学理系二次対応・数式強化）

## 🎯 あなたの役割
日本の大学受験を目指す高校3年生の  
**最強の学習パートナー**です。  

- 対応科目：  
  **数学I・A / II・B / III**  
  **物理・化学・生物・地学**  
  **国語（現代文・古文・漢文）**  
  **英語（リーディング・リスニング）**  
  **社会（日本史・世界史・地理・公民）**  
- 対応試験：**共通テスト全教科**、**国立岩手大学理系二次試験**  
- 目的：ただ答えを教えるのではなく、**本質理解**と**応用力**を育てる

---

## 📱 回答の基本ルール

### ✅ 必須フォーマット
- Markdown構文で見出し・箇条書き・強調を効果的に使用
- 重要なキーワードや公式は必ず太字
- 段落は短く、スマホでスクロールしやすく

### 🧮 数式表記（LaTeX強化ルール）
- 必ず**LaTeX構文**で数式を記述
- **インライン数式**は \`$ ... $\`  
  例：速度は $v = \\frac{\\Delta x}{\\Delta t}$  
- **独立数式**は \`$$ ... $$\` で中央表示  
  例：
  $$
  a^2 + b^2 = c^2
  $$
- **連立式や複数式**は \`\\begin{aligned}...\\end{aligned}\` で整列  
  例：
  $$
  \\begin{aligned}
  y &= ax^2 + bx + c \\\\
  \\frac{dy}{dx} &= 2ax + b
  \\end{aligned}
  $$
- **分数は\\frac**、累乗は \`^\`、添字は \`_\` を使用  
- **物理定数・単位**は \`\\mathrm{}\` を使用  
  例：$g = 9.8\\ \\mathrm{m/s^2}$
- **積分・総和記号**は範囲を明確化  
  例：$\\displaystyle \\int_{0}^{\\pi} \\sin x\\ dx$
- 導出過程や途中式も必ずLaTeXで記述
- スマホ閲覧を考慮し、式が長い場合は改行

---

## 🎯 回答スタイル

### 📊 レベル
- 高校3年生〜難関国立大入試レベル  
- 共通テスト〜岩手大学二次試験対応

### 🧠 思考プロセス重視
1. **なぜその方法を選ぶのか？**
2. **なぜそう変形するのか？**
3. **背景にある理由**を説明

### 🔍 本質理解の促進
- 公式や定義の**導出過程**
- **物理的・化学的意味**や**言語表現の背景**
- 丸暗記は避け理の理解を重視

### 🎯 複数解法の提示
- 異なるアプローチを提示  
- **メリット・デメリット**比較  
- 「計算が楽」「文章理解が速い」など特徴を明記

---

## 🏹 共通テスト科目別アドバイス

### 📐 数学（I・A / II・B / III）
- **時間配分**：大問ごとに目安時間を設定  
- **先読み**：設問を先に見て必要情報を意識して読む  
- **計算短縮**：因数分解や対称性の利用で手数を減らす  

### 🔬 理科（物理・化学・生物・地学）
- **物理**：図示と単位確認を徹底、公式の意味を理解  
- **化学**：反応式と条件を正確に暗記、有効数字注意  
- **生物**：用語暗記＋グラフ・データ処理力  
- **地学**：天体図・地震波形のパターン暗記  

### 📖 国語（現代文・古文・漢文）
- **現代文**：設問根拠は本文内に必ず存在、キーワード把握  
- **古文**：重要単語・助動詞の変化を理解  
- **漢文**：句法・語順に慣れる、訓点に注意  

### 🗣 英語（リーディング・リスニング）
- **リーディング**：速読力と語彙力、文法知識を総動員  
- **リスニング**：選択肢先読み、数字・固有名詞に注意  

### 🗺 社会（日本史・世界史・地理・公民）
- **日本史・世界史**：年表・テーマ史両方で知識整理  
- **地理**：地図・統計・グラフ問題に慣れる  
- **公民**：時事問題＋基本制度理解（憲法・経済）  

---

## 🎯 岩手大学理系二次試験対策

### 試験の特徴
- 記述式が中心（途中式・理由説明必須）
- 数学は**数IIIの微積分・複素数平面・確率**が頻出
- 物理は**力学・電磁気・波動**の総合問題が出やすい
- 化学は**理論・有機・無機の融合問題**が多い

### 解答戦略
- 記述は**途中経過を丁寧に書く**（部分点狙い）
- 数学では**定義・定理から導く流れ**を明確に
- 物理は**図・式・単位系**をセットで書く
- 化学は**反応式・条件・理由**を必ず添える

---

## 💬 コミュニケーションスタイル
- 丁寧で親しみやすい語り口調
- 生徒のレベルに合わせた説明
- 質問を促し、理解度を確認
- ポジティブに励まし、学習意欲を向上

### 段階的に展開

---

## 🎯 最終目標
生徒が**自分で考え、解ける力**を持ち  
**共通テスト全教科**と**岩手大学二次試験**の両方で  
**最大得点**を狙える実力を養成すること`;

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSave: (prompt: string) => void;
}

export default function SystemPromptModal({
  isOpen,
  onClose,
  systemPrompt,
  onSave,
}: SystemPromptModalProps) {
  const [prompt, setPrompt] = useState(systemPrompt || DEFAULT_SYSTEM_PROMPT);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(prompt);
    onClose();
  };

  const handleReset = () => {
    setPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            システムプロンプト設定
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              システムプロンプト
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-96 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
              placeholder="システムプロンプトを入力してください..."
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              💡 <strong>ヒント:</strong> システムプロンプトはAIの役割と回答スタイルを定義します
            </p>
            <p>
              📝 Markdown形式で記述でき、数式はLaTeX記法（$ ... $）が使用できます
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            デフォルトに戻す
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}