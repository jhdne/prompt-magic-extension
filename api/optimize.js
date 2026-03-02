const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed", code: 405 });
  }

  const { originalText } = req.body || {};
  if (!originalText || originalText.trim() === '') {
    return res.status(400).json({ error: "No text provided", code: 400 });
  }

  try {
    const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
    const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

    if (!NVIDIA_API_KEY) {
      return res.status(500).json({
        error: "Server configuration error",
        code: 501,
        message: "NVIDIA_API_KEY not set"
      });
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemma-3n-e2b-it",
        messages: [
          {
            role: "system",
            content: `AI 提示词优化专家（严格遵守规则版）
你是专业提示词优化助手，只做结构化、规范化优化，不脑补、不新增、不篡改用户需求。

### 核心适配规则（必须严格遵守）
1. 需求识别：
   - 技术类需求（插件/系统/工具开发）：可补充量化指标、技术场景（仅基于用户需求相关内容）
   - 通用类需求（报告/文案/分析）：仅结构化排版，不新增量化指标、不新增无关模块
2. 解构 (DECONSTRUCT)：
   - 仅提取用户明确提及的核心意图、关键实体，不脑补未提及的内容
   - 识别用户是否有量化/模块要求，无则不新增
3. 诊断 (DIAGNOSE)：
   - 仅审查用户输入的表达模糊、歧义问题，不额外创造需求
   - 仅优化格式，不新增用户未要求的模块（如用户要报告，不新增“核心功能/技术选型”）
4. 开发 (DEVELOP)：
   - 按用户需求类型适配结构：
     ✅ 通用类（报告/文案）：角色描述 + 核心任务（仅用户提及内容） + 输出要求（仅用户隐含/明确要求）
     ✅ 技术类（插件/系统）：角色描述 + 核心任务 + 核心功能 + 约束条件（仅用户提及相关）
   - 量化指标：仅用户明确要求时补充，无则不新增任何百分比/数值约束
   - 模块新增：禁止新增用户未提及的模块（如用户要报告，禁止加“技术选型/附加功能”）
5. 交付 (DELIVER)：
   - 输出仅包含用户需求相关内容，无无关模块、无强加的量化指标
   - 格式规范，行间距紧凑，无冗余空行/空格

### 输出格式要求（强制遵守）
1. 文本约束：
   - 禁止输出"优化后的提示词："字样，直接输出优化结果；
   - 角色描述仅1次（格式：你是一位资深XX专家，专注于XX领域），匹配用户需求（如“网站开发”≠“插件开发”）；
   - 禁止重复任何模块/文本，禁止简化核心关键词。
2. 空行约束（极致紧凑）：
   - 角色描述后无空行；
   - 模块标题（###）前仅保留1个空行，标题后无空行；
   - 模块内列表项无空行，模块间仅0.1个空行；
   - 无连续1个以上空行，无开头/结尾空行。
3. 缩进与标点约束：
   - 所有行无前置空格，列表项编号后用中文冒号（：），冒号后无多余空格；
   - 禁止使用多个空格缩进，补充说明用“（）”标注。
4. 结构化标注：
- 核心模块用"###"标注标题，按以下固定顺序排列：
  ① 核心任务（含量化目标）→ ② 核心功能（按优先级排序）→ ③ 技术选型（补充场景）→ ④ 附加功能 → ⑤ 约束条件（量化）
- 列表项：一级用数字编号（1.），无二级项，补充说明用“（）”标注
- 关键信息（量化指标、场景）无需加粗，直接融入文本
5. 内容约束：
- 所有目标必须补充量化指标（如提升≥80%、耗时≤100ms、占用≤5%）
- 技术选型必须补充适用场景，用“（）”标注（如AWS RDS（中小规模数据））
- 禁止模块内重复描述，禁止空洞表述（如“提升效率”必须量化）

工作规则：只优化结构与表达，不创造需求、不脑补内容、不新增模块。`
          },
          {
            role: "user",
            content: `请严格按规则优化，只结构化、不新增、不脑补、不篡改。
需求内容：
${originalText.trim()}`
          }
        ],
        temperature: 0.01,
        top_p: 0.01,
        max_tokens: 3072,
        stream: false
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: "API request failed", details: err });
    }

    const data = await response.json();
    if (!data?.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: "Invalid API response" });
    }

    let txt = data.choices[0].message.content
      .replace(/优化后的提示词：/g, '')
      .replace(/角色：.*\n?/g, '')
      .replace(/[`#]/g, '')
      .replace(/^\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+|\n+$/g, '')
      .trim();

    // 角色去重（只保留第一个）
    const roleMatch = txt.match(/你是一位资深[^。]+。/);
    if (roleMatch) {
      const first = roleMatch[0];
      txt = txt.replace(/你是一位资深[^。]+。/g, '')
      txt = first + '\n' + txt;
    }

    res.json({
      success: true,
      optimizedText: txt
    });

  } catch (err) {
    res.status(500).json({
      error: "Internal server error",
      message: err.message
    });
  }
};

