const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 增强的CORS配置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: "Method not allowed", 
            code: 405,
            message: "Only POST method is supported"
        });
    }

    const { originalText } = req.body || {};
    if (!originalText || originalText.trim() === '') {
        return res.status(400).json({ 
            error: "No text provided", 
            code: 400,
            message: "originalText parameter is required and cannot be empty"
        });
    }

    try {
        const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
        const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

        if (!NVIDIA_API_KEY) {
            return res.status(500).json({ 
                error: "Server configuration error", 
                code: 501,
                message: "NVIDIA_API_KEY environment variable is not set"
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
                        content: `AI 提示词优化专家（精准适配版）
你是一位顶级 AI 提示词优化专家，核心原则是：**精准理解用户原始需求，仅优化表达、结构化格式，不新增用户未提及的模块/量化指标，不过度加工**。你的使命是：直接将用户输入的需求转化为精准、结构化、格式规范的提示词，无需提问，不额外增加无关内容。

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
   - 禁止输出"优化后的提示词："字样，直接输出优化结果
   - 必须在开头添加适配的角色描述（格式：你是一位资深XX专家，专注于XX领域），角色描述仅匹配用户需求类型
   - 禁止出现"角色：XXX"类冗余文本，禁止新增用户未提及的模块标题
2. 空行约束（极致紧凑）：
   - 角色描述后无空行
   - 模块标题（###）前仅保留1个空行，标题后无空行
   - 模块内所有列表项之间无任何空行，模块间仅保留1个空行
   - 整体无连续2个以上空行，禁止开头/结尾空行
   - 列表项编号后直接跟内容，无换行、无空行
3. 缩进与标点约束：
   - 所有行开头无前置空格（包括模块标题、列表项）
   - 列表项编号后统一用中文冒号（：），冒号后无多余空格，直接跟内容
   - 禁止使用多个空格缩进，补充说明仅用“（）”标注（仅用户相关内容）
   - 所有标点后无多余空格，行尾无多余空格
4. 内容约束（核心！）：
   - 禁止新增用户未提及的量化指标（如用户未提增长率，禁止加≥15%）
   - 禁止新增用户未提及的模块（如用户要报告，禁止加“核心功能/技术选型/附加功能”）
   - 仅优化用户输入的表达，结构化排版，不改变核心意图，不额外加工

### 工作规则
1. 全程无提问：直接基于用户原始需求优化，不追问、不脑补
2. 精准适配：按需求类型（通用/技术）选择优化策略，不一刀切
3. 最小改动：仅优化格式和表达清晰度，不新增无关内容
4. 记忆隔离：不保存任何优化会话中的信息到记忆中
5. 格式优先：在精准理解需求的前提下，保证格式零瑕疵`
                    },
                    {
                        role: "user",
                        content: `请严格按照要求优化以下需求：
1. 精准理解核心意图，仅优化表达和格式，不新增任何未提及的模块/量化指标；
2. 必须以角色描述开头，行间距极致紧凑，无冗余空行/空格/标题；
3. 禁止新增“核心功能/技术选型/附加功能”等用户未提及的模块；
需求内容：\n\n${originalText.trim()}`
                    }
                ],
                temperature: 0.01, // 极致低随机性，保证理解精准
                top_p: 0.01,      
                max_tokens: 3072, 
                stream: false,
                stop: null
            })
        });

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

        if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
            return res.status(500).json({ 
                error: "Invalid API response format", 
                code: 502,
                details: data,
                message: "No valid completion found in API response"
            });
        }

        // 最终输出处理（极致格式校准+精准性兜底）
        let finalOutput = data.choices[0].message.content
            // 基础冗余清理
            .replace(/优化后的提示词：/g, '') 
            .replace(/角色：.*\n/g, '') 
            .replace(/[#*`]/g, '') 
            // 空行极致清理
            .replace(/\n{2,}/g, '\n') 
            .replace(/^\n+|\n+$/g, '') 
            .replace(/\n(?=###)/g, '') 
            .replace(/(\d\.\s*)\n+/g, '$1') 
            // 空格极致清理
            .replace(/^\s+/gm, '') 
            .replace(/：\s+/g, '：') 
            .replace(/\s+$/, '') 
            .replace(/\s{2,}/g, ' ') 
            // 精准性兜底：删除无关模块（核心功能/技术选型/附加功能）
            .replace(/### 核心功能[\s\S]*?(?=### |$)/g, '')
            .replace(/### 技术选型[\s\S]*?(?=### |$)/g, '')
            .replace(/### 附加功能[\s\S]*?(?=### |$)/g, '')
            // 删除强加的量化指标（仅保留用户提及的）
            .replace(/≥\d+%/g, (match) => {
                // 仅保留用户输入中包含的量化指标，否则删除
                return originalText.includes(match) ? match : '';
            })
            .replace(/≤\d+%/g, (match) => {
                return originalText.includes(match) ? match : '';
            })
            .trim();

        // 兜底：补充适配的角色描述
        if (!finalOutput.startsWith('你是一位')) {
            // 按需求类型适配角色描述
            let rolePrefix = '';
            if (originalText.includes('报告') || originalText.includes('分析')) {
                rolePrefix = `你是一位资深市场分析师，专注于市场研究报告撰写。`;
            } else if (originalText.includes('插件') || originalText.includes('系统') || originalText.includes('工具')) {
                rolePrefix = `你是一位资深技术开发专家，专注于插件/系统研发。`;
            } else {
                rolePrefix = `你是一位资深文案优化专家，专注于精准表达和结构化排版。`;
            }
            finalOutput = rolePrefix + '\n' + finalOutput;
        }

        res.status(200).json({ 
            success: true,
            code: 200,
            optimizedText: finalOutput,
            requestId: data.id || null
        });

    } catch (err) {
        const errorResponse = {
            error: "Internal server error",
            code: 500,
            message: err.message || "Unknown error occurred"
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = err.stack;
        }

        res.status(500).json(errorResponse);
    }
};
