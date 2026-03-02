const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // CORS 配置增强：支持更多常见头部，适配复杂请求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 预检请求缓存1天

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed", code: 405 });

    const { originalText } = req.body || {};
    if (!originalText) return res.status(400).json({ error: "No text provided", code: 400 });

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
你是一位顶级 AI 提示词优化专家，专注于生成**高可执行性、结构化、细粒度**的技术类提示词，你的使命是：直接将用户输入的模糊需求转化为精准、落地性强的优化版本，无需提问，充分释放 AI 在各平台上的潜力。

### 4D 方法论（自动执行）
1. 解构 (DECONSTRUCT)：
  - 提取核心意图、关键实体与上下文
  - 识别输出要求与约束条件
  - 梳理已知信息与缺失信息（重点补充量化指标、落地标准）
2. 诊断 (DIAGNOSE)：
  - 审查表达模糊（如“提升效率”需量化）、歧义、粒度粗糙问题
  - 检查模块分类混乱、逻辑重复、优先级缺失问题
  - 评估结构化与复杂度需求（技术类需按“目标→功能→技术→约束”分层）
3. 开发 (DEVELOP)：
  - 技术类提示词：约束导向+精准聚焦+量化目标+优先级排序
  - 自动赋予“资深XX专家”身份，补充细分领域专业属性
  - 按“核心任务→核心功能→技术选型→附加功能→约束条件”构建逻辑结构
  - 技术选型需补充适用场景，功能需按优先级排序，目标需量化
4. 交付 (DELIVER)：
  - 自动构建优化后的提示词，确保无逻辑重复、模块分类清晰
  - 根据复杂度自动选择格式，技术类强制按“### 模块标题”分层
  - 自动补充可落地的约束条件、验收标准

### 优化技术（自动应用）
基础层：角色赋予（细分领域）、上下文分层、输出规格、任务拆解（按优先级）
进阶层：思维链、约束优化（补充量化指标）、细粒度拆分（功能/技术场景匹配）

### 平台适配（自动判断）
- ChatGPT/GPT-4：结构化分段、量化目标、技术选型场景化
- Claude：长上下文、推理框架、约束条件细化
- Gemini：创意任务、对比分析
- 其他平台：应用通用最佳实践

### 输出格式要求（强制遵守，违反直接重生成）
1. 禁止输出"优化后的提示词："字样，直接输出优化结果
2. 禁止出现"角色：XXX"类冗余文本，角色直接融入开头（如“你是一位资深XX专家”）
3. 行间距：仅模块间保留0.5个空行，行内无多余换行，二级项缩进2个空格
4. 结构化标注（技术类强制）：
  - 核心模块用"###"标注标题，按以下固定顺序排列：
    ① 核心任务（含量化目标）→ ② 核心功能（按优先级排序）→ ③ 技术选型（补充场景）→ ④ 附加功能 → ⑤ 约束条件
  - 列表项：一级用数字编号，二级用"-"，关键信息（量化指标、场景）加粗
  - 无多余空行、无重复模块、无无效描述（如“输出格式要求”类空洞内容）

### 回复格式规范
【简单请求】
[结构化优化后的提示词]
【复杂请求（技术类默认）】
[结构化优化后的提示词]
### 工作规则
1. 全程无提问：直接对用户输入的提示词进行解构、诊断、开发与交付
2. 自动判定复杂度：技术类默认按复杂请求处理，强制补充量化目标和落地标准
3. 自动适配平台：根据优化后的提示词特性，自动适配主流 AI 平台的最佳实践
4. 记忆隔离：不保存任何优化会话中的信息到记忆中`
                    },
                    {
                        role: "user",
                        content: `请严格按照输出格式要求，直接输出重构后的结构化Prompt，不准有任何废话、冗余标题、多余空行、逻辑重复或空洞描述。
要求：
1. 技术类提示词必须补充量化目标、功能优先级、技术选型场景、约束条件
2. 模块按“核心任务→核心功能→技术选型→附加功能→约束条件”排序
3. 禁止出现“输出格式要求”类无效内容
需求内容：\n\n${originalText}`
                    }
                ],
                temperature: 0.05, // 进一步降低随机性，确保格式严格遵守
                top_p: 0.05,      // 极度收窄采样，锁定格式和逻辑
                max_tokens: 3072, // 提升最大令牌数，容纳更细粒度内容
                stream: false
            })
        });

        // 增加响应状态码判断
        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ 
                error: "NVIDIA API Request Failed", 
                code: response.status,
                details: errorData 
            });
        }

        const data = await response.json();

        if (data && data.choices && data.choices[0] && data.choices[0].message) {
            // 后处理：强化格式清理，适配技术类提示词
            let finalOutput = data.choices[0].message.content
                .replace(/优化后的提示词：/g, '') // 删除冗余标题
                .replace(/角色：.*\n/g, '') // 删除角色行
                .replace(/\n{3,}/g, '\n\n') // 压缩过多空行
                .replace(/[#*`]/g, '') // 移除Markdown符号
                .replace(/输出格式要求：.*\n/g, '') // 删除空洞的输出要求
                .replace(/\s{4,}/g, '  ') // 将4个以上空格替换为2个，统一缩进
                .trim();
            
            res.status(200).json({ 
                optimizedText: finalOutput,
                code: 200,
                success: true
            });
        } else {
            res.status(500).json({ 
                error: "API Response Format Error", 
                code: 500,
                details: data || "No valid response from API" 
            });
        }
    } catch (err) {
        res.status(500).json({ 
            error: "Internal Server Error", 
            code: 500,
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined // 开发环境展示栈信息
        });
    }
};
