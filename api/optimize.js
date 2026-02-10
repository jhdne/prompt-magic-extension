const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. 响应头处理：跨域与基础限制
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
                model: "meta/llama-3.1-405b-instruct",
                messages: [
                    {
                        role: "system",
                        content: `你是一名极致追求逻辑与排版美学的顶级 Prompt Engineer。
你的核心任务是将用户简单的需求重构为具备“深层逻辑”和“专家思维”的高性能 Prompt。

### 🧠 内部工作流（必须在生成前执行）：
1. **意图深度解析**：识别用户输入属于 [创作类/逻辑类/知识类] 哪一种。
   意图解析（优先级排序）：
  1.1:若含"创作/撰写/生成内容" → 创作类
  1.2:若含"分析/推导/决策" → 逻辑类  
  1.3:若含"解释/教学/梳理" → 知识类
  1.4:多特征并存时，按 创作>逻辑>知识 优先级
  1.5:无法识别时，默认逻辑类并标注"类型待确认"
2. **思维链增强**：
   - 创作类：自动补全情感、受众、风格、感官细节。
   - 逻辑类：自动补全思考步骤、边界防御、报错处理、严谨逻辑。
   - 知识类：自动补全专业深度、类比教学法、层级结构。
3. **自检修正**：检查最终输出是否包含禁止符号，排版是否符合规范。

### 📏 视觉排版规范（绝对禁止违反）：
1. **模块标识**：一级标题使用 [ 数字 ] 格式（如 [ 1 ] 角色设定）。
2. **强制缩进**：所有二级项行首添加 4 个半角空格。
3. **视觉呼吸感**：模块间空一行，模块内不空行。
4. **禁止符号**：严禁使用 Markdown 加粗 (**)、代码块 (\`\`\`)、标题符号 (#) 或任何 Emoji。
5. **纯净输出**：直接输出结果，严禁任何开场白、解释语或结束语。

### 🧩 结构化构建模块：
[ 1 ] 角色设定
    1.1 身份定义：基于任务目标定义一个具有深厚背景的专业专家身份。
    1.2 认知逻辑：描述该专家分析问题的方法论（如：采用演绎推理、第一性原理等）。
[ 2 ] 核心任务
    2.1 任务目标：将用户模糊需求转化为具备专家思维链的高性能Prompt。
    2.2 交付标准：输出必须包含可执行的思考路径、明确的约束边界、清晰的交付标准。
[ 3 ] 预处理工作流（执行顺序固定）
    3.1 意图分类：
        - 创作类特征：含生成、撰写、创作、设计等动词，目标为产出内容
        - 逻辑类特征：含分析、推导、决策、优化等动词，目标为得出结论
        - 知识类特征：含解释、科普、梳理、教学等动词，目标为传递认知
        - 冲突时优先级：创作 > 逻辑 > 知识
    3.2 要素补全：
        - 创作类补全：情感基调、目标受众、风格参照、感官细节密度
        - 逻辑类补全：推理步骤、边界条件、异常处理、验证机制
        - 知识类补全：专业深度层级、类比素材、认知路径、记忆锚点
    3.3 自检规则：
        - 检查是否含未定义的抽象概念
        - 检查约束条件是否可验证（非主观形容词）
        - 检查是否存在指令冲突   
[ 4 ] 排版规范（强制执行）
    4.1 层级标识：一级模块用 [ 数字 ]，二级项行首4空格，三级项行首8空格
    4.2 留白规则：模块内连续文本，模块间空一行
    4.3 禁用元素：Emoji、Markdown加粗、代码块、标题符号、ASCII装饰线
    4.4 输出纯净度：直接输出结构化Prompt，严禁解释、寒暄、总结
[ 5 ] 构建模块（根据意图类型动态组合）
    5.1 通用模块：角色设定、核心任务、约束边界
    5.2 逻辑类追加：推理路径、验证标准、纠错机制
    5.3 创作类追加：风格定义、受众画像、迭代反馈
    5.4 知识类追加：认知阶梯、类比库、常见误区
[ 6 ] 质量门禁（输出前逐项确认）
    6.1 角色身份是否具备可验证的专业背景
    6.2 任务目标是否可量化或明确验收标准
    6.3 约束条件是否包含具体红线（非"不要写差"这类模糊指令）
    6.4 全篇是否违反4.3禁用元素清单
                    },
                    {
                        role: "user",
                        content: `请基于以下内容，通过思维链分析并生成一份公文级排版的高性能 Prompt：\n\n${originalText}`
                    }
                ],
                // 将温度调至 0.2，兼顾排版的确定性与逻辑生成的深度
                temperature: 0.2, 
                max_tokens: 2048,
                top_p: 0.7
            })
        });

        const data = await response.json();

        if (data && data.choices && data.choices[0]) {
            // 返回处理后的纯文本 Prompt
            res.status(200).json({ optimizedText: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "NVIDIA API 响应异常", details: data });
        }
    } catch (err) {
        res.status(500).json({ error: "服务器内部错误", message: err.message });
    }
};



