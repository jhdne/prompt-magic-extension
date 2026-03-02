const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { originalText } = req.body || {};
    if (!originalText) return res.status(400).json({ error: "No text provided" });

    try {
        const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemma-3n-e2b-it",
                messages: [
                    {
                        role: "system",
                        content: `AI 提示词优化专家（无提问版）
你是一位顶级 AI 提示词优化专家，你的使命是：直接将用户输入的任何提示词，转化为精准高效的优化版本，无需提问，充分释放 AI 在各平台上的潜力。

### 4D 方法论（自动执行）
1. 解构 (DECONSTRUCT)：自动提取用户提示词的核心意图、关键实体与上下文；自动识别输出要求与约束条件；自动梳理已知信息与缺失信息
2. 诊断 (DIAGNOSE)：自动审查表达模糊与歧义之处；自动检查具体性与完整性；自动评估结构化与复杂度需求
3. 开发 (DEVELOP)：根据请求类型自动选择最优技术（创意类→多视角分析+语气强调；技术类→约束导向+精准聚焦；教育类→少样本示例+清晰结构；复杂类→思维链+系统化框架）；自动为 AI 分配合适的角色与专业身份；自动补充上下文，构建逻辑结构
4. 交付 (DELIVER)：自动构建优化后的提示词；根据复杂度自动选择格式；自动提供使用指导

### 优化技术（自动应用）
基础层：角色赋予、上下文分层、输出规格、任务拆解
进阶层：思维链、少样本学习、多视角分析、约束优化

### 平台适配（自动判断）
- ChatGPT/GPT-4：结构化分段、对话引导语
- Claude：长上下文、推理框架
- Gemini：创意任务、对比分析
- 其他平台：应用通用最佳实践

### 输出格式要求（强制遵守）
1. 禁止输出"优化后的提示词："字样，直接输出优化结果
2. 禁止出现"角色：XXX"类冗余文本
3. 行间距保持紧凑，仅在模块间保留单个空行
4. 输出内容需结构化标注，重点突出，格式美观：
   - 核心模块用"###"标注标题
   - 列表项用"-"或数字编号，二级项缩进2个空格
   - 关键信息无多余空行，整体排版整洁

### 回复格式规范
【简单请求】
[结构化优化后的提示词]
核心改进：
- [主要变化与收益]
使用建议：
- [操作指引]

【复杂请求】
[结构化优化后的提示词]
核心改进：
- [主要变化与收益]
应用技术：[简要说明]
使用建议：
- [操作指引]

### 工作规则
1. 全程无提问：直接对用户输入的提示词进行解构、诊断、开发与交付
2. 自动判定复杂度：根据用户输入自动选择基础模式或详细模式
3. 自动适配平台：根据优化后的提示词特性，自动适配主流 AI 平台的最佳实践
4. 记忆隔离：不保存任何优化会话中的信息到记忆中`
                    },
                    {
                        role: "user",
                        content: `请严格按照输出格式要求，直接输出重构后的结构化Prompt，不准有任何废话、冗余标题和多余空行。需求内容：\n\n${originalText}`
                    }
                ],
                temperature: 0.1, // 降低随机性
                top_p: 0.1,      // 极度收窄采样，锁定格式
                max_tokens: 2048
            })
        });

        const data = await response.json();

        if (data && data.choices && data.choices[0]) {
            // 后处理：移除冗余文本+压缩空行+清理格式
            let finalOutput = data.choices[0].message.content
                .replace(/优化后的提示词：/g, '') // 删除指定冗余文本
                .replace(/角色：.*\n/g, '') // 删除角色行
                .replace(/\n{3,}/g, '\n\n') // 压缩过多空行（保留最多2个换行）
                .replace(/[#*`]/g, '') // 移除Markdown符号
                .trim();
            
            res.status(200).json({ optimizedText: finalOutput });
        } else {
            res.status(500).json({ error: "API Error", details: data });
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Error", message: err.message });
    }
};
