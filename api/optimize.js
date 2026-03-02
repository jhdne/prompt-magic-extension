const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 增强的CORS配置，适配各类前端请求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 预检请求缓存1天，减少请求次数

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 仅允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: "Method not allowed", 
            code: 405,
            message: "Only POST method is supported"
        });
    }

    // 验证请求参数
    const { originalText } = req.body || {};
    if (!originalText || originalText.trim() === '') {
        return res.status(400).json({ 
            error: "No text provided", 
            code: 400,
            message: "originalText parameter is required and cannot be empty"
        });
    }

    try {
        // NVIDIA API配置
        const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
        const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

        // 验证API密钥
        if (!NVIDIA_API_KEY) {
            return res.status(500).json({ 
                error: "Server configuration error", 
                code: 501,
                message: "NVIDIA_API_KEY environment variable is not set"
            });
        }

        // 调用NVIDIA API
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
                        content: `AI 提示词优化专家（无提问版）
你是一位顶级 AI 提示词优化专家，专注于生成**高可执行性、结构化、细粒度、格式零瑕疵**的技术类提示词，你的使命是：直接将用户输入的模糊需求转化为精准、落地性强、格式规范的优化版本，无需提问，充分释放 AI 在各平台上的潜力。

### 4D 方法论（自动执行）
1. 解构 (DECONSTRUCT)：
- 提取核心意图、关键实体与上下文
- 识别输出要求与约束条件
- 梳理已知信息与缺失信息（强制补充量化指标、落地标准、技术场景）
2. 诊断 (DIAGNOSE)：
- 审查表达模糊（如“提升效率”必须量化）、歧义、粒度粗糙、描述重复问题
- 检查模块分类混乱、逻辑重复、优先级缺失、空行冗余问题
- 评估结构化与复杂度需求（技术类强制按“角色→核心任务→核心功能→技术选型→附加功能→约束条件”分层）
3. 开发 (DEVELOP)：
- 技术类提示词：约束导向+精准聚焦+量化目标+优先级排序+场景匹配
- 自动赋予“资深XX专家”身份，角色描述简洁无冗余，不重复核心任务内容
- 按固定逻辑结构构建：角色描述→核心任务（量化）→核心功能（优先级）→技术选型（场景）→附加功能→约束条件（量化）
- 所有目标必须量化（如提升≥XX%、耗时≤XXms），技术选型必须补充适用场景
4. 交付 (DELIVER)：
- 自动构建优化后的提示词，确保无逻辑重复、模块分类清晰、格式零瑕疵
- 严格遵守所有格式约束，违反则直接重生成

### 优化技术（自动应用）
基础层：角色赋予（细分领域）、上下文分层、输出规格、任务拆解（按优先级）、格式标准化
进阶层：思维链、约束优化（补充量化指标）、细粒度拆分（功能/技术场景匹配）、格式自动校准

### 平台适配（自动判断）
- ChatGPT/GPT-4：结构化分段、量化目标、技术选型场景化、格式紧凑
- Claude：长上下文、推理框架、约束条件细化、无冗余空行
- Gemini：创意任务、对比分析
- 其他平台：应用通用最佳实践

### 输出格式要求（强制遵守，违反直接重生成）
1. 文本约束：
- 禁止输出"优化后的提示词："字样，直接输出优化结果
- 禁止出现"角色：XXX"类冗余文本，角色直接融入开头第一句
- 角色描述简洁，不重复核心任务内容，无多余修饰词，但提示词开头必须有角色描述
2. 空行约束（核心！）：
- 角色描述后无空行
- 模块标题（###）前仅保留1个空行，标题后无空行
- 模块内列表项之间无空行，模块间仅保留0.2个空行
- 整体无连续2个以上空行，禁止开头/结尾空行
3. 缩进与标点约束（核心！）：
- 所有行开头无前置空格（包括模块标题、列表项）
- 列表项编号后统一用中文冒号（：），冒号后无多余空格
- 禁止使用多个空格缩进，补充说明仅用“（）”标注，无前置空格
- 所有标点后无多余空格，行尾无多余空格
4. 结构化标注：
- 核心模块用"###"标注标题，按以下固定顺序排列：
  ① 核心任务（含量化目标）→ ② 核心功能（按优先级排序）→ ③ 技术选型（补充场景）→ ④ 附加功能 → ⑤ 约束条件（量化）
- 列表项：一级用数字编号（1.），无二级项，补充说明用“（）”标注
- 关键信息（量化指标、场景）无需加粗，直接融入文本
5. 内容约束：
- 所有目标必须补充量化指标（如提升≥80%、耗时≤100ms、占用≤5%）
- 技术选型必须补充适用场景，用“（）”标注（如AWS RDS（中小规模数据））
- 禁止模块内重复描述，禁止空洞表述（如“提升效率”必须量化）

### 回复格式规范
【简单请求】
[结构化优化后的提示词]


【复杂请求（技术类默认）】
[结构化优化后的提示词]


### 工作规则
1. 全程无提问：直接对用户输入的提示词进行解构、诊断、开发与交付
2. 自动判定复杂度：技术类默认按复杂请求处理，强制补充量化目标和落地标准
3. 自动适配平台：根据优化后的提示词特性，自动适配主流 AI 平台的最佳实践
4. 记忆隔离：不保存任何优化会话中的信息到记忆中
5. 格式优先：即使内容完整，格式不符合要求也需重新生成`
                    },
                    {
                        role: "user",
                        content: `请严格按照输出格式要求，直接输出重构后的结构化Prompt，不准有任何废话、冗余标题、多余空行、前置空格、标点后多余空格。需求内容：\n\n${originalText.trim()}`
                    }
                ],
                temperature: 0.05, // 极低随机性，保证格式稳定
                top_p: 0.05,      // 极度收窄采样，锁定输出格式
                max_tokens: 3072, // 足够容纳细粒度技术类提示词
                stream: false,
                stop: null
            })
        });

        // 处理API响应状态
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return res.status(response.status).json({ 
                error: "NVIDIA API request failed", 
                code: response.status,
                details: errorData,
                message: `API returned status code: ${response.status}`
            });
        }

        const data = await response.json();

        // 验证API响应格式
        if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
            return res.status(500).json({ 
                error: "Invalid API response format", 
                code: 502,
                details: data,
                message: "No valid completion found in API response"
            });
        }

        // 最终输出处理（格式校准+清理）
        let finalOutput = data.choices[0].message.content
            // 基础冗余文本清理
            .replace(/优化后的提示词：/g, '') 
            .replace(/角色：.*\n/g, '') 
            .replace(/[#*`]/g, '') 
            .replace(/输出格式要求：.*\n/g, '') 
            // 空行精准清理（核心）
            .replace(/\n{3,}/g, '\n\n') // 压缩3个以上空行为2个
            .replace(/^\n+|\n+$/g, '') // 删除开头/结尾空行
            .replace(/\n{2,}(?=###)/g, '\n') // 模块标题前仅保留1个空行
            // 空格精准清理（核心）
            .replace(/^\s+/gm, '') // 删除每行开头所有空格
            .replace(/：\s+/g, '：') // 冒号后删除多余空格
            .replace(/\s+$/, '') // 删除行尾多余空格
            .replace(/\s{4,}/g, ' ') // 压缩4个以上空格为1个
            .trim();

        // 返回最终结果
        res.status(200).json({ 
            success: true,
            code: 200,
            optimizedText: finalOutput,
            requestId: data.id || null
        });

    } catch (err) {
        // 异常处理（区分开发/生产环境）
        const errorResponse = {
            error: "Internal server error",
            code: 500,
            message: err.message || "Unknown error occurred"
        };

        // 开发环境下返回栈信息，方便调试
        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = err.stack;
        }

        res.status(500).json(errorResponse);
    }
};


